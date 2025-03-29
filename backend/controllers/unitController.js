// controllers/unitController.js
import Unit from "../models/Unit.js";
import Property from "../models/Property.js";
import Floor from "../models/Floor.js";
import Maintenance from "../models/Maintenance.js";
import mongoose from "mongoose";
import logger from "../utils/logger.js";

export const getUnits = async (req, res) => {
  try {
    // Filter by propertyId if provided
    const filter = {};
    if (req.query.propertyId) {
      filter.propertyId = req.query.propertyId;
    }
    if (req.query.floorId) {
      filter.floorId = req.query.floorId;
    }

    const units = await Unit.find(filter)
      .populate("propertyId")
      .populate("floorId")
      .populate("currentTenant");

    res.json(units);
  } catch (error) {
    logger.error(`Error fetching units: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
};

export const getUnit = async (req, res) => {
  try {
    const unit = await Unit.findById(req.params.id)
      .populate("propertyId")
      .populate("floorId")
      .populate("currentTenant");

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

    // Verify floor exists if floorId is provided
    let floor = null;
    if (req.body.floorId) {
      floor = await Floor.findById(req.body.floorId);
      if (!floor) {
        throw new Error("Floor not found");
      }
      // Verify floor belongs to property
      if (floor.propertyId.toString() !== property._id.toString()) {
        throw new Error("Floor does not belong to this property");
      }
    } else if (req.body.floorNumber) {
      // Find or create floor by number
      floor = await Floor.findOne({
        propertyId: property._id,
        number: req.body.floorNumber,
      });

      if (!floor) {
        // Create new floor
        floor = new Floor({
          propertyId: property._id,
          number: req.body.floorNumber,
          name: req.body.floorName || `Floor ${req.body.floorNumber}`,
        });
        await floor.save({ session });

        // Add to property's floors array
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

    // Create the unit
    const unit = new Unit({
      ...req.body,
      floorId: floor._id,
    });

    await unit.save({ session });

    // Add unit to property's units array
    property.units.push(unit._id);
    await property.save({ session });

    // Add unit to floor's units array
    floor.units.push(unit._id);
    await floor.save({ session });

    await session.commitTransaction();

    // Return the fully populated unit
    const populatedUnit = await Unit.findById(unit._id)
      .populate("propertyId")
      .populate("floorId");

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
    }

    // Handle images if any
    if (req.files) {
      const images = req.files.map((file) => ({
        url: file.path,
        caption: file.originalname,
      }));
      unit.images.push(...images);
    }

    // Update unit fields
    Object.keys(req.body).forEach((key) => {
      unit[key] = req.body[key];
    });

    await unit.save({ session });
    await session.commitTransaction();

    res.json(unit);
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
      return res
        .status(400)
        .json({ error: "Cannot delete unit with active tenant" });
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

    unit.status = req.body.status;
    await unit.save();
    res.json(unit);
  } catch (error) {
    logger.error(`Error updating unit status: ${error.message}`);
    res.status(400).json({ error: error.message });
  }
};
