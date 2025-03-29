// backend/models/Payment.js
import mongoose from "mongoose";
import { generateInvoiceNumber } from "../utils/helpers.js";
import logger from "../utils/logger.js";

const paymentSchema = new mongoose.Schema(
  {
    tenant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
    },
    unit: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Unit",
      required: true,
    },
    property: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Property",
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    dueAmount: {
      type: Number,
      default: 0, // The amount that was actually due
    },
    paymentDate: {
      type: Date,
      default: Date.now,
    },
    dueDate: {
      type: Date,
      required: true,
    },
    paymentMethod: {
      type: String,
      enum: ["cash", "bank_transfer", "check", "mobile_money", "card", "other"],
      default: "cash",
    },
    status: {
      type: String,
      enum: ["pending", "completed", "failed", "refunded", "partial"],
      default: "pending",
    },
    type: {
      type: String,
      enum: ["rent", "deposit", "fee", "maintenance", "other"],
      default: "rent",
    },
    description: {
      type: String,
    },
    reference: {
      type: String,
    },
    receiptNumber: {
      type: String,
    },
    latePayment: {
      isLate: {
        type: Boolean,
        default: false,
      },
      daysLate: {
        type: Number,
        default: 0,
      },
      lateFee: {
        type: Number,
        default: 0,
      },
    },
    // Balance tracking
    previousBalance: {
      type: Number,
      default: 0, // Balance before this payment
    },
    newBalance: {
      type: Number,
      default: 0, // Balance after this payment
    },
    // For partial payments
    paymentVariance: {
      type: Number,
      default: 0, // Negative means underpaid, positive means overpaid
    },
    // For recurring payments
    isRecurring: {
      type: Boolean,
      default: false,
    },
    recurringFrequency: {
      type: String,
      enum: ["weekly", "monthly", "quarterly", "annually"],
    },
    recurringStartDate: {
      type: Date,
    },
    recurringEndDate: {
      type: Date,
    },
    // For tracking who created the payment
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    // For receipt and evidence
    attachments: [
      {
        title: String,
        path: String,
        uploadDate: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    // For tracking payment allocation to multiple invoices
    allocations: [
      {
        invoiceId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Invoice", // If you have an invoice model
        },
        amount: Number,
        description: String,
      },
    ],
    // For tracking edits/adjustments to payments
    adjustmentHistory: [
      {
        date: {
          type: Date,
          default: Date.now,
        },
        previousAmount: Number,
        newAmount: Number,
        reason: String,
        adjustedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
      },
    ],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Pre-save hook to generate receipt number
paymentSchema.pre("save", function (next) {
  // Generate receipt number if not present and payment is completed
  if (this.status === "completed" && !this.receiptNumber) {
    // Generate receipt number: current year + month + random 4 digits
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const random = Math.floor(1000 + Math.random() * 9000); // 4-digit random number
    this.receiptNumber = `RCPT-${year}${month}-${random}`;
  }

  // Generate reference number if not present
  if (!this.reference) {
    this.reference = generateInvoiceNumber();
  }

  // Calculate payment variance for tracking partial/overpayments
  if (this.status === "completed" || this.status === "partial") {
    // If dueAmount is set, calculate the variance
    if (this.dueAmount > 0) {
      this.paymentVariance = this.amount - this.dueAmount;
    }
    // Determine if this was a partial payment
    if (this.dueAmount > 0 && this.amount < this.dueAmount) {
      this.status = "partial";
    }
  }

  // Check for late payment
  if (this.dueDate && this.paymentDate) {
    const dueDate = new Date(this.dueDate);
    const paymentDate = new Date(this.paymentDate);

    if (paymentDate > dueDate) {
      const diffTime = Math.abs(paymentDate - dueDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      this.latePayment = {
        isLate: true,
        daysLate: diffDays,
        lateFee: this.latePayment?.lateFee || 0, // Preserve existing late fee if set
      };
    }
  }

  next();
});

// Pre-save hook to update tenant and unit balances
paymentSchema.pre("save", async function (next) {
  try {
    if (this.isNew || this.isModified("status") || this.isModified("amount")) {
      const Tenant = mongoose.model("Tenant");
      const Unit = mongoose.model("Unit");

      const tenant = await Tenant.findById(this.tenant);
      const unit = await Unit.findById(this.unit);

      if (!tenant || !unit) {
        return next();
      }

      // Store previous balance before making changes
      this.previousBalance = tenant.currentBalance;

      // Default the dueAmount to the full amount if not specified
      if (!this.dueAmount || this.dueAmount <= 0) {
        this.dueAmount = this.amount;
      }

      // If payment is completed or partial, update the balance
      if (this.status === "completed" || this.status === "partial") {
        // Calculate the payment variance
        this.paymentVariance = this.amount - this.dueAmount;

        // Update tenant balance
        tenant.currentBalance -= this.amount;

        // Update unit balance
        unit.balance -= this.amount;

        // Update last payment date
        unit.lastPaymentDate = this.paymentDate;

        // Add to tenant payment history
        tenant.paymentHistory.push({
          date: this.paymentDate,
          amount: this.amount,
          type: this.type,
          status: this.status,
          reference: this.reference,
          balance: tenant.currentBalance,
          description: this.description,
        });

        await tenant.save();
        await unit.save();
      }

      // Update the new balance field
      this.newBalance = tenant.currentBalance;
    }
    next();
  } catch (error) {
    logger.error(`Error in payment pre-save hook: ${error.message}`);
    next(error);
  }
});

// Calculate if payment is on time, late, or early
paymentSchema.virtual("paymentTiming").get(function () {
  if (!this.dueDate || !this.paymentDate) return "unknown";

  const dueDate = new Date(this.dueDate);
  const paymentDate = new Date(this.paymentDate);

  // Compare dates (ignoring time component)
  const dueStr = dueDate.toISOString().split("T")[0];
  const paymentStr = paymentDate.toISOString().split("T")[0];

  if (paymentStr < dueStr) return "early";
  if (paymentStr > dueStr) return "late";
  return "on-time";
});

// Virtual for payment status description
paymentSchema.virtual("statusDescription").get(function () {
  switch (this.status) {
    case "completed":
      return this.paymentVariance > 0
        ? "Paid (Overpaid)"
        : this.paymentVariance < 0
        ? "Paid (Underpaid)"
        : "Paid";
    case "partial":
      return `Partially Paid (${Math.abs(this.paymentVariance)} remaining)`;
    case "pending":
      return "Pending";
    case "failed":
      return "Failed";
    case "refunded":
      return "Refunded";
    default:
      return this.status;
  }
});

// Virtual for formatted amount
paymentSchema.virtual("formattedAmount").get(function () {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "KES",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(this.amount || 0);
});

// Virtual for days overdue (if payment is pending)
paymentSchema.virtual("daysOverdue").get(function () {
  if (this.status !== "pending" || !this.dueDate) return 0;

  const dueDate = new Date(this.dueDate);
  const today = new Date();

  if (today <= dueDate) return 0;

  const diffTime = Math.abs(today - dueDate);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Helper methods

// Calculate late fee based on current configuration
paymentSchema.methods.calculateLateFee = function (
  lateFeePercentage = 0.1,
  maxDays = 30
) {
  if (!this.dueDate) return 0;

  const dueDate = new Date(this.dueDate);
  const today = new Date();

  // If not late, no fee
  if (today <= dueDate) return 0;

  // Calculate days late, capped at maxDays
  const diffTime = Math.abs(today - dueDate);
  const daysLate = Math.min(
    Math.ceil(diffTime / (1000 * 60 * 60 * 24)),
    maxDays
  );

  // Simple late fee calculation
  return this.dueAmount * lateFeePercentage * (daysLate / 30);
};

// Method to record a payment adjustment
paymentSchema.methods.adjustPayment = async function (
  newAmount,
  reason,
  adjustedBy
) {
  // Store the previous amount
  const previousAmount = this.amount;

  // Add to adjustment history
  this.adjustmentHistory.push({
    date: new Date(),
    previousAmount,
    newAmount,
    reason,
    adjustedBy,
  });

  // Update the amount
  this.amount = newAmount;

  // Recalculate payment variance
  if (this.dueAmount > 0) {
    this.paymentVariance = newAmount - this.dueAmount;

    // Update status based on new amount
    if (newAmount >= this.dueAmount) {
      this.status = "completed";
    } else {
      this.status = "partial";
    }
  }

  await this.save();
};

// Method to record payment allocation
paymentSchema.methods.allocateToInvoice = function (
  invoiceId,
  amount,
  description = ""
) {
  this.allocations.push({
    invoiceId,
    amount,
    description,
  });
};

export default mongoose.model("Payment", paymentSchema);
