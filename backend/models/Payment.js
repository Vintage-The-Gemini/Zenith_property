// backend/models/Payment.js
import mongoose from "mongoose";

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
    
    // Basic Amount Information
    baseRentAmount: {
      type: Number,
      required: true,
    },
    amountDue: {
      type: Number,
      required: true,
    },
    amountPaid: {
      type: Number,
      required: true,
    },
    
    // Payment Allocation
    appliedToPreviousBalance: {
      type: Number,
      default: 0,
    },
    appliedToCurrentRent: {
      type: Number,
      default: 0,
    },
    overpayment: {
      type: Number,
      default: 0,
    },
    underpayment: {
      type: Number,
      default: 0,
    },
    
    // Balance Tracking
    previousBalance: {
      type: Number,
      default: 0,
    },
    paymentVariance: {
      type: Number,
      default: 0, // amountPaid - amountDue
    },
    newBalance: {
      type: Number,
      default: 0,
    },
    isOverpayment: {
      type: Boolean,
      default: false,
    },
    isUnderpayment: {
      type: Boolean,
      default: false,
    },
    
    // Track if payment is in same period
    inSamePeriod: {
      type: Boolean,
      default: false,
    },
    
    // Payment Details
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
  },
  {
    timestamps: true,
  }
);

// Auto-generate reference and receipt numbers
paymentSchema.pre("save", function (next) {
  if (!this.reference) {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const random = Math.floor(100 + Math.random() * 900);
    this.reference = `PAY-${year}${month}${day}-${random}`;
  }
  
  if (this.status === "completed" && !this.receiptNumber) {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const random = Math.floor(1000 + Math.random() * 9000);
    this.receiptNumber = `RCPT-${year}${month}-${random}`;
  }
  
  next();
});

export default mongoose.model("Payment", paymentSchema);