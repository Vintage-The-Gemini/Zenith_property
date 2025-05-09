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
    },
    category: {
      type: String,
      enum: ["maintenance", "utilities", "taxes", "insurance", "mortgage", "payroll", "marketing", "custom"],
      required: true,
    },
    customCategory: {
      type: String,
    },
    amount: {
      type: Number,
      required: true,
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
        default: "monthly",
      },
      nextDue: Date,
    },
    // Optional attachments/receipts
    attachments: [
      {
        name: String,
        path: String,
        uploadDate: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Pre-save hook to set nextDue date for recurring expenses
expenseSchema.pre("save", function (next) {
  if (this.isModified("recurring.isRecurring") || this.isModified("recurring.frequency") || this.isNew) {
    if (this.recurring.isRecurring) {
      const baseDate = this.date;
      let nextDue;
      
      switch (this.recurring.frequency) {
        case "weekly":
          nextDue = new Date(baseDate);
          nextDue.setDate(nextDue.getDate() + 7);
          break;
        case "monthly":
          nextDue = new Date(baseDate);
          nextDue.setMonth(nextDue.getMonth() + 1);
          break;
        case "quarterly":
          nextDue = new Date(baseDate);
          nextDue.setMonth(nextDue.getMonth() + 3);
          break;
        case "annually":
          nextDue = new Date(baseDate);
          nextDue.setFullYear(nextDue.getFullYear() + 1);
          break;
        default:
          nextDue = new Date(baseDate);
          nextDue.setMonth(nextDue.getMonth() + 1);
      }
      
      this.recurring.nextDue = nextDue;
    }
  }
  
  next();
});

export default mongoose.model("Expense", expenseSchema);