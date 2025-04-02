// backend/controllers/paymentController.js
import Payment from "../models/Payment.js";
import Tenant from "../models/Tenant.js";
import Unit from "../models/Unit.js";
import Property from "../models/Property.js";
import mongoose from "mongoose";
import logger from "../utils/logger.js";

// Get all payments with optional filtering
export const getPayments = async (req, res) => {
  try {
    // Apply filters if provided
    const filter = {};
    if (req.query.tenantId) filter.tenant = req.query.tenantId;
    if (req.query.unitId) filter.unit = req.query.unitId;
    if (req.query.propertyId) filter.property = req.query.propertyId;
    if (req.query.status) filter.status = req.query.status;
    if (req.query.type) filter.type = req.query.type;

    // Date range filters
    if (req.query.startDate && req.query.endDate) {
      filter.paymentDate = {
        $gte: new Date(req.query.startDate),
        $lte: new Date(req.query.endDate),
      };
    } else if (req.query.startDate) {
      filter.paymentDate = { $gte: new Date(req.query.startDate) };
    } else if (req.query.endDate) {
      filter.paymentDate = { $lte: new Date(req.query.endDate) };
    }

    const payments = await Payment.find(filter)
      .populate("tenant", "firstName lastName email phone currentBalance")
      .populate("unit", "unitNumber")
      .populate("property", "name")
      .sort("-paymentDate");

    res.json(payments);
  } catch (error) {
    logger.error(`Error fetching payments: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
};

// Get a single payment by ID
export const getPayment = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate("tenant", "firstName lastName email phone currentBalance")
      .populate("unit", "unitNumber propertyId")
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

// Create a new payment with balance tracking and carry-forward
export const createPayment = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const {
      tenant,
      unit,
      property,
      amount,
      dueAmount,
      paymentDate,
      dueDate,
      paymentMethod,
      type,
      status,
      description,
      reference,
      agencyFeePercentage,
      taxDeductionPercentage
    } = req.body;

    // Verify tenant exists
    const tenantExists = await Tenant.findById(tenant).session(session);
    if (!tenantExists) {
      await session.abortTransaction();
      return res.status(404).json({ error: "Tenant not found" });
    }

    // Get the previous balance from tenant
    const previousBalance = tenantExists.currentBalance || 0;
    
    // Calculate the actual due amount (use provided or default to amount)
    const actualDueAmount = dueAmount || amount;
    
    // Calculate variance (positive means overpaid, negative means underpaid)
    const paymentVariance = amount - actualDueAmount;
    
    // Calculate new balance
    const newBalance = status === "completed" || status === "partial" 
      ? previousBalance - amount + actualDueAmount // Adjust based on what was actually due
      : previousBalance;
    
    // Create payment with balance information
    const payment = new Payment({
      tenant,
      unit,
      property,
      amount,
      dueAmount: actualDueAmount,
      paymentDate: paymentDate || new Date(),
      dueDate: dueDate || new Date(),
      paymentMethod: paymentMethod || "cash",
      type: type || "rent",
      status: status || "completed",
      description,
      reference,
      previousBalance,
      paymentVariance,
      newBalance,
      carryForward: paymentVariance !== 0,
      carryForwardAmount: paymentVariance,
      agencyFee: {
        percentage: agencyFeePercentage || 0
      },
      taxDeduction: {
        percentage: taxDeductionPercentage || 0
      }
    });
    
    // Set payment period (default to current month if not specified)
    const paymentDateObj = new Date(paymentDate || new Date());
    const firstDayOfMonth = new Date(paymentDateObj.getFullYear(), paymentDateObj.getMonth(), 1);
    const lastDayOfMonth = new Date(paymentDateObj.getFullYear(), paymentDateObj.getMonth() + 1, 0);
    
    payment.paymentPeriod = {
      startDate: req.body.paymentPeriod?.startDate || firstDayOfMonth,
      endDate: req.body.paymentPeriod?.endDate || lastDayOfMonth
    };

    await payment.save({ session });

    // Update tenant balance if payment is completed or partial
    if (status === "completed" || status === "partial") {
      tenantExists.currentBalance = newBalance;
      
      // Add to payment history
      if (!tenantExists.paymentHistory) {
        tenantExists.paymentHistory = [];
      }
      
      tenantExists.paymentHistory.push({
        date: payment.paymentDate,
        amount: payment.amount,
        type: payment.type,
        status: payment.status,
        reference: payment.reference,
        balance: newBalance,
        description: payment.description || `${payment.type} payment`,
        carryForward: payment.carryForward,
        carryForwardAmount: payment.carryForwardAmount
      });

      await tenantExists.save({ session });
      
      // Also update the unit's last payment date
      const unit = await Unit.findById(payment.unit).session(session);
      if (unit) {
        unit.lastPaymentDate = payment.paymentDate;
        unit.balance = newBalance; // Update unit balance to match tenant balance
        await unit.save({ session });
      }
    }

    await session.commitTransaction();
    
    // Return populated payment
    const populatedPayment = await Payment.findById(payment._id)
      .populate("tenant", "firstName lastName email phone currentBalance")
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

// Update payment status
export const updatePaymentStatus = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { status, paymentMethod, paymentDate, amount } = req.body;

    const payment = await Payment.findById(req.params.id).session(session);
    if (!payment) {
      await session.abortTransaction();
      return res.status(404).json({ error: "Payment not found" });
    }

    // Get the old status to compare
    const oldStatus = payment.status;
    
    // Update amount if provided
    if (amount && amount !== payment.amount) {
      payment.amount = amount;
      
      // Recalculate payment variance
      payment.paymentVariance = payment.amount - payment.dueAmount;
      
      // Update carry forward flags
      payment.carryForward = payment.paymentVariance !== 0;
      payment.carryForwardAmount = payment.paymentVariance;
    }

    // Update the payment
    payment.status = status;
    if (paymentMethod) {
      payment.paymentMethod = paymentMethod;
    }
    if (paymentDate) {
      payment.paymentDate = paymentDate;
    }

    await payment.save({ session });

    // If status changed to completed, update tenant balance
    if ((status === "completed" || status === "partial") && 
        (oldStatus !== "completed" && oldStatus !== "partial")) {
      const tenant = await Tenant.findById(payment.tenant).session(session);
      if (tenant) {
        // Calculate new balance based on current balance and payment details
        const newBalance = tenant.currentBalance - payment.amount + payment.dueAmount;
        tenant.currentBalance = newBalance;

        // Add to payment history
        if (!tenant.paymentHistory) {
          tenant.paymentHistory = [];
        }

        tenant.paymentHistory.push({
          date: payment.paymentDate || new Date(),
          amount: payment.amount,
          type: payment.type,
          status: payment.status,
          reference: payment.reference,
          balance: newBalance,
          description: payment.description || "Payment status updated",
          carryForward: payment.carryForward,
          carryForwardAmount: payment.carryForwardAmount
        });

        await tenant.save({ session });

        // Update unit's last payment date and balance
        const unit = await Unit.findById(payment.unit).session(session);
        if (unit) {
          unit.lastPaymentDate = payment.paymentDate || new Date();
          unit.balance = newBalance;
          await unit.save({ session });
        }
      }
    }

    await session.commitTransaction();

    // Return the updated payment
    const updatedPayment = await Payment.findById(payment._id)
      .populate("tenant", "firstName lastName email phone currentBalance")
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
export const getPaymentsByUnit = async (req, res) => {
  try {
    const payments = await Payment.find({ unit: req.params.unitId })
      .populate("tenant", "firstName lastName currentBalance")
      .sort("-paymentDate");

    res.json(payments);
  } catch (error) {
    logger.error(`Error fetching unit payments: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
};

// Get payment summary statistics
export const getPaymentSummary = async (req, res) => {
  try {
    // Get current month's start and end dates
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
      23,
      59,
      59
    );

    // Get completed payments for current month
    const completedPayments = await Payment.find({
      status: { $in: ["completed", "partial"] },
      paymentDate: { $gte: startOfMonth, $lte: endOfMonth },
    });

    // Get pending payments
    const pendingPayments = await Payment.find({
      status: "pending",
    });

    // Calculate totals
    const totalCollected = completedPayments.reduce(
      (sum, payment) => sum + payment.amount,
      0
    );
    const totalPending = pendingPayments.reduce(
      (sum, payment) => sum + payment.amount,
      0
    );

    // Overdue payments
    const overduePayments = pendingPayments.filter(
      (payment) => payment.dueDate && new Date() > new Date(payment.dueDate)
    );
    const totalOverdue = overduePayments.reduce(
      (sum, payment) => sum + payment.amount,
      0
    );
    
    // Calculate landlord amount
    const landlordTotal = completedPayments.reduce(
      (sum, payment) => sum + (payment.landlordAmount || payment.amount),
      0
    );
    
    // Agency fees
    const agencyFeesTotal = completedPayments.reduce(
      (sum, payment) => sum + (payment.agencyFee?.amount || 0),
      0
    );
    
    // Tax deductions
    const taxDeductionsTotal = completedPayments.reduce(
      (sum, payment) => sum + (payment.taxDeduction?.amount || 0),
      0
    );
    
    // Payment variance totals
    const paymentVarianceTotal = completedPayments.reduce(
      (sum, payment) => sum + (payment.paymentVariance || 0),
      0
    );

    res.json({
      currentMonth: {
        name: startOfMonth.toLocaleString("default", { month: "long" }),
        year: startOfMonth.getFullYear(),
      },
      collected: totalCollected,
      pending: totalPending,
      overdue: totalOverdue,
      overdueCount: overduePayments.length,
      totalCount: completedPayments.length + pendingPayments.length,
      landlordAmount: landlordTotal,
      agencyFees: agencyFeesTotal,
      taxDeductions: taxDeductionsTotal,
      paymentVariance: paymentVarianceTotal
    });
  } catch (error) {
    logger.error(`Error fetching payment summary: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
};

// Get monthly payment data
export const getMonthlyPayments = async (req, res) => {
  try {
    // Get start and end dates if provided
    const startDate = req.query.startDate ? new Date(req.query.startDate) : new Date(new Date().getFullYear(), 0, 1);
    const endDate = req.query.endDate ? new Date(req.query.endDate) : new Date();
    
    // Property filter if provided
    const propertyFilter = req.query.propertyId ? { property: req.query.propertyId } : {};
    
    // Get all payments within the date range
    const payments = await Payment.find({
      ...propertyFilter,
      paymentDate: { $gte: startDate, $lte: endDate }
    });
    
    // Group payments by month
    const monthlyData = {};
    
    payments.forEach(payment => {
      const paymentDate = new Date(payment.paymentDate);
      const monthYear = `${paymentDate.getFullYear()}-${String(paymentDate.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthlyData[monthYear]) {
        monthlyData[monthYear] = {
          month: new Date(paymentDate.getFullYear(), paymentDate.getMonth(), 1)
            .toLocaleString('default', { month: 'long', year: 'numeric' }),
          revenue: 0,
          pending: 0,
          overdue: 0,
          paymentCount: 0,
          landlordAmount: 0,
          agencyFees: 0,
          variance: 0
        };
      }
      
      if (payment.status === 'completed' || payment.status === 'partial') {
        monthlyData[monthYear].revenue += payment.amount;
        monthlyData[monthYear].landlordAmount += (payment.landlordAmount || payment.amount);
        monthlyData[monthYear].agencyFees += (payment.agencyFee?.amount || 0);
        monthlyData[monthYear].variance += (payment.paymentVariance || 0);
      } else if (payment.status === 'pending') {
        monthlyData[monthYear].pending += payment.amount;
        
        // Check if payment is overdue
        if (payment.dueDate && new Date() > new Date(payment.dueDate)) {
          monthlyData[monthYear].overdue += payment.amount;
        }
      }
      
      monthlyData[monthYear].paymentCount++;
    });
    
    // Convert to array and sort by date
    const result = Object.entries(monthlyData).map(([key, value]) => ({
      ...value,
      monthKey: key
    })).sort((a, b) => a.monthKey.localeCompare(b.monthKey));
    
    res.json(result);
  } catch (error) {
    logger.error(`Error fetching monthly payments: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
};

// Get BnB booking calendar for a unit
export const getBnbCalendar = async (req, res) => {
  try {
    const { unitId } = req.params;
    
    // Get unit with BnB settings and bookings
    const unit = await Unit.findById(unitId)
      .populate({
        path: 'bookings',
        select: 'checkIn checkOut status tenant nightlyRate totalAmount'
      });
      
    if (!unit) {
      return res.status(404).json({ error: 'Unit not found' });
    }
    
    if (unit.type !== 'bnb') {
      return res.status(400).json({ error: 'This unit is not configured for BnB bookings' });
    }
    
    // Format response
    const response = {
      unitDetails: {
        id: unit._id,
        unitNumber: unit.unitNumber,
        nightlyRate: unit.bnbSettings?.nightlyRate || unit.monthlyRent / 30,
        weeklyRate: unit.bnbSettings?.weeklyRate,
        monthlyRate: unit.bnbSettings?.monthlyRate || unit.monthlyRent,
        minimumStay: unit.bnbSettings?.minimumStay || 1,
        checkInTime: unit.bnbSettings?.checkInTime || "14:00",
        checkOutTime: unit.bnbSettings?.checkOutTime || "11:00",
      },
      occupiedDates: unit.bookings.map(booking => ({
        startDate: booking.checkIn,
        endDate: booking.checkOut,
        status: booking.status,
        tenantId: booking.tenant,
        amount: booking.totalAmount
      })),
      unavailableDates: unit.bnbSettings?.unavailableDates || []
    };
    
    res.json(response);
  } catch (error) {
    logger.error(`Error fetching BnB calendar: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
};

// Create a BnB booking
export const createBnbBooking = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const { unitId, checkIn, checkOut, tenantId, amount, nightlyRate, totalNights } = req.body;
    
    // Validate unit exists and is configured for BnB
    const unit = await Unit.findById(unitId).session(session);
    if (!unit) {
      await session.abortTransaction();
      return res.status(404).json({ error: 'Unit not found' });
    }
    
   // backend/controllers/paymentController.js (continued)
   if (unit.type !== 'bnb') {
    await session.abortTransaction();
    return res.status(400).json({ error: 'This unit is not configured for BnB bookings' });
  }
  
  // Check if the dates are available
  const checkInDate = new Date(checkIn);
  const checkOutDate = new Date(checkOut);
  
  // Validate dates
  if (checkInDate >= checkOutDate) {
    await session.abortTransaction();
    return res.status(400).json({ error: 'Check-out date must be after check-in date' });
  }
  
  // Check for booking conflicts
  const conflictingBooking = await Unit.findOne({
    _id: unitId,
    'bookings': {
      $elemMatch: {
        status: { $ne: 'cancelled' },
        $or: [
          // New booking starts during an existing booking
          { checkIn: { $lte: checkInDate }, checkOut: { $gte: checkInDate } },
          // New booking ends during an existing booking
          { checkIn: { $lte: checkOutDate }, checkOut: { $gte: checkOutDate } },
          // New booking entirely contains an existing booking
          { checkIn: { $gte: checkInDate }, checkOut: { $lte: checkOutDate } }
        ]
      }
    }
  }).session(session);
  
  if (conflictingBooking) {
    await session.abortTransaction();
    return res.status(400).json({ error: 'The selected dates are not available for booking' });
  }
  
  // Create the booking
  const booking = {
    checkIn: checkInDate,
    checkOut: checkOutDate,
    tenant: tenantId,
    nightlyRate: nightlyRate || unit.bnbSettings?.nightlyRate || unit.monthlyRent / 30,
    totalNights: totalNights || Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24)),
    totalAmount: amount || totalNights * nightlyRate,
    status: 'confirmed',
    createdAt: new Date()
  };
  
  // Add booking to unit
  if (!unit.bookings) {
    unit.bookings = [];
  }
  unit.bookings.push(booking);
  await unit.save({ session });
  
  // Create a payment record
  const payment = new Payment({
    tenant: tenantId,
    unit: unitId,
    property: unit.propertyId,
    amount: booking.totalAmount,
    dueAmount: booking.totalAmount,
    paymentDate: new Date(),
    dueDate: checkInDate, // Due by check-in date
    paymentMethod: 'card', // Default method
    type: 'bnb',
    status: 'completed',
    description: `BnB booking from ${checkInDate.toLocaleDateString()} to ${checkOutDate.toLocaleDateString()}`,
    paymentPeriod: {
      startDate: checkInDate,
      endDate: checkOutDate
    },
    bnbBooking: {
      checkIn: checkInDate,
      checkOut: checkOutDate,
      totalNights: booking.totalNights,
      nightlyRate: booking.nightlyRate
    }
  });
  
  await payment.save({ session });
  
  // Update tenant if exists
  if (tenantId) {
    const tenant = await Tenant.findById(tenantId).session(session);
    if (tenant) {
      // Add booking to tenant's history
      if (!tenant.bookingHistory) {
        tenant.bookingHistory = [];
      }
      
      tenant.bookingHistory.push({
        checkIn: checkInDate,
        checkOut: checkOutDate,
        unitId: unitId,
        totalAmount: booking.totalAmount,
        status: 'confirmed'
      });
      
      await tenant.save({ session });
    }
  }
  
  await session.commitTransaction();
  
  res.status(201).json({
    message: 'BnB booking created successfully',
    booking,
    payment: {
      id: payment._id,
      amount: payment.amount,
      status: payment.status
    }
  });
} catch (error) {
  await session.abortTransaction();
  logger.error(`Error creating BnB booking: ${error.message}`);
  res.status(400).json({ error: error.message });
} finally {
  session.endSession();
}
};

// Calculate amount due for tenant
export const calculateAmountDue = async (req, res) => {
try {
  const { tenantId } = req.params;
  
  // Get tenant details
  const tenant = await Tenant.findById(tenantId)
    .populate('unitId', 'monthlyRent leaseStartDate');
  
  if (!tenant) {
    return res.status(404).json({ error: 'Tenant not found' });
  }
  
  const unit = tenant.unitId;
  if (!unit) {
    return res.status(400).json({ error: 'Tenant has no assigned unit' });
  }
  
  // Get tenant's rent amount and payment period
  const monthlyRent = unit.monthlyRent;
  
  // Get rent due date - this should be configurable per tenant or property
  const today = new Date();
  const currentMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const currentMonthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  
  // Get custom rent due day if set (e.g., 5th of month)
  const rentDueDay = tenant.leaseDetails?.paymentDueDay || 1;
  const rentDueDate = new Date(today.getFullYear(), today.getMonth(), rentDueDay);
  
  // Check previous payments to determine carry-forward amount
  // Find most recent payment with carry-forward
  const recentPayment = await Payment.findOne({
    tenant: tenantId,
    carryForward: true,
    paymentDate: { $lt: currentMonthStart }
  }).sort('-paymentDate');
  
  // Initialize carry-forward amount
  let carryForwardAmount = 0;
  
  // If there's a recent payment with carry-forward, use that amount
  if (recentPayment) {
    carryForwardAmount = recentPayment.carryForwardAmount || 0;
  } else {
    // Otherwise use current balance
    carryForwardAmount = tenant.currentBalance || 0;
  }
  
  // Determine amount due based on monthly rent adjusted by carry-forward
  let amountDue = monthlyRent;
  
  // Subtract carry-forward if positive (overpayment), add if negative (underpayment)
  amountDue -= carryForwardAmount;
  
  // If negative due amount (extreme overpayment), set to 0
  if (amountDue < 0) {
    amountDue = 0;
  }
  
  // Check if payment is overdue
  const isOverdue = today > rentDueDate && amountDue > 0;
  
  res.json({
    tenant: {
      id: tenant._id,
      name: `${tenant.firstName} ${tenant.lastName}`,
      currentBalance: tenant.currentBalance || 0
    },
    unit: {
      id: unit._id,
      unitNumber: unit.unitNumber,
      monthlyRent
    },
    rentPeriod: {
      startDate: currentMonthStart,
      endDate: currentMonthEnd,
      dueDate: rentDueDate
    },
    payment: {
      amountDue,
      carryForwardAmount,
      isOverdue,
      gracePeriod: tenant.leaseDetails?.gracePeriod || 0,
      lateFee: isOverdue ? (tenant.leaseDetails?.lateFee || 0) : 0
    }
  });
} catch (error) {
  logger.error(`Error calculating amount due: ${error.message}`);
  res.status(500).json({ error: error.message });
}
};

// Get landlord payout summary
export const getLandlordPayoutSummary = async (req, res) => {
try {
  const { propertyId } = req.params;
  const { startDate, endDate } = req.query;
  
  // Set default date range to current month if not provided
  const periodStart = startDate ? new Date(startDate) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const periodEnd = endDate ? new Date(endDate) : new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0);
  
  // Get all completed payments for the property in the period
  const payments = await Payment.find({
    property: propertyId,
    status: { $in: ['completed', 'partial'] },
    paymentDate: { $gte: periodStart, $lte: periodEnd }
  }).populate('tenant', 'firstName lastName');
  
  // Get expenses for the property in the period
  const expenses = await mongoose.model('Expense').find({
    property: propertyId,
    date: { $gte: periodStart, $lte: periodEnd },
    paymentStatus: 'paid'
  });
  
  // Calculate totals
  const totalCollected = payments.reduce((sum, payment) => sum + payment.amount, 0);
  
  // Calculate agency fees and tax deductions
  const agencyFees = payments.reduce((sum, payment) => {
    const feeAmount = payment.agencyFee?.amount || 
      (payment.agencyFee?.percentage ? payment.amount * (payment.agencyFee.percentage / 100) : 0);
    return sum + feeAmount;
  }, 0);
  
  const taxDeductions = payments.reduce((sum, payment) => {
    const taxAmount = payment.taxDeduction?.amount || 
      (payment.taxDeduction?.percentage ? payment.amount * (payment.taxDeduction.percentage / 100) : 0);
    return sum + taxAmount;
  }, 0);
  
  // Calculate total expenses
  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  
  // Calculate landlord payout amount
  const landlordAmount = totalCollected - agencyFees - taxDeductions - totalExpenses;
  
  // Group payments by unit
  const unitSummaries = {};
  payments.forEach(payment => {
    const unitId = payment.unit.toString();
    if (!unitSummaries[unitId]) {
      unitSummaries[unitId] = {
        unitId,
        unitNumber: payment.unit.unitNumber || 'Unknown',
        totalAmount: 0,
        paymentsCount: 0,
        tenants: new Set()
      };
    }
    
    unitSummaries[unitId].totalAmount += payment.amount;
    unitSummaries[unitId].paymentsCount += 1;
    if (payment.tenant) {
      unitSummaries[unitId].tenants.add(payment.tenant._id.toString());
    }
  });
  
  // Convert unit summaries to array
  const unitData = Object.values(unitSummaries).map(unit => ({
    ...unit,
    tenantCount: unit.tenants.size,
    tenants: Array.from(unit.tenants) // Convert Set to Array
  }));
  
  res.json({
    property: propertyId,
    period: {
      startDate: periodStart,
      endDate: periodEnd
    },
    summary: {
      totalCollected,
      agencyFees,
      taxDeductions,
      totalExpenses,
      landlordAmount
    },
    units: unitData,
    payments: payments.map(payment => ({
      id: payment._id,
      date: payment.paymentDate,
      amount: payment.amount,
      tenant: payment.tenant ? `${payment.tenant.firstName} ${payment.tenant.lastName}` : 'Unknown',
      agencyFee: payment.agencyFee?.amount || 0,
      taxDeduction: payment.taxDeduction?.amount || 0,
      landlordAmount: payment.amount - (payment.agencyFee?.amount || 0) - (payment.taxDeduction?.amount || 0)
    })),
    expenses: expenses.map(expense => ({
      id: expense._id,
      date: expense.date,
      amount: expense.amount,
      category: expense.category,
      description: expense.description
    }))
  });
} catch (error) {
  logger.error(`Error getting landlord payout summary: ${error.message}`);
  res.status(500).json({ error: error.message });
}
};

export default {
getPayments,
getPayment,
createPayment,
updatePaymentStatus,
getPaymentsByTenant,
getPaymentsByProperty,
getPaymentsByUnit,
getPaymentSummary,
getMonthlyPayments,
getBnbCalendar,
createBnbBooking,
calculateAmountDue,
getLandlordPayoutSummary
};