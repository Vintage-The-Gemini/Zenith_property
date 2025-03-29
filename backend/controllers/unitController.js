// controllers/unitController.js
import Unit from "../models/Unit.js";
import Property from "../models/Property.js";
import Floor from "../models/Floor.js";
import Maintenance from "../models/Maintenance.js";
import mongoose from "mongoose";
import logger from "../utils/logger.js";

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
      .populate("currentTenant", "firstName lastName email phone");

    res.json(units);
  } catch (error) {
    logger.error(`Error fetching units: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
};

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

export const createUnit = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Verify property exists
    const property = await Property.findById(req.body.propertyId);
    if (!property) {
      throw new Error("Property not found");
    }

    // Determine if property is commercial
    const isCommercial = property.propertyType === "commercial";

    // Get or create floor
    let floor;
    if (req.body.floorId) {
      // Use provided floor ID
      floor = await Floor.findById(req.body.floorId);
      if (!floor) {
        throw new Error("Floor not found");
      }
      // Verify floor belongs to property
      if (floor.propertyId.toString() !== property._id.toString()) {
        throw new Error("Floor does not belong to this property");
      }
    } else if (req.body.floorNumber) {
      // Try to find existing floor with this number
      floor = await Floor.findOne({
        propertyId: property._id,
        number: req.body.floorNumber,
      });

      // Create floor if it doesn't exist
      if (!floor) {
        floor = new Floor({
          propertyId: property._id,
          number: req.body.floorNumber,
          name: req.body.floorName || `Floor ${req.body.floorNumber}`,
        });
        await floor.save({ session });

        // Add floor to property
        if (!property.floors) property.floors = [];
        property.floors.push({
          number: floor.number,
          name: floor.name,
          _id: floor._id,
        });
        await property.save({ session });
      }
    } else {
      throw new Error("Either floorId or floorNumber must be provided");
    }

    // Prepare unit data based on property type
    const unitData = {
      ...req.body,
      floorId: floor._id,
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

    // Create the unit
    const unit = new Unit(unitData);
    await unit.save({ session });

    // Add unit to property's units array
    property.units.push(unit._id);
    await property.save({ session });

    // Add unit to floor's units array
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

export const updateUnit = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const unit = await Unit.findById(req.params.id);
    if (!unit) {
      return res.status(404).json({ error: "Unit not found" });
    }

    // Verify property type to validate fields
    const property = await Property.findById(unit.propertyId);
    const isCommercial = property && property.propertyType === "commercial";

    // Handle floor change if needed
    if (req.body.floorId && req.body.floorId !== unit.floorId.toString()) {
      // Verify new floor exists
      const newFloor = await Floor.findById(req.body.floorId);
      if (!newFloor) {
        return res.status(404).json({ error: "New floor not found" });
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
    } else if (
      req.body.floorNumber &&
      req.body.floorNumber !== unit.floorNumber
    ) {
      // Find or create floor with the new floor number
      let newFloor = await Floor.findOne({
        propertyId: unit.propertyId,
        number: req.body.floorNumber,
      });

      if (!newFloor) {
        // Create new floor
        newFloor = new Floor({
          propertyId: unit.propertyId,
          number: req.body.floorNumber,
          name: req.body.floorName || `Floor ${req.body.floorNumber}`,
        });
        await newFloor.save({ session });

        // Add to property
        await Property.updateOne(
          { _id: unit.propertyId },
          {
            $push: {
              floors: {
                number: newFloor.number,
                name: newFloor.name,
                _id: newFloor._id,
              },
            },
          },
          { session }
        );
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

      // Update unit with new floor ID
      unit.floorId = newFloor._id;
      unit.floorNumber = newFloor.number;
    }

    // Handle images if any
    if (req.files && req.files.length > 0) {
      const images = req.files.map((file) => ({
        url: file.path,
        caption: file.originalname,
        uploadDate: new Date(),
      }));
      unit.images.push(...images);
    }

    // Validate fields based on property type
    if (isCommercial) {
      // For commercial properties, ensure residential fields aren't set
      req.body.bedrooms = 0;
      req.body.bathrooms = 0;
      req.body.furnished = false;
    } else {
      // For residential, ensure commercial fields aren't set
      delete req.body.commercialUnitType;
    }

    // Update tenant relationship if status changes
    if (req.body.status && req.body.status !== unit.status) {
      if (
        req.body.status === "occupied" &&
        !req.body.currentTenant &&
        !unit.currentTenant
      ) {
        return res.status(400).json({
          error:
            "Cannot mark unit as occupied without assigning a tenant. Please assign a tenant first.",
        });
      }

      if (req.body.status !== "occupied" && unit.status === "occupied") {
        // If changing from occupied to something else, remove tenant reference
        unit.currentTenant = null;
      }
    }

    // Update unit fields
    Object.keys(req.body).forEach((key) => {
      // Skip floorId as it's handled separately
      if (key !== "floorId" && key !== "floorNumber" && key !== "floorName") {
        unit[key] = req.body[key];
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

    // If status is changing from occupied to something else, remove tenant reference
    if (unit._previousStatus === "occupied" && req.body.status !== "occupied") {
      unit.currentTenant = null;
    }

    await unit.save();
    res.json(unit);
  } catch (error) {
    logger.error(`Error updating unit status: ${error.message}`);
    res.status(400).json({ error: error.message });
  }
};

export const getUnitsByFloor = async (req, res) => {
  try {
    const units = await Unit.find({ floorId: req.params.floorId })
      .populate("propertyId", "name propertyType")
      .populate("currentTenant", "firstName lastName email phone")
      .sort("unitNumber");

    res.json(units);
  } catch (error) {
    logger.error(`Error fetching units by floor: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
};

// Get available units (useful for tenant assignment)
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
