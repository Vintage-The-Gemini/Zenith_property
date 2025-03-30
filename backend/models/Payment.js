// backend/models/Payment.js
import mongoose from "mongoose";
import { generateInvoiceNumber } from "../utils/helpers.js";

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

  // If due amount is not set, use the amount
  if (!this.dueAmount) {
    this.dueAmount = this.amount;
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
      this.previousBalance = tenant.currentBalance || 0;

      // Default the dueAmount to the full amount if not specified
      if (!this.dueAmount || this.dueAmount <= 0) {
        this.dueAmount = this.amount;
      }

      // If payment is completed or partial, update the balance
      if (this.status === "completed" || this.status === "partial") {
        // Calculate the payment variance
        this.paymentVariance = this.amount - this.dueAmount;

        // Update tenant balance
        if (!tenant.currentBalance) tenant.currentBalance = 0;
        tenant.currentBalance -= this.amount;

        // Update unit balance
        if (!unit.balance) unit.balance = 0;
        unit.balance -= this.amount;

        // Update last payment date
        unit.lastPaymentDate = this.paymentDate;

        // Add to tenant payment history
        if (!tenant.paymentHistory) tenant.paymentHistory = [];
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
    console.error(`Error in payment pre-save hook: ${error.message}`);
    next(error);
  }
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

// Virtual for payment timing (on-time, late, early)
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

// Virtual for days overdue (if payment is pending)
paymentSchema.virtual("daysOverdue").get(function () {
  if (this.status !== "pending" || !this.dueDate) return 0;

  const dueDate = new Date(this.dueDate);
  const today = new Date();

  if (today <= dueDate) return 0;

  const diffTime = Math.abs(today - dueDate);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

export default mongoose.model("Payment", paymentSchema);
