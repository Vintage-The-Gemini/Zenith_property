// controllers/unitController.js
import Unit from "../models/Unit.js";
import Property from "../models/Property.js";
import Maintenance from "../models/Maintenance.js";
import mongoose from "mongoose";
import logger from "../utils/logger.js";

export const getUnits = async (req, res) => {
  try {
    const units = await Unit.find()
      .populate("propertyId")
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
    const property = await Property.findById(req.body.propertyId);
    if (!property) {
      throw new Error("Property not found");
    }

    const unit = new Unit(req.body);
    await unit.save({ session });

    // Add unit to property
    property.units.push(unit._id);
    await property.save({ session });

    await session.commitTransaction();
    res.status(201).json(unit);
  } catch (error) {
    await session.abortTransaction();
    logger.error(`Error creating unit: ${error.message}`);
    res.status(400).json({ error: error.message });
  } finally {
    session.endSession();
  }
};

export const updateUnit = async (req, res) => {
  try {
    const unit = await Unit.findById(req.params.id);
    if (!unit) {
      return res.status(404).json({ error: "Unit not found" });
    }

    // Handle images if any
    if (req.files) {
      const images = req.files.map((file) => ({
        url: file.path,
        caption: file.originalname,
      }));
      unit.images.push(...images);
    }

    Object.assign(unit, req.body);
    await unit.save();
    res.json(unit);
  } catch (error) {
    logger.error(`Error updating unit: ${error.message}`);
    res.status(400).json({ error: error.message });
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
