// backend/models/TenantActivity.js
import mongoose from 'mongoose';

const tenantActivitySchema = new mongoose.Schema({
  // Core Information
  tenant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
    index: true
  },
  
  // Activity Classification
  action: {
    type: String,
    required: true,
    enum: [
      // Lifecycle events
      'tenant_created',
      'tenant_updated',
      'status_changed',
      'tenant_approved',
      'tenant_rejected',
      'tenant_activated',
      'tenant_deactivated',
      'tenant_blacklisted',
      'tenant_deleted',
      
      // Unit and property events
      'unit_assigned',
      'unit_changed',
      'moved_in',
      'moved_out',
      'lease_signed',
      'lease_renewed',
      'lease_terminated',
      'lease_expired',
      
      // Financial events
      'payment_made',
      'payment_failed',
      'payment_refunded',
      'balance_updated',
      'rent_generated',
      'late_fee_applied',
      'deposit_paid',
      'deposit_refunded',
      
      // Document events
      'document_uploaded',
      'document_verified',
      'document_rejected',
      'document_expired',
      'lease_document_signed',
      
      // Communication events
      'email_sent',
      'sms_sent',
      'call_made',
      'message_received',
      'complaint_filed',
      'complaint_resolved',
      'notice_served',
      
      // Portal and system events
      'portal_access_granted',
      'portal_access_revoked',
      'login_successful',
      'login_failed',
      'password_changed',
      'password_reset_requested',
      'password_reset_completed',
      'account_locked',
      'account_unlocked',
      
      // Reference and verification events
      'reference_requested',
      'reference_received',
      'background_check_initiated',
      'background_check_completed',
      'credit_check_performed',
      'employment_verified',
      
      // Maintenance and service events
      'maintenance_request_submitted',
      'maintenance_request_assigned',
      'maintenance_completed',
      'service_request_created',
      'inspection_scheduled',
      'inspection_completed',
      
      // Administrative events
      'note_added',
      'reminder_set',
      'task_assigned',
      'follow_up_scheduled',
      'contact_information_updated',
      'emergency_contact_updated',
      
      // Legal and compliance events
      'eviction_notice_served',
      'court_case_filed',
      'settlement_reached',
      'compliance_check_performed',
      
      // System generated events
      'automatic_reminder_sent',
      'recurring_payment_processed',
      'lease_renewal_reminder',
      'lease_expiry_warning',
      'overdue_payment_alert'
    ],
    index: true
  },
  
  // Activity Details
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  
  // Who performed the action
  performedBy: {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    userType: {
      type: String,
      enum: ['admin', 'property_manager', 'staff', 'tenant', 'system', 'api'],
      required: true
    },
    userName: String, // Store name for historical purposes
    userEmail: String
  },
  
  // When it happened
  timestamp: {
    type: Date,
    default: Date.now,
    required: true,
    index: true
  },
  effectiveDate: Date, // When the change takes effect (if different from timestamp)
  
  // Activity Classification
  category: {
    type: String,
    enum: [
      'administrative',
      'financial',
      'legal',
      'maintenance',
      'communication',
      'security',
      'compliance',
      'system'
    ],
    required: true,
    index: true
  },
  
  severity: {
    type: String,
    enum: ['info', 'low', 'medium', 'high', 'critical'],
    default: 'info',
    index: true
  },
  
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal'
  },
  
  // Status and workflow
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'completed', 'cancelled', 'failed'],
    default: 'completed'
  },
  
  // Related entities
  relatedEntities: {
    property: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Property'
    },
    unit: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Unit'
    },
    lease: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lease'
    },
    payment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Payment'
    },
    expense: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Expense'
    },
    maintenanceRequest: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MaintenanceRequest'
    },
    document: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Document'
    }
  },
  
  // Detailed metadata
  metadata: {
    // Original data (for updates)
    originalData: mongoose.Schema.Types.Mixed,
    newData: mongoose.Schema.Types.Mixed,
    changedFields: [String],
    
    // Financial information
    financialImpact: {
      amount: Number,
      currency: { type: String, default: 'KES' },
      type: {
        type: String,
        enum: ['debit', 'credit', 'neutral']
      },
      balanceBefore: Number,
      balanceAfter: Number
    },
    
    // System information
    systemInfo: {
      ipAddress: String,
      userAgent: String,
      sessionId: String,
      deviceType: String,
      browser: String,
      location: {
        country: String,
        city: String,
        coordinates: {
          lat: Number,
          lng: Number
        }
      }
    },
    
    // Communication details
    communicationDetails: {
      method: {
        type: String,
        enum: ['email', 'sms', 'phone', 'whatsapp', 'in_person', 'mail']
      },
      recipient: String,
      subject: String,
      messageId: String,
      deliveryStatus: {
        type: String,
        enum: ['sent', 'delivered', 'read', 'failed', 'bounced']
      },
      response: String
    },
    
    // Document details
    documentDetails: {
      documentType: String,
      fileName: String,
      fileSize: Number,
      filePath: String,
      verificationStatus: String,
      verificationNotes: String
    },
    
    // Workflow information
    workflowInfo: {
      stepName: String,
      stepOrder: Number,
      totalSteps: Number,
      nextStep: String,
      assignedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      dueDate: Date,
      completedDate: Date
    },
    
    // Integration data
    integrationData: {
      source: String, // e.g., 'mobile_app', 'web_portal', 'api', 'import'
      sourceId: String,
      externalReference: String,
      apiVersion: String,
      webhookData: mongoose.Schema.Types.Mixed
    },
    
    // Additional context
    additionalContext: mongoose.Schema.Types.Mixed,
    tags: [String],
    customFields: mongoose.Schema.Types.Mixed
  },
  
  // Visibility and permissions
  visibility: {
    type: String,
    enum: ['public', 'internal', 'confidential', 'restricted'],
    default: 'internal'
  },
  visibleToTenant: {
    type: Boolean,
    default: false
  },
  
  // Flags
  isSystemGenerated: {
    type: Boolean,
    default: false,
    index: true
  },
  isAutomated: {
    type: Boolean,
    default: false
  },
  requiresApproval: {
    type: Boolean,
    default: false
  },
  isApproved: {
    type: Boolean,
    default: true
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: Date,
  
  // Follow-up and reminders
  followUp: {
    required: {
      type: Boolean,
      default: false
    },
    dueDate: Date,
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    notes: String,
    completed: {
      type: Boolean,
      default: false
    },
    completedDate: Date
  },
  
  // Attachments and evidence
  attachments: [{
    name: String,
    path: String,
    type: {
      type: String,
      enum: ['image', 'document', 'video', 'audio', 'other']
    },
    size: Number,
    uploadDate: { type: Date, default: Date.now },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  
  // Audit trail
  auditTrail: {
    created: {
      by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      at: { type: Date, default: Date.now },
      reason: String
    },
    lastModified: {
      by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      at: Date,
      reason: String,
      changes: [String]
    },
    accessed: [{
      by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      at: { type: Date, default: Date.now },
      method: String // 'view', 'export', 'print'
    }]
  }
  
}, {
  timestamps: true,
  toJSON: { 
    virtuals: true,
    transform: function(doc, ret) {
      // Remove sensitive data from JSON output
      if (ret.metadata?.systemInfo?.ipAddress && ret.visibility === 'public') {
        delete ret.metadata.systemInfo.ipAddress;
      }
      return ret;
    }
  },
  toObject: { virtuals: true }
});

// Comprehensive indexing for performance
tenantActivitySchema.index({ tenant: 1, timestamp: -1 });
tenantActivitySchema.index({ tenant: 1, action: 1, timestamp: -1 });
tenantActivitySchema.index({ tenant: 1, category: 1, timestamp: -1 });
tenantActivitySchema.index({ action: 1, timestamp: -1 });
tenantActivitySchema.index({ category: 1, severity: 1, timestamp: -1 });
tenantActivitySchema.index({ 'performedBy.user': 1, timestamp: -1 });
tenantActivitySchema.index({ status: 1, timestamp: -1 });
tenantActivitySchema.index({ isSystemGenerated: 1, timestamp: -1 });
tenantActivitySchema.index({ 'relatedEntities.property': 1, timestamp: -1 });
tenantActivitySchema.index({ 'relatedEntities.unit': 1, timestamp: -1 });
tenantActivitySchema.index({ 'followUp.required': 1, 'followUp.dueDate': 1 });

// Compound indexes for complex queries
tenantActivitySchema.index({ 
  tenant: 1, 
  category: 1, 
  severity: 1, 
  timestamp: -1 
});
tenantActivitySchema.index({ 
  'relatedEntities.property': 1, 
  action: 1, 
  timestamp: -1 
});

// Virtual properties
tenantActivitySchema.virtual('timeAgo').get(function() {
  const now = new Date();
  const diff = now - this.timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  return 'Just now';
});

tenantActivitySchema.virtual('isOverdue').get(function() {
  return this.followUp.required && 
         this.followUp.dueDate && 
         new Date() > this.followUp.dueDate && 
         !this.followUp.completed;
});

tenantActivitySchema.virtual('actorName').get(function() {
  if (this.performedBy.userType === 'system') return 'System';
  if (this.performedBy.userType === 'api') return 'API';
  return this.performedBy.userName || 'Unknown User';
});

// Static methods for querying and analytics
tenantActivitySchema.statics.createActivity = async function(data) {
  const activity = new this({
    ...data,
    category: this.getCategoryForAction(data.action),
    severity: this.getSeverityForAction(data.action),
    auditTrail: {
      created: {
        by: data.performedBy?.user,
        at: new Date(),
        reason: 'Activity logged'
      }
    }
  });
  
  return await activity.save();
};

tenantActivitySchema.statics.logTenantActivity = async function(
  tenantId, 
  action, 
  title, 
  description, 
  performedBy, 
  metadata = {}
) {
  return await this.createActivity({
    tenant: tenantId,
    action,
    title,
    description,
    performedBy,
    metadata,
    timestamp: new Date()
  });
};

tenantActivitySchema.statics.getCategoryForAction = function(action) {
  const categoryMap = {
    // Financial activities
    'payment_made': 'financial',
    'payment_failed': 'financial',
    'balance_updated': 'financial',
    'rent_generated': 'financial',
    'late_fee_applied': 'financial',
    'deposit_paid': 'financial',
    'deposit_refunded': 'financial',
    
    // Legal activities
    'lease_signed': 'legal',
    'lease_terminated': 'legal',
    'eviction_notice_served': 'legal',
    'court_case_filed': 'legal',
    'tenant_blacklisted': 'legal',
    
    // Administrative activities
    'tenant_created': 'administrative',
    'tenant_updated': 'administrative',
    'status_changed': 'administrative',
    'unit_assigned': 'administrative',
    'moved_in': 'administrative',
    'moved_out': 'administrative',
    'document_uploaded': 'administrative',
    'document_verified': 'administrative',
    
    // Security activities
    'portal_access_granted': 'security',
    'login_successful': 'security',
    'login_failed': 'security',
    'password_changed': 'security',
    'account_locked': 'security',
    
    // Communication activities
    'email_sent': 'communication',
    'sms_sent': 'communication',
    'call_made': 'communication',
    'complaint_filed': 'communication',
    
    // Maintenance activities
    'maintenance_request_submitted': 'maintenance',
    'maintenance_completed': 'maintenance',
    'inspection_scheduled': 'maintenance',
    
    // System activities
    'automatic_reminder_sent': 'system',
    'recurring_payment_processed': 'system',
    'lease_renewal_reminder': 'system'
  };
  
  return categoryMap[action] || 'administrative';
};

tenantActivitySchema.statics.getSeverityForAction = function(action) {
  const severityMap = {
    'tenant_blacklisted': 'critical',
    'eviction_notice_served': 'critical',
    'court_case_filed': 'critical',
    'payment_failed': 'high',
    'lease_terminated': 'high',
    'account_locked': 'high',
    'moved_out': 'medium',
    'lease_signed': 'medium',
    'payment_made': 'low',
    'document_uploaded': 'info',
    'login_successful': 'info'
  };
  
  return severityMap[action] || 'info';
};

tenantActivitySchema.statics.getActivitiesForTenant = function(tenantId, options = {}) {
  const {
    limit = 20,
    skip = 0,
    category,
    action,
    severity,
    startDate,
    endDate,
    includeSystem = true
  } = options;
  
  const filter = { tenant: tenantId };
  
  if (category) filter.category = category;
  if (action) filter.action = action;
  if (severity) filter.severity = severity;
  if (!includeSystem) filter.isSystemGenerated = false;
  
  if (startDate || endDate) {
    filter.timestamp = {};
    if (startDate) filter.timestamp.$gte = new Date(startDate);
    if (endDate) filter.timestamp.$lte = new Date(endDate);
  }
  
  return this.find(filter)
    .populate('performedBy.user', 'firstName lastName email')
    .populate('relatedEntities.property', 'name')
    .populate('relatedEntities.unit', 'unitNumber')
    .populate('relatedEntities.payment', 'amount reference')
    .sort({ timestamp: -1 })
    .skip(skip)
    .limit(limit);
};

tenantActivitySchema.statics.getActivitySummary = async function(tenantId, days = 30) {
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  
  const summary = await this.aggregate([
    {
      $match: {
        tenant: mongoose.Types.ObjectId(tenantId),
        timestamp: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: {
          category: '$category',
          action: '$action'
        },
        count: { $sum: 1 },
        lastActivity: { $max: '$timestamp' },
        avgSeverity: { $avg: { 
          $switch: {
            branches: [
              { case: { $eq: ['$severity', 'info'] }, then: 1 },
              { case: { $eq: ['$severity', 'low'] }, then: 2 },
              { case: { $eq: ['$severity', 'medium'] }, then: 3 },
              { case: { $eq: ['$severity', 'high'] }, then: 4 },
              { case: { $eq: ['$severity', 'critical'] }, then: 5 }
            ],
            default: 1
          }
        }}
      }
    },
    {
      $sort: { count: -1 }
    }
  ]);
  
  const categoryBreakdown = await this.aggregate([
    {
      $match: {
        tenant: mongoose.Types.ObjectId(tenantId),
        timestamp: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: '$category',
        count: { $sum: 1 },
        criticalCount: {
          $sum: { $cond: [{ $eq: ['$severity', 'critical'] }, 1, 0] }
        },
        highCount: {
          $sum: { $cond: [{ $eq: ['$severity', 'high'] }, 1, 0] }
        }
      }
    }
  ]);
  
  return {
    summary,
    categoryBreakdown,
    totalActivities: summary.reduce((sum, item) => sum + item.count, 0),
    period: `${days} days`
  };
};

tenantActivitySchema.statics.getOverdueFollowUps = function() {
  const now = new Date();
  return this.find({
    'followUp.required': true,
    'followUp.dueDate': { $lt: now },
    'followUp.completed': false
  })
  .populate('tenant', 'firstName lastName')
  .populate('followUp.assignedTo', 'firstName lastName')
  .sort({ 'followUp.dueDate': 1 });
};

tenantActivitySchema.statics.getActivitiesByProperty = function(propertyId, options = {}) {
  const { limit = 50, category, severity } = options;
  
  const filter = { 'relatedEntities.property': propertyId };
  if (category) filter.category = category;
  if (severity) filter.severity = severity;
  
  return this.find(filter)
    .populate('tenant', 'firstName lastName')
    .populate('performedBy.user', 'firstName lastName')
    .sort({ timestamp: -1 })
    .limit(limit);
};

// Instance methods
tenantActivitySchema.methods.markAsRead = function(userId) {
  this.auditTrail.accessed.push({
    by: userId,
    at: new Date(),
    method: 'view'
  });
  return this.save();
};

tenantActivitySchema.methods.addFollowUp = function(dueDate, assignedTo, notes) {
  this.followUp = {
    required: true,
    dueDate: new Date(dueDate),
    assignedTo,
    notes,
    completed: false
  };
  return this.save();
};

tenantActivitySchema.methods.completeFollowUp = function(completedBy, notes) {
  this.followUp.completed = true;
  this.followUp.completedDate = new Date();
  this.followUp.completionNotes = notes;
  this.followUp.completedBy = completedBy;
  return this.save();
};

tenantActivitySchema.methods.addAttachment = function(attachmentData, uploadedBy) {
  this.attachments.push({
    ...attachmentData,
    uploadDate: new Date(),
    uploadedBy
  });
  return this.save();
};

// Pre-save middleware
tenantActivitySchema.pre('save', function(next) {
  // Auto-generate title if not provided
  if (!this.title && this.action) {
    this.title = this.generateTitleFromAction();
  }
  
  // Set effective date if not provided
  if (!this.effectiveDate) {
    this.effectiveDate = this.timestamp;
  }
  
  // Update audit trail
  if (this.isModified() && !this.isNew) {
    this.auditTrail.lastModified = {
      by: this.performedBy?.user,
      at: new Date(),
      reason: 'Activity updated',
      changes: this.modifiedPaths()
    };
  }
  
  next();
});

// Instance helper method
tenantActivitySchema.methods.generateTitleFromAction = function() {
  const titleMap = {
    'tenant_created': 'Tenant Record Created',
    'payment_made': 'Payment Received',
    'lease_signed': 'Lease Agreement Signed',
    'moved_in': 'Tenant Moved In',
    'moved_out': 'Tenant Moved Out',
    'document_uploaded': 'Document Uploaded',
    'status_changed': 'Status Changed',
    'unit_assigned': 'Unit Assigned',
    'balance_updated': 'Balance Updated',
    'portal_access_granted': 'Portal Access Granted',
    'maintenance_request_submitted': 'Maintenance Request Submitted'
  };
  
  return titleMap[this.action] || this.action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};

const TenantActivity = mongoose.model('TenantActivity', tenantActivitySchema);

export default TenantActivity;