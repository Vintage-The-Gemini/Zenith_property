// models/Lease.js
import mongoose from "mongoose";

const leaseSchema = new mongoose.Schema(
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
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    rentAmount: {
      type: Number,
      required: true,
    },
    securityDeposit: {
      type: Number,
      required: true,
    },
    paymentFrequency: {
      type: String,
      enum: ["monthly", "weekly", "daily"],
      default: "monthly",
    },
    paymentDueDay: {
      type: Number,
      min: 1,
      max: 31,
      default: 1,
    },
    lateFeePercentage: {
      type: Number,
      default: 10, // 10%
    },
    terms: {
      type: String,
    },
    specialConditions: {
      type: String,
    },
    agreementDocument: {
      path: String,
      uploadDate: {
        type: Date,
        default: Date.now,
      },
      verified: {
        type: Boolean,
        default: false,
      },
    },
    status: {
      type: String,
      enum: ["active", "expired", "terminated", "pending"],
      default: "pending",
    },
    terminationReason: {
      type: String,
    },
    terminationDate: {
      type: Date,
    },
    renewalHistory: [
      {
        previousEndDate: Date,
        newEndDate: Date,
        rentAmount: Number,
        renewalDate: Date,
        notes: String,
      },
    ],
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Lease", leaseSchema);
