// controllers/unitController.js
import Unit from '../models/Unit.js';
import Property from '../models/Property.js';

export const getUnits = async (req, res) => {
  try {
    const units = await Unit.find()
      .populate('propertyId')
      .populate('currentTenant');
    res.json(units);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getUnit = async (req, res) => {
  try {
    const unit = await Unit.findById(req.params.id)
      .populate('propertyId')
      .populate('currentTenant');
    
    if (!unit) {
      return res.status(404).json({ error: 'Unit not found' });
    }
    res.json(unit);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createUnit = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const property = await Property.findById(req.body.propertyId);
    if (!property) {
      throw new Error('Property not found');
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
    res.status(400).json({ error: error.message });
  } finally {
    session.endSession();
  }
};

export const updateUnit = async (req, res) => {
  try {
    const unit = await Unit.findById(req.params.id);
    if (!unit) {
      return res.status(404).json({ error: 'Unit not found' });
    }

    // Handle images if any
    if (req.files) {
      const images = req.files.map(file => ({
        url: file.path,
        caption: file.originalname
      }));
      unit.images.push(...images);
    }

    Object.assign(unit, req.body);
    await unit.save();
    res.json(unit);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const addMaintenanceRecord = async (req, res) => {
  try {
    const unit = await Unit.findById(req.params.id);
    if (!unit) {
      return res.status(404).json({ error: 'Unit not found' });
    }

    unit.maintenanceHistory.push({
      date: new Date(),
      description: req.body.description,
      cost: req.body.cost,
      performedBy: req.body.performedBy
    });

    await unit.save();
    res.json(unit);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const updateUnitStatus = async (req, res) => {
  try {
    const unit = await Unit.findById(req.params.id);
    if (!unit) {
      return res.status(404).json({ error: 'Unit not found' });
    }

    unit.status = req.body.status;
    await unit.save();
    res.json(unit);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};