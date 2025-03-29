// models/Unit.js
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
    },
    floorNumber: {
      type: Number,
      required: true,
      default: 1,
    },
    unitNumber: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ["rental", "bnb"],
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
      default: function () {
        // If property is commercial, default to 0
        const Property = mongoose.model("Property");
        return Property.findById(this.propertyId).then((property) =>
          property && property.propertyType === "commercial" ? 0 : 1
        );
      },
    },
    bathrooms: {
      type: Number,
      default: function () {
        // If property is commercial, default to 0
        const Property = mongoose.model("Property");
        return Property.findById(this.propertyId).then((property) =>
          property && property.propertyType === "commercial" ? 0 : 1
        );
      },
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
  },
  {
    timestamps: true,
  }
);

// Create a compound index on propertyId and unitNumber to ensure uniqueness
unitSchema.index({ propertyId: 1, unitNumber: 1 }, { unique: true });

// Middleware to handle unit status changes
unitSchema.pre("save", async function (next) {
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

// Set up virtual for property type access
unitSchema.virtual("isCommercial").get(async function () {
  const Property = mongoose.model("Property");
  const property = await Property.findById(this.propertyId);
  return property && property.propertyType === "commercial";
});

export default mongoose.model("Unit", unitSchema);
