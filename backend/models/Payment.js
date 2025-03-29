// models/Payment.js
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

export default mongoose.model("Payment", paymentSchema);
