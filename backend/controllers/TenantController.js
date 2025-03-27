// controllers/tenantController.js
import Tenant from '../models/Tenant.js';
import Unit from '../models/Unit.js';
import mongoose from 'mongoose';

export const getTenants = async (req, res) => {
  try {
    const tenants = await Tenant.find()
      .populate('unitId')
      .populate('userId', '-password');
    res.json(tenants);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getTenant = async (req, res) => {
  try {
    const tenant = await Tenant.findById(req.params.id)
      .populate('unitId')
      .populate('userId', '-password');
    
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }
    res.json(tenant);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createTenant = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Check if unit is available
    const unit = await Unit.findById(req.body.unitId);
    if (!unit || unit.status !== 'available') {
      throw new Error('Unit is not available');
    }

    const tenant = new Tenant({
      ...req.body,
      status: 'pending'
    });

    await tenant.save({ session });

    // Update unit status
    unit.status = 'occupied';
    unit.currentTenant = tenant._id;
    await unit.save({ session });

    await session.commitTransaction();
    res.status(201).json(tenant);
  } catch (error) {
    await session.abortTransaction();
    res.status(400).json({ error: error.message });
  } finally {
    session.endSession();
  }
};

export const updateTenant = async (req, res) => {
  try {
    const tenant = await Tenant.findById(req.params.id);
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    // Handle document uploads if any
    if (req.files) {
      const documents = req.files.map(file => ({
        type: file.fieldname,
        name: file.originalname,
        path: file.path,
        uploadDate: new Date()
      }));
      tenant.documents.push(...documents);
    }

    Object.assign(tenant, req.body);
    await tenant.save();
    res.json(tenant);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const endTenancy = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const tenant = await Tenant.findById(req.params.id);
    if (!tenant) {
      throw new Error('Tenant not found');
    }

    // Update tenant status
    tenant.status = 'past';
    tenant.leaseDetails.endDate = new Date();
    await tenant.save({ session });

    // Update unit status
    const unit = await Unit.findById(tenant.unitId);
    if (unit) {
      unit.status = 'available';
      unit.currentTenant = null;
      await unit.save({ session });
    }

    await session.commitTransaction();
    res.json({ message: 'Tenancy ended successfully' });
  } catch (error) {
    await session.abortTransaction();
    res.status(400).json({ error: error.message });
  } finally {
    session.endSession();
  }
};

export const recordPayment = async (req, res) => {
  try {
    const tenant = await Tenant.findById(req.params.id);
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    tenant.paymentHistory.push({
      date: new Date(),
      amount: req.body.amount,
      type: req.body.type,
      status: 'completed',
      reference: req.body.reference
    });

    await tenant.save();
    res.json(tenant);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};