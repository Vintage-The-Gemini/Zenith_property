// backend/controllers/tenantController.js
import Tenant from '../models/Tenant.js';
import Unit from '../models/Unit.js';
import Lease from '../models/Lease.js';
import Payment from '../models/Payment.js';
import Property from '../models/Property.js';
import mongoose from 'mongoose';
import logger from '../utils/logger.js';
import bcrypt from 'bcryptjs';

/**
 * Create a new tenant with proper lifecycle tracking
 */
export const createTenant = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const tenantData = {
      ...req.body,
      status: 'prospective', // Start as prospective
      tenancyLifecycle: {
        status: 'prospective',
        applicationDate: new Date(),
        transitions: [{
          from: null,
          to: 'prospective',
          date: new Date(),
          reason: 'Initial application',
          performedBy: req.user?.id
        }]
      },
      currentBalance: 0,
      paymentHistory: [],
      documents: []
    };

    // Hash password if provided for tenant portal access
    if (tenantData.password) {
      const salt = await bcrypt.genSalt(10);
      tenantData.password = await bcrypt.hash(tenantData.password, salt);
    }

    // Handle document uploads
    if (req.files) {
      tenantData.documents = await this.processDocumentUploads(req.files);
    }

    const tenant = new Tenant(tenantData);
    await tenant.save({ session });

    // Create tenant activity log
    await this.createTenantActivity(tenant._id, 'created', 'Tenant record created', req.user?.id, session);

    await session.commitTransaction();
    
    // Return tenant without sensitive data
    const { password, ...tenantResponse } = tenant.toObject();
    res.status(201).json(tenantResponse);

  } catch (error) {
    await session.abortTransaction();
    logger.error(`Error creating tenant: ${error.message}`);
    res.status(400).json({ error: error.message });
  } finally {
    session.endSession();
  }
};

/**
 * Get all tenants with filtering and pagination
 */
export const getTenants = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      propertyId,
      unitId,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      includeDocuments = false
    } = req.query;

    // Build filter object
    const filter = {};
    
    if (status) filter.status = status;
    if (unitId) filter.currentUnit = unitId;
    
    // Property filter - find units in property first
    if (propertyId) {
      const units = await Unit.find({ propertyId }).distinct('_id');
      filter.currentUnit = { $in: units };
    }

    // Search filter
    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { nationalId: { $regex: search, $options: 'i' } }
      ];
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Build query
    let query = Tenant.find(filter);
    
    // Conditionally include documents
    if (!includeDocuments) {
      query = query.select('-documents -password');
    } else {
      query = query.select('-password');
    }

    // Execute query with population
    const [tenants, total] = await Promise.all([
      query
        .populate('currentUnit', 'unitNumber floor type status')
        .populate('currentUnit.propertyId', 'name address')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit)),
      Tenant.countDocuments(filter)
    ]);

    // Get summary statistics
    const summary = await Tenant.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalBalance: { $sum: '$currentBalance' }
        }
      }
    ]);

    const statusSummary = summary.reduce((acc, item) => {
      acc[item._id] = {
        count: item.count,
        totalBalance: item.totalBalance
      };
      return acc;
    }, {});

    res.json({
      tenants,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      },
      summary: statusSummary
    });

  } catch (error) {
    logger.error(`Error fetching tenants: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get single tenant with full details
 */
export const getTenantById = async (req, res) => {
  try {
    const { id } = req.params;
    const { includePaymentHistory = true, includeDocuments = true } = req.query;

    let selectFields = '-password';
    if (!includeDocuments) selectFields += ' -documents';

    const tenant = await Tenant.findById(id)
      .select(selectFields)
      .populate('currentUnit')
      .populate('currentUnit.propertyId', 'name address')
      .populate('previousUnits.unit', 'unitNumber floor');

    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    // Get active lease
    const activeLease = await Lease.findOne({
      tenant: id,
      status: 'active'
    }).populate('property', 'name').populate('unit', 'unitNumber floor');

    // Get payment history if requested
    let paymentHistory = [];
    if (includePaymentHistory) {
      paymentHistory = await Payment.find({ tenant: id })
        .sort({ paymentDate: -1 })
        .limit(20)
        .select('amount paymentDate type status reference paymentMethod');
    }

    // Get recent activities
    const activities = await TenantActivity.find({ tenant: id })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('performedBy', 'firstName lastName');

    res.json({
      tenant,
      activeLease,
      paymentHistory,
      activities
    });

  } catch (error) {
    logger.error(`Error fetching tenant: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Update tenant information
 */
export const updateTenant = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id } = req.params;
    const updates = req.body;

    const tenant = await Tenant.findById(id).session(session);
    if (!tenant) {
      throw new Error('Tenant not found');
    }

    // Track what fields are being updated
    const updatedFields = [];
    const originalData = {};

    // Process updates
    Object.keys(updates).forEach(key => {
      if (key !== '_id' && key !== 'password' && updates[key] !== tenant[key]) {
        originalData[key] = tenant[key];
        tenant[key] = updates[key];
        updatedFields.push(key);
      }
    });

    // Handle password update separately
    if (updates.password) {
      const salt = await bcrypt.genSalt(10);
      tenant.password = await bcrypt.hash(updates.password, salt);
      updatedFields.push('password');
    }

    // Handle document uploads
    if (req.files && req.files.length > 0) {
      const newDocuments = await this.processDocumentUploads(req.files);
      tenant.documents.push(...newDocuments);
      updatedFields.push('documents');
    }

    tenant.updatedAt = new Date();
    await tenant.save({ session });

    // Create activity log
    await this.createTenantActivity(
      id,
      'updated',
      `Updated fields: ${updatedFields.join(', ')}`,
      req.user?.id,
      session,
      { originalData, updatedFields }
    );

    await session.commitTransaction();

    // Return updated tenant without password
    const { password, ...tenantResponse } = tenant.toObject();
    res.json(tenantResponse);

  } catch (error) {
    await session.abortTransaction();
    logger.error(`Error updating tenant: ${error.message}`);
    res.status(400).json({ error: error.message });
  } finally {
    session.endSession();
  }
};

/**
 * Update tenant status with lifecycle management
 */
export const updateTenantStatus = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id } = req.params;
    const { status, reason, unitId, moveOutDate, moveInDate, notes } = req.body;
    
    const tenant = await Tenant.findById(id).session(session);
    if (!tenant) {
      throw new Error('Tenant not found');
    }

    const previousStatus = tenant.status;

    // Validate status transition
    const validTransitions = this.getValidStatusTransitions(previousStatus);
    if (!validTransitions.includes(status)) {
      throw new Error(`Invalid status transition from ${previousStatus} to ${status}`);
    }

    // Handle move-out process
    if (status === 'past' && previousStatus === 'active') {
      await this.handleTenantMoveOut(tenant, unitId, moveOutDate, reason, session);
    }

    // Handle move-in process
    if (status === 'active' && previousStatus !== 'active') {
      await this.handleTenantMoveIn(tenant, unitId, moveInDate, session);
    }

    // Handle approval process
    if (status === 'approved' && previousStatus === 'prospective') {
      await this.handleTenantApproval(tenant, session);
    }

    // Handle blacklisting
    if (status === 'blacklisted') {
      await this.handleTenantBlacklisting(tenant, reason, session);
    }

    // Update tenant status and lifecycle
    tenant.status = status;
    tenant.tenancyLifecycle.status = status;
    tenant.tenancyLifecycle.transitions.push({
      from: previousStatus,
      to: status,
      date: new Date(),
      reason: reason || `Status changed to ${status}`,
      performedBy: req.user?.id,
      notes: notes
    });

    // Status-specific updates
    if (status === 'past') {
      tenant.tenancyLifecycle.moveOutDate = moveOutDate || new Date();
      tenant.tenancyLifecycle.finalBalance = tenant.currentBalance || 0;
      tenant.endDate = moveOutDate || new Date();
    }

    if (status === 'active') {
      tenant.tenancyLifecycle.moveInDate = moveInDate || new Date();
      tenant.startDate = moveInDate || new Date();
    }

    await tenant.save({ session });

    // Create activity log
    await this.createTenantActivity(
      id,
      'status_changed',
      `Status changed from ${previousStatus} to ${status}. Reason: ${reason}`,
      req.user?.id,
      session
    );

    await session.commitTransaction();

    res.json({
      success: true,
      tenant,
      transition: {
        from: previousStatus,
        to: status,
        date: new Date(),
        reason
      }
    });

  } catch (error) {
    await session.abortTransaction();
    logger.error(`Error updating tenant status: ${error.message}`);
    res.status(400).json({ error: error.message });
  } finally {
    session.endSession();
  }
};

/**
 * Upload tenant document
 */
export const uploadTenantDocument = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id } = req.params;
    const { documentType, notes } = req.body;

    if (!req.file) {
      throw new Error('No file uploaded');
    }

    const tenant = await Tenant.findById(id).session(session);
    if (!tenant) {
      throw new Error('Tenant not found');
    }

    const document = {
      type: documentType,
      name: req.file.originalname,
      path: req.file.path,
      uploadDate: new Date(),
      verified: false,
      notes: notes,
      uploadedBy: req.user?.id
    };

    tenant.documents.push(document);
    await tenant.save({ session });

    // Create activity log
    await this.createTenantActivity(
      id,
      'document_uploaded',
      `Uploaded ${documentType}: ${req.file.originalname}`,
      req.user?.id,
      session
    );

    await session.commitTransaction();

    res.status(201).json({
      success: true,
      document,
      message: 'Document uploaded successfully'
    });

  } catch (error) {
    await session.abortTransaction();
    logger.error(`Error uploading tenant document: ${error.message}`);
    res.status(400).json({ error: error.message });
  } finally {
    session.endSession();
  }
};

/**
 * Verify tenant document
 */
export const verifyTenantDocument = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id, documentId } = req.params;
    const { verified, notes } = req.body;

    const tenant = await Tenant.findById(id).session(session);
    if (!tenant) {
      throw new Error('Tenant not found');
    }

    const document = tenant.documents.id(documentId);
    if (!document) {
      throw new Error('Document not found');
    }

    document.verified = verified;
    document.verificationDate = new Date();
    document.verifiedBy = req.user?.id;
    if (notes) document.verificationNotes = notes;

    await tenant.save({ session });

    // Create activity log
    await this.createTenantActivity(
      id,
      'document_verified',
      `Document ${document.name} ${verified ? 'verified' : 'rejected'}`,
      req.user?.id,
      session
    );

    await session.commitTransaction();

    res.json({
      success: true,
      document,
      message: `Document ${verified ? 'verified' : 'rejected'} successfully`
    });

  } catch (error) {
    await session.abortTransaction();
    logger.error(`Error verifying tenant document: ${error.message}`);
    res.status(400).json({ error: error.message });
  } finally {
    session.endSession();
  }
};

/**
 * Delete tenant (soft delete)
 */
export const deleteTenant = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id } = req.params;
    const { reason, confirmDeletion } = req.body;

    if (!confirmDeletion) {
      throw new Error('Deletion confirmation required');
    }

    const tenant = await Tenant.findById(id).session(session);
    if (!tenant) {
      throw new Error('Tenant not found');
    }

    // Check for active dependencies
    const [activeLease, recentPayments] = await Promise.all([
      Lease.findOne({ tenant: id, status: 'active' }),
      Payment.countDocuments({ 
        tenant: id, 
        paymentDate: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } 
      })
    ]);

    if (activeLease) {
      throw new Error('Cannot delete tenant with active lease');
    }

    if (recentPayments > 0) {
      throw new Error('Cannot delete tenant with recent payments');
    }

    // Soft delete
    tenant.status = 'deleted';
    tenant.deletedAt = new Date();
    tenant.deletedBy = req.user?.id;
    tenant.deletionReason = reason;

    await tenant.save({ session });

    // Create activity log
    await this.createTenantActivity(
      id,
      'deleted',
      `Tenant deleted. Reason: ${reason}`,
      req.user?.id,
      session
    );

    await session.commitTransaction();

    res.json({
      success: true,
      message: 'Tenant deleted successfully',
      tenantId: id
    });

  } catch (error) {
    await session.abortTransaction();
    logger.error(`Error deleting tenant: ${error.message}`);
    res.status(400).json({ error: error.message });
  } finally {
    session.endSession();
  }
};

/**
 * Get tenant payment summary
 */
export const getTenantPaymentSummary = async (req, res) => {
  try {
    const { id } = req.params;
    const { months = 12 } = req.query;

    const tenant = await Tenant.findById(id);
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - parseInt(months));

    // Get payments
    const payments = await Payment.find({
      tenant: id,
      paymentDate: { $gte: startDate },
      status: 'completed'
    }).sort({ paymentDate: -1 });

    // Calculate summary
    const summary = {
      currentBalance: tenant.currentBalance || 0,
      totalPaid: payments.reduce((sum, p) => sum + p.amount, 0),
      paymentCount: payments.length,
      averagePayment: 0,
      lastPaymentDate: payments[0]?.paymentDate,
      lastPaymentAmount: payments[0]?.amount,
      paymentHistory: payments.slice(0, 10), // Last 10 payments
      monthlyBreakdown: {}
    };

    summary.averagePayment = summary.paymentCount > 0 ? summary.totalPaid / summary.paymentCount : 0;

    // Monthly breakdown
    payments.forEach(payment => {
      const monthKey = `${payment.paymentDate.getFullYear()}-${payment.paymentDate.getMonth() + 1}`;
      if (!summary.monthlyBreakdown[monthKey]) {
        summary.monthlyBreakdown[monthKey] = {
          total: 0,
          count: 0,
          payments: []
        };
      }
      summary.monthlyBreakdown[monthKey].total += payment.amount;
      summary.monthlyBreakdown[monthKey].count += 1;
      summary.monthlyBreakdown[monthKey].payments.push({
        amount: payment.amount,
        date: payment.paymentDate,
        type: payment.type,
        method: payment.paymentMethod
      });
    });

    res.json(summary);

  } catch (error) {
    logger.error(`Error fetching tenant payment summary: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
};

// Helper Methods

/**
 * Handle tenant move-out process
 */
const handleTenantMoveOut = async (tenant, unitId, moveOutDate, reason, session) => {
  // Clear unit occupancy
  if (tenant.currentUnit) {
    await Unit.findByIdAndUpdate(
      tenant.currentUnit,
      {
        status: 'available',
        $unset: { currentTenant: 1 },
        lastVacatedDate: moveOutDate || new Date(),
        moveOutReason: reason
      },
      { session }
    );
  }

  // Terminate active lease
  await Lease.findOneAndUpdate(
    { tenant: tenant._id, status: 'active' },
    {
      status: 'terminated',
      actualEndDate: moveOutDate || new Date(),
      terminationReason: reason || 'Tenant moved out',
      terminationDate: new Date()
    },
    { session }
  );

  // Update tenant unit history
  if (tenant.currentUnit) {
    tenant.previousUnits = tenant.previousUnits || [];
    tenant.previousUnits.push({
      unit: tenant.currentUnit,
      moveInDate: tenant.tenancyLifecycle.moveInDate,
      moveOutDate: moveOutDate || new Date(),
      finalBalance: tenant.currentBalance || 0,
      moveOutReason: reason
    });
  }

  // Clear current unit from tenant
  tenant.currentUnit = null;
};

/**
 * Handle tenant move-in process
 */
const handleTenantMoveIn = async (tenant, unitId, moveInDate, session) => {
  if (unitId) {
    // Check unit availability
    const unit = await Unit.findById(unitId).session(session);
    if (!unit || unit.status !== 'available') {
      throw new Error('Unit is not available for occupancy');
    }

    // Update unit
    await Unit.findByIdAndUpdate(
      unitId,
      {
        status: 'occupied',
        currentTenant: tenant._id,
        lastOccupiedDate: moveInDate || new Date(),
        moveInDate: moveInDate || new Date()
      },
      { session }
    );

    // Update tenant
    tenant.currentUnit = unitId;
    tenant.tenancyLifecycle.moveInDate = moveInDate || new Date();
  }
};

/**
 * Handle tenant approval process
 */
const handleTenantApproval = async (tenant, session) => {
  // Set approval metadata
  tenant.approvalDate = new Date();
  tenant.tenancyLifecycle.approvalDate = new Date();
  
  // Initialize payment tracking
  tenant.paymentPerformance = {
    totalPayments: 0,
    onTimePayments: 0,
    onTimeRate: 0
  };
};

/**
 * Handle tenant blacklisting
 */
const handleTenantBlacklisting = async (tenant, reason, session) => {
  // Set blacklist metadata
  tenant.blacklistDate = new Date();
  tenant.blacklistReason = reason;
  
  // Clear current unit if occupied
  if (tenant.currentUnit) {
    await Unit.findByIdAndUpdate(
      tenant.currentUnit,
      {
        status: 'available',
        $unset: { currentTenant: 1 },
        lastVacatedDate: new Date()
      },
      { session }
    );
    
    tenant.currentUnit = null;
  }

  // Terminate any active leases
  await Lease.updateMany(
    { tenant: tenant._id, status: 'active' },
    {
      status: 'terminated',
      actualEndDate: new Date(),
      terminationReason: `Tenant blacklisted: ${reason}`,
      terminationDate: new Date()
    },
    { session }
  );
};

/**
 * Get valid status transitions
 */
const getValidStatusTransitions = (currentStatus) => {
  const transitions = {
    'prospective': ['approved', 'rejected', 'deleted'],
    'approved': ['active', 'rejected', 'deleted'],
    'active': ['past', 'blacklisted', 'deleted'],
    'past': ['blacklisted', 'deleted'],
    'rejected': ['prospective', 'deleted'],
    'blacklisted': ['deleted'],
    'deleted': []
  };

  return transitions[currentStatus] || [];
};

/**
 * Process document uploads
 */
const processDocumentUploads = async (files) => {
  const documents = [];
  
  for (const file of files) {
    documents.push({
      type: file.fieldname || 'other',
      name: file.originalname,
      path: file.path,
      size: file.size,
      mimeType: file.mimetype,
      uploadDate: new Date(),
      verified: false
    });
  }
  
  return documents;
};

/**
 * Create tenant activity log
 */
const createTenantActivity = async (tenantId, action, description, performedBy, session, metadata = {}) => {
  const TenantActivity = mongoose.model('TenantActivity');
  
  const activity = new TenantActivity({
    tenant: tenantId,
    action,
    description,
    performedBy,
    metadata,
    timestamp: new Date()
  });

  await activity.save({ session });
  return activity;
};

export default {
  createTenant,
  getTenants,
  getTenantById,
  updateTenant,
  updateTenantStatus,
  uploadTenantDocument,
  verifyTenantDocument,
  deleteTenant,
  getTenantPaymentSummary
};