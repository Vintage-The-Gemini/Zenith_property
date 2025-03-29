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
      enum: ["pending", "completed", "failed", "refunded"],
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
    previousBalance: {
      type: Number,
      default: 0, // Balance before this payment
    },
    newBalance: {
      type: Number,
      default: 0, // Balance after this payment
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save hook to generate receipt number
paymentSchema.pre("save", function (next) {
  if (!this.receiptNumber) {
    // Generate receipt number: current year + month + random 4 digits
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const random = Math.floor(1000 + Math.random() * 9000); // 4-digit random number
    this.receiptNumber = `RCPT-${year}${month}-${random}`;
  }

  if (!this.reference) {
    this.reference = generateInvoiceNumber();
  }

  next();
});

// Pre-save hook to update tenant balance
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

      // Store previous balance
      this.previousBalance = tenant.currentBalance;

      // If payment is completed, update the balance
      if (this.status === "completed") {
        // Reduce the balance by the payment amount (payment reduces what is owed)
        tenant.currentBalance -= this.amount;
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
    next(error);
  }
});

export default mongoose.model("Payment", paymentSchema);
