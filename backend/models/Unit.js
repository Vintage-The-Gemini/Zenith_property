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
    bnbSettings: {
      isActive: {
        type: Boolean,
        default: false,
      },
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
      checkInTime: {
        type: String,
        default: "14:00", // 2 PM
      },
      checkOutTime: {
        type: String,
        default: "11:00", // 11 AM
      },
      // Availability calendar
      unavailableDates: [
        {
          startDate: Date,
          endDate: Date,
          reason: String,
        },
      ],
      amenities: [String],
    },

    // Bookings (for BnB units)
    bookings: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Booking",
      },
    ],

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
      default: 0, // Mirrors the tenant's currentBalance
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

// Pre-validate hook to ensure floorId is provided
unitSchema.pre("validate", function (next) {
  if (!this.floorId) {
    next(new Error("Floor ID is required for a unit"));
  } else {
    next();
  }
});

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

  // If this is a BnB unit, make sure the BnB settings are activated
  if (this.isModified("type") && this.type === "bnb") {
    this.bnbSettings = {
      ...this.bnbSettings,
      isActive: true,
      nightlyRate: this.bnbSettings?.nightlyRate || this.monthlyRent / 30,
      weeklyRate:
        this.bnbSettings?.weeklyRate || (this.monthlyRent / 30) * 7 * 0.9, // 10% discount
      monthlyRate: this.bnbSettings?.monthlyRate || this.monthlyRent,
    };
  }

  next();
});

// Store original document values before making changes
unitSchema.pre("save", function (next) {
  if (this.isNew) return next();

  this._original = this.toObject();
  next();
});

// Calculate daily rate for BnB
unitSchema.virtual("dailyRate").get(function () {
  if (this.type === "bnb" && this.bnbSettings?.nightlyRate) {
    return this.bnbSettings.nightlyRate;
  }

  // Default calculation from monthly rent
  return this.monthlyRent / 30;
});

export default mongoose.model("Unit", unitSchema);
