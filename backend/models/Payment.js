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
    
    // Payment Period Information
    paymentPeriod: {
      month: {
        type: Number,
        required: true,
      },
      year: {
        type: Number,
        required: true,
      },
      startDate: {
        type: Date,
        required: true,
      },
      endDate: {
        type: Date,
        required: true,
      },
    },
    
    // Progressive Balance Tracking
    baseRentAmount: {
      type: Number,
      required: true, // From tenant's negotiated rent
    },
    balanceBeforePayment: {
      type: Number,
      default: 0, // Outstanding balance before this payment
    },
    amountDue: {
      type: Number,
      required: true, // What was due at time of payment
    },
    amountPaid: {
      type: Number,
      required: true,
    },
    balanceAfterPayment: {
      type: Number,
      required: true, // New balance after this payment
    },
    
    // Period-based calculations
    monthlyRentDue: {
      type: Number,
      required: true, // Base rent for the period
    },
    cumulativeAmountDue: {
      type: Number,
      required: true, // Total that should have been paid by this date
    },
    
    // Payment sequence within period
    paymentSequence: {
      type: Number,
      default: 1, // 1st, 2nd, 3rd payment in the period
    },
    
    // Payment allocation (optional - for detailed tracking)
    appliedToArears: {
      type: Number,
      default: 0,
    },
    appliedToCurrentPeriod: {
      type: Number,
      default: 0,
    },
    
    // Status flags
    isOverpayment: {
      type: Boolean,
      default: false,
    },
    isUnderpayment: {
      type: Boolean,
      default: false,
    },
    isFullyPaid: {
      type: Boolean,
      default: false, // True if period is fully paid
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