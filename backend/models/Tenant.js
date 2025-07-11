// backend/models/Tenant.js
import mongoose from 'mongoose';

const tenantSchema = new mongoose.Schema({
  // Basic Information
  firstName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  lastName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  phone: {
    type: String,
    required: true,
    trim: true,
    match: [/^(\+254|254|0)[17]\d{8}$/, 'Please enter a valid Kenyan phone number']
  },
  alternativePhone: {
    type: String,
    trim: true,
    match: [/^(\+254|254|0)[17]\d{8}$/, 'Please enter a valid Kenyan phone number']
  },
  nationalId: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    match: [/^\d{8}$/, 'Please enter a valid 8-digit national ID']
  },
  dateOfBirth: {
    type: Date,
    required: true,
    validate: {
      validator: function(value) {
        const age = (new Date() - new Date(value)) / (365.25 * 24 * 60 * 60 * 1000);
        return age >= 18;
      },
      message: 'Tenant must be at least 18 years old'
    }
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other'],
    required: true
  },
  maritalStatus: {
    type: String,
    enum: ['single', 'married', 'divorced', 'widowed'],
    default: 'single'
  },

  // Address Information
  currentAddress: {
    street: String,
    city: String,
    county: String,
    postalCode: String,
    country: { type: String, default: 'Kenya' }
  },
  permanentAddress: {
    street: String,
    city: String,
    county: String,
    postalCode: String,
    country: { type: String, default: 'Kenya' }
  },

  // Employment Information
  employment: {
    status: {
      type: String,
      enum: ['employed', 'self-employed', 'unemployed', 'student', 'retired'],
      required: true
    },
    employer: String,
    jobTitle: String,
    workAddress: String,
    monthlyIncome: {
      type: Number,
      min: 0,
      validate: {
        validator: function(value) {
          if (this.employment.status === 'employed' || this.employment.status === 'self-employed') {
            return value > 0;
          }
          return true;
        },
        message: 'Monthly income is required for employed/self-employed tenants'
      }
    },
    employmentStartDate: Date,
    supervisorName: String,
    supervisorContact: String
  },

  // Emergency Contact
  emergencyContact: {
    name: { type: String, required: true },
    relationship: { type: String, required: true },
    phone: { 
      type: String, 
      required: true,
      match: [/^(\+254|254|0)[17]\d{8}$/, 'Please enter a valid phone number']
    },
    email: String,
    address: String
  },

  // Tenant Status and Lifecycle
  status: {
    type: String,
    enum: ['prospective', 'approved', 'active', 'past', 'rejected', 'blacklisted', 'deleted'],
    default: 'prospective'
  },
  
  tenancyLifecycle: {
    status: {
      type: String,
      enum: ['prospective', 'approved', 'active', 'past', 'rejected', 'blacklisted', 'deleted'],
      default: 'prospective'
    },
    applicationDate: { type: Date, default: Date.now },
    approvalDate: Date,
    moveInDate: Date,
    moveOutDate: Date,
    finalBalance: Number,
    blacklistDate: Date,
    blacklistReason: String,
    transitions: [{
      from: String,
      to: String,
      date: { type: Date, default: Date.now },
      reason: String,
      performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      notes: String
    }]
  },

  // Unit and Property Information
  currentUnit: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Unit'
  },
  previousUnits: [{
    unit: { type: mongoose.Schema.Types.ObjectId, ref: 'Unit' },
    moveInDate: Date,
    moveOutDate: Date,
    finalBalance: Number,
    moveOutReason: String
  }],

  // Lease Details
  leaseDetails: {
    startDate: Date,
    endDate: Date,
    rentAmount: {
      type: Number,
      required: function() { return this.status === 'active'; },
      min: 0
    },
    securityDeposit: { type: Number, min: 0, default: 0 },
    paymentFrequency: {
      type: String,
      enum: ['weekly', 'monthly', 'quarterly', 'semi-annual', 'annual'],
      default: 'monthly'
    },
    paymentDueDate: { type: Number, min: 1, max: 31, default: 5 }, // Day of month
    leaseType: {
      type: String,
      enum: ['fixed-term', 'month-to-month', 'periodic'],
      default: 'fixed-term'
    },
    renewalTerms: String,
    specialTerms: [String]
  },

  // Financial Information
  currentBalance: { type: Number, default: 0 },
  totalPaidToDate: { type: Number, default: 0 },
  securityDepositPaid: { type: Number, default: 0 },
  lastPaymentDate: Date,
  lastPaymentAmount: Number,
  monthlyRentDue: Number,
  lastRentGeneration: Date,
  paymentStatus: {
    type: String,
    enum: ['current', 'late', 'overdue', 'defaulted'],
    default: 'current'
  },
  overdueAmount: { type: Number, default: 0 },
  overdueDate: Date,

  // Payment History (last 20 payments for quick access)
  paymentHistory: [{
    paymentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment' },
    amount: Number,
    date: Date,
    type: String,
    method: String,
    newBalance: Number,
    reference: String
  }],

  // Rent History for tracking rent changes
  rentHistory: [{
    month: Number,
    year: Number,
    amount: Number,
    generatedDate: Date,
    status: {
      type: String,
      enum: ['pending', 'paid', 'partial', 'overdue'],
      default: 'pending'
    }
  }],

  // Payment Performance Metrics
  paymentPerformance: {
    totalPayments: { type: Number, default: 0 },
    onTimePayments: { type: Number, default: 0 },
    latePayments: { type: Number, default: 0 },
    onTimeRate: { type: Number, default: 0 }, // Percentage
    averagePaymentDelay: { type: Number, default: 0 }, // Days
    lastCalculated: Date
  },

  // Document Management
  documents: [{
    type: {
      type: String,
      enum: ['leaseAgreement', 'identification', 'paymentReceipt', 'moveInInspection', 'moveOutInspection', 'employmentLetter', 'payslip', 'bankStatement', 'other'],
      required: true
    },
    name: String,
    path: String,
    size: Number,
    mimeType: String,
    uploadDate: { type: Date, default: Date.now },
    verified: { type: Boolean, default: false },
    verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    verificationDate: Date,
    verificationNotes: String,
    expiryDate: Date, // For documents that expire (e.g., ID copies)
    notes: String,
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  }],

  // References
  references: [{
    type: {
      type: String,
      enum: ['previous_landlord', 'employer', 'personal', 'bank'],
      required: true
    },
    name: { type: String, required: true },
    relationship: String,
    phone: { 
      type: String, 
      required: true,
      match: [/^(\+254|254|0)[17]\d{8}$/, 'Please enter a valid phone number']
    },
    email: String,
    address: String,
    contactedDate: Date,
    contactedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    verificationStatus: {
      type: String,
      enum: ['pending', 'verified', 'failed', 'not_reachable'],
      default: 'pending'
    },
    verificationNotes: String
  }],

  // Tenant Portal Access
  password: String, // Hashed password for tenant portal
  portalAccess: {
    enabled: { type: Boolean, default: false },
    lastLogin: Date,
    loginAttempts: { type: Number, default: 0 },
    accountLocked: { type: Boolean, default: false },
    lockUntil: Date,
    passwordResetToken: String,
    passwordResetExpires: Date
  },

  // Preferences and Settings
  preferences: {
    communicationMethod: {
      type: String,
      enum: ['email', 'sms', 'whatsapp', 'call'],
      default: 'email'
    },
    language: { type: String, default: 'en' },
    timezone: { type: String, default: 'Africa/Nairobi' },
    notifications: {
      paymentReminders: { type: Boolean, default: true },
      maintenanceUpdates: { type: Boolean, default: true },
      leaseRenewals: { type: Boolean, default: true },
      generalAnnouncements: { type: Boolean, default: true }
    }
  },

  // Notes and Comments
  notes: String,
  internalNotes: String, // Only visible to staff
  
  // Audit Trail
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  deletedAt: Date,
  deletionReason: String,
  balanceLastRecalculated: Date

}, {
  timestamps: true,
  toJSON: { 
    virtuals: true,
    transform: function(doc, ret) {
      delete ret.password;
      delete ret.portalAccess.passwordResetToken;
      return ret;
    }
  },
  toObject: { virtuals: true }
});

// Indexes for performance
tenantSchema.index({ email: 1 });
tenantSchema.index({ nationalId: 1 });
tenantSchema.index({ phone: 1 });
tenantSchema.index({ status: 1 });
tenantSchema.index({ currentUnit: 1 });
tenantSchema.index({ 'tenancyLifecycle.status': 1 });
tenantSchema.index({ currentBalance: 1 });
tenantSchema.index({ lastPaymentDate: 1 });
tenantSchema.index({ createdAt: 1 });

// Virtual for full name
tenantSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Virtual for age
tenantSchema.virtual('age').get(function() {
  if (!this.dateOfBirth) return null;
  return Math.floor((new Date() - new Date(this.dateOfBirth)) / (365.25 * 24 * 60 * 60 * 1000));
});

// Virtual for days since last payment
tenantSchema.virtual('daysSinceLastPayment').get(function() {
  if (!this.lastPaymentDate) return null;
  return Math.floor((new Date() - new Date(this.lastPaymentDate)) / (1000 * 60 * 60 * 24));
});

// Virtual for rental tenure in months
tenantSchema.virtual('tenureMonths').get(function() {
  if (!this.tenancyLifecycle.moveInDate) return 0;
  const endDate = this.tenancyLifecycle.moveOutDate || new Date();
  const startDate = new Date(this.tenancyLifecycle.moveInDate);
  return Math.floor((endDate - startDate) / (1000 * 60 * 60 * 24 * 30.44));
});

// Virtual for balance status
tenantSchema.virtual('balanceStatus').get(function() {
  const balance = this.currentBalance || 0;
  if (balance <= 0) return 'clear';
  if (balance > 0 && balance <= (this.leaseDetails?.rentAmount || 0)) return 'within_rent';
  return 'over_rent';
});

// Instance methods
tenantSchema.methods.addPaymentToHistory = function(payment) {
  this.paymentHistory.unshift({
    paymentId: payment._id,
    amount: payment.amount,
    date: payment.paymentDate,
    type: payment.type,
    method: payment.paymentMethod,
    newBalance: payment.newBalance,
    reference: payment.reference
  });
  
  // Keep only last 20 payments
  if (this.paymentHistory.length > 20) {
    this.paymentHistory = this.paymentHistory.slice(0, 20);
  }
};

tenantSchema.methods.updatePaymentPerformance = function(isOnTime) {
  this.paymentPerformance.totalPayments += 1;
  if (isOnTime) {
    this.paymentPerformance.onTimePayments += 1;
  } else {
    this.paymentPerformance.latePayments += 1;
  }
  
  this.paymentPerformance.onTimeRate = Math.round(
    (this.paymentPerformance.onTimePayments / this.paymentPerformance.totalPayments) * 100
  );
  this.paymentPerformance.lastCalculated = new Date();
};

tenantSchema.methods.canMakePortalLogin = function() {
  const now = new Date();
  return this.portalAccess.enabled && 
         !this.portalAccess.accountLocked && 
         (!this.portalAccess.lockUntil || this.portalAccess.lockUntil < now);
};

tenantSchema.methods.incrementLoginAttempts = function() {
  this.portalAccess.loginAttempts += 1;
  
  // Lock account after 5 failed attempts
  if (this.portalAccess.loginAttempts >= 5) {
    this.portalAccess.accountLocked = true;
    this.portalAccess.lockUntil = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
  }
};

tenantSchema.methods.resetLoginAttempts = function() {
  this.portalAccess.loginAttempts = 0;
  this.portalAccess.accountLocked = false;
  this.portalAccess.lockUntil = undefined;
  this.portalAccess.lastLogin = new Date();
};

// Static methods
tenantSchema.statics.findByPhoneOrEmail = function(identifier) {
  return this.findOne({
    $or: [
      { phone: identifier },
      { email: identifier.toLowerCase() }
    ]
  });
};

tenantSchema.statics.getActiveTenantsCount = function() {
  return this.countDocuments({ status: 'active' });
};

tenantSchema.statics.getTotalOutstandingBalance = function() {
  return this.aggregate([
    { $match: { status: 'active', currentBalance: { $gt: 0 } } },
    { $group: { _id: null, total: { $sum: '$currentBalance' } } }
  ]);
};

tenantSchema.statics.getOverdueTenantsCount = function() {
  const gracePeriodDays = 5;
  const overdueDate = new Date(Date.now() - gracePeriodDays * 24 * 60 * 60 * 1000);
  
  return this.countDocuments({
    status: 'active',
    currentBalance: { $gt: 0 },
    lastPaymentDate: { $lt: overdueDate }
  });
};

// Pre-save middleware
tenantSchema.pre('save', function(next) {
  // Update balance status based on current balance
  if (this.isModified('currentBalance')) {
    const balance = this.currentBalance || 0;
    const rentAmount = this.leaseDetails?.rentAmount || 0;
    
    if (balance <= 0) {
      this.paymentStatus = 'current';
      this.overdueAmount = 0;
      this.overdueDate = undefined;
    } else if (this.daysSinceLastPayment > 5) {
      this.paymentStatus = 'overdue';
      this.overdueAmount = balance;
      this.overdueDate = new Date();
    } else if (this.daysSinceLastPayment > 0) {
      this.paymentStatus = 'late';
    }
  }

  // Auto-generate tenant ID if not present
  if (!this.tenantId) {
    this.tenantId = `TNT-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
  }

  next();
});

// Post-save middleware
tenantSchema.post('save', function(doc) {
  // Log significant changes
  if (this.isModified('status') || this.isModified('currentBalance')) {
    logger.info(`Tenant ${doc._id} updated: status=${doc.status}, balance=${doc.currentBalance}`);
  }
});

const Tenant = mongoose.model('Tenant', tenantSchema);

export default Tenant;