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
      .populate("tenant", "firstName lastName email")
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
      .populate("tenant", "firstName lastName email phone")
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

// Create a new payment
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
    } = req.body;

    // Verify tenant exists
    const tenantExists = await Tenant.findById(tenant).session(session);
    if (!tenantExists) {
      await session.abortTransaction();
      return res.status(404).json({ error: "Tenant not found" });
    }

    // Verify unit exists
    const unitExists = await Unit.findById(unit).session(session);
    if (!unitExists) {
      await session.abortTransaction();
      return res.status(404).json({ error: "Unit not found" });
    }

    // Verify property exists
    const propertyExists = await Property.findById(property).session(session);
    if (!propertyExists) {
      await session.abortTransaction();
      return res.status(404).json({ error: "Property not found" });
    }

    // Create payment with correct balance information
    const previousBalance = tenantExists.currentBalance || 0;
    const actualDueAmount = dueAmount || amount;
    const paymentVariance = amount - actualDueAmount;

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
      newBalance:
        status === "completed" ? previousBalance - amount : previousBalance,
    });

    await payment.save({ session });

    // If payment is completed, update tenant balance
    if (status === "completed" || status === "partial") {
      tenantExists.currentBalance = previousBalance - amount;

      // Add to payment history if not already there
      if (!tenantExists.paymentHistory) {
        tenantExists.paymentHistory = [];
      }

      tenantExists.paymentHistory.push({
        date: payment.paymentDate,
        amount: payment.amount,
        type: payment.type,
        status: payment.status,
        reference: payment.reference,
        balance: tenantExists.currentBalance,
        description: payment.description,
      });

      await tenantExists.save({ session });

      // Update the unit's last payment date
      unitExists.lastPaymentDate = payment.paymentDate;
      await unitExists.save({ session });
    }

    await session.commitTransaction();

    // Return the populated payment
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

    // If status changed to completed, update tenant balance
    if (status === "completed" && oldStatus !== "completed") {
      const tenant = await Tenant.findById(payment.tenant).session(session);
      if (tenant) {
        // Update tenant balance
        tenant.currentBalance = (tenant.currentBalance || 0) - payment.amount;

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
          balance: tenant.currentBalance,
          description: payment.description || "Payment status updated",
        });

        await tenant.save({ session });

        // Update unit's last payment date
        const unit = await Unit.findById(payment.unit).session(session);
        if (unit) {
          unit.lastPaymentDate = payment.paymentDate || new Date();
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
      .populate("tenant", "firstName lastName")
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
      .populate("tenant", "firstName lastName")
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
      status: "completed",
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
    });
  } catch (error) {
    logger.error(`Error fetching payment summary: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
};
