// backend/models/Unit.js
import mongoose from "mongoose";

const unitSchema = new mongoose.Schema(
  {
    propertyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Property",
      required: true,
    },
    floorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Floor",
      required: true,
    },
    unitNumber: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ["rental", "bnb", "commercial"],
      default: "rental",
      required: true,
    },
    status: {
      type: String,
      enum: ["available", "occupied", "maintenance", "reserved"],
      default: "available",
    },

    // Common fields for all property types
    squareFootage: {
      type: Number,
    },
    description: {
      type: String,
    },
    monthlyRent: {
      type: Number,
      required: true,
    },
    securityDeposit: {
      type: Number,
    },

    // Residential specific fields
    bedrooms: {
      type: Number,
      default: 1,
    },
    bathrooms: {
      type: Number,
      default: 1,
    },
    furnished: {
      type: Boolean,
      default: false,
    },

    // Commercial specific fields
    commercialUnitType: {
      type: String,
      enum: ["office", "retail", "warehouse", "industrial", "other"],
    },

    // BnB specific fields
    nightlyRate: {
      type: Number,
    },
    weeklyRate: {
      type: Number,
    },
    monthlyRate: {
      type: Number,
    },
    minimumStay: {
      type: Number,
      default: 1,
    },

    amenities: [
      {
        type: String,
      },
    ],

    maintenanceHistory: [
      {
        date: Date,
        description: String,
        cost: Number,
        performedBy: String,
      },
    ],

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

    currentTenant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
    },

    // Financial tracking
    balance: {
      type: Number,
      default: 0, // Positive means tenant owes, negative means tenant has credit
    },
    lastPaymentDate: {
      type: Date,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Create a compound index on propertyId and unitNumber to ensure uniqueness
unitSchema.index({ propertyId: 1, unitNumber: 1 }, { unique: true });

// Middleware to handle unit status changes
unitSchema.pre("save", async function (next) {
  // Track previous status for status change operations
  if (this.isModified("status")) {
    this._previousStatus = this._original?.status;
  }

  // If status is changing to occupied, ensure there's a tenant assigned
  if (
    this.isModified("status") &&
    this.status === "occupied" &&
    !this.currentTenant
  ) {
    throw new Error("Cannot mark unit as occupied without assigning a tenant");
  }

  // If status is changing from occupied to something else, remove tenant reference
  if (
    this.isModified("status") &&
    this.status !== "occupied" &&
    this._previousStatus === "occupied"
  ) {
    this.currentTenant = null;
  }

  next();
});

// Store original document values before making changes
unitSchema.pre("save", function (next) {
  if (this.isNew) return next();

  this._original = this.toObject();
  next();
});

export default mongoose.model("Unit", unitSchema);
