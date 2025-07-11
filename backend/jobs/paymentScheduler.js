// backend/jobs/paymentScheduler.js
import cron from 'node-cron';
import Tenant from '../models/Tenant.js';
import Payment from '../models/Payment.js';
import Unit from '../models/Unit.js';
import Property from '../models/Property.js';
import { startOfMonth, endOfMonth, addMonths, format } from 'date-fns';
import logger from '../utils/logger.js';
import mongoose from 'mongoose';

/**
 * Payment Scheduler - Handles automatic monthly rent generation and tracking
 */
class PaymentScheduler {
  constructor() {
    this.isRunning = false;
    this.scheduleJobs();
  }

  /**
   * Schedule all payment-related cron jobs
   */
  scheduleJobs() {
    // Run monthly rent generation on 1st of every month at 00:01
    cron.schedule('1 0 1 * *', () => {
      this.generateMonthlyRent();
    }, {
      timezone: "Africa/Nairobi"
    });

    // Daily balance update check at 06:00
    cron.schedule('0 6 * * *', () => {
      this.updateDailyBalances();
    }, {
      timezone: "Africa/Nairobi"
    });

    // Weekly payment reminder check on Mondays at 09:00
    cron.schedule('0 9 * * 1', () => {
      this.checkOverduePayments();
    }, {
      timezone: "Africa/Nairobi"
    });

    // Monthly financial summary generation on last day of month at 23:00
    cron.schedule('0 23 L * *', () => {
      this.generateMonthlyFinancialSummary();
    }, {
      timezone: "Africa/Nairobi"
    });

    logger.info('Payment scheduler jobs initialized');
  }

  /**
   * Generate monthly rent charges for all active tenants
   */
  async generateMonthlyRent() {
    if (this.isRunning) {
      logger.warn('Monthly rent generation already running, skipping...');
      return;
    }

    this.isRunning = true;
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      logger.info('Starting monthly rent generation...');
      
      const currentDate = new Date();
      const currentMonth = currentDate.getMonth() + 1;
      const currentYear = currentDate.getFullYear();

      // Get all active tenants with lease details
      const activeTenants = await Tenant.find({ 
        status: 'active',
        'leaseDetails.rentAmount': { $gt: 0 },
        'leaseDetails.startDate': { $lte: currentDate },
        $or: [
          { 'leaseDetails.endDate': { $exists: false } },
          { 'leaseDetails.endDate': { $gte: currentDate } }
        ]
      })
      .populate('currentUnit')
      .session(session);

      let processedCount = 0;
      let skippedCount = 0;
      let errorCount = 0;

      for (const tenant of activeTenants) {
        try {
          const result = await this.generateTenantMonthlyRent(tenant, currentMonth, currentYear, session);
          if (result.processed) {
            processedCount++;
          } else {
            skippedCount++;
          }
        } catch (error) {
          errorCount++;
          logger.error(`Error generating rent for tenant ${tenant._id}: ${error.message}`);
        }
      }

      await session.commitTransaction();
      
      logger.info(`Monthly rent generation completed: ${processedCount} processed, ${skippedCount} skipped, ${errorCount} errors`);
      
      // Generate summary notification
      await this.notifyAdminsOfRentGeneration({
        processed: processedCount,
        skipped: skippedCount,
        errors: errorCount,
        month: currentMonth,
        year: currentYear
      });

    } catch (error) {
      await session.abortTransaction();
      logger.error(`Monthly rent generation failed: ${error.message}`);
    } finally {
      session.endSession();
      this.isRunning = false;
    }
  }

  /**
   * Generate monthly rent for a specific tenant
   */
  async generateTenantMonthlyRent(tenant, month, year, session) {
    const rentAmount = tenant.leaseDetails.rentAmount;
    
    // Check if rent already generated for this month
    const existingCharge = await Payment.findOne({
      tenant: tenant._id,
      type: 'rent_charge',
      'paymentPeriod.month': month,
      'paymentPeriod.year': year
    }).session(session);

    if (existingCharge) {
      return { processed: false, reason: 'Already generated' };
    }

    // Check payment frequency
    const frequency = tenant.leaseDetails.paymentFrequency || 'monthly';
    if (frequency !== 'monthly') {
      return await this.handleNonMonthlyPayment(tenant, month, year, session);
    }

    // Calculate any outstanding balance
    const previousBalance = tenant.currentBalance || 0;
    const newBalance = previousBalance + rentAmount;

    // Update tenant balance
    await Tenant.findByIdAndUpdate(
      tenant._id,
      {
        currentBalance: newBalance,
        monthlyRentDue: rentAmount,
        lastRentGeneration: new Date(),
        $push: {
          rentHistory: {
            month,
            year,
            amount: rentAmount,
            generatedDate: new Date(),
            status: 'pending'
          }
        }
      },
      { session }
    );

    // Update unit revenue tracking
    if (tenant.currentUnit) {
      await Unit.findByIdAndUpdate(
        tenant.currentUnit._id,
        {
          $inc: {
            'revenueTracking.currentMonth.expectedRental': rentAmount
          },
          lastRentGeneration: new Date()
        },
        { session }
      );
    }

    logger.info(`Generated rent for tenant ${tenant.firstName} ${tenant.lastName}: KES ${rentAmount.toLocaleString()}`);
    
    return { processed: true, amount: rentAmount };
  }

  /**
   * Handle non-monthly payment frequencies
   */
  async handleNonMonthlyPayment(tenant, month, year, session) {
    const frequency = tenant.leaseDetails.paymentFrequency;
    const rentAmount = tenant.leaseDetails.rentAmount;
    
    let shouldGenerate = false;
    let amount = rentAmount;

    switch (frequency) {
      case 'weekly':
        // Generate weekly rent (monthly amount / 4)
        amount = Math.round(rentAmount / 4);
        shouldGenerate = true;
        break;
      
      case 'quarterly':
        // Generate quarterly rent only in March, June, September, December
        if ([3, 6, 9, 12].includes(month)) {
          amount = rentAmount * 3;
          shouldGenerate = true;
        }
        break;
      
      case 'semi-annual':
        // Generate bi-annual rent only in June and December
        if ([6, 12].includes(month)) {
          amount = rentAmount * 6;
          shouldGenerate = true;
        }
        break;
      
      case 'annual':
        // Generate annual rent only in January
        if (month === 1) {
          amount = rentAmount * 12;
          shouldGenerate = true;
        }
        break;
    }

    if (shouldGenerate) {
      const newBalance = (tenant.currentBalance || 0) + amount;
      
      await Tenant.findByIdAndUpdate(
        tenant._id,
        {
          currentBalance: newBalance,
          monthlyRentDue: amount,
          lastRentGeneration: new Date()
        },
        { session }
      );

      logger.info(`Generated ${frequency} rent for tenant ${tenant.firstName} ${tenant.lastName}: KES ${amount.toLocaleString()}`);
      return { processed: true, amount, frequency };
    }

    return { processed: false, reason: `No ${frequency} charge due this month` };
  }

  /**
   * Update daily balances and payment tracking
   */
  async updateDailyBalances() {
    try {
      logger.info('Starting daily balance update...');

      // Get all active tenants
      const activeTenants = await Tenant.find({ status: 'active' });
      
      let updatedCount = 0;

      for (const tenant of activeTenants) {
        try {
          // Check for any recent payments that might need balance adjustments
          const recentPayments = await Payment.find({
            tenant: tenant._id,
            paymentDate: {
              $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
            },
            status: 'completed'
          });

          if (recentPayments.length > 0) {
            await this.recalculateTenantBalance(tenant._id);
            updatedCount++;
          }

        } catch (error) {
          logger.error(`Error updating balance for tenant ${tenant._id}: ${error.message}`);
        }
      }

      logger.info(`Daily balance update completed: ${updatedCount} tenants updated`);

    } catch (error) {
      logger.error(`Daily balance update failed: ${error.message}`);
    }
  }

  /**
   * Check for overdue payments and generate alerts
   */
  async checkOverduePayments() {
    try {
      logger.info('Checking for overdue payments...');

      const currentDate = new Date();
      const gracePeriodDays = 5; // Days after month end to consider as grace period
      const overdueThreshold = new Date(currentDate.getTime() - gracePeriodDays * 24 * 60 * 60 * 1000);

      // Find tenants with outstanding balances
      const overduetenants = await Tenant.find({
        status: 'active',
        currentBalance: { $gt: 0 },
        lastPaymentDate: { $lt: overdueThreshold }
      }).populate('currentUnit');

      let overdueCount = 0;
      const overdueReport = [];

      for (const tenant of overduetenants) {
        const daysOverdue = Math.floor((currentDate - new Date(tenant.lastPaymentDate)) / (1000 * 60 * 60 * 24));
        
        const overdueInfo = {
          tenantId: tenant._id,
          name: `${tenant.firstName} ${tenant.lastName}`,
          unit: tenant.currentUnit?.unitNumber,
          balance: tenant.currentBalance,
          daysOverdue,
          lastPayment: tenant.lastPaymentDate,
          phone: tenant.phone,
          email: tenant.email
        };

        overdueReport.push(overdueInfo);
        overdueCount++;

        // Update tenant with overdue status
        await Tenant.findByIdAndUpdate(tenant._id, {
          paymentStatus: 'overdue',
          overdueAmount: tenant.currentBalance,
          overdueDate: currentDate
        });
      }

      if (overdueCount > 0) {
        await this.notifyAdminsOfOverduePayments(overdueReport);
        logger.info(`Found ${overdueCount} tenants with overdue payments`);
      } else {
        logger.info('No overdue payments found');
      }

    } catch (error) {
      logger.error(`Overdue payment check failed: ${error.message}`);
    }
  }

  /**
   * Generate monthly financial summary
   */
  async generateMonthlyFinancialSummary() {
    try {
      logger.info('Generating monthly financial summary...');

      const currentDate = new Date();
      const startOfCurrentMonth = startOfMonth(currentDate);
      const endOfCurrentMonth = endOfMonth(currentDate);

      // Get payments for current month
      const monthlyPayments = await Payment.find({
        paymentDate: {
          $gte: startOfCurrentMonth,
          $lte: endOfCurrentMonth
        },
        status: 'completed'
      }).populate('tenant', 'firstName lastName')
        .populate('property', 'name');

      // Calculate summary statistics
      const summary = {
        month: format(currentDate, 'MMMM yyyy'),
        totalPayments: monthlyPayments.length,
        totalAmount: monthlyPayments.reduce((sum, payment) => sum + payment.amount, 0),
        averagePayment: 0,
        paymentMethods: {},
        propertyBreakdown: {},
        onTimePayments: 0,
        latePayments: 0
      };

      summary.averagePayment = summary.totalAmount / summary.totalPayments || 0;

      // Analyze payment methods
      monthlyPayments.forEach(payment => {
        summary.paymentMethods[payment.paymentMethod] = 
          (summary.paymentMethods[payment.paymentMethod] || 0) + payment.amount;

        // Property breakdown
        const propertyName = payment.property?.name || 'Unknown';
        summary.propertyBreakdown[propertyName] = 
          (summary.propertyBreakdown[propertyName] || 0) + payment.amount;

        // Payment timeliness
        if (payment.metadata?.paymentTimeliness === 'on-time') {
          summary.onTimePayments++;
        } else {
          summary.latePayments++;
        }
      });

      // Get outstanding balances
      const outstandingBalances = await Tenant.aggregate([
        {
          $match: {
            status: 'active',
            currentBalance: { $gt: 0 }
          }
        },
        {
          $group: {
            _id: null,
            totalOutstanding: { $sum: '$currentBalance' },
            tenantCount: { $sum: 1 }
          }
        }
      ]);

      summary.outstandingBalance = outstandingBalances[0]?.totalOutstanding || 0;
      summary.tenantsWithBalance = outstandingBalances[0]?.tenantCount || 0;

      // Save summary to database or send to admins
      await this.saveMonthlyFinancialSummary(summary);
      
      logger.info(`Monthly financial summary generated: KES ${summary.totalAmount.toLocaleString()} from ${summary.totalPayments} payments`);

    } catch (error) {
      logger.error(`Monthly financial summary generation failed: ${error.message}`);
    }
  }

  /**
   * Recalculate tenant balance based on all payments
   */
  async recalculateTenantBalance(tenantId) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const tenant = await Tenant.findById(tenantId).session(session);
      if (!tenant) return;

      // Get all completed payments for this tenant
      const payments = await Payment.find({
        tenant: tenantId,
        status: 'completed'
      }).sort({ paymentDate: 1 }).session(session);

      // Get all rent charges
      const rentCharges = await this.calculateTotalRentCharges(tenant, session);

      // Calculate current balance
      let calculatedBalance = rentCharges;
      let totalPaid = 0;

      payments.forEach(payment => {
        if (payment.type === 'rent' || payment.type === 'deposit') {
          totalPaid += payment.amount;
        }
      });

      calculatedBalance = rentCharges - totalPaid;

      // Update tenant if balance differs
      if (Math.abs(calculatedBalance - (tenant.currentBalance || 0)) > 0.01) {
        await Tenant.findByIdAndUpdate(
          tenantId,
          {
            currentBalance: calculatedBalance,
            balanceLastRecalculated: new Date(),
            totalPaidToDate: totalPaid
          },
          { session }
        );

        logger.info(`Recalculated balance for tenant ${tenantId}: KES ${calculatedBalance.toLocaleString()}`);
      }

      await session.commitTransaction();

    } catch (error) {
      await session.abortTransaction();
      logger.error(`Error recalculating balance for tenant ${tenantId}: ${error.message}`);
    } finally {
      session.endSession();
    }
  }

  /**
   * Calculate total rent charges for a tenant
   */
  async calculateTotalRentCharges(tenant, session) {
    const leaseStart = new Date(tenant.leaseDetails?.startDate);
    const currentDate = new Date();
    const rentAmount = tenant.leaseDetails?.rentAmount || 0;
    
    if (!leaseStart || rentAmount === 0) return 0;

    const monthsDiff = (currentDate.getFullYear() - leaseStart.getFullYear()) * 12 + 
                      (currentDate.getMonth() - leaseStart.getMonth()) + 1;

    // Consider payment frequency
    const frequency = tenant.leaseDetails?.paymentFrequency || 'monthly';
    let totalCharges = 0;

    switch (frequency) {
      case 'monthly':
        totalCharges = monthsDiff * rentAmount;
        break;
      case 'quarterly':
        totalCharges = Math.ceil(monthsDiff / 3) * (rentAmount * 3);
        break;
      case 'semi-annual':
        totalCharges = Math.ceil(monthsDiff / 6) * (rentAmount * 6);
        break;
      case 'annual':
        totalCharges = Math.ceil(monthsDiff / 12) * (rentAmount * 12);
        break;
      default:
        totalCharges = monthsDiff * rentAmount;
    }

    return totalCharges;
  }

  /**
   * Notify admins of rent generation results
   */
  async notifyAdminsOfRentGeneration(summary) {
    try {
      // This would integrate with notification system
      logger.info(`Rent generation summary: ${JSON.stringify(summary)}`);
      
      // Here you would send emails, SMS, or push notifications to admins
      // Example integration with notification service
      
    } catch (error) {
      logger.error(`Error sending rent generation notification: ${error.message}`);
    }
  }

  /**
   * Notify admins of overdue payments
   */
  async notifyAdminsOfOverduePayments(overdueReport) {
    try {
      logger.info(`Overdue payments report: ${overdueReport.length} tenants`);
      
      // Sort by days overdue (most urgent first)
      overdueReport.sort((a, b) => b.daysOverdue - a.daysOverdue);
      
      // Here you would send detailed overdue report to admins
      
    } catch (error) {
      logger.error(`Error sending overdue payment notification: ${error.message}`);
    }
  }

  /**
   * Save monthly financial summary
   */
  async saveMonthlyFinancialSummary(summary) {
    try {
      // Save to FinancialSummary collection or send to admins
      logger.info(`Financial summary saved for ${summary.month}`);
      
      // Here you would save to database or send to stakeholders
      
    } catch (error) {
      logger.error(`Error saving financial summary: ${error.message}`);
    }
  }

  /**
   * Manual trigger for rent generation (for testing or catch-up)
   */
  async manualRentGeneration(month, year) {
    logger.info(`Manual rent generation triggered for ${month}/${year}`);
    
    // Temporarily override current date logic
    const originalDate = Date.now;
    Date.now = () => new Date(year, month - 1, 1).getTime();
    
    try {
      await this.generateMonthlyRent();
    } finally {
      Date.now = originalDate;
    }
  }

  /**
   * Get scheduler status and statistics
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      lastRun: this.lastRun,
      nextRun: this.getNextScheduledRun(),
      jobsScheduled: 4,
      timezone: 'Africa/Nairobi'
    };
  }

  /**
   * Get next scheduled run time
   */
  getNextScheduledRun() {
    const now = new Date();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1, 0, 1);
    return nextMonth;
  }
}

// Export singleton instance
const paymentScheduler = new PaymentScheduler();
export default paymentScheduler;