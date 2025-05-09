// backend/controllers/paymentController.js
import Payment from "../models/Payment.js";
import Tenant from "../models/Tenant.js";
import Unit from "../models/Unit.js";
import mongoose from "mongoose";
import logger from "../utils/logger.js";

export const createPayment = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const {
      tenant: tenantId,
      unit: unitId,
      property: propertyId,
      amountPaid,
      paymentDate,
      dueDate,
      paymentMethod,
      type,
      description,
      inSamePeriod,
    } = req.body;

    // Fetch tenant with unit data
    const tenant = await Tenant.findById(tenantId)
      .populate('unitId')
      .session(session);
      
    if (!tenant) {
      throw new Error("Tenant not found");
    }

    // Get base rent amount from tenant's lease
    const baseRentAmount = tenant.leaseDetails?.rentAmount || 0;
    
    // Get previous balance
    const previousBalance = tenant.currentBalance || 0;
    
    // Parse amount paid
    const paidAmount = parseFloat(amountPaid);
    
    // Calculate amount due based on payment period
    let amountDue;
    
    if (inSamePeriod) {
      // If same payment period, use the previous balance as the amount due
      amountDue = previousBalance;
    } else {
      // If new payment period, add base rent to previous balance
      amountDue = previousBalance + baseRentAmount;
    }
    
    // Calculate payment allocation
    let appliedToPreviousBalance = Math.min(previousBalance, paidAmount);
    let appliedToCurrentRent = 0;
    
    // Apply to current rent only if in new period and there's remaining payment
    if (!inSamePeriod && paidAmount > previousBalance) {
      appliedToCurrentRent = Math.min(baseRentAmount, paidAmount - previousBalance);
    }
    
    // Calculate payment variance
    const paymentVariance = paidAmount - amountDue;
    const overpayment = paymentVariance > 0 ? paymentVariance : 0;
    const underpayment = paymentVariance < 0 ? Math.abs(paymentVariance) : 0;
    
    // Calculate new balance
    const newBalance = amountDue - paidAmount;
    
    // Determine payment status
    let status = 'completed';
    if (paidAmount < amountDue) {
      status = 'partial';
    }
    
    // Create payment record
    const payment = new Payment({
      tenant: tenantId,
      unit: unitId,
      property: propertyId,
      baseRentAmount,
      amountDue,
      amountPaid: paidAmount,
      appliedToPreviousBalance,
      appliedToCurrentRent,
      overpayment,
      underpayment,
      previousBalance,
      paymentVariance,
      newBalance,
      inSamePeriod: !!inSamePeriod,
      isOverpayment: overpayment > 0,
      isUnderpayment: underpayment > 0,
      paymentDate: paymentDate || new Date(),
      dueDate: dueDate || new Date(),
      paymentMethod: paymentMethod || "cash",
      status,
      type: type || "rent",
      description,
    });

    await payment.save({ session });

    // Update tenant balance
    tenant.currentBalance = newBalance;
    
    // Add to payment history
    if (!tenant.paymentHistory) {
      tenant.paymentHistory = [];
    }
    
    tenant.paymentHistory.push({
      date: payment.paymentDate,
      amount: payment.amountPaid,
      type: payment.type,
      status: payment.status,
      reference: payment.reference,
      balance: newBalance,
      description: payment.description || `${payment.type} payment`,
    });

    await tenant.save({ session });
    
    // Update unit's last payment date if applicable
    if (status === 'completed' || status === 'partial') {
      const unit = await Unit.findById(unitId).session(session);
      if (unit) {
        unit.lastPaymentDate = payment.paymentDate;
        unit.balance = newBalance;
        await unit.save({ session });
      }
    }

    await session.commitTransaction();
    
    // Return populated payment
    const populatedPayment = await Payment.findById(payment._id)
      .populate("tenant", "firstName lastName email")
      .populate("unit", "unitNumber")
      .populate("property", "name");
      
    res.status(201).json(populatedPayment);
  } catch (error) {
    await session.abortTransaction();
    logger.error(`Error creating payment: ${error.message}`);
    res.status(400).json({ error: error.message });
  } finally {
    session.endSession();
  }
};

// Get a single payment by ID
export const getPayment = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate("tenant", "firstName lastName email phone currentBalance")
      .populate("unit", "unitNumber")
      .populate("property", "name address");

    if (!payment) {
      return res.status(404).json({ error: "Payment not found" });
    }
    res.json(payment);
  } catch (error) {
    logger.error(`Error fetching payment: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
};

// Get payments with enhanced filtering
export const getPayments = async (req, res) => {
  try {
    const filter = {};
    
    // Apply filters
    if (req.query.tenantId) filter.tenant = req.query.tenantId;
    if (req.query.unitId) filter.unit = req.query.unitId;
    if (req.query.propertyId) filter.property = req.query.propertyId;
    if (req.query.status) filter.status = req.query.status;
    if (req.query.type) filter.type = req.query.type;
    
    // Balance filters
    if (req.query.hasOverpayment === 'true') filter.isOverpayment = true;
    if (req.query.hasUnderpayment === 'true') filter.isUnderpayment = true;
    
    // Date range filters
    if (req.query.startDate || req.query.endDate) {
      filter.paymentDate = {};
      if (req.query.startDate) {
        filter.paymentDate.$gte = new Date(req.query.startDate);
      }
      if (req.query.endDate) {
        filter.paymentDate.$lte = new Date(req.query.endDate);
      }
    }

    const payments = await Payment.find(filter)
      .populate("tenant", "firstName lastName email currentBalance")
      .populate("unit", "unitNumber")
      .populate("property", "name")
      .sort("-paymentDate");

    res.json(payments);
  } catch (error) {
    logger.error(`Error fetching payments: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
};

// Update payment status
export const updatePaymentStatus = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { status, paymentMethod, paymentDate } = req.body;

    const payment = await Payment.findById(req.params.id).session(session);
    if (!payment) {
      await session.abortTransaction();
      return res.status(404).json({ error: "Payment not found" });
    }

    // Get the old status to compare
    const oldStatus = payment.status;

    // Update the payment
    payment.status = status;
    if (paymentMethod) {
      payment.paymentMethod = paymentMethod;
    }
    if (paymentDate) {
      payment.paymentDate = paymentDate;
    }

    await payment.save({ session });

    // If status changed to completed, update balance tracking
    if (status === "completed" && oldStatus !== "completed") {
      const tenant = await Tenant.findById(payment.tenant).session(session);
      if (tenant) {
        // Recalculate balance
        tenant.currentBalance = payment.newBalance;

        // Update payment history
        const historyEntry = tenant.paymentHistory.find(
          h => h.reference === payment.reference
        );
        if (historyEntry) {
          historyEntry.status = status;
        }

        await tenant.save({ session });

        // Update unit's last payment date
        const unit = await Unit.findById(payment.unit).session(session);
        if (unit) {
          unit.lastPaymentDate = payment.paymentDate || new Date();
          unit.balance = payment.newBalance;
          await unit.save({ session });
        }
      }
    }

    await session.commitTransaction();

    // Return the updated payment
    const updatedPayment = await Payment.findById(payment._id)
      .populate("tenant", "firstName lastName email")
      .populate("unit", "unitNumber")
      .populate("property", "name");

    res.json(updatedPayment);
  } catch (error) {
    await session.abortTransaction();
    logger.error(`Error updating payment status: ${error.message}`);
    res.status(400).json({ error: error.message });
  } finally {
    session.endSession();
  }
};

// Get payments by tenant
export const getPaymentsByTenant = async (req, res) => {
  try {
    const payments = await Payment.find({ tenant: req.params.tenantId })
      .populate("unit", "unitNumber")
      .populate("property", "name")
      .sort("-paymentDate");

    res.json(payments);
  } catch (error) {
    logger.error(`Error fetching tenant payments: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
};

// Get payments by property
export const getPaymentsByProperty = async (req, res) => {
  try {
    const payments = await Payment.find({ property: req.params.propertyId })
      .populate("tenant", "firstName lastName currentBalance")
      .populate("unit", "unitNumber")
      .sort("-paymentDate");

    res.json(payments);
  } catch (error) {
    logger.error(`Error fetching property payments: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
};

// Get payments by unit
// Get payments by unit
export const getPaymentsByUnit = async (req, res) => {
  try {
    const payments = await Payment.find({ unit: req.params.unitId })
      .populate("tenant", "firstName lastName")
      .sort("-paymentDate");

    res.json(payments);
  } catch (error) {
    logger.error(`Error fetching unit payments: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
};

// Get payment summary with balance information
export const getPaymentSummary = async (req, res) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    
    // Get all payments for the current month
    const monthlyPayments = await Payment.find({
      paymentDate: { $gte: startOfMonth, $lte: endOfMonth },
    });
    
    // Calculate statistics
    const collected = monthlyPayments
      .filter(p => p.status === 'completed')
      .reduce((sum, p) => sum + p.amountPaid, 0);
      
    const pending = monthlyPayments
      .filter(p => p.status === 'pending')
      .reduce((sum, p) => sum + p.amountDue, 0);
      
    const overdue = monthlyPayments
      .filter(p => p.status === 'pending' && p.dueDate < now)
      .reduce((sum, p) => sum + p.amountDue, 0);
    
    // YTD total
    const ytdPayments = await Payment.find({
      paymentDate: { $gte: startOfYear },
      status: 'completed',
    });
    
    const ytdTotal = ytdPayments.reduce((sum, p) => sum + p.amountPaid, 0);
    
    // Payment methods breakdown
    const paymentMethods = {};
    monthlyPayments
      .filter(p => p.status === 'completed')
      .forEach(payment => {
        if (!paymentMethods[payment.paymentMethod]) {
          paymentMethods[payment.paymentMethod] = 0;
        }
        paymentMethods[payment.paymentMethod] += payment.amountPaid;
      });
    
    // Get all payments to calculate balance statistics
    const allPayments = await Payment.find({});
    
    // Balance statistics
    const totalOverpayments = allPayments
      .filter(p => p.isOverpayment)
      .reduce((sum, p) => sum + (p.overpayment || 0), 0);
      
    const totalUnderpayments = allPayments
      .filter(p => p.isUnderpayment)
      .reduce((sum, p) => sum + (p.underpayment || 0), 0);
    
    res.json({
      currentMonth: {
        name: startOfMonth.toLocaleString('default', { month: 'long' }),
        year: startOfMonth.getFullYear(),
      },
      collected,
      pending,
      overdue,
      overdueCount: monthlyPayments.filter(p => p.status === 'pending' && p.dueDate < now).length,
      totalCount: monthlyPayments.length,
      ytdTotal,
      paymentMethods,
      balanceStatistics: {
        totalOverpayments,
        totalUnderpayments,
        netBalance: totalUnderpayments - totalOverpayments,
      },
    });
  } catch (error) {
    logger.error(`Error fetching payment summary: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
};

export default {
  createPayment,
  getPayment,
  getPayments,
  updatePaymentStatus,
  getPaymentsByTenant,
  getPaymentsByProperty,
  getPaymentsByUnit,
  getPaymentSummary,
};