// controllers/floorController.js
import Floor from "../models/Floor.js";
import Property from "../models/Property.js";
import mongoose from "mongoose";
import logger from "../utils/logger.js";

// Get floors for a property
export const getFloorsByProperty = async (req, res) => {
  try {
    const floors = await Floor.find({ propertyId: req.params.propertyId })
      .populate("units")
      .sort("number");
    res.json(floors);
  } catch (error) {
    logger.error(`Error fetching floors: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
};

// Get a single floor
export const getFloor = async (req, res) => {
  try {
    const floor = await Floor.findById(req.params.id).populate("units");

    if (!floor) {
      return res.status(404).json({ error: "Floor not found" });
    }

    res.json(floor);
  } catch (error) {
    logger.error(`Error fetching floor: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
};

// Create a new floor
export const createFloor = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Verify property exists
    const property = await Property.findById(req.body.propertyId);
    if (!property) {
      return res.status(404).json({ error: "Property not found" });
    }

    // Check for duplicate floor number
    const existingFloor = await Floor.findOne({
      propertyId: req.body.propertyId,
      number: req.body.number,
    });

    if (existingFloor) {
      return res
        .status(400)
        .json({
          error: "A floor with this number already exists for this property",
        });
    }

    const floor = new Floor(req.body);
    await floor.save({ session });

    // Update property's floors array if needed
    if (!property.floors) {
      property.floors = [];
    }
    property.floors.push({
      number: floor.number,
      name: floor.name,
      _id: floor._id,
    });
    await property.save({ session });

    await session.commitTransaction();
    res.status(201).json(floor);
  } catch (error) {
    await session.abortTransaction();
    logger.error(`Error creating floor: ${error.message}`);
    res.status(400).json({ error: error.message });
  } finally {
    session.endSession();
  }
};

// Update a floor
export const updateFloor = async (req, res) => {
  try {
    const floor = await Floor.findById(req.params.id);

    if (!floor) {
      return res.status(404).json({ error: "Floor not found" });
    }

    // Check for duplicate floor number if number is being changed
    if (req.body.number && req.body.number !== floor.number) {
      const existingFloor = await Floor.findOne({
        propertyId: floor.propertyId,
        number: req.body.number,
        _id: { $ne: floor._id },
      });

      if (existingFloor) {
        return res
          .status(400)
          .json({
            error: "A floor with this number already exists for this property",
          });
      }
    }

    // Update floor
    Object.keys(req.body).forEach((key) => {
      floor[key] = req.body[key];
    });

    await floor.save();

    // If the floor number or name changed, update property's floors array
    if (req.body.number || req.body.name) {
      const property = await Property.findById(floor.propertyId);
      if (property && property.floors) {
        const floorIndex = property.floors.findIndex(
          (f) => f._id.toString() === floor._id.toString()
        );
        if (floorIndex !== -1) {
          property.floors[floorIndex] = {
            number: floor.number,
            name: floor.name,
            _id: floor._id,
          };
          await property.save();
        }
      }
    }

    res.json(floor);
  } catch (error) {
    logger.error(`Error updating floor: ${error.message}`);
    res.status(400).json({ error: error.message });
  }
};

// Delete a floor
export const deleteFloor = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const floor = await Floor.findById(req.params.id);

    if (!floor) {
      return res.status(404).json({ error: "Floor not found" });
    }

    // Check if floor has units
    if (floor.units && floor.units.length > 0) {
      return res
        .status(400)
        .json({
          error: "Cannot delete floor with units. Remove all units first.",
        });
    }

    // Remove floor from property's floors array
    await Property.updateOne(
      { _id: floor.propertyId },
      { $pull: { floors: { _id: floor._id } } }
    );

    await floor.deleteOne({ session });

    await session.commitTransaction();
    res.json({ message: "Floor deleted successfully" });
  } catch (error) {
    await session.abortTransaction();
    logger.error(`Error deleting floor: ${error.message}`);
    res.status(500).json({ error: error.message });
  } finally {
    session.endSession();
  }
};
