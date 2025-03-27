// backend/models/Maintainence.js
import mongoose from "mongoose";

const maintenanceSchema = new mongoose.Schema(
  {
    property: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Property",
      required: true,
    },
    unit: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Unit",
      required: true,
    },
    tenant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
    },
    issue: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "emergency"],
      default: "medium",
    },
    status: {
      type: String,
      enum: ["pending", "in_progress", "completed", "cancelled"],
      default: "pending",
    },
    category: {
      type: String,
      enum: [
        "plumbing",
        "electrical",
        "hvac",
        "structural",
        "appliance",
        "cleaning",
        "other",
      ],
      default: "other",
    },
    images: [
      {
        url: String,
        caption: String,
        uploadDate: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    assignedTo: {
      type: String,
    },
    estimatedCost: {
      type: Number,
    },
    actualCost: {
      type: Number,
    },
    scheduledDate: {
      type: Date,
    },
    completionDate: {
      type: Date,
    },
    notes: [
      {
        content: String,
        createdBy: String,
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    reportedBy: {
      type: String,
      required: true,
    },
    reportedDate: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Maintenance", maintenanceSchema);
