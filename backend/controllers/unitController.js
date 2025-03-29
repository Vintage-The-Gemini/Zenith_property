// backend/controllers/unitController.js
import mongoose from "mongoose";
import Unit from "../models/Unit.js";
import Property from "../models/Property.js";
import Floor from "../models/Floor.js";
import Maintenance from "../models/Maintenance.js";
import logger from "../utils/logger.js";

/**
 * Get all units with optional filtering
 */
export const getUnits = async (req, res) => {
  try {
    // Apply filters if provided
    const filter = {};
    if (req.query.propertyId) {
      filter.propertyId = req.query.propertyId;
    }
    if (req.query.floorId) {
      filter.floorId = req.query.floorId;
    }
    if (req.query.status) {
      filter.status = req.query.status;
    }
    if (req.query.type) {
      filter.type = req.query.type;
    }

    const units = await Unit.find(filter)
      .populate("propertyId", "name propertyType")
      .populate("floorId", "number name")
      .populate("currentTenant", "firstName lastName email phone")
      .sort("unitNumber");

    res.json(units);
  } catch (error) {
    logger.error(`Error fetching units: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get a single unit by ID
 */
export const getUnit = async (req, res) => {
  try {
    const unit = await Unit.findById(req.params.id)
      .populate("propertyId", "name propertyType address")
      .populate("floorId", "number name")
      .populate("currentTenant", "firstName lastName email phone");

    if (!unit) {
      return res.status(404).json({ error: "Unit not found" });
    }
    res.json(unit);
  } catch (error) {
    logger.error(`Error fetching unit: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Create a new unit
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
      status,
      monthlyRent,
      ...otherData
    } = req.body;

    // Check for required fields
    if (!propertyId || !floorId || !unitNumber || !monthlyRent) {
      return res.status(400).json({
        error:
          "Property ID, floor ID, unit number, and monthly rent are required",
      });
    }

    // Verify property exists
    const property = await Property.findById(propertyId);
    if (!property) {
      return res.status(404).json({ error: "Property not found" });
    }

    // Verify floor exists and belongs to the property
    const floor = await Floor.findById(floorId);
    if (!floor) {
      return res.status(404).json({ error: "Floor not found" });
    }

    if (floor.propertyId.toString() !== propertyId) {
      return res.status(400).json({
        error: "Floor does not belong to the specified property",
      });
    }

    // Check for duplicate unit number in this property
    const existingUnit = await Unit.findOne({ propertyId, unitNumber });
    if (existingUnit) {
      return res.status(400).json({
        error: "A unit with this number already exists in this property",
      });
    }

    // Determine if property is commercial
    const isCommercial =
      property.propertyType === "commercial" ||
      property.propertyType === "mixed-use";

    // Create new unit
    const unitData = {
      propertyId,
      floorId,
      unitNumber,
      type: type || "rental",
      status: status || "available",
      monthlyRent: parseFloat(monthlyRent),
      ...otherData,
    };

    // Set property type-specific defaults
    if (isCommercial) {
      // Set commercial defaults
      unitData.bedrooms = 0;
      unitData.bathrooms = 0;
      unitData.furnished = false;

      if (!unitData.commercialUnitType) {
        unitData.commercialUnitType = "office";
      }
    } else {
      // Set residential defaults if not provided
      if (unitData.bedrooms === undefined) unitData.bedrooms = 1;
      if (unitData.bathrooms === undefined) unitData.bathrooms = 1;

      // Make sure commercial fields aren't set for residential
      delete unitData.commercialUnitType;
    }

    const unit = new Unit(unitData);
    await unit.save({ session });

    // Add unit to property
    if (!property.units) property.units = [];
    property.units.push(unit._id);
    await property.save({ session });

    // Add unit to floor
    if (!floor.units) floor.units = [];
    floor.units.push(unit._id);
    await floor.save({ session });

    await session.commitTransaction();

    // Return the populated unit
    const populatedUnit = await Unit.findById(unit._id)
      .populate("propertyId", "name propertyType")
      .populate("floorId", "number name");

    res.status(201).json(populatedUnit);
  } catch (error) {
    await session.abortTransaction();
    logger.error(`Error creating unit: ${error.message}`);
    res.status(400).json({ error: error.message });
  } finally {
    session.endSession();
  }
};

/**
 * Add maintenance record to a unit
 */
export const addMaintenanceRecord = async (req, res) => {
  try {
    const unit = await Unit.findById(req.params.id);
    if (!unit) {
      return res.status(404).json({ error: "Unit not found" });
    }

    // Create a new maintenance record in the Maintenance collection
    const maintenance = new Maintenance({
      property: unit.propertyId,
      unit: unit._id,
      title: req.body.title || "Maintenance",
      description: req.body.description,
      cost: req.body.cost,
      priority: req.body.priority || "medium",
      reportedDate: new Date(),
      reportedBy: req.user?._id,
    });

    await maintenance.save();

    // Also add to unit's maintenance history for quick reference
    unit.maintenanceHistory.push({
      date: new Date(),
      description: req.body.description,
      cost: req.body.cost,
      performedBy: req.body.performedBy,
    });

    // Update unit status if requested
    if (req.body.updateUnitStatus) {
      unit.status = "maintenance";
    }

    await unit.save();

    res.json(unit);
  } catch (error) {
    logger.error(`Error adding maintenance record: ${error.message}`);
    res.status(400).json({ error: error.message });
  }
};

/**
 * Update unit status
 */
export const updateUnitStatus = async (req, res) => {
  try {
    const unit = await Unit.findById(req.params.id);
    if (!unit) {
      return res.status(404).json({ error: "Unit not found" });
    }

    // Validate status change
    if (req.body.status === "occupied" && !unit.currentTenant) {
      return res.status(400).json({
        error:
          "Cannot mark unit as occupied without assigning a tenant. Please assign a tenant first.",
      });
    }

    // Store previous status for reference
    unit._previousStatus = unit.status;

    // Update status
    unit.status = req.body.status;

    await unit.save();
    res.json(unit);
  } catch (error) {
    logger.error(`Error updating unit status: ${error.message}`);
    res.status(400).json({ error: error.message });
  }
};

/**
 * Get available units (useful for tenant assignment)
 */
export const getAvailableUnits = async (req, res) => {
  try {
    // Filter by property if provided
    const filter = { status: "available" };
    if (req.query.propertyId) {
      filter.propertyId = req.query.propertyId;
    }

    const units = await Unit.find(filter)
      .populate("propertyId", "name propertyType")
      .populate("floorId", "number name")
      .sort("unitNumber");

    res.json(units);
  } catch (error) {
    logger.error(`Error fetching available units: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Update an existing unit
 */
export const updateUnit = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const unit = await Unit.findById(req.params.id);
    if (!unit) {
      return res.status(404).json({ error: "Unit not found" });
    }

    // Check if propertyId is being changed (usually not allowed)
    if (
      req.body.propertyId &&
      req.body.propertyId !== unit.propertyId.toString()
    ) {
      return res.status(400).json({
        error: "Cannot change the property of an existing unit",
      });
    }

    // Handle floor change if needed
    if (req.body.floorId && req.body.floorId !== unit.floorId.toString()) {
      // Check if new floor exists and belongs to same property
      const newFloor = await Floor.findById(req.body.floorId);
      if (!newFloor) {
        return res.status(404).json({ error: "New floor not found" });
      }

      if (newFloor.propertyId.toString() !== unit.propertyId.toString()) {
        return res.status(400).json({
          error: "New floor must belong to the same property",
        });
      }

      // Remove unit from old floor
      await Floor.updateOne(
        { _id: unit.floorId },
        { $pull: { units: unit._id } },
        { session }
      );

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
        return res.status(400).json({
          error: "A unit with this number already exists in this property",
        });
      }
    }

    // Handle status change
    if (req.body.status && req.body.status !== unit.status) {
      if (
        req.body.status === "occupied" &&
        !req.body.currentTenant &&
        !unit.currentTenant
      ) {
        return res.status(400).json({
          error: "Cannot mark unit as occupied without assigning a tenant",
        });
      }

      // Store previous status for reference in pre-save hook
      unit._previousStatus = unit.status;
    }

    // Update unit fields
    const updateFields = [
      "unitNumber",
      "type",
      "status",
      "monthlyRent",
      "securityDeposit",
      "bedrooms",
      "bathrooms",
      "squareFootage",
      "furnished",
      "description",
      "commercialUnitType",
      "nightlyRate",
      "weeklyRate",
      "monthlyRate",
      "minimumStay",
      "floorId",
      "currentTenant",
      "amenities",
    ];

    updateFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        unit[field] = req.body[field];
      }
    });

    await unit.save({ session });
    await session.commitTransaction();

    // Return populated unit
    const populatedUnit = await Unit.findById(req.params.id)
      .populate("propertyId", "name propertyType")
      .populate("floorId", "number name")
      .populate("currentTenant", "firstName lastName email phone");

    res.json(populatedUnit);
  } catch (error) {
    await session.abortTransaction();
    logger.error(`Error updating unit: ${error.message}`);
    res.status(400).json({ error: error.message });
  } finally {
    session.endSession();
  }
};

/**
 * Delete a unit
 */
export const deleteUnit = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const unit = await Unit.findById(req.params.id);
    if (!unit) {
      return res.status(404).json({ error: "Unit not found" });
    }

    // Check if unit has an active tenant
    if (unit.currentTenant) {
      return res.status(400).json({
        error:
          "Cannot delete unit with active tenant. Please remove tenant first.",
      });
    }

    // Remove unit from property
    await Property.updateOne(
      { _id: unit.propertyId },
      { $pull: { units: unit._id } },
      { session }
    );

    // Remove unit from floor
    await Floor.updateOne(
      { _id: unit.floorId },
      { $pull: { units: unit._id } },
      { session }
    );

    // Delete all maintenance records for this unit
    await Maintenance.deleteMany({ unit: unit._id }, { session });

    // Delete the unit
    await unit.deleteOne({ session });

    await session.commitTransaction();
    res.json({ message: "Unit deleted successfully" });
  } catch (error) {
    await session.abortTransaction();
    logger.error(`Error deleting unit: ${error.message}`);
    res.status(500).json({ error: error.message });
  } finally {
    session.endSession();
  }
};
