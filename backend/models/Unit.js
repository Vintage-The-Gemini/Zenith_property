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

  next();
});

// Store original document values before making changes
unitSchema.pre("save", function (next) {
  if (this.isNew) return next();

  this._original = this.toObject();
  next();
});

// Virtual for getting full property name
unitSchema.virtual("fullPropertyName").get(function () {
  return this.propertyId
    ? `${this.propertyId.name} - Unit ${this.unitNumber}`
    : `Unit ${this.unitNumber}`;
});

// Virtual for getting occupancy status with tenant info
unitSchema.virtual("occupancyDetails").get(function () {
  if (this.status !== "occupied" || !this.currentTenant) {
    return { occupied: false };
  }

  return {
    occupied: true,
    tenantId: this.currentTenant._id || this.currentTenant,
    tenantName:
      this.currentTenant.firstName && this.currentTenant.lastName
        ? `${this.currentTenant.firstName} ${this.currentTenant.lastName}`
        : "Unknown tenant",
  };
});

// Virtual for getting total maintenance costs
unitSchema.virtual("totalMaintenanceCost").get(function () {
  if (!this.maintenanceHistory || this.maintenanceHistory.length === 0) {
    return 0;
  }

  return this.maintenanceHistory.reduce((total, record) => {
    return total + (record.cost || 0);
  }, 0);
});

// Virtual for getting active maintenance issues count
unitSchema.virtual("activeMaintenanceIssuesCount").get(function () {
  if (!this.maintenanceHistory) return 0;

  // This is just a placeholder - in a real system, you'd track active vs. resolved issues
  // For now, we'll consider issues from the last 30 days as "active"
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  return this.maintenanceHistory.filter((record) => {
    const recordDate = new Date(record.date);
    return recordDate >= thirtyDaysAgo;
  }).length;
});

// Helper method to get formatted rent amount
unitSchema.methods.getFormattedRent = function () {
  const formatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "KES",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

  return formatter.format(this.monthlyRent || 0);
};

// Helper method to check if unit is suitable for a specific property type
unitSchema.methods.isSuitableForPropertyType = function (propertyType) {
  if (propertyType === "commercial" && this.type !== "commercial") {
    return false;
  }

  if (
    propertyType === "residential" &&
    this.type !== "rental" &&
    this.type !== "bnb"
  ) {
    return false;
  }

  return true;
};

export default mongoose.model("Unit", unitSchema);
