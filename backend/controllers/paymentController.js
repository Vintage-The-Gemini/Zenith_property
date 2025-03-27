// backend/controllers/paymentController.js
import Payment from "../models/Payment.js";
import Tenant from "../models/Tenant.js";
import Unit from "../models/Unit.js";
import { calculateLateFees, generateInvoiceNumber } from "../utils/helpers.js";

export const getPayments = async (req, res) => {
  try {
    const payments = await Payment.find()
      .populate("tenant", "firstName lastName email")
      .populate("unit", "unitNumber")
      .populate("property", "name")
      .sort("-paymentDate");

    res.json(payments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

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
    res.status(500).json({ error: error.message });
  }
};

export const createPayment = async (req, res) => {
  try {
    const {
      tenantId,
      unitId,
      propertyId,
      amount,
      dueDate,
      paymentMethod,
      type,
      description,
    } = req.body;

    // Verify tenant exists
    const tenant = await Tenant.findById(tenantId);
    if (!tenant) {
      return res.status(404).json({ error: "Tenant not found" });
    }

    // Verify unit exists
    const unit = await Unit.findById(unitId);
    if (!unit) {
      return res.status(404).json({ error: "Unit not found" });
    }

    // Generate reference number
    const reference = generateInvoiceNumber();

    // Create payment
    const payment = new Payment({
      tenant: tenantId,
      unit: unitId,
      property: propertyId,
      amount,
      dueDate: new Date(dueDate),
      paymentMethod,
      type,
      description,
      reference,
      createdBy: req.user._id,
    });

    // Check if payment is late
    const today = new Date();
    const due = new Date(dueDate);

    if (today > due) {
      const daysLate = Math.floor((today - due) / (1000 * 60 * 60 * 24));
      const lateFee = calculateLateFees(amount, daysLate);

      payment.latePayment = {
        isLate: true,
        daysLate,
        lateFee,
      };

      // Add late fee to total amount
      payment.amount += lateFee;
    }

    await payment.save();

    // Update tenant payment history
    if (tenant.paymentHistory) {
      tenant.paymentHistory.push({
        date: payment.paymentDate,
        amount: payment.amount,
        type: payment.type,
        status: payment.status,
        reference: payment.reference,
      });
      await tenant.save();
    }

    res.status(201).json(payment);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const updatePaymentStatus = async (req, res) => {
  try {
    const { status, paymentMethod } = req.body;

    const payment = await Payment.findById(req.params.id);
    if (!payment) {
      return res.status(404).json({ error: "Payment not found" });
    }

    payment.status = status;
    if (paymentMethod) {
      payment.paymentMethod = paymentMethod;
    }

    // If marking as completed, update the payment date to now
    if (status === "completed" && payment.status !== "completed") {
      payment.paymentDate = new Date();
    }

    await payment.save();

    // Update tenant payment history if tenant exists
    if (payment.tenant) {
      const tenant = await Tenant.findById(payment.tenant);
      if (tenant && tenant.paymentHistory) {
        const paymentIndex = tenant.paymentHistory.findIndex(
          (p) => p.reference === payment.reference
        );

        if (paymentIndex !== -1) {
          tenant.paymentHistory[paymentIndex].status = status;
          await tenant.save();
        }
      }
    }

    res.json(payment);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const getPaymentsByTenant = async (req, res) => {
  try {
    const payments = await Payment.find({ tenant: req.params.tenantId })
      .populate("unit", "unitNumber")
      .populate("property", "name")
      .sort("-paymentDate");

    res.json(payments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getPaymentsByProperty = async (req, res) => {
  try {
    const payments = await Payment.find({ property: req.params.propertyId })
      .populate("tenant", "firstName lastName")
      .populate("unit", "unitNumber")
      .sort("-paymentDate");

    res.json(payments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getPaymentsByUnit = async (req, res) => {
  try {
    const payments = await Payment.find({ unit: req.params.unitId })
      .populate("tenant", "firstName lastName")
      .sort("-paymentDate");

    res.json(payments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

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

    // Get completed payments for the current month
    const completedPayments = await Payment.find({
      status: "completed",
      paymentDate: { $gte: startOfMonth, $lte: endOfMonth },
    });

    // Get pending payments
    const pendingPayments = await Payment.find({
      status: "pending",
      dueDate: { $lte: endOfMonth },
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

    // Get overdue payments
    const overduePayments = pendingPayments.filter(
      (payment) => new Date() > new Date(payment.dueDate)
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
      totalCount: completedPayments.length + pendingPayments.length,
      overdueCount: overduePayments.length,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
