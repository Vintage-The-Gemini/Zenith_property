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
    paymentPeriod: {
      startDate: {
        type: Date,
        default: function () {
          // Default to first day of current month
          const now = new Date();
          return new Date(now.getFullYear(), now.getMonth(), 1);
        },
      },
      endDate: {
        type: Date,
        default: function () {
          // Default to last day of current month
          const now = new Date();
          return new Date(now.getFullYear(), now.getMonth() + 1, 0);
        },
      },
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
    carryForward: {
      type: Boolean,
      default: false, // Whether this payment has a carry forward amount
    },
    carryForwardAmount: {
      type: Number,
      default: 0, // Amount carried forward (could be positive or negative)
    },
    // Recurring expense calculation fields
    agencyFee: {
      amount: {
        type: Number,
        default: 0,
      },
      percentage: {
        type: Number,
        default: 0, // e.g., 10% of rent
      },
    },
    taxDeduction: {
      amount: {
        type: Number,
        default: 0,
      },
      percentage: {
        type: Number,
        default: 0, // e.g., 5% of rent
      },
    },
    landlordAmount: {
      type: Number,
      default: function () {
        return (
          this.amount -
          (this.agencyFee?.amount || 0) -
          (this.taxDeduction?.amount || 0)
        );
      },
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
  if (this.status === "completed" || this.status === "partial") {
    this.paymentVariance = this.amount - this.dueAmount;

    // Set carryForward flag if there's a variance
    this.carryForward = this.paymentVariance !== 0;
    this.carryForwardAmount = this.paymentVariance;

    // Set status to partial if amount is less than due amount
    if (this.amount < this.dueAmount) {
      this.status = "partial";
    }

    // Calculate agency fee and tax deduction if percentages are set
    if (this.agencyFee && this.agencyFee.percentage > 0) {
      this.agencyFee.amount = (this.amount * this.agencyFee.percentage) / 100;
    }

    if (this.taxDeduction && this.taxDeduction.percentage > 0) {
      this.taxDeduction.amount =
        (this.amount * this.taxDeduction.percentage) / 100;
    }

    // Calculate amount due to landlord
    this.landlordAmount =
      this.amount -
      (this.agencyFee?.amount || 0) -
      (this.taxDeduction?.amount || 0);
  }

  next();
});

export default mongoose.model("Payment", paymentSchema);
