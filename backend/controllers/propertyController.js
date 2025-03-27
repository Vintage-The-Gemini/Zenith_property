// controllers/propertyController.js
import Property from '../models/Property.js';
import Unit from '../models/Unit.js';
import mongoose from 'mongoose';

export const getProperties = async (req, res) => {
  try {
    const properties = await Property.find({ owner: req.user._id })
      .populate('units')
      .populate('managers', '-password');
    res.json(properties);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getProperty = async (req, res) => {
  try {
    const property = await Property.findOne({
      _id: req.params.id,
      owner: req.user._id
    }).populate('units').populate('managers', '-password');
    
    if (!property) {
      return res.status(404).json({ error: 'Property not found' });
    }
    res.json(property);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createProperty = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const property = new Property({
      ...req.body,
      owner: req.user._id
    });

    await property.save({ session });

    // If units are provided, create them
    if (req.body.units && Array.isArray(req.body.units)) {
      const unitPromises = req.body.units.map(unit => {
        const newUnit = new Unit({
          ...unit,
          propertyId: property._id
        });
        return newUnit.save({ session });
      });

      const units = await Promise.all(unitPromises);
      property.units = units.map(unit => unit._id);
      await property.save({ session });
    }

    await session.commitTransaction();
    res.status(201).json(property);
  } catch (error) {
    await session.abortTransaction();
    res.status(400).json({ error: error.message });
  } finally {
    session.endSession();
  }
};

export const updateProperty = async (req, res) => {
  const updates = Object.keys(req.body);
  const allowedUpdates = ['name', 'address', 'propertyType', 'amenities', 'managers', 'status'];
  const isValidOperation = updates.every(update => allowedUpdates.includes(update));

  if (!isValidOperation) {
    return res.status(400).json({ error: 'Invalid updates' });
  }

  try {
    const property = await Property.findOne({
      _id: req.params.id,
      owner: req.user._id
    });

    if (!property) {
      return res.status(404).json({ error: 'Property not found' });
    }

    updates.forEach(update => property[update] = req.body[update]);
    await property.save();
    res.json(property);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const deleteProperty = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const property = await Property.findOne({
      _id: req.params.id,
      owner: req.user._id
    });

    if (!property) {
      return res.status(404).json({ error: 'Property not found' });
    }

    // Delete associated units
    await Unit.deleteMany({ propertyId: property._id }, { session });
    await property.remove({ session });

    await session.commitTransaction();
    res.json({ message: 'Property deleted successfully' });
  } catch (error) {
    await session.abortTransaction();
    res.status(500).json({ error: error.message });
  } finally {
    session.endSession();
  }
};