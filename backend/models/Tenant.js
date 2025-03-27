// models/Tenant.js
import mongoose from 'mongoose';

const tenantSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  unitId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Unit'
  },
  status: {
    type: String,
    enum: ['active', 'pending', 'past', 'blacklisted'],
    default: 'pending'
  },
  // Personal Information
  firstName: {
    type: String,
    required: true
  },
  lastName: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    required: true
  },
  // Identification & Verification
  identificationDetails: {
    type: {
      type: String,
      enum: ['passport', 'nationalId', 'driverLicense']
    },
    number: String,
    issueDate: Date,
    expiryDate: Date,
    verified: {
      type: Boolean,
      default: false
    }
  },
  // Lease Information
  leaseDetails: {
    startDate: Date,
    endDate: Date,
    rentAmount: Number,
    securityDeposit: Number,
    paymentFrequency: {
      type: String,
      enum: ['monthly', 'weekly', 'daily'],
      default: 'monthly'
    }
  },
  // Document Storage
  documents: [{
    type: {
      type: String,
      enum: ['leaseAgreement', 'identification', 'background_check', 'proof_of_income', 'insurance', 'other'],
      required: true
    },
    name: String,
    path: String,
    uploadDate: {
      type: Date,
      default: Date.now
    },
    verified: {
      type: Boolean,
      default: false
    },
    required: {
      type: Boolean,
      default: true
    }
  }],
  // Emergency Contact
  emergencyContact: {
    name: String,
    relationship: String,
    phone: String,
    email: String
  },
  // Payment History
  paymentHistory: [{
    date: Date,
    amount: Number,
    type: String,
    status: String,
    reference: String
  }],
  // For BnB Guests
  bookingHistory: [{
    checkIn: Date,
    checkOut: Date,
    unitId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Unit'
    },
    totalAmount: Number,
    status: String
  }]
}, {
  timestamps: true
});

// Middleware to ensure lease document is present for rental tenants
tenantSchema.pre('save', async function(next) {
  if (this.isModified('status') && this.status === 'active') {
    const unit = await mongoose.model('Unit').findById(this.unitId);
    if (unit.type === 'rental') {
      const hasLeaseAgreement = this.documents.some(doc => 
        doc.type === 'leaseAgreement' && doc.verified
      );
      if (!hasLeaseAgreement) {
        throw new Error('Lease agreement must be uploaded and verified before activating tenant');
      }
    }
  }
  next();
});

export default mongoose.model('Tenant', tenantSchema);