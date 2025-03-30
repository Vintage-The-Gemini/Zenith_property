// backend/controllers/paymentController.js
import Payment from "../models/Payment.js";
import Tenant from "../models/Tenant.js";
import Unit from "../models/Unit.js";
import Property from "../models/Property.js";
import { calculateLateFees, generateInvoiceNumber } from "../utils/helpers.js";
import logger from "../utils/logger.js";

// Get all payments with filters
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

// Get payment by ID
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
  try {
    const {
      tenantId,
      unitId,
      propertyId,
      amount,
      dueAmount,
      // Other fields...
    } = req.body;

    // Find tenant and get current balance
    const tenant = await Tenant.findById(tenantId);
    if (!tenant) {
      return res.status(404).json({ error: "Tenant not found" });
    }

    // Calculate variance and update tenant balance
    const previousBalance = tenant.currentBalance || 0;
    const actualDueAmount = dueAmount || amount;
    const paymentVariance = amount - actualDueAmount;

    // Update tenant balance
    tenant.currentBalance = previousBalance - amount;
    await tenant.save();

    // Create payment record with balance info
    const payment = new Payment({
      tenant: tenantId,
      unit: unitId,
      property: propertyId,
      amount,
      dueAmount: actualDueAmount,
      paymentVariance,
      previousBalance,
      newBalance: tenant.currentBalance,
      // Other fields...
    });

    await payment.save();
    res.status(201).json(payment);
  } catch (error) {
    // Error handling...
  }
};

// Update payment status
export const updatePaymentStatus = async (req, res) => {
  try {
    const { status, paymentMethod, paymentDate } = req.body;

    const payment = await Payment.findById(req.params.id);
    if (!payment) {
      return res.status(404).json({ error: "Payment not found" });
    }

    payment.status = status;
    if (paymentMethod) {
      payment.paymentMethod = paymentMethod;
    }

    // If marking as completed, update the payment date
    if (status === "completed" && payment.status !== "completed") {
      payment.paymentDate = paymentDate || new Date();
    }

    await payment.save();

    res.json(payment);
  } catch (error) {
    logger.error(`Error updating payment status: ${error.message}`);
    res.status(400).json({ error: error.message });
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

    // Get year to date statistics
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const ytdPayments = await Payment.find({
      status: "completed",
      paymentDate: { $gte: startOfYear, $lte: now },
    });
    const ytdTotal = ytdPayments.reduce(
      (sum, payment) => sum + payment.amount,
      0
    );

    // Get payment methods breakdown for completed payments
    const paymentMethods = {};
    completedPayments.forEach((payment) => {
      if (!paymentMethods[payment.paymentMethod]) {
        paymentMethods[payment.paymentMethod] = 0;
      }
      paymentMethods[payment.paymentMethod] += payment.amount;
    });

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
      ytdTotal: ytdTotal,
      paymentMethods: paymentMethods,
    });
  } catch (error) {
    logger.error(`Error fetching payment summary: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
};

// Generate monthly rent invoices for all active tenants
export const generateRentInvoices = async (req, res) => {
  try {
    // Find all active tenants
    const tenants = await Tenant.find({ status: "active" })
      .populate("unitId")
      .populate("propertyId");

    const invoices = [];
    const today = new Date();

    for (const tenant of tenants) {
      // Skip if unit or property not found
      if (!tenant.unitId || !tenant.propertyId) continue;

      // Skip if lease details are incomplete or lease has ended
      if (
        !tenant.leaseDetails ||
        !tenant.leaseDetails.rentAmount ||
        !tenant.leaseDetails.endDate
      )
        continue;
      if (new Date(tenant.leaseDetails.endDate) < today) continue;

      // Create a due date (typically first of next month)
      const dueDate = new Date(today.getFullYear(), today.getMonth() + 1, 1);

      // Create the invoice as a pending payment
      const invoice = new Payment({
        tenant: tenant._id,
        unit: tenant.unitId._id,
        property: tenant.propertyId._id,
        amount: tenant.leaseDetails.rentAmount,
        dueDate: dueDate,
        paymentDate: null,
        paymentMethod: "pending",
        type: "rent",
        description: `Monthly rent for ${dueDate.toLocaleString("default", {
          month: "long",
          year: "numeric",
        })}`,
        reference: generateInvoiceNumber(),
        status: "pending",
        previousBalance: tenant.currentBalance,
        newBalance: tenant.currentBalance + tenant.leaseDetails.rentAmount,
      });

      await invoice.save();
      invoices.push(invoice);
    }

    res.json({
      message: `Successfully generated ${invoices.length} rent invoices`,
      invoices: invoices,
    });
  } catch (error) {
    logger.error(`Error generating rent invoices: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
};
