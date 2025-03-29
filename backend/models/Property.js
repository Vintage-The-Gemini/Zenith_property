// backend/models/Property.js
import mongoose from "mongoose";

const propertySchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    address: {
      street: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      zipCode: { type: String, required: true },
      country: { type: String, required: true },
      coordinates: {
        latitude: Number,
        longitude: Number,
      },
    },
    propertyType: {
      type: String,
      enum: ["apartment", "house", "condo", "commercial", "mixed-use"],
      required: true,
    },
    units: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Unit",
      },
    ],
    // Reference to floors in this property
    floors: [
      {
        _id: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Floor",
        },
        number: Number,
        name: String,
      },
    ],
    amenities: [
      {
        name: String,
        description: String,
        icon: String,
      },
    ],
    managers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    documents: [
      {
        title: String,
        type: String,
        path: String,
        uploadDate: { type: Date, default: Date.now },
      },
    ],
    insurance: {
      provider: String,
      policyNumber: String,
      expiryDate: Date,
      documents: [
        {
          title: String,
          path: String,
          uploadDate: { type: Date, default: Date.now },
        },
      ],
    },
    expenses: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Expense",
      },
    ],
    status: {
      type: String,
      enum: ["active", "inactive", "maintenance"],
      default: "active",
    },
    description: {
      type: String,
    },
    // Commercial-specific fields
    commercialDetails: {
      propertyClass: {
        type: String,
        enum: ["A", "B", "C"],
      },
      zoning: String,
      totalLeasableArea: Number,
      yearBuilt: Number,
      renovationYear: Number,
      parkingSpaces: Number,
    },
    // Residential-specific fields
    residentialDetails: {
      totalUnits: Number,
      commonAreas: [String],
      petPolicy: {
        allowed: Boolean,
        restrictions: String,
        petDeposit: Number,
      },
      securityFeatures: [String],
    },
    // Mixed-use specific fields
    mixedUseDetails: {
      residentialPercentage: Number,
      commercialPercentage: Number,
      retailPercentage: Number,
    },
    // Media
    images: [
      {
        url: String,
        caption: String,
        isPrimary: Boolean,
        uploadDate: { type: Date, default: Date.now },
      },
    ],
    notes: String,
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual for active units count
propertySchema.virtual("activeUnitsCount").get(function () {
  if (!this.units) return 0;
  return this.units.filter(
    (unit) => unit.status !== "maintenance" && unit.status !== "inactive"
  ).length;
});

// Virtual for occupancy rate
propertySchema.virtual("occupancyRate").get(function () {
  const totalUnits = this.units ? this.units.length : 0;
  if (totalUnits === 0) return 0;

  const occupiedUnits = this.units.filter(
    (unit) => unit.status === "occupied"
  ).length;

  return Math.round((occupiedUnits / totalUnits) * 100);
});

// Helper method to get property type group
propertySchema.methods.getPropertyTypeGroup = function () {
  if (this.propertyType === "commercial" || this.propertyType === "mixed-use") {
    return "commercial";
  }
  return "residential";
};

export default mongoose.model("Property", propertySchema);
