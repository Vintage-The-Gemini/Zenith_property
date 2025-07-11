// backend/controllers/propertyController.js
import Property from '../models/Property.js';
import Unit from '../models/Unit.js';
import Tenant from '../models/Tenant.js';
import Lease from '../models/Lease.js';
import Payment from '../models/Payment.js';
import Expense from '../models/Expense.js';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import logger from '../utils/logger.js';

/**
 * Get all properties with filtering and pagination
 */
export const getProperties = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      type,
      status,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter
    const filter = {};
    
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { 'address.street': { $regex: search, $options: 'i' } },
        { 'address.city': { $regex: search, $options: 'i' } }
      ];
    }

    if (type) filter.propertyType = type;
    if (status) filter.status = status;

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const [properties, total] = await Promise.all([
      Property.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .populate('createdBy', 'firstName lastName'),
      Property.countDocuments(filter)
    ]);

    // Get unit counts for each property
    const propertiesWithCounts = await Promise.all(
      properties.map(async (property) => {
        const unitCounts = await Unit.aggregate([
          { $match: { propertyId: property._id } },
          {
            $group: {
              _id: '$status',
              count: { $sum: 1 }
            }
          }
        ]);

        const counts = {
          total: 0,
          available: 0,
          occupied: 0,
          maintenance: 0
        };

        unitCounts.forEach(item => {
          counts.total += item.count;
          counts[item._id] = item.count;
        });

        return {
          ...property.toObject(),
          unitCounts: counts
        };
      })
    );

    res.json({
      properties: propertiesWithCounts,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });

  } catch (error) {
    logger.error(`Error fetching properties: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get single property with detailed information
 */
export const getPropertyById = async (req, res) => {
  try {
    const { id } = req.params;

    const property = await Property.findById(id)
      .populate('createdBy', 'firstName lastName');

    if (!property) {
      return res.status(404).json({ error: 'Property not found' });
    }

    // Get units
    const units = await Unit.find({ propertyId: id })
      .populate('occupancy.currentTenant', 'firstName lastName email phone');

    // Get financial summary
    const financialSummary = await getPropertyFinancialSummary(id);

    res.json({
      property,
      units,
      financialSummary
    });

  } catch (error) {
    logger.error(`Error fetching property: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Create new property
 */
export const createProperty = async (req, res) => {
  try {
    const propertyData = {
      ...req.body,
      createdBy: req.user?.id
    };

    const property = new Property(propertyData);
    await property.save();

    res.status(201).json({
      success: true,
      property,
      message: 'Property created successfully'
    });

  } catch (error) {
    logger.error(`Error creating property: ${error.message}`);
    res.status(400).json({ error: error.message });
  }
};

/**
 * Update property
 */
export const updateProperty = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const property = await Property.findById(id);
    if (!property) {
      return res.status(404).json({ error: 'Property not found' });
    }

    // Update fields
    Object.keys(updates).forEach(key => {
      if (key !== '_id') {
        property[key] = updates[key];
      }
    });

    property.updatedBy = req.user?.id;
    await property.save();

    res.json({
      success: true,
      property,
      message: 'Property updated successfully'
    });

  } catch (error) {
    logger.error(`Error updating property: ${error.message}`);
    res.status(400).json({ error: error.message });
  }
};

/**
 * Delete property with comprehensive safety checks
 */
export const deleteProperty = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id } = req.params;
    const { confirmDeletion, password, force = false } = req.body;

    // Validation checks
    if (!confirmDeletion) {
      return res.status(400).json({ 
        error: 'Deletion confirmation required',
        message: 'You must confirm this action by setting confirmDeletion to true'
      });
    }

    // Verify user password for security
    if (password) {
      const user = await User.findById(req.user.id);
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ error: 'Invalid password confirmation' });
      }
    }

    const property = await Property.findById(id).session(session);
    if (!property) {
      return res.status(404).json({ error: 'Property not found' });
    }

    // Check for dependencies
    const dependencies = await checkPropertyDependencies(id);
    
    if (dependencies.hasBlockingDependencies && !force) {
      return res.status(400).json({
        error: 'Cannot delete property with active dependencies',
        dependencies,
        message: 'Please resolve all dependencies first, or use force=true to proceed'
      });
    }

    // Perform soft delete
    property.status = 'deleted';
    property.deletedAt = new Date();
    property.deletedBy = req.user.id;
    await property.save({ session });

    // Archive or clean up related data if forced
    if (force) {
      await handleForceDeletion(id, session);
    }

    await session.commitTransaction();

    res.json({ 
      success: true,
      message: 'Property deleted successfully',
      propertyId: id,
      dependencies: dependencies
    });

  } catch (error) {
    await session.abortTransaction();
    logger.error(`Error deleting property: ${error.message}`);
    res.status(500).json({ error: error.message });
  } finally {
    session.endSession();
  }
};

/**
 * Get property dashboard data
 */
export const getPropertyDashboard = async (req, res) => {
  try {
    const { id } = req.params;
    const { period = '30' } = req.query; // days

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period));

    // Get property with basic info
    const property = await Property.findById(id);
    if (!property) {
      return res.status(404).json({ error: 'Property not found' });
    }

    // Parallel data fetching
    const [
      unitStats,
      recentPayments,
      recentExpenses,
      tenantStats,
      financialSummary
    ] = await Promise.all([
      getUnitStatistics(id),
      getRecentPayments(id, startDate),
      getRecentExpenses(id, startDate),
      getTenantStatistics(id),
      getPropertyFinancialSummary(id, startDate)
    ]);

    res.json({
      property: {
        id: property._id,
        name: property.name,
        address: property.address,
        propertyType: property.propertyType
      },
      unitStats,
      tenantStats,
      financialSummary,
      recentActivity: {
        payments: recentPayments,
        expenses: recentExpenses
      },
      period: `${period} days`
    });

  } catch (error) {
    logger.error(`Error fetching property dashboard: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
};

// Helper Functions

/**
 * Check property dependencies before deletion
 */
async function checkPropertyDependencies(propertyId) {
  const [units, activeLeases, activePayments, recentExpenses] = await Promise.all([
    Unit.find({ propertyId }),
    Lease.countDocuments({ property: propertyId, status: 'active' }),
    Payment.countDocuments({ 
      property: propertyId, 
      status: { $in: ['pending', 'processing'] }
    }),
    Expense.countDocuments({ 
      property: propertyId, 
      paymentStatus: 'pending',
      createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
    })
  ]);

  const occupiedUnits = units.filter(unit => unit.status === 'occupied').length;
  const activeTenants = await Tenant.countDocuments({
    currentUnit: { $in: units.map(u => u._id) },
    status: 'active'
  });

  const hasBlockingDependencies = 
    occupiedUnits > 0 || 
    activeLeases > 0 || 
    activeTenants > 0 || 
    activePayments > 0;

  return {
    hasBlockingDependencies,
    details: {
      totalUnits: units.length,
      occupiedUnits,
      activeTenants,
      activeLeases,
      pendingPayments: activePayments,
      recentExpenses
    },
    warnings: [
      ...(occupiedUnits > 0 ? [`${occupiedUnits} units are currently occupied`] : []),
      ...(activeTenants > 0 ? [`${activeTenants} active tenants will be affected`] : []),
      ...(activeLeases > 0 ? [`${activeLeases} active leases will be terminated`] : []),
      ...(activePayments > 0 ? [`${activePayments} pending payments will be cancelled`] : [])
    ]
  };
}

/**
 * Handle forced deletion with cleanup
 */
async function handleForceDeletion(propertyId, session) {
  // Get all units for this property
  const units = await Unit.find({ propertyId }).session(session);
  const unitIds = units.map(u => u._id);

  // Terminate active leases
  await Lease.updateMany(
    { property: propertyId, status: 'active' },
    { 
      status: 'terminated',
      actualEndDate: new Date(),
      terminationReason: 'Property deleted'
    },
    { session }
  );

  // Update tenants to past status
  await Tenant.updateMany(
    { currentUnit: { $in: unitIds }, status: 'active' },
    { 
      status: 'past',
      currentUnit: null,
      'tenancyLifecycle.moveOutDate': new Date()
    },
    { session }
  );

  // Cancel pending payments
  await Payment.updateMany(
    { property: propertyId, status: 'pending' },
    { status: 'cancelled' },
    { session }
  );

  // Mark units as deleted
  await Unit.updateMany(
    { propertyId },
    { 
      status: 'out_of_service',
      deletedAt: new Date()
    },
    { session }
  );
}

/**
 * Get unit statistics for property
 */
async function getUnitStatistics(propertyId) {
  const stats = await Unit.aggregate([
    { $match: { propertyId: mongoose.Types.ObjectId(propertyId) } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);

  const result = {
    total: 0,
    available: 0,
    occupied: 0,
    maintenance: 0,
    reserved: 0
  };

  stats.forEach(stat => {
    result.total += stat.count;
    result[stat._id] = stat.count;
  });

  result.occupancyRate = result.total > 0 ? 
    Math.round((result.occupied / result.total) * 100) : 0;

  return result;
}

/**
 * Get tenant statistics for property
 */
async function getTenantStatistics(propertyId) {
  const units = await Unit.find({ propertyId }).distinct('_id');
  
  const stats = await Tenant.aggregate([
    { $match: { currentUnit: { $in: units } } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);

  const result = {
    total: 0,
    active: 0,
    prospective: 0,
    past: 0
  };

  stats.forEach(stat => {
    result.total += stat.count;
    result[stat._id] = stat.count;
  });

  return result;
}

/**
 * Get recent payments for property
 */
async function getRecentPayments(propertyId, startDate) {
  return await Payment.find({
    property: propertyId,
    paymentDate: { $gte: startDate }
  })
  .populate('tenant', 'firstName lastName')
  .sort({ paymentDate: -1 })
  .limit(10)
  .select('amount paymentDate type status reference tenant');
}

/**
 * Get recent expenses for property
 */
async function getRecentExpenses(propertyId, startDate) {
  return await Expense.find({
    property: propertyId,
    date: { $gte: startDate },
    deleted: { $ne: true }
  })
  .sort({ date: -1 })
  .limit(10)
  .select('amount date category description paymentStatus');
}

/**
 * Get financial summary for property
 */
async function getPropertyFinancialSummary(propertyId, startDate = null) {
  const dateFilter = startDate ? { $gte: startDate } : {};
  
  const [paymentsResult, expensesResult] = await Promise.all([
    Payment.aggregate([
      { 
        $match: { 
          property: mongoose.Types.ObjectId(propertyId),
          status: 'completed',
          ...(startDate && { paymentDate: dateFilter })
        }
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$amount' },
          paymentCount: { $sum: 1 }
        }
      }
    ]),
    Expense.aggregate([
      { 
        $match: { 
          property: mongoose.Types.ObjectId(propertyId),
          deleted: { $ne: true },
          ...(startDate && { date: dateFilter })
        }
      },
      {
        $group: {
          _id: null,
          totalExpenses: { $sum: '$amount' },
          expenseCount: { $sum: 1 }
        }
      }
    ])
  ]);

  const revenue = paymentsResult[0]?.totalRevenue || 0;
  const expenses = expensesResult[0]?.totalExpenses || 0;
  const netIncome = revenue - expenses;

  return {
    revenue,
    expenses,
    netIncome,
    paymentCount: paymentsResult[0]?.paymentCount || 0,
    expenseCount: expensesResult[0]?.expenseCount || 0,
    profitMargin: revenue > 0 ? Math.round((netIncome / revenue) * 100) : 0,
    currency: 'KES'
  };
}

export default {
  getProperties,
  getPropertyById,
  createProperty,
  updateProperty,
  deleteProperty,
  getPropertyDashboard
};