// backend/models/Expense.js
import mongoose from "mongoose";

const expenseSchema = new mongoose.Schema(
  {
    property: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Property",
      required: true,
    },
    unit: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Unit",
      // Make unit optional - it can be null for property-wide expenses
      required: false,
    },
    category: {
      type: String,
      enum: [
        "maintenance",
        "utilities",
        "taxes",
        "insurance",
        "mortgage",
        "payroll",
        "marketing",
        "custom",
      ],
      required: true,
    },
    customCategory: {
      type: String,
      required: function () {
        return this.category === "custom";
      },
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    date: {
      type: Date,
      required: true,
      default: Date.now,
    },
    description: {
      type: String,
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "overdue"],
      default: "pending",
    },
    vendor: {
      name: String,
      contact: String,
      invoiceNumber: String,
    },
    recurring: {
      isRecurring: {
        type: Boolean,
        default: false,
      },
      frequency: {
        type: String,
        enum: ["weekly", "monthly", "quarterly", "annually"],
      },
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
expenseSchema.index({ property: 1, date: -1 });
expenseSchema.index({ unit: 1, date: -1 });
expenseSchema.index({ category: 1 });

export default mongoose.model("Expense", expenseSchema);