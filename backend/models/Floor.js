// models/Floor.js
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
  }
);

// Ensure property and floor number combination is unique
floorSchema.index({ propertyId: 1, number: 1 }, { unique: true });

export default mongoose.model("Floor", floorSchema);
