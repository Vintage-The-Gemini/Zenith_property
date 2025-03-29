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
      // Add this field to link unit to a floor
      type: mongoose.Schema.Types.ObjectId,
      ref: "Floor",
    },
    floorNumber: {
      type: Number,
      required: true,
    },
    unitNumber: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ["rental", "bnb"],
      required: true,
    },
    status: {
      type: String,
      enum: ["available", "occupied", "maintenance", "reserved"],
      default: "available",
    },
    // Basic unit details
    bedrooms: { type: Number, required: true },
    bathrooms: { type: Number, required: true },
    squareFootage: { type: Number },
    furnished: { type: Boolean, default: false },

    // Rental specific fields
    monthlyRent: {
      type: Number,
      required: function () {
        return this.type === "rental";
      },
    },
    securityDeposit: {
      type: Number,
      required: function () {
        return this.type === "rental";
      },
    },

    // BnB specific fields
    nightlyRate: {
      type: Number,
      required: function () {
        return this.type === "bnb";
      },
    },
    weeklyRate: { type: Number },
    monthlyRate: { type: Number },
    minimumStay: {
      type: Number,
      default: 1,
      required: function () {
        return this.type === "bnb";
      },
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

export default mongoose.model("Unit", unitSchema);
