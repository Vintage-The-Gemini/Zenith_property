// backend/models/Booking.js
import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema(
  {
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
    tenant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
    },
    checkIn: {
      type: Date,
      required: true,
    },
    checkOut: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ["confirmed", "checked_in", "checked_out", "cancelled", "no_show"],
      default: "confirmed",
    },
    totalNights: {
      type: Number,
      required: true,
      min: 1,
    },
    nightlyRate: {
      type: Number,
      required: true,
    },
    totalAmount: {
      type: Number,
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "partially_paid", "paid", "refunded"],
      default: "pending",
    },
    guestCount: {
      type: Number,
      default: 1,
    },
    specialRequests: {
      type: String,
    },
    paymentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Payment",
    },
    // Check-in time preferences
    preferredCheckInTime: {
      type: String,
    },
    actualCheckInTime: {
      type: Date,
    },
    actualCheckOutTime: {
      type: Date,
    },
    // Additional fees
    additionalFees: [
      {
        name: String,
        amount: Number,
        description: String,
      },
    ],
    // Discount applied
    discount: {
      amount: Number,
      reason: String,
    },
    // Record source of booking
    bookingSource: {
      type: String,
      enum: ["direct", "website", "phone", "walk_in", "agent", "other"],
      default: "direct",
    },
    notes: {
      type: String,
    },
    cancellationReason: {
      type: String,
    },
    cancellationDate: {
      type: Date,
    },
    refundAmount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save middleware to perform validations and calculations
bookingSchema.pre("save", function (next) {
  // Ensure check-out date is after check-in date
  if (this.checkOut <= this.checkIn) {
    return next(new Error("Check-out date must be after check-in date"));
  }

  // If status is being changed to cancelled, set cancellation date
  if (
    this.isModified("status") &&
    this.status === "cancelled" &&
    !this.cancellationDate
  ) {
    this.cancellationDate = new Date();
  }

  // Calculate or validate total nights
  const checkInDate = new Date(this.checkIn);
  const checkOutDate = new Date(this.checkOut);
  const nightsDiff = Math.ceil(
    (checkOutDate - checkInDate) / (1000 * 60 * 60 * 24)
  );

  if (nightsDiff !== this.totalNights) {
    this.totalNights = nightsDiff;
  }

  // Validate or calculate total amount
  const calculatedAmount = this.totalNights * this.nightlyRate;

  // Add additional fees if any
  const additionalFeesTotal =
    this.additionalFees?.reduce((sum, fee) => sum + fee.amount, 0) || 0;

  // Subtract discount if any
  const discountAmount = this.discount?.amount || 0;

  const expectedTotal = calculatedAmount + additionalFeesTotal - discountAmount;

  // If there's a discrepancy, log a warning but allow the save
  if (Math.abs(expectedTotal - this.totalAmount) > 0.01) {
    console.warn(
      `Booking amounts don't match: calculated=${expectedTotal}, provided=${this.totalAmount}`
    );
  }

  next();
});

// Static method to check for availability
bookingSchema.statics.checkAvailability = async function (
  unitId,
  checkIn,
  checkOut
) {
  const checkInDate = new Date(checkIn);
  const checkOutDate = new Date(checkOut);

  // Find any bookings that overlap with the requested dates
  const conflictingBookings = await this.find({
    unit: unitId,
    status: { $nin: ["cancelled", "no_show"] },
    $or: [
      // New booking starts during an existing booking
      { checkIn: { $lte: checkInDate }, checkOut: { $gt: checkInDate } },
      // New booking ends during an existing booking
      { checkIn: { $lt: checkOutDate }, checkOut: { $gte: checkOutDate } },
      // New booking entirely contains an existing booking
      { checkIn: { $gte: checkInDate, $lt: checkOutDate } },
    ],
  });

  return {
    available: conflictingBookings.length === 0,
    conflictingBookings,
  };
};

// Method to calculate nightly rates with discounts
bookingSchema.methods.calculateRates = function (unitSettings) {
  const checkInDate = new Date(this.checkIn);
  const checkOutDate = new Date(this.checkOut);
  const nightsDiff = Math.ceil(
    (checkOutDate - checkInDate) / (1000 * 60 * 60 * 24)
  );

  let totalAmount = 0;

  // Apply weekly rate if stay is 7+ days and weekly rate is set
  if (nightsDiff >= 7 && unitSettings.weeklyRate) {
    const fullWeeks = Math.floor(nightsDiff / 7);
    const remainingDays = nightsDiff % 7;

    totalAmount =
      fullWeeks * unitSettings.weeklyRate +
      remainingDays * unitSettings.nightlyRate;
  }
  // Apply monthly rate if stay is 30+ days and monthly rate is set
  else if (nightsDiff >= 30 && unitSettings.monthlyRate) {
    const fullMonths = Math.floor(nightsDiff / 30);
    const remainingDays = nightsDiff % 30;

    totalAmount =
      fullMonths * unitSettings.monthlyRate +
      remainingDays * unitSettings.nightlyRate;
  }
  // Otherwise just use nightly rate
  else {
    totalAmount = nightsDiff * unitSettings.nightlyRate;
  }

  return {
    totalNights: nightsDiff,
    baseAmount: nightsDiff * unitSettings.nightlyRate,
    discountedAmount: totalAmount,
    discount: nightsDiff * unitSettings.nightlyRate - totalAmount,
  };
};

export default mongoose.model("Booking", bookingSchema);
