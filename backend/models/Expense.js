// backend/models/Expense.js
import mongoose from 'mongoose';

const expenseSchema = new mongoose.Schema({
  // Basic Information
  property: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Property',
    required: true,
    index: true
  },
  unit: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Unit',
    index: true
  },
  
  // Expense Details
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500
  },
  category: {
    type: String,
    required: true,
    enum: [
      'maintenance',
      'utilities', 
      'taxes',
      'insurance',
      'mortgage',
      'payroll',
      'marketing',
      'legal',
      'accounting',
      'repairs',
      'cleaning',
      'security',
      'landscaping',
      'supplies',
      'equipment',
      'technology',
      'communications',
      'travel',
      'office',
      'custom'
    ],
    index: true
  },
  subcategory: {
    type: String,
    trim: true,
    maxlength: 100
  },
  
  // Financial Details
  amount: {
    type: Number,
    required: true,
    min: 0,
    set: function(value) {
      return Math.round(value * 100) / 100; // Round to 2 decimal places
    }
  },
  currency: {
    type: String,
    default: 'KES',
    enum: ['KES', 'USD', 'EUR', 'GBP']
  },
  taxAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  taxRate: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  
  // Date Information
  date: {
    type: Date,
    required: true,
    index: true
  },
  dueDate: Date,
  
  // Vendor/Supplier Information
  vendor: {
    name: {
      type: String,
      trim: true,
      maxlength: 200
    },
    contact: {
      phone: String,
      email: String,
      address: String
    },
    vendorId: String,
    taxId: String
  },
  
  // Payment Information
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'overdue', 'cancelled'],
    default: 'pending',
    index: true
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'bank_transfer', 'cheque', 'mobile_money', 'card', 'other']
  },
  paymentDate: Date,
  paymentReference: String,
  
  // Document Management
  invoiceNumber: {
    type: String,
    trim: true,
    maxlength: 100
  },
  receiptNumber: {
    type: String,
    trim: true,
    maxlength: 100
  },
  receipt: {
    path: String,
    originalName: String,
    uploadDate: { type: Date, default: Date.now },
    size: Number,
    mimeType: String
  },
  attachments: [{
    name: String,
    path: String,
    uploadDate: { type: Date, default: Date.now },
    size: Number,
    mimeType: String,
    type: {
      type: String,
      enum: ['invoice', 'receipt', 'quote', 'contract', 'other'],
      default: 'other'
    }
  }],
  
  // Approval Workflow
  approvalStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'needs_review'],
    default: 'pending',
    index: true
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: Date,
  approvalNotes: String,
  
  // Categorization and Tags
  isRecurring: {
    type: Boolean,
    default: false
  },
  recurringPattern: {
    frequency: {
      type: String,
      enum: ['weekly', 'monthly', 'quarterly', 'annually']
    },
    interval: { type: Number, min: 1 },
    endDate: Date,
    nextDueDate: Date
  },
  tags: [String],
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  
  // Maintenance Specific (if applicable)
  maintenanceDetails: {
    workOrderId: String,
    contractorId: String,
    startDate: Date,
    completionDate: Date,
    warrantyPeriod: Number, // in months
    warrantyExpiry: Date
  },
  
  // Utility Specific (if applicable)
  utilityDetails: {
    utilityType: {
      type: String,
      enum: ['electricity', 'water', 'gas', 'internet', 'garbage', 'sewer', 'other']
    },
    meterReading: {
      previous: Number,
      current: Number,
      units: String
    },
    serviceProvider: String,
    accountNumber: String,
    billingPeriod: {
      from: Date,
      to: Date
    }
  },
  
  // Reference and Notes
  reference: String,
  notes: String,
  internalNotes: String, // Only visible to staff
  
  // Audit and Tracking
  metadata: {
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    lastModifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    lastModifiedAt: Date,
    source: {
      type: String,
      enum: ['manual_entry', 'import', 'recurring', 'api', 'mobile_app'],
      default: 'manual_entry'
    },
    ipAddress: String,
    userAgent: String,
    changedFields: [String]
  },
  
  // Soft Delete
  deleted: {
    type: Boolean,
    default: false,
    index: true
  },
  deletedAt: Date,
  deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  deletionReason: String

}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
expenseSchema.index({ property: 1, date: -1 });
expenseSchema.index({ unit: 1, date: -1 });
expenseSchema.index({ category: 1, date: -1 });
expenseSchema.index({ paymentStatus: 1, date: -1 });
expenseSchema.index({ approvalStatus: 1, date: -1 });
expenseSchema.index({ vendor: 1 });
expenseSchema.index({ invoiceNumber: 1 });
expenseSchema.index({ deleted: 1, date: -1 });
expenseSchema.index({ 'recurringPattern.nextDueDate': 1 });

// Compound indexes
expenseSchema.index({ property: 1, category: 1, date: -1 });
expenseSchema.index({ paymentStatus: 1, dueDate: 1 });

// Virtual for total amount including tax
expenseSchema.virtual('totalAmount').get(function() {
  return this.amount + (this.taxAmount || 0);
});

// Virtual for days overdue
expenseSchema.virtual('daysOverdue').get(function() {
  if (!this.dueDate || this.paymentStatus === 'paid') return 0;
  const today = new Date();
  const dueDate = new Date(this.dueDate);
  if (today <= dueDate) return 0;
  return Math.floor((today - dueDate) / (1000 * 60 * 60 * 24));
});

// Virtual for formatted amount
expenseSchema.virtual('formattedAmount').get(function() {
  return `${this.currency} ${this.amount.toLocaleString('en-KE', { minimumFractionDigits: 2 })}`;
});

// Virtual for status badge info
expenseSchema.virtual('statusInfo').get(function() {
  const statusMap = {
    pending: { color: 'yellow', text: 'Pending' },
    paid: { color: 'green', text: 'Paid' },
    overdue: { color: 'red', text: 'Overdue' },
    cancelled: { color: 'gray', text: 'Cancelled' }
  };
  return statusMap[this.paymentStatus] || statusMap.pending;
});

// Instance methods
expenseSchema.methods.markAsPaid = function(paymentDate, paymentMethod, reference) {
  this.paymentStatus = 'paid';
  this.paymentDate = paymentDate || new Date();
  this.paymentMethod = paymentMethod;
  this.paymentReference = reference;
  return this.save();
};

expenseSchema.methods.approve = function(approvedBy, notes) {
  this.approvalStatus = 'approved';
  this.approvedBy = approvedBy;
  this.approvedAt = new Date();
  this.approvalNotes = notes;
  return this.save();
};

expenseSchema.methods.reject = function(rejectedBy, reason) {
  this.approvalStatus = 'rejected';
  this.approvedBy = rejectedBy;
  this.approvedAt = new Date();
  this.approvalNotes = reason;
  return this.save();
};

expenseSchema.methods.addAttachment = function(attachment) {
  this.attachments.push({
    ...attachment,
    uploadDate: new Date()
  });
  return this.save();
};

// Static methods
expenseSchema.statics.getExpensesByProperty = function(propertyId, options = {}) {
  const filter = { 
    property: propertyId,
    deleted: { $ne: true }
  };
  
  if (options.category) filter.category = options.category;
  if (options.status) filter.paymentStatus = options.status;
  if (options.startDate || options.endDate) {
    filter.date = {};
    if (options.startDate) filter.date.$gte = new Date(options.startDate);
    if (options.endDate) filter.date.$lte = new Date(options.endDate);
  }

  return this.find(filter)
    .populate('unit', 'unitNumber floor')
    .populate('approvedBy', 'firstName lastName')
    .sort({ date: -1 });
};

expenseSchema.statics.getOverdueExpenses = function() {
  const today = new Date();
  return this.find({
    paymentStatus: 'pending',
    dueDate: { $lt: today },
    deleted: { $ne: true }
  })
  .populate('property', 'name')
  .populate('unit', 'unitNumber')
  .sort({ dueDate: 1 });
};

expenseSchema.statics.getPendingApprovals = function() {
  return this.find({
    approvalStatus: 'pending',
    deleted: { $ne: true }
  })
  .populate('property', 'name')
  .populate('metadata.createdBy', 'firstName lastName')
  .sort({ createdAt: -1 });
};

expenseSchema.statics.getExpenseSummary = async function(propertyId, startDate, endDate) {
  const match = {
    deleted: { $ne: true }
  };
  
  if (propertyId) match.property = mongoose.Types.ObjectId(propertyId);
  if (startDate || endDate) {
    match.date = {};
    if (startDate) match.date.$gte = new Date(startDate);
    if (endDate) match.date.$lte = new Date(endDate);
  }

  return await this.aggregate([
    { $match: match },
    {
      $group: {
        _id: '$category',
        totalAmount: { $sum: '$amount' },
        count: { $sum: 1 },
        averageAmount: { $avg: '$amount' },
        paidAmount: {
          $sum: { $cond: [{ $eq: ['$paymentStatus', 'paid'] }, '$amount', 0] }
        },
        pendingAmount: {
          $sum: { $cond: [{ $eq: ['$paymentStatus', 'pending'] }, '$amount', 0] }
        }
      }
    },
    { $sort: { totalAmount: -1 } }
  ]);
};

// Pre-save middleware
expenseSchema.pre('save', function(next) {
  // Auto-generate reference if not provided
  if (!this.reference && this.isNew) {
    this.reference = `EXP-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
  }

  // Set overdue status
  if (this.dueDate && this.paymentStatus === 'pending') {
    const today = new Date();
    if (today > this.dueDate) {
      this.paymentStatus = 'overdue';
    }
  }

  // Calculate warranty expiry for maintenance expenses
  if (this.category === 'maintenance' && this.maintenanceDetails?.warrantyPeriod) {
    const completionDate = this.maintenanceDetails.completionDate || this.date;
    const expiryDate = new Date(completionDate);
    expiryDate.setMonth(expiryDate.getMonth() + this.maintenanceDetails.warrantyPeriod);
    this.maintenanceDetails.warrantyExpiry = expiryDate;
  }

  next();
});

// Pre-remove middleware
expenseSchema.pre('remove', async function(next) {
  try {
    // Remove any scheduled recurring expenses
    if (this.isRecurring) {
      await this.constructor.updateMany(
        { 'metadata.parentExpense': this._id },
        { $set: { deleted: true, deletedAt: new Date() } }
      );
    }
    next();
  } catch (error) {
    next(error);
  }
});

const Expense = mongoose.model('Expense', expenseSchema);

export default Expense;