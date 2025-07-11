// backend/controllers/paymentController.js
import Payment from '../models/Payment.js';
import Tenant from '../models/Tenant.js';
import Unit from '../models/Unit.js';
import Property from '../models/Property.js';
import mongoose from 'mongoose';
import logger from '../utils/logger.js';
import { startOfMonth, endOfMonth, addMonths, isSameMonth } from 'date-fns';

/**
 * Create a new payment with automatic period detection and balance updates
 */
export const createPayment = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { tenant: tenantId, amount, paymentDate, type = 'rent', paymentMethod, description } = req.body;
    
    // Validate required fields
    if (!tenantId || !amount || !paymentDate) {
      throw new Error('Tenant, amount, and payment date are required');
    }

    // Fetch tenant with current balance
    const tenant = await Tenant.findById(tenantId)
      .populate('currentUnit')
      .session(session);
    
    if (!tenant) {
      throw new Error('Tenant not found');
    }

    if (!tenant.currentUnit) {
      throw new Error('Tenant must be assigned to a unit before recording payments');
    }

    // Get property information
    const unit = await Unit.findById(tenant.currentUnit._id)
      .populate('propertyId')
      .session(session);

    // Get current payment period info
    const paymentPeriod = await calculatePaymentPeriod(tenantId, paymentDate, type);
    
    // Calculate previous balance and due amounts
    const previousBalance = tenant.currentBalance || 0;
    const rentAmount = tenant.leaseDetails?.rentAmount || 0;
    
    // Create payment with period tracking
    const payment = new Payment({
      tenant: tenantId,
      property: unit.propertyId._id,
      unit: tenant.currentUnit._id,
      amount: parseFloat(amount),
      paymentDate: new Date(paymentDate),
      paymentMethod: paymentMethod || 'cash',
      type,
      description,
      currency: 'KES', // Always KES
      status: 'completed',
      paymentPeriod: {
        month: paymentPeriod.month,
        year: paymentPeriod.year,
        isNewPeriod: paymentPeriod.isNewPeriod,
        periodStartDate: paymentPeriod.startDate,
        periodEndDate: paymentPeriod.endDate
      },
      previousBalance: previousBalance,
      reference: generatePaymentReference(),
      
      // Balance calculations
      rentForPeriod: paymentPeriod.isNewPeriod ? rentAmount : 0,
      totalDueBeforePayment: paymentPeriod.isNewPeriod ? previousBalance + rentAmount : previousBalance,
      
      // Additional metadata
      metadata: {
        createdBy: req.user?.id,
        automaticPeriodDetection: true,
        paymentTimeliness: calculatePaymentTimeliness(paymentDate, paymentPeriod)
      }
    });

    // Calculate new balance
    const totalDue = payment.totalDueBeforePayment;
    const newBalance = totalDue - parseFloat(amount);
    payment.newBalance = newBalance;
    payment.balanceAfterPayment = newBalance;

    await payment.save({ session });

    // Update tenant balance and payment history
    await updateTenantBalance(tenantId, payment, session);
    
    // Update unit balance if applicable
    await updateUnitBalance(tenant.currentUnit._id, payment, session);

    // Update property revenue tracking
    await updatePropertyRevenue(unit.propertyId._id, payment, session);

    await session.commitTransaction();
    
    // Return populated payment
    const populatedPayment = await Payment.findById(payment._id)
      .populate('tenant', 'firstName lastName email phone')
      .populate('property', 'name address')
      .populate('unit', 'unitNumber floor');

    res.status(201).json({
      success: true,
      payment: populatedPayment,
      balanceInfo: {
        previousBalance,
        rentForPeriod: payment.rentForPeriod,
        totalDue: payment.totalDueBeforePayment,
        amountPaid: payment.amount,
        newBalance: payment.newBalance,
        isNewPeriod: paymentPeriod.isNewPeriod
      }
    });

  } catch (error) {
    await session.abortTransaction();
    logger.error(`Payment creation error: ${error.message}`);
    res.status(400).json({ error: error.message });
  } finally {
    session.endSession();
  }
};

/**
 * Get payments with filtering and pagination
 */
export const getPayments = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      tenant,
      property,
      unit,
      type,
      status,
      startDate,
      endDate,
      paymentMethod,
      sortBy = 'paymentDate',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    const filter = {};
    
    if (tenant) filter.tenant = tenant;
    if (property) filter.property = property;
    if (unit) filter.unit = unit;
    if (type) filter.type = type;
    if (status) filter.status = status;
    if (paymentMethod) filter.paymentMethod = paymentMethod;

    // Date range filter
    if (startDate || endDate) {
      filter.paymentDate = {};
      if (startDate) filter.paymentDate.$gte = new Date(startDate);
      if (endDate) filter.paymentDate.$lte = new Date(endDate);
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute query
    const [payments, total] = await Promise.all([
      Payment.find(filter)
        .populate('tenant', 'firstName lastName email phone')
        .populate('property', 'name address')
        .populate('unit', 'unitNumber floor')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit)),
      Payment.countDocuments(filter)
    ]);

    // Calculate summary statistics
    const summary = await Payment.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$amount' },
          completedPayments: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, '$amount', 0] }
          },
          pendingPayments: {
            $sum: { $cond: [{ $eq: ['$status', 'pending'] }, '$amount', 0] }
          },
          averagePayment: { $avg: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      payments,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      },
      summary: summary[0] || {
        totalAmount: 0,
        completedPayments: 0,
        pendingPayments: 0,
        averagePayment: 0,
        count: 0
      }
    });

  } catch (error) {
    logger.error(`Error fetching payments: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get single payment details
 */
export const getPaymentById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const payment = await Payment.findById(id)
      .populate('tenant', 'firstName lastName email phone leaseDetails')
      .populate('property', 'name address')
      .populate('unit', 'unitNumber floor type');

    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    // Get related payments for context
    const relatedPayments = await Payment.find({
      tenant: payment.tenant._id,
      type: payment.type
    })
    .sort({ paymentDate: -1 })
    .limit(5)
    .select('amount paymentDate status type reference');

    res.json({
      payment,
      relatedPayments: relatedPayments.filter(p => p._id.toString() !== id)
    });

  } catch (error) {
    logger.error(`Error fetching payment: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Update payment status or details
 */
export const updatePayment = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id } = req.params;
    const updates = req.body;

    const payment = await Payment.findById(id).session(session);
    if (!payment) {
      throw new Error('Payment not found');
    }

    const previousStatus = payment.status;
    const previousAmount = payment.amount;

    // Update payment fields
    Object.keys(updates).forEach(key => {
      if (key !== '_id' && key !== 'tenant' && key !== 'property') {
        payment[key] = updates[key];
      }
    });

    // If amount changed, recalculate balances
    if (updates.amount && parseFloat(updates.amount) !== previousAmount) {
      const amountDifference = parseFloat(updates.amount) - previousAmount;
      payment.newBalance = payment.newBalance - amountDifference;
      payment.balanceAfterPayment = payment.newBalance;

      // Update tenant balance
      await Tenant.findByIdAndUpdate(
        payment.tenant,
        { $inc: { currentBalance: -amountDifference } },
        { session }
      );
    }

    // If status changed from pending to completed, update balances
    if (previousStatus === 'pending' && updates.status === 'completed') {
      await updateTenantBalance(payment.tenant, payment, session);
    }

    payment.metadata = {
      ...payment.metadata,
      lastModifiedBy: req.user?.id,
      lastModifiedAt: new Date(),
      changeReason: updates.changeReason || 'Updated via API'
    };

    await payment.save({ session });
    await session.commitTransaction();

    const updatedPayment = await Payment.findById(id)
      .populate('tenant', 'firstName lastName email phone')
      .populate('property', 'name address')
      .populate('unit', 'unitNumber floor');

    res.json(updatedPayment);

  } catch (error) {
    await session.abortTransaction();
    logger.error(`Error updating payment: ${error.message}`);
    res.status(400).json({ error: error.message });
  } finally {
    session.endSession();
  }
};

/**
 * Delete payment (soft delete)
 */
export const deletePayment = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id } = req.params;
    const { reason } = req.body;

    const payment = await Payment.findById(id).session(session);
    if (!payment) {
      throw new Error('Payment not found');
    }

    // Soft delete - mark as deleted instead of removing
    payment.status = 'deleted';
    payment.deletedAt = new Date();
    payment.deletedBy = req.user?.id;
    payment.deletionReason = reason || 'Deleted via API';

    // Reverse balance updates
    if (payment.status === 'completed') {
      await Tenant.findByIdAndUpdate(
        payment.tenant,
        { $inc: { currentBalance: payment.amount } },
        { session }
      );
    }

    await payment.save({ session });
    await session.commitTransaction();

    res.json({ message: 'Payment deleted successfully', paymentId: id });

  } catch (error) {
    await session.abortTransaction();
    logger.error(`Error deleting payment: ${error.message}`);
    res.status(400).json({ error: error.message });
  } finally {
    session.endSession();
  }
};

/**
 * Get payment analytics and insights
 */
export const getPaymentAnalytics = async (req, res) => {
  try {
    const { propertyId, startDate, endDate, period = 'monthly' } = req.query;

    const matchStage = {
      status: 'completed'
    };

    if (propertyId) matchStage.property = mongoose.Types.ObjectId(propertyId);
    if (startDate || endDate) {
      matchStage.paymentDate = {};
      if (startDate) matchStage.paymentDate.$gte = new Date(startDate);
      if (endDate) matchStage.paymentDate.$lte = new Date(endDate);
    }

    // Payment trends by period
    const trendData = await Payment.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: {
            year: { $year: '$paymentDate' },
            month: { $month: '$paymentDate' },
            ...(period === 'weekly' && { week: { $week: '$paymentDate' } }),
            ...(period === 'daily' && { day: { $dayOfMonth: '$paymentDate' } })
          },
          totalAmount: { $sum: '$amount' },
          paymentCount: { $sum: 1 },
          averageAmount: { $avg: '$amount' },
          onTimePayments: {
            $sum: { $cond: [{ $eq: ['$metadata.paymentTimeliness', 'on-time'] }, 1, 0] }
          },
          latePayments: {
            $sum: { $cond: [{ $eq: ['$metadata.paymentTimeliness', 'late'] }, 1, 0] }
          }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    // Payment method distribution
    const paymentMethods = await Payment.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$paymentMethod',
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 },
          percentage: { $sum: 1 }
        }
      }
    ]);

    // Top paying tenants
    const topTenants = await Payment.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$tenant',
          totalPaid: { $sum: '$amount' },
          paymentCount: { $sum: 1 },
          averagePayment: { $avg: '$amount' },
          lastPayment: { $max: '$paymentDate' }
        }
      },
      {
        $lookup: {
          from: 'tenants',
          localField: '_id',
          foreignField: '_id',
          as: 'tenantInfo'
        }
      },
      { $unwind: '$tenantInfo' },
      { $sort: { totalPaid: -1 } },
      { $limit: 10 }
    ]);

    res.json({
      trends: trendData,
      paymentMethods,
      topTenants,
      summary: {
        totalAnalyzed: await Payment.countDocuments(matchStage),
        dateRange: { startDate, endDate },
        period
      }
    });

  } catch (error) {
    logger.error(`Error getting payment analytics: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
};

// Helper Functions

/**
 * Calculate payment period information
 */
const calculatePaymentPeriod = async (tenantId, paymentDate, type) => {
  const currentDate = new Date(paymentDate);
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();
  
  // Get last payment for this tenant and type
  const lastPayment = await Payment.findOne({
    tenant: tenantId,
    type: type,
    status: 'completed'
  }).sort({ paymentDate: -1 });

  let isNewPeriod = true;
  
  if (lastPayment) {
    const lastPaymentDate = new Date(lastPayment.paymentDate);
    isNewPeriod = !isSameMonth(currentDate, lastPaymentDate);
  }

  return {
    month: currentMonth + 1,
    year: currentYear,
    isNewPeriod,
    startDate: startOfMonth(currentDate),
    endDate: endOfMonth(currentDate)
  };
};

/**
 * Update tenant balance after payment
 */
const updateTenantBalance = async (tenantId, payment, session) => {
  const tenant = await Tenant.findById(tenantId).session(session);
  const previousBalance = tenant.currentBalance || 0;
  
  let newBalance;
  if (payment.type === 'rent' && payment.paymentPeriod.isNewPeriod) {
    // New period: add rent to previous balance, then subtract payment
    const rentAmount = tenant.leaseDetails?.rentAmount || 0;
    newBalance = previousBalance + rentAmount - payment.amount;
  } else {
    // Same period: just subtract payment from current balance
    newBalance = previousBalance - payment.amount;
  }

  // Update tenant
  const updateData = {
    currentBalance: newBalance,
    lastPaymentDate: payment.paymentDate,
    $push: {
      paymentHistory: {
        paymentId: payment._id,
        amount: payment.amount,
        date: payment.paymentDate,
        type: payment.type,
        method: payment.paymentMethod,
        newBalance: newBalance,
        reference: payment.reference
      }
    }
  };

  // Update payment performance metrics
  const totalPayments = tenant.paymentHistory ? tenant.paymentHistory.length + 1 : 1;
  const onTimePayments = (tenant.onTimePayments || 0) + 
    (payment.metadata?.paymentTimeliness === 'on-time' ? 1 : 0);
  
  updateData.paymentPerformance = {
    totalPayments,
    onTimePayments,
    onTimeRate: Math.round((onTimePayments / totalPayments) * 100)
  };

  await Tenant.findByIdAndUpdate(tenantId, updateData, { session });

  // Update payment with balance info
  payment.newBalance = newBalance;
  payment.balanceAfterPayment = newBalance;
  await payment.save({ session });
};

/**
 * Update unit balance tracking
 */
const updateUnitBalance = async (unitId, payment, session) => {
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  
  await Unit.findByIdAndUpdate(
    unitId,
    {
      $inc: {
        'revenueTracking.currentMonth.rental': payment.amount,
        'revenueTracking.totalLifetime.rental': payment.amount,
        'revenueTracking.currentMonth.total': payment.amount,
        'revenueTracking.totalLifetime.total': payment.amount
      },
      lastPaymentDate: payment.paymentDate,
      lastPaymentAmount: payment.amount
    },
    { session }
  );
};

/**
 * Update property revenue tracking
 */
const updatePropertyRevenue = async (propertyId, payment, session) => {
  const currentMonth = new Date();
  const monthKey = `${currentMonth.getFullYear()}-${currentMonth.getMonth() + 1}`;
  
  await Property.findByIdAndUpdate(
    propertyId,
    {
      $inc: {
        [`financials.monthlyRevenue.${monthKey}`]: payment.amount,
        'financials.totalRevenue': payment.amount
      },
      'financials.lastUpdated': new Date()
    },
    { session }
  );
};

/**
 * Calculate payment timeliness
 */
const calculatePaymentTimeliness = (paymentDate, paymentPeriod) => {
  const paidDate = new Date(paymentDate);
  const dueDate = new Date(paymentPeriod.endDate);
  dueDate.setDate(5); // Assuming rent is due on 5th of each month
  
  if (paidDate <= dueDate) {
    return 'on-time';
  } else if (paidDate <= new Date(dueDate.getTime() + 5 * 24 * 60 * 60 * 1000)) {
    return 'grace-period';
  } else {
    return 'late';
  }
};

/**
 * Generate unique payment reference
 */
const generatePaymentReference = () => {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substr(2, 4);
  return `PAY-${timestamp}-${random}`.toUpperCase();
};

export default {
  createPayment,
  getPayments,
  getPaymentById,
  updatePayment,
  deletePayment,
  getPaymentAnalytics
};