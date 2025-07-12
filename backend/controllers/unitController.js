// backend/controllers/unitController.js
import Unit from "../models/Unit.js";
import Property from "../models/Property.js";
import Tenant from "../models/Tenant.js";
import Floor from "../models/Floor.js";
import mongoose from "mongoose";
import logger from "../utils/logger.js";

/**
 * Get all units with filtering
 * @route GET /api/units
 */
export const getUnits = async (req, res) => {
  try {
    const {
      status,
      property,
      floor,
      type,
      page = 1,
      limit = 20,
      search,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    // Build filter object
    const filter = {};

    if (status) filter.status = status;
    if (property) filter.propertyId = property;
    if (floor) filter['floor.floorId'] = floor;
    if (type) filter.type = type;

    // Search functionality
    if (search) {
      filter.$or = [
        { unitNumber: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    // Calculate pagination
    const skip = (page - 1) * limit;
    const sortDirection = sortOrder === "desc" ? -1 : 1;

    // Get units with population
    const units = await Unit.find(filter)
      .populate("propertyId", "name address")
      .populate("occupancy.currentTenant", "firstName lastName email phone")
      .sort({ [sortBy]: sortDirection })
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const total = await Unit.countDocuments(filter);

    res.json({
      success: true,
      data: units,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total,
        limit: parseInt(limit),
      },
    });
  } catch (error) {
    logger.error(`Error fetching units: ${error.message}`);
    res.status(500).json({
      success: false,
      error: "Failed to fetch units",
    });
  }
};

/**
 * Get single unit by ID
 * @route GET /api/units/:id
 */
export const getUnitById = async (req, res) => {
  try {
    const unit = await Unit.findById(req.params.id)
      .populate("propertyId", "name address")
      .populate("occupancy.currentTenant", "firstName lastName email phone status");

    if (!unit) {
      return res.status(404).json({
        success: false,
        error: "Unit not found",
      });
    }

    res.json({
      success: true,
      data: unit,
    });
  } catch (error) {
    logger.error(`Error fetching unit: ${error.message}`);
    res.status(500).json({
      success: false,
      error: "Failed to fetch unit",
    });
  }
};

/**
 * Create new unit
 * @route POST /api/units
 */
export const createUnit = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const {
      propertyId,
      floorId,
      unitNumber,
      type,
      size,
      bedrooms,
      bathrooms,
      rent,
      deposit,
      description,
      amenities,
      images,
    } = req.body;

    // Verify property exists
    const property = await Property.findById(propertyId);
    if (!property) {
      await session.abortTransaction();
      return res.status(404).json({
        success: false,
        error: "Property not found",
      });
    }

    // Verify floor exists if provided
    if (floorId) {
      const floor = await Floor.findById(floorId);
      if (!floor) {
        await session.abortTransaction();
        return res.status(404).json({
          success: false,
          error: "Floor not found",
        });
      }

      // Check if floor belongs to the property
      if (floor.propertyId.toString() !== propertyId) {
        await session.abortTransaction();
        return res.status(400).json({
          success: false,
          error: "Floor does not belong to the specified property",
        });
      }
    }

    // Check if unit number already exists in this property
    const existingUnit = await Unit.findOne({
      propertyId,
      unitNumber,
    });

    if (existingUnit) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        error: "Unit number already exists in this property",
      });
    }

    // Create unit
    const unitData = {
      propertyId,
      floorId: floorId || null,
      unitNumber,
      type,
      size,
      bedrooms,
      bathrooms,
      rent,
      deposit,
      description,
      amenities: amenities || [],
      images: images || [],
      status: "available",
    };

    const unit = new Unit(unitData);
    await unit.save({ session });

    // Add unit to floor if floor is specified
    if (floorId) {
      await Floor.updateOne(
        { _id: floorId },
        { $push: { units: unit._id } },
        { session }
      );
    }

    await session.commitTransaction();

    // Populate the response
    await unit.populate("propertyId", "name address");
    if (floorId) {
      await unit.populate("floorId", "name floorNumber");
    }

    res.status(201).json({
      success: true,
      message: "Unit created successfully",
      data: unit,
    });
  } catch (error) {
    await session.abortTransaction();
    logger.error(`Error creating unit: ${error.message}`);
    res.status(500).json({
      success: false,
      error: "Failed to create unit",
    });
  } finally {
    session.endSession();
  }
};

/**
 * Update unit
 * @route PUT /api/units/:id
 */
export const updateUnit = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const unit = await Unit.findById(req.params.id);
    if (!unit) {
      await session.abortTransaction();
      return res.status(404).json({
        success: false,
        error: "Unit not found",
      });
    }

    // Check if propertyId is being changed (usually not allowed)
    if (
      req.body.propertyId &&
      req.body.propertyId !== unit.propertyId.toString()
    ) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        error: "Cannot change the property of an existing unit",
      });
    }

    // Handle floor change if needed
    if (req.body.floorId && req.body.floorId !== unit.floorId?.toString()) {
      // Check if new floor exists and belongs to same property
      const newFloor = await Floor.findById(req.body.floorId);
      if (!newFloor) {
        await session.abortTransaction();
        return res.status(404).json({
          success: false,
          error: "New floor not found",
        });
      }

      if (newFloor.propertyId.toString() !== unit.propertyId.toString()) {
        await session.abortTransaction();
        return res.status(400).json({
          success: false,
          error: "New floor must belong to the same property",
        });
      }

      // Remove unit from old floor if it had one
      if (unit.floorId) {
        await Floor.updateOne(
          { _id: unit.floorId },
          { $pull: { units: unit._id } },
          { session }
        );
      }

      // Add unit to new floor
      await Floor.updateOne(
        { _id: newFloor._id },
        { $push: { units: unit._id } },
        { session }
      );
    }

    // Handle unitNumber change - check for duplicates
    if (req.body.unitNumber && req.body.unitNumber !== unit.unitNumber) {
      const existingUnit = await Unit.findOne({
        propertyId: unit.propertyId,
        unitNumber: req.body.unitNumber,
        _id: { $ne: unit._id },
      });

      if (existingUnit) {
        await session.abortTransaction();
        return res.status(400).json({
          success: false,
          error: "A unit with this number already exists in this property",
        });
      }
    }

    // Update the unit
    const updateData = { ...req.body };
    delete updateData.propertyId; // Don't allow property change

    Object.assign(unit, updateData);
    unit.lastModified = new Date();

    await unit.save({ session });
    await session.commitTransaction();

    // Populate the response
    await unit.populate("propertyId", "name address");
    if (unit.floorId) {
      await unit.populate("floorId", "name floorNumber");
    }

    res.json({
      success: true,
      message: "Unit updated successfully",
      data: unit,
    });
  } catch (error) {
    await session.abortTransaction();
    logger.error(`Error updating unit: ${error.message}`);
    res.status(500).json({
      success: false,
      error: "Failed to update unit",
    });
  } finally {
    session.endSession();
  }
};

/**
 * Delete unit
 * @route DELETE /api/units/:id
 */
export const deleteUnit = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const unit = await Unit.findById(req.params.id);

    if (!unit) {
      await session.abortTransaction();
      return res.status(404).json({
        success: false,
        error: "Unit not found",
      });
    }

    // Check if unit has active tenant
    if (unit.currentTenant) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        error: "Cannot delete unit with active tenant. Move out tenant first.",
      });
    }

    // Check for pending payments
    const Payment = (await import("../models/Payment.js")).default;
    const pendingPayments = await Payment.countDocuments({
      unit: unit._id,
      status: { $in: ["pending", "partial"] },
    });

    if (pendingPayments > 0) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        error: "Cannot delete unit with pending payments",
      });
    }

    // Remove unit from floor if it belongs to one
    if (unit.floorId) {
      await Floor.updateOne(
        { _id: unit.floorId },
        { $pull: { units: unit._id } },
        { session }
      );
    }

    await Unit.findByIdAndDelete(unit._id, { session });
    await session.commitTransaction();

    res.json({
      success: true,
      message: "Unit deleted successfully",
    });
  } catch (error) {
    await session.abortTransaction();
    logger.error(`Error deleting unit: ${error.message}`);
    res.status(500).json({
      success: false,
      error: "Failed to delete unit",
    });
  } finally {
    session.endSession();
  }
};

// Additional helper functions that might be needed

/**
 * Get available units for a property
 */
export const getAvailableUnits = async (req, res) => {
  try {
    const { property } = req.query;
    
    const filter = { status: "available" };
    if (property) filter.propertyId = property;

    const units = await Unit.find(filter)
      .populate("propertyId", "name")
      .populate("floorId", "name floorNumber")
      .sort("unitNumber");

    res.json({
      success: true,
      data: units,
    });
  } catch (error) {
    logger.error(`Error fetching available units: ${error.message}`);
    res.status(500).json({
      success: false,
      error: "Failed to fetch available units",
    });
  }
};

/**
 * Assign tenant to unit
 */
export const assignTenant = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { unitId } = req.params;
    const { tenantId } = req.body;

    const unit = await Unit.findById(unitId);
    if (!unit) {
      await session.abortTransaction();
      return res.status(404).json({
        success: false,
        error: "Unit not found",
      });
    }

    if (unit.status !== "available") {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        error: "Unit is not available for assignment",
      });
    }

    const tenant = await Tenant.findById(tenantId);
    if (!tenant) {
      await session.abortTransaction();
      return res.status(404).json({
        success: false,
        error: "Tenant not found",
      });
    }

    // Update unit
    unit.currentTenant = tenantId;
    unit.status = "occupied";
    unit.occupancyStartDate = new Date();
    await unit.save({ session });

    // Update tenant
    tenant.currentUnit = unitId;
    tenant.status = "active";
    await tenant.save({ session });

    await session.commitTransaction();

    res.json({
      success: true,
      message: "Tenant assigned to unit successfully",
      data: unit,
    });
  } catch (error) {
    await session.abortTransaction();
    logger.error(`Error assigning tenant: ${error.message}`);
    res.status(500).json({
      success: false,
      error: "Failed to assign tenant",
    });
  } finally {
    session.endSession();
  }
};