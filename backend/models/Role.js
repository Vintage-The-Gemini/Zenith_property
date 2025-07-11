// backend/models/Role.js
import mongoose from 'mongoose';

const roleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    enum: [
      'super_admin',
      'admin', 
      'property_manager',
      'accountant',
      'maintenance',
      'staff',
      'tenant'
    ]
  },
  
  displayName: {
    type: String,
    required: true,
    trim: true
  },
  
  description: {
    type: String,
    trim: true,
    maxlength: 500
  },
  
  // Permissions for different modules
  permissions: [{
    module: {
      type: String,
      required: true,
      enum: [
        'properties',
        'units', 
        'tenants',
        'payments',
        'expenses',
        'reports',
        'maintenance',
        'users',
        'settings',
        'system'
      ]
    },
    actions: [{
      type: String,
      enum: [
        'create',
        'read', 
        'update',
        'delete',
        'approve',
        'verify',
        'export',
        'assign',
        'bulk_update',
        'bulk_delete'
      ]
    }]
  }],

  // Subscription and access restrictions
  restrictions: {
    // Property limits (for subscription-based access)
    propertiesLimit: {
      type: Number,
      min: 0,
      default: null // null = unlimited
    },
    
    // User management limits
    usersLimit: {
      type: Number,
      min: 0,
      default: null
    },
    
    // Unit limits per property
    unitsPerPropertyLimit: {
      type: Number,
      min: 0,
      default: null
    },
    
    // Report access restrictions
    reportsAccess: {
      type: [String],
      enum: [
        'financial_summary',
        'occupancy_report', 
        'tenant_payments',
        'property_performance',
        'expense_analysis',
        'revenue_trends',
        'maintenance_reports',
        'tenant_lifecycle',
        'cash_flow',
        'profit_loss'
      ],
      default: []
    },
    
    // Data access scope
    dataAccess: {
      own: {
        type: Boolean,
        default: false // Can only access their own created data
      },
      assigned: {
        type: Boolean, 
        default: false // Can access assigned properties/units
      },
      all: {
        type: Boolean,
        default: false // Can access all data in system
      }
    },
    
    // Feature access restrictions
    featureAccess: {
      bnbManagement: { type: Boolean, default: true },
      recurringExpenses: { type: Boolean, default: true },
      bulkOperations: { type: Boolean, default: false },
      apiAccess: { type: Boolean, default: false },
      dataExport: { type: Boolean, default: false },
      systemSettings: { type: Boolean, default: false },
      userManagement: { type: Boolean, default: false },
      roleManagement: { type: Boolean, default: false }
    },
    
    // Time-based restrictions
    timeRestrictions: {
      allowedDays: {
        type: [String],
        enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
        default: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
      },
      allowedHours: {
        start: { type: String, default: '00:00' }, // 24-hour format
        end: { type: String, default: '23:59' }
      },
      timezone: { type: String, default: 'Africa/Nairobi' }
    },
    
    // Amount limits (for financial operations)
    amountLimits: {
      maxExpenseAmount: {
        type: Number,
        min: 0,
        default: null // null = unlimited
      },
      maxPaymentAmount: {
        type: Number,
        min: 0, 
        default: null
      },
      requireApprovalOver: {
        type: Number,
        min: 0,
        default: null // Amount requiring approval
      }
    }
  },

  // Role hierarchy (lower number = higher authority)
  hierarchy: {
    type: Number,
    required: true,
    min: 1,
    max: 100
  },
  
  // System role cannot be deleted/modified
  isSystemRole: {
    type: Boolean,
    default: false
  },
  
  // Active status
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  
  // Role color for UI display
  color: {
    type: String,
    default: '#6B7280',
    match: /^#[0-9A-F]{6}$/i
  },
  
  // Default role for new users
  isDefault: {
    type: Boolean,
    default: false
  },
  
  // Audit fields
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
  
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
roleSchema.index({ name: 1 });
roleSchema.index({ hierarchy: 1 });
roleSchema.index({ isActive: 1 });
roleSchema.index({ isDefault: 1 });

// Virtual for user count
roleSchema.virtual('userCount', {
  ref: 'User',
  localField: '_id',
  foreignField: 'role',
  count: true
});

// Instance methods
roleSchema.methods.hasPermission = function(module, action) {
  const modulePermission = this.permissions.find(p => p.module === module);
  return modulePermission ? modulePermission.actions.includes(action) : false;
};

roleSchema.methods.addPermission = function(module, action) {
  let modulePermission = this.permissions.find(p => p.module === module);
  
  if (!modulePermission) {
    modulePermission = { module, actions: [] };
    this.permissions.push(modulePermission);
  }
  
  if (!modulePermission.actions.includes(action)) {
    modulePermission.actions.push(action);
  }
  
  return this.save();
};

roleSchema.methods.removePermission = function(module, action) {
  const modulePermission = this.permissions.find(p => p.module === module);
  
  if (modulePermission) {
    modulePermission.actions = modulePermission.actions.filter(a => a !== action);
    
    // Remove module if no actions left
    if (modulePermission.actions.length === 0) {
      this.permissions = this.permissions.filter(p => p.module !== module);
    }
  }
  
  return this.save();
};

roleSchema.methods.canAccessData = function(scope) {
  return this.restrictions.dataAccess[scope] === true;
};

roleSchema.methods.isWithinLimits = function(resource, currentCount) {
  const limit = this.restrictions[`${resource}Limit`];
  return limit === null || currentCount < limit;
};

// Static methods
roleSchema.statics.getDefaultRole = function() {
  return this.findOne({ isDefault: true, isActive: true });
};

roleSchema.statics.getRoleByHierarchy = function(maxHierarchy) {
  return this.find({ 
    hierarchy: { $lte: maxHierarchy },
    isActive: true 
  }).sort({ hierarchy: 1 });
};

roleSchema.statics.seedDefaultRoles = async function() {
  const defaultRoles = [
    {
      name: 'super_admin',
      displayName: 'Super Administrator',
      description: 'Full system access with all permissions',
      permissions: [
        { module: 'properties', actions: ['create', 'read', 'update', 'delete', 'bulk_update', 'bulk_delete'] },
        { module: 'units', actions: ['create', 'read', 'update', 'delete', 'assign'] },
        { module: 'tenants', actions: ['create', 'read', 'update', 'delete', 'verify', 'bulk_update'] },
        { module: 'payments', actions: ['create', 'read', 'update', 'delete', 'approve', 'export'] },
        { module: 'expenses', actions: ['create', 'read', 'update', 'delete', 'approve', 'export'] },
        { module: 'reports', actions: ['read', 'export'] },
        { module: 'maintenance', actions: ['create', 'read', 'update', 'delete', 'assign'] },
        { module: 'users', actions: ['create', 'read', 'update', 'delete'] },
        { module: 'settings', actions: ['read', 'update'] },
        { module: 'system', actions: ['read', 'update'] }
      ],
      restrictions: {
        dataAccess: { all: true },
        featureAccess: {
          bnbManagement: true,
          recurringExpenses: true,
          bulkOperations: true,
          apiAccess: true,
          dataExport: true,
          systemSettings: true,
          userManagement: true,
          roleManagement: true
        }
      },
      hierarchy: 1,
      isSystemRole: true,
      color: '#DC2626'
    },
    
    {
      name: 'admin',
      displayName: 'Administrator',
      description: 'Administrative access with most permissions',
      permissions: [
        { module: 'properties', actions: ['create', 'read', 'update', 'delete'] },
        { module: 'units', actions: ['create', 'read', 'update', 'delete', 'assign'] },
        { module: 'tenants', actions: ['create', 'read', 'update', 'verify'] },
        { module: 'payments', actions: ['create', 'read', 'update', 'approve', 'export'] },
        { module: 'expenses', actions: ['create', 'read', 'update', 'approve', 'export'] },
        { module: 'reports', actions: ['read', 'export'] },
        { module: 'maintenance', actions: ['create', 'read', 'update', 'assign'] },
        { module: 'users', actions: ['create', 'read', 'update'] }
      ],
      restrictions: {
        dataAccess: { all: true },
        reportsAccess: [
          'financial_summary', 'occupancy_report', 'tenant_payments', 
          'property_performance', 'expense_analysis', 'revenue_trends'
        ],
        featureAccess: {
          bnbManagement: true,
          recurringExpenses: true,
          bulkOperations: true,
          dataExport: true,
          userManagement: true
        }
      },
      hierarchy: 2,
      isSystemRole: true,
      color: '#DC2626'
    },
    
    {
      name: 'property_manager',
      displayName: 'Property Manager',
      description: 'Manages assigned properties and their operations',
      permissions: [
        { module: 'properties', actions: ['read', 'update'] },
        { module: 'units', actions: ['create', 'read', 'update'] },
        { module: 'tenants', actions: ['create', 'read', 'update'] },
        { module: 'payments', actions: ['create', 'read', 'update'] },
        { module: 'expenses', actions: ['create', 'read'] },
        { module: 'reports', actions: ['read'] },
        { module: 'maintenance', actions: ['create', 'read', 'update', 'assign'] }
      ],
      restrictions: {
        dataAccess: { assigned: true },
        reportsAccess: ['occupancy_report', 'tenant_payments', 'property_performance', 'maintenance_reports'],
        featureAccess: {
          bnbManagement: true,
          dataExport: false
        },
        amountLimits: {
          maxExpenseAmount: 50000, // KES 50,000
          requireApprovalOver: 20000 // KES 20,000
        }
      },
      hierarchy: 3,
      isSystemRole: true,
      color: '#059669'
    },
    
    {
      name: 'accountant',
      displayName: 'Accountant',
      description: 'Manages financial operations and reporting',
      permissions: [
        { module: 'properties', actions: ['read'] },
        { module: 'units', actions: ['read'] },
        { module: 'tenants', actions: ['read'] },
        { module: 'payments', actions: ['create', 'read', 'update', 'approve', 'export'] },
        { module: 'expenses', actions: ['create', 'read', 'update', 'approve', 'export'] },
        { module: 'reports', actions: ['read', 'export'] }
      ],
      restrictions: {
        dataAccess: { all: true },
        reportsAccess: [
          'financial_summary', 'expense_analysis', 'revenue_trends', 
          'cash_flow', 'profit_loss', 'tenant_payments'
        ],
        featureAccess: {
          dataExport: true,
          recurringExpenses: true
        }
      },
      hierarchy: 4,
      isSystemRole: true,
      color: '#7C3AED'
    },
    
    {
      name: 'maintenance',
      displayName: 'Maintenance Staff',
      description: 'Handles maintenance requests and property upkeep',
      permissions: [
        { module: 'properties', actions: ['read'] },
        { module: 'units', actions: ['read', 'update'] },
        { module: 'tenants', actions: ['read'] },
        { module: 'maintenance', actions: ['create', 'read', 'update'] },
        { module: 'expenses', actions: ['create', 'read'] }
      ],
      restrictions: {
        dataAccess: { assigned: true },
        reportsAccess: ['maintenance_reports'],
        amountLimits: {
          maxExpenseAmount: 10000, // KES 10,000
          requireApprovalOver: 5000 // KES 5,000
        }
      },
      hierarchy: 5,
      isSystemRole: true,
      color: '#EA580C'
    },
    
    {
      name: 'staff',
      displayName: 'Staff Member',
      description: 'Basic operational access',
      permissions: [
        { module: 'properties', actions: ['read'] },
        { module: 'units', actions: ['read'] },
        { module: 'tenants', actions: ['read', 'update'] },
        { module: 'payments', actions: ['read'] },
      ],
      restrictions: {
        dataAccess: { assigned: true },
        reportsAccess: ['occupancy_report'],
        amountLimits: {
          maxExpenseAmount: 5000, // KES 5,000
          requireApprovalOver: 2000 // KES 2,000
        }
      },
      hierarchy: 6,
      isSystemRole: true,
      color: '#6B7280'
    },
    
    {
      name: 'tenant',
      displayName: 'Tenant',
      description: 'Tenant portal access with limited permissions',
      permissions: [
        { module: 'payments', actions: ['read'] },
        { module: 'maintenance', actions: ['create', 'read'] },
        { module: 'tenants', actions: ['read'] } // Can view own profile only
      ],
      restrictions: {
        dataAccess: { own: true },
        reportsAccess: [],
        featureAccess: {
          bnbManagement: false,
          recurringExpenses: false,
          bulkOperations: false,
          apiAccess: false,
          dataExport: false,
          systemSettings: false,
          userManagement: false,
          roleManagement: false
        }
      },
      hierarchy: 10,
      isSystemRole: true,
      isDefault: true,
      color: '#10B981'
    }
  ];

  for (const roleData of defaultRoles) {
    await this.findOneAndUpdate(
      { name: roleData.name },
      roleData,
      { upsert: true, new: true }
    );
  }
  
  console.log('Default roles seeded successfully');
};

// Validate permissions before save
roleSchema.pre('save', function(next) {
  // Ensure hierarchy is within valid range
  if (this.hierarchy < 1 || this.hierarchy > 100) {
    return next(new Error('Hierarchy must be between 1 and 100'));
  }
  
  // Validate that only one role can be default
  if (this.isDefault && this.isModified('isDefault')) {
    this.constructor.updateMany(
      { _id: { $ne: this._id } },
      { isDefault: false }
    ).exec();
  }
  
  next();
});

// Post-save middleware
roleSchema.post('save', function(doc) {
  console.log(`Role ${doc.name} saved with hierarchy ${doc.hierarchy}`);
});

// Pre-remove middleware
roleSchema.pre('remove', async function(next) {
  // Prevent deletion of system roles
  if (this.isSystemRole) {
    return next(new Error('Cannot delete system roles'));
  }
  
  // Check if any users have this role
  const User = mongoose.model('User');
  const userCount = await User.countDocuments({ role: this._id });
  
  if (userCount > 0) {
    return next(new Error(`Cannot delete role with ${userCount} assigned users`));
  }
  
  next();
});

const Role = mongoose.model('Role', roleSchema);

export default Role;