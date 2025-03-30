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
    amount: {
      type: Number,
      required: true,
    },
    dueAmount: {
      type: Number,
      default: function () {
        return this.amount;
      },
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
    // Balance tracking
    previousBalance: {
      type: Number,
      default: 0, // Balance before this payment
    },
    paymentVariance: {
      type: Number,
      default: 0, // Negative means underpaid, positive means overpaid
    },
    newBalance: {
      type: Number,
      default: 0, // Balance after this payment
    },
  },
  {
    timestamps: true,
  }
);

// Generate receipt number on completed payments if not present
paymentSchema.pre("save", function (next) {
  if (this.status === "completed" && !this.receiptNumber) {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const random = Math.floor(1000 + Math.random() * 9000); // 4-digit random number
    this.receiptNumber = `RCPT-${year}${month}-${random}`;
  }

  // Generate reference if not present
  if (!this.reference) {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const random = Math.floor(100 + Math.random() * 900); // 3-digit random number
    this.reference = `PAY-${year}${month}${day}-${random}`;
  }

  // Calculate payment variance if it's a completed payment
  if (this.status === "completed") {
    this.paymentVariance = this.amount - this.dueAmount;

    // Set status to partial if amount is less than due amount
    if (this.amount < this.dueAmount) {
      this.status = "partial";
    }
  }

  next();
});

export default mongoose.model("Payment", paymentSchema);
