// backend/models/Floor.js
import mongoose from "mongoose";

const floorSchema = new mongoose.Schema(
  {
    propertyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Property",
      required: true,
    },
    number: {
      type: Number,
      required: true,
    },
    name: {
      type: String,
      default: function () {
        return `Floor ${this.number}`;
      },
    },
    units: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Unit",
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

// Ensure property and floor number combination is unique
floorSchema.index({ propertyId: 1, number: 1 }, { unique: true });

// Virtual for vacant units count
floorSchema.virtual("vacantUnitsCount").get(function () {
  if (!this.units) return 0;

  // If units are populated objects
  if (this.units.length > 0 && typeof this.units[0] !== "string") {
    return this.units.filter((unit) => unit.status === "available").length;
  }

  // If units are just IDs, we can't calculate this
  return 0;
});

// Virtual for occupied units count
floorSchema.virtual("occupiedUnitsCount").get(function () {
  if (!this.units) return 0;

  // If units are populated objects
  if (this.units.length > 0 && typeof this.units[0] !== "string") {
    return this.units.filter((unit) => unit.status === "occupied").length;
  }

  // If units are just IDs, we can't calculate this
  return 0;
});

export default mongoose.model("Floor", floorSchema);
