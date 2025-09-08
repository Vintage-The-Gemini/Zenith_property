// backend/controllers/paymentController.js
import Payment from "../models/Payment.js";
import Tenant from "../models/Tenant.js";
import Unit from "../models/Unit.js";
import mongoose from "mongoose";
import logger from "../utils/logger.js";

// Helper function to get payment period details
const getPaymentPeriod = (date, customPeriod = null) => {
  const paymentDate = new Date(date);
  
  if (customPeriod) {
    // Handle custom payment periods set by property owner
    return customPeriod;
  }
  
  // Default: Monthly period (1st to end of month)
  const year = paymentDate.getFullYear();
  const month = paymentDate.getMonth();
  
  return {
    month: month + 1, // 1-12
    year: year,
    startDate: new Date(year, month, 1),
    endDate: new Date(year, month + 1, 0) // Last day of month
  };
};

// Helper function to calculate tenant's current balance
const calculateTenantBalance = async (tenantId, upToDate = new Date()) => {
  const tenant = await Tenant.findById(tenantId);
  if (!tenant) throw new Error("Tenant not found");

  if (!tenant.leaseDetails?.startDate || !tenant.leaseDetails?.rentAmount) {
    return {
      totalBalance: 0,
      totalOverpayments: 0,
      netBalance: 0,
      hasCredit: false
    };
  }

  // CORRECT LOGIC: Calculate total amount due from lease start
  const leaseStart = new Date(tenant.leaseDetails.startDate);
  const monthlyRent = tenant.leaseDetails.rentAmount;
  let totalAmountDue = 0;

  // Calculate how many rent periods have passed since lease start
  if (leaseStart <= upToDate) {
    const currentDate = new Date(leaseStart);
    
    // Count complete months from lease start to upToDate
    while (currentDate <= upToDate) {
      totalAmountDue += monthlyRent;
      currentDate.setMonth(currentDate.getMonth() + 1);
    }
  }

  // Get all payments for this tenant up to the specified date
  const payments = await Payment.find({
    tenant: tenantId,
    paymentDate: { $lte: upToDate }
  }).sort({ paymentDate: 1, createdAt: 1 });

  const totalPayments = payments.reduce((sum, payment) => sum + payment.amountPaid, 0);

  // Current balance = what they owe - what they've paid
  const netBalance = totalAmountDue - totalPayments;
  const totalOverpayments = netBalance < 0 ? Math.abs(netBalance) : 0;

  return {
    totalBalance: netBalance,
    totalOverpayments,
    netBalance,
    hasCredit: netBalance < 0
  };
};

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
      paymentMethod,
      type,
      description,
      paymentPeriod: customPeriod
    } = req.body;

    // Fetch tenant with lease details
    const tenant = await Tenant.findById(tenantId).session(session);
    if (!tenant) {
      throw new Error("Tenant not found");
    }

    if (!tenant.leaseDetails?.rentAmount) {
      throw new Error("Tenant must have a negotiated rent amount in lease details");
    }

    const paidAmount = parseFloat(amountPaid);
    const paymentDateTime = new Date(paymentDate || new Date());
    
    // Get payment period details
    const period = getPaymentPeriod(paymentDateTime, customPeriod);
    
    // Get base rent from tenant's lease (negotiated amount)
    const baseRentAmount = tenant.leaseDetails.rentAmount;
    
    // Get current balance before this payment using correct calculation
    const balanceInfo = await calculateTenantBalance(tenantId, paymentDateTime);
    const currentBalance = balanceInfo.netBalance;
    
    // Get payment sequence for this period
    const existingPaymentsInPeriod = await Payment.countDocuments({
      tenant: tenantId,
      "paymentPeriod.month": period.month,
      "paymentPeriod.year": period.year
    }).session(session);
    
    const paymentSequence = existingPaymentsInPeriod + 1;
    
    // Amount due is simply what the tenant currently owes
    const amountDue = Math.max(0, currentBalance);
    
    // Calculate new balance after this payment (allow negative for overpayments)
    const newBalance = currentBalance - paidAmount;
    
    // Determine if this completes the period payment
    const totalPaidInPeriodSoFar = await Payment.aggregate([
      {
        $match: {
          tenant: new mongoose.Types.ObjectId(tenantId),
          "paymentPeriod.month": period.month,
          "paymentPeriod.year": period.year
        }
      },
      {
        $group: {
          _id: null,
          totalPaid: { $sum: "$amountPaid" }
        }
      }
    ]).session(session);
    
    const currentPeriodPaid = (totalPaidInPeriodSoFar[0]?.totalPaid || 0) + paidAmount;
    const isFullyPaid = currentPeriodPaid >= baseRentAmount && newBalance === 0;
    
    // Calculate payment allocation
    const appliedToArears = Math.min(Math.max(0, currentBalance), paidAmount);
    const appliedToCurrentPeriod = paidAmount - appliedToArears;
    
    // Determine payment status
    let status = 'completed';
    if (newBalance > 0) {
      status = 'partial';
    }
    
    // Create payment record
    const payment = new Payment({
      tenant: tenantId,
      unit: unitId,
      property: propertyId,
      paymentPeriod: period,
      baseRentAmount,
      balanceBeforePayment: currentBalance,
      amountDue,
      amountPaid: paidAmount,
      balanceAfterPayment: newBalance,
      monthlyRentDue: baseRentAmount,
      cumulativeAmountDue: amountDue,
      paymentSequence,
      appliedToArears,
      appliedToCurrentPeriod,
      isOverpayment: paidAmount > amountDue,
      isUnderpayment: paidAmount < amountDue,
      isFullyPaid,
      paymentDate: paymentDateTime,
      dueDate: period.endDate,
      paymentMethod: paymentMethod || "cash",
      status,
      type: type || "rent",
      description: description || `Payment ${paymentSequence} for ${period.month}/${period.year}`
    });

    await payment.save({ session });

    // Update tenant's current balance and payment history
    tenant.currentBalance = newBalance;
    
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
      description: payment.description
    });

    await tenant.save({ session });
    
    // Update unit's last payment date and balance
    const unit = await Unit.findById(unitId).session(session);
    if (unit) {
      unit.lastPaymentDate = payment.paymentDate;
      unit.balance = newBalance;
      await unit.save({ session });
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

// Get tenant's detailed balance information including credits and arrears
export const getTenantDetailedBalance = async (req, res) => {
  try {
    const { tenantId } = req.params;
    const tenant = await Tenant.findById(tenantId);
    
    if (!tenant) {
      return res.status(404).json({ error: "Tenant not found" });
    }

    // Get all payments for this tenant
    const payments = await Payment.find({ tenant: tenantId })
      .sort({ paymentDate: 1, createdAt: 1 });

    // Group payments by period
    const periods = new Map();
    let totalCredits = 0;
    let totalArrears = 0;
    
    payments.forEach(payment => {
      const key = `${payment.paymentPeriod.year}-${payment.paymentPeriod.month}`;
      if (!periods.has(key)) {
        periods.set(key, {
          year: payment.paymentPeriod.year,
          month: payment.paymentPeriod.month,
          rentDue: payment.baseRentAmount || tenant.leaseDetails.rentAmount,
          totalPaid: 0,
          payments: []
        });
      }
      
      const period = periods.get(key);
      period.totalPaid += payment.amountPaid;
      period.payments.push(payment);
    });

    // Calculate balance for each period
    const periodBalances = [];
    periods.forEach((period, key) => {
      const balance = period.rentDue - period.totalPaid;
      
      periodBalances.push({
        ...period,
        balance: balance,
        isOverpaid: balance < 0,
        isUnderpaid: balance > 0,
        overpaymentAmount: balance < 0 ? Math.abs(balance) : 0,
        arrearAmount: balance > 0 ? balance : 0
      });

      if (balance < 0) {
        totalCredits += Math.abs(balance);
      } else if (balance > 0) {
        totalArrears += balance;
      }
    });

    // Calculate current month's situation
    const now = new Date();
    const currentPeriod = getPaymentPeriod(now);
    const currentKey = `${currentPeriod.year}-${currentPeriod.month}`;
    const currentPeriodData = periods.get(currentKey);
    
    // Net balance calculation
    const netBalance = totalArrears - totalCredits;
    const currentMonthRent = tenant.leaseDetails.rentAmount;
    
    res.json({
      tenantId,
      tenantName: `${tenant.firstName} ${tenant.lastName}`,
      monthlyRent: currentMonthRent,
      totalCredits,
      totalArrears,
      netBalance,
      hasCredit: totalCredits > totalArrears,
      currentPeriod,
      currentPeriodPaid: currentPeriodData?.totalPaid || 0,
      currentPeriodDue: currentMonthRent,
      periodBalances: periodBalances.sort((a, b) => 
        b.year - a.year || b.month - a.month
      )
    });
  } catch (error) {
    logger.error(`Error getting tenant detailed balance: ${error.message}`);
    res.status(400).json({ error: error.message });
  }
};

// Get tenant's current balance and payment summary
export const getTenantBalanceSummary = async (req, res) => {
  try {
    const { tenantId } = req.params;
    const { date } = req.query;
    
    const upToDate = date ? new Date(date) : new Date();
    const tenant = await Tenant.findById(tenantId);
    
    if (!tenant) {
      return res.status(404).json({ error: "Tenant not found" });
    }
    
    const currentBalance = tenant.currentBalance || 0;
    const currentPeriod = getPaymentPeriod(upToDate);
    
    // Get payments for current period
    const currentPeriodPayments = await Payment.find({
      tenant: tenantId,
      "paymentPeriod.month": currentPeriod.month,
      "paymentPeriod.year": currentPeriod.year
    }).sort({ paymentDate: 1 });
    
    const currentPeriodPaid = currentPeriodPayments.reduce((total, p) => total + p.amountPaid, 0);
    const currentPeriodDue = tenant.leaseDetails.rentAmount;
    const remainingForPeriod = Math.max(0, currentPeriodDue - currentPeriodPaid);
    
    // Calculate what's due now (including any arrears)
    const amountDueNow = currentBalance > 0 ? currentBalance : remainingForPeriod;
    
    res.json({
      tenantId,
      currentBalance,
      amountDueNow,
      currentPeriod,
      currentPeriodDue,
      currentPeriodPaid,
      remainingForPeriod,
      baseRentAmount: tenant.leaseDetails.rentAmount,
      paymentHistory: currentPeriodPayments
    });
  } catch (error) {
    logger.error(`Error getting tenant balance summary: ${error.message}`);
    res.status(400).json({ error: error.message });
  }
};

// Get all payments (for global admin view)
export const getPayments = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      tenant,
      property,
      unit,
      status,
      startDate,
      endDate,
      month,
      year
    } = req.query;

    const filter = {};
    
    if (tenant) filter.tenant = tenant;
    if (property) filter.property = property;
    if (unit) filter.unit = unit;
    if (status) filter.status = status;
    if (month) filter["paymentPeriod.month"] = parseInt(month);
    if (year) filter["paymentPeriod.year"] = parseInt(year);
    
    if (startDate || endDate) {
      filter.paymentDate = {};
      if (startDate) filter.paymentDate.$gte = new Date(startDate);
      if (endDate) filter.paymentDate.$lte = new Date(endDate);
    }

    const payments = await Payment.find(filter)
      .populate("tenant", "firstName lastName email")
      .populate("unit", "unitNumber")
      .populate("property", "name")
      .sort({ paymentDate: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Payment.countDocuments(filter);

    res.json({
      payments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    logger.error(`Error getting payments: ${error.message}`);
    res.status(400).json({ error: error.message });
  }
};

// Get payments by property (for property-specific payment management)
export const getPaymentsByProperty = async (req, res) => {
  try {
    const { propertyId } = req.params;
    const { page = 1, limit = 10, month, year, status } = req.query;
    
    const filter = { property: propertyId };
    if (month) filter["paymentPeriod.month"] = parseInt(month);
    if (year) filter["paymentPeriod.year"] = parseInt(year);
    if (status) filter.status = status;
    
    const payments = await Payment.find(filter)
      .populate("tenant", "firstName lastName email")
      .populate("unit", "unitNumber")
      .sort({ paymentDate: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Payment.countDocuments(filter);
    
    // Get property payment summary
    const summary = await Payment.aggregate([
      { $match: { property: new mongoose.Types.ObjectId(propertyId) } },
      {
        $group: {
          _id: null,
          totalCollected: { $sum: "$amountPaid" },
          totalDue: { $sum: "$amountDue" },
          currentBalance: { $sum: "$balanceAfterPayment" },
          paymentCount: { $sum: 1 }
        }
      }
    ]);

    res.json({
      payments,
      summary: summary[0] || {
        totalCollected: 0,
        totalDue: 0,
        currentBalance: 0,
        paymentCount: 0
      },
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    logger.error(`Error getting payments by property: ${error.message}`);
    res.status(400).json({ error: error.message });
  }
};

// Other existing functions...
export const getPayment = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate("tenant", "firstName lastName email phone currentBalance")
      .populate("unit", "unitNumber")
      .populate("property", "name");

    if (!payment) {
      return res.status(404).json({ error: "Payment not found" });
    }

    res.json(payment);
  } catch (error) {
    logger.error(`Error getting payment: ${error.message}`);
    res.status(400).json({ error: error.message });
  }
};

export const updatePaymentStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const payment = await Payment.findById(req.params.id);

    if (!payment) {
      return res.status(404).json({ error: "Payment not found" });
    }

    payment.status = status;
    await payment.save();

    res.json(payment);
  } catch (error) {
    logger.error(`Error updating payment status: ${error.message}`);
    res.status(400).json({ error: error.message });
  }
};

export const getPaymentsByTenant = async (req, res) => {
  try {
    const { tenantId } = req.params;
    const payments = await Payment.find({ tenant: tenantId })
      .populate("unit", "unitNumber")
      .populate("property", "name")
      .sort({ paymentDate: -1 });

    res.json(payments);
  } catch (error) {
    logger.error(`Error getting payments by tenant: ${error.message}`);
    res.status(400).json({ error: error.message });
  }
};

export const getPaymentsByUnit = async (req, res) => {
  try {
    const { unitId } = req.params;
    const payments = await Payment.find({ unit: unitId })
      .populate("tenant", "firstName lastName email")
      .populate("property", "name")
      .sort({ paymentDate: -1 });

    res.json(payments);
  } catch (error) {
    logger.error(`Error getting payments by unit: ${error.message}`);
    res.status(400).json({ error: error.message });
  }
};

export const getPaymentSummary = async (req, res) => {
  try {
    const { month, year, property } = req.query;
    const currentDate = new Date();
    const targetMonth = month ? parseInt(month) : currentDate.getMonth() + 1;
    const targetYear = year ? parseInt(year) : currentDate.getFullYear();

    const filter = {
      "paymentPeriod.month": targetMonth,
      "paymentPeriod.year": targetYear
    };
    
    if (property) {
      filter.property = property;
    }

    const payments = await Payment.find(filter);

    const summary = {
      totalCollected: payments.reduce((sum, p) => sum + p.amountPaid, 0),
      totalDue: payments.reduce((sum, p) => sum + p.amountDue, 0),
      totalBalance: payments.reduce((sum, p) => sum + p.balanceAfterPayment, 0),
      totalPayments: payments.length,
      completedPayments: payments.filter(p => p.status === 'completed').length,
      partialPayments: payments.filter(p => p.status === 'partial').length,
      pendingPayments: payments.filter(p => p.status === 'pending').length,
      averagePayment: payments.length ? payments.reduce((sum, p) => sum + p.amountPaid, 0) / payments.length : 0,
      period: { month: targetMonth, year: targetYear }
    };

    res.json(summary);
  } catch (error) {
    logger.error(`Error getting payment summary: ${error.message}`);
    res.status(400).json({ error: error.message });
  }
};

export default {
  createPayment,
  getPayments,
  getPayment,
  updatePaymentStatus,
  getPaymentsByTenant,
  getPaymentsByProperty,
  getPaymentsByUnit,
  getPaymentSummary,
  getTenantBalanceSummary,
  getTenantDetailedBalance
};