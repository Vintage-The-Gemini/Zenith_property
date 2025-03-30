// backend/controllers/floorController.js
import mongoose from "mongoose";
import Floor from "../models/Floor.js";
import Property from "../models/Property.js";
import Unit from "../models/Unit.js";
import logger from "../utils/logger.js";

/**
 * Get all floors for a property
 */
export const getFloorsByProperty = async (req, res) => {
  try {
    const { propertyId } = req.params;

    // Validate property ID
    if (!mongoose.Types.ObjectId.isValid(propertyId)) {
      return res.status(400).json({ error: "Invalid property ID format" });
    }

    // Check if property exists
    const property = await Property.findById(propertyId);
    if (!property) {
      return res.status(404).json({ error: "Property not found" });
    }

    // Find all floors for this property, populate units
    const floors = await Floor.find({ propertyId })
      .populate({
        path: "units",
        select:
          "unitNumber status monthlyRent bedrooms bathrooms currentTenant",
        populate: {
          path: "currentTenant",
          select: "firstName lastName email",
        },
      })
      .sort("number");

    res.json(floors);
  } catch (error) {
    logger.error(`Error in getFloorsByProperty: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get a single floor by ID
 */
export const getFloor = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate floor ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid floor ID format" });
    }

    // Find floor and populate units
    const floor = await Floor.findById(id).populate({
      path: "units",
      select: "unitNumber status monthlyRent bedrooms bathrooms currentTenant",
      populate: {
        path: "currentTenant",
        select: "firstName lastName email",
      },
    });

    if (!floor) {
      return res.status(404).json({ error: "Floor not found" });
    }

    res.json(floor);
  } catch (error) {
    logger.error(`Error in getFloor: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get units for a specific floor
 */
export const getUnitsForFloor = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate floor ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid floor ID format" });
    }

    // Find floor
    const floor = await Floor.findById(id);
    if (!floor) {
      return res.status(404).json({ error: "Floor not found" });
    }

    // Get units for this floor
    const units = await Unit.find({ floorId: id })
      .populate("currentTenant", "firstName lastName email")
      .sort("unitNumber");

    res.json(units);
  } catch (error) {
    logger.error(`Error in getUnitsForFloor: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Create a new floor
 */
export const createFloor = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { propertyId, number, name, notes } = req.body;

    // Validate required fields
    if (!propertyId || number === undefined) {
      return res
        .status(400)
        .json({ error: "Property ID and floor number are required" });
    }

    // Verify property exists
    const property = await Property.findById(propertyId);
    if (!property) {
      return res.status(404).json({ error: "Property not found" });
    }

    // Check for duplicate floor number in this property
    const existingFloor = await Floor.findOne({ propertyId, number });
    if (existingFloor) {
      return res.status(400).json({
        error: "A floor with this number already exists for this property",
      });
    }

    // Create new floor
    const floor = new Floor({
      propertyId,
      number,
      name: name || `Floor ${number}`,
      notes,
      units: [],
    });

    await floor.save({ session });

    // Add floor to property's floors array if it doesn't already exist
    if (!property.floors) {
      property.floors = [];
    }

    // Check if floor already exists in property
    const floorExists = property.floors.some((f) => f.number === floor.number);

    if (!floorExists) {
      property.floors.push({
        _id: floor._id,
        number: floor.number,
        name: floor.name,
      });
      await property.save({ session });
    }

    await session.commitTransaction();

    res.status(201).json(floor);
  } catch (error) {
    await session.abortTransaction();
    logger.error(`Error in createFloor: ${error.message}`);
    res.status(400).json({ error: error.message });
  } finally {
    session.endSession();
  }
};

/**
 * Update an existing floor
 */
export const updateFloor = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id } = req.params;
    const updates = req.body;

    // Find the floor
    const floor = await Floor.findById(id);
    if (!floor) {
      return res.status(404).json({ error: "Floor not found" });
    }

    // Check for duplicate floor number if number is being updated
    if (updates.number !== undefined && updates.number !== floor.number) {
      const existingFloor = await Floor.findOne({
        propertyId: floor.propertyId,
        number: updates.number,
        _id: { $ne: id },
      });

      if (existingFloor) {
        return res.status(400).json({
          error: "A floor with this number already exists for this property",
        });
      }
    }

    // Update the floor
    Object.keys(updates).forEach((key) => {
      if (updates[key] !== undefined) {
        floor[key] = updates[key];
      }
    });

    await floor.save({ session });

    // Update the floor in the property's floors array if name or number changed
    if (updates.number !== undefined || updates.name !== undefined) {
      await Property.updateOne(
        { _id: floor.propertyId, "floors._id": floor._id },
        {
          $set: {
            "floors.$.number": floor.number,
            "floors.$.name": floor.name,
          },
        },
        { session }
      );
    }

    await session.commitTransaction();
    res.json(floor);
  } catch (error) {
    await session.abortTransaction();
    logger.error(`Error in updateFloor: ${error.message}`);
    res.status(400).json({ error: error.message });
  } finally {
    session.endSession();
  }
};

/**
 * Delete a floor
 */
export const deleteFloor = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id } = req.params;

    // Find the floor
    const floor = await Floor.findById(id);
    if (!floor) {
      return res.status(404).json({ error: "Floor not found" });
    }

    // Check if floor has units
    const units = await Unit.find({ floorId: id });
    if (units.length > 0) {
      return res.status(400).json({
        error: "Cannot delete floor with units. Please remove all units first.",
      });
    }

    // Remove floor from property
    await Property.updateOne(
      { _id: floor.propertyId },
      { $pull: { floors: { _id: floor._id } } },
      { session }
    );

    // Delete the floor
    await floor.deleteOne({ session });

    await session.commitTransaction();
    res.json({ message: "Floor deleted successfully" });
  } catch (error) {
    await session.abortTransaction();
    logger.error(`Error in deleteFloor: ${error.message}`);
    res.status(500).json({ error: error.message });
  } finally {
    session.endSession();
  }
};
