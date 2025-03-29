// backend/models/Tenant.js
import mongoose from "mongoose";

const tenantSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    unitId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Unit",
      required: true,
    },
    propertyId: {
      // Added for easy property-specific queries
      type: mongoose.Schema.Types.ObjectId,
      ref: "Property",
      required: true,
    },
    status: {
      type: String,
      enum: ["active", "pending", "past", "blacklisted"],
      default: "pending",
    },
    // Personal Information
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: true,
    },
    // Identification & Verification
    identificationDetails: {
      type: {
        type: String,
        enum: ["passport", "nationalId", "driverLicense"],
      },
      number: String,
      issueDate: Date,
      expiryDate: Date,
      verified: {
        type: Boolean,
        default: false,
      },
    },
    // Lease Information
    leaseDetails: {
      startDate: Date,
      endDate: Date,
      rentAmount: Number,
      securityDeposit: Number,
      paymentFrequency: {
        type: String,
        enum: ["monthly", "weekly", "daily"],
        default: "monthly",
      },
      agreementDocument: {
        path: String,
        uploadDate: Date,
        verified: {
          type: Boolean,
          default: false,
        },
      },
    },
    // Document Storage
    documents: [
      {
        type: {
          type: String,
          enum: [
            "leaseAgreement",
            "identification",
            "background_check",
            "proof_of_income",
            "insurance",
            "other",
          ],
          required: true,
        },
        name: String,
        path: String,
        uploadDate: {
          type: Date,
          default: Date.now,
        },
        verified: {
          type: Boolean,
          default: false,
        },
        required: {
          type: Boolean,
          default: true,
        },
      },
    ],
    // Emergency Contact
    emergencyContact: {
      name: String,
      relationship: String,
      phone: String,
      email: String,
    },
    // Payment History
    paymentHistory: [
      {
        date: Date,
        amount: Number,
        type: {
          type: String,
          enum: ["rent", "deposit", "fee", "maintenance", "other"],
          default: "rent",
        },
        status: {
          type: String,
          enum: ["pending", "completed", "failed", "refunded"],
          default: "completed",
        },
        reference: String,
        balance: Number, // Remaining balance after this payment
        description: String,
      },
    ],
    // Current balance
    currentBalance: {
      type: Number,
      default: 0, // Positive means tenant owes, negative means tenant has credit
    },
    // For BnB Guests
    bookingHistory: [
      {
        checkIn: Date,
        checkOut: Date,
        unitId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Unit",
        },
        totalAmount: Number,
        status: String,
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Middleware to ensure lease document is present for rental tenants with active status
tenantSchema.pre("save", async function (next) {
  if (this.isModified("status") && this.status === "active") {
    const unit = await mongoose.model("Unit").findById(this.unitId);
    if (unit && unit.type === "rental") {
      const hasLeaseAgreement = this.documents.some(
        (doc) => doc.type === "leaseAgreement"
      );
      if (!hasLeaseAgreement && !this.leaseDetails.startDate) {
        throw new Error(
          "Lease agreement or lease details must be provided before activating tenant"
        );
      }
    }
  }
  next();
});

// Calculate total paid amount
tenantSchema.methods.getTotalPaid = function () {
  return this.paymentHistory.reduce((total, payment) => {
    if (payment.status === "completed") {
      return total + payment.amount;
    }
    return total;
  }, 0);
};

// Calculate due amount based on lease duration and rent amount
tenantSchema.methods.getTotalDue = function () {
  if (
    !this.leaseDetails.startDate ||
    !this.leaseDetails.endDate ||
    !this.leaseDetails.rentAmount
  ) {
    return 0;
  }

  const start = new Date(this.leaseDetails.startDate);
  const end = new Date(this.leaseDetails.endDate);
  const now = new Date();

  // If lease hasn't started yet, nothing is due
  if (now < start) {
    return 0;
  }

  // If lease has ended, calculate based on full lease period
  if (now > end) {
    const monthsDiff =
      (end.getFullYear() - start.getFullYear()) * 12 +
      (end.getMonth() - start.getMonth()) +
      (end.getDate() >= start.getDate() ? 1 : 0);
    return monthsDiff * this.leaseDetails.rentAmount;
  }

  // If lease is active, calculate based on months elapsed
  const monthsElapsed =
    (now.getFullYear() - start.getFullYear()) * 12 +
    (now.getMonth() - start.getMonth()) +
    (now.getDate() >= start.getDate() ? 1 : 0);

  return monthsElapsed * this.leaseDetails.rentAmount;
};

export default mongoose.model("Tenant", tenantSchema);
