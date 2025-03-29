// controllers/tenantController.js
import Tenant from "../models/Tenant.js";
import Unit from "../models/Unit.js";
import mongoose from "mongoose";
import logger from "../utils/logger.js";

export const getTenants = async (req, res) => {
  try {
    // Apply filters if provided
    const filter = {};
    if (req.query.propertyId) filter.propertyId = req.query.propertyId;
    if (req.query.unitId) filter.unitId = req.query.unitId;
    if (req.query.status) filter.status = req.query.status;

    const tenants = await Tenant.find(filter)
      .populate("unitId")
      .populate("propertyId", "name");

    res.json(tenants);
  } catch (error) {
    logger.error(`Error fetching tenants: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
};

export const getTenant = async (req, res) => {
  try {
    const tenant = await Tenant.findById(req.params.id)
      .populate("unitId")
      .populate("propertyId", "name");

    if (!tenant) {
      return res.status(404).json({ error: "Tenant not found" });
    }
    res.json(tenant);
  } catch (error) {
    logger.error(`Error fetching tenant: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
};

export const createTenant = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { unitId, propertyId, ...tenantData } = req.body;

    // Verify required fields
    if (!unitId || !propertyId) {
      return res
        .status(400)
        .json({ error: "Unit ID and Property ID are required" });
    }

    // Check if unit exists and is available
    const unit = await Unit.findById(unitId).session(session);
    if (!unit) {
      return res.status(404).json({ error: "Unit not found" });
    }

    if (unit.status !== "available" && unit.status !== "reserved") {
      return res
        .status(400)
        .json({ error: "Unit is not available for assignment" });
    }

    // Create the tenant
    const tenant = new Tenant({
      ...tenantData,
      unitId,
      propertyId,
      status: "active", // Set tenant as active by default when creating
    });

    await tenant.save({ session });

    // Update unit status to occupied and set current tenant
    unit.status = "occupied";
    unit.currentTenant = tenant._id;
    await unit.save({ session });

    await session.commitTransaction();

    // Return populated tenant data
    const populatedTenant = await Tenant.findById(tenant._id)
      .populate("unitId")
      .populate("propertyId", "name");

    res.status(201).json(populatedTenant);
  } catch (error) {
    await session.abortTransaction();
    logger.error(`Error creating tenant: ${error.message}`);
    res.status(400).json({ error: error.message });
  } finally {
    session.endSession();
  }
};

export const updateTenant = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const tenant = await Tenant.findById(req.params.id).session(session);
    if (!tenant) {
      return res.status(404).json({ error: "Tenant not found" });
    }

    const oldUnitId = tenant.unitId;
    const newUnitId = req.body.unitId;

    // If changing units
    if (newUnitId && newUnitId.toString() !== oldUnitId.toString()) {
      // Check if new unit exists and is available
      const newUnit = await Unit.findById(newUnitId).session(session);
      if (!newUnit) {
        return res.status(404).json({ error: "New unit not found" });
      }

      if (newUnit.status !== "available" && newUnit.status !== "reserved") {
        return res
          .status(400)
          .json({ error: "New unit is not available for assignment" });
      }

      // Update old unit if it exists
      const oldUnit = await Unit.findById(oldUnitId).session(session);
      if (
        oldUnit &&
        oldUnit.currentTenant &&
        oldUnit.currentTenant.toString() === tenant._id.toString()
      ) {
        oldUnit.status = "available";
        oldUnit.currentTenant = null;
        await oldUnit.save({ session });
      }

      // Update new unit
      newUnit.status = "occupied";
      newUnit.currentTenant = tenant._id;
      await newUnit.save({ session });

      // Update tenant's propertyId if needed
      if (newUnit.propertyId.toString() !== tenant.propertyId.toString()) {
        tenant.propertyId = newUnit.propertyId;
      }
    }

    // Handle status change - if tenant is made inactive, update unit
    if (req.body.status && req.body.status !== tenant.status) {
      if (req.body.status === "past" || req.body.status === "blacklisted") {
        // Find and update the unit if this tenant is currently assigned
        const unit = await Unit.findOne({ currentTenant: tenant._id }).session(
          session
        );
        if (unit) {
          unit.status = "available";
          unit.currentTenant = null;
          await unit.save({ session });
        }
      }
    }

    // Update tenant fields
    const allowedUpdates = [
      "firstName",
      "lastName",
      "email",
      "phone",
      "status",
      "identificationDetails",
      "leaseDetails",
      "emergencyContact",
    ];

    allowedUpdates.forEach((field) => {
      if (req.body[field] !== undefined) {
        tenant[field] = req.body[field];
      }
    });

    // Update unitId after validation (this is safe now)
    if (newUnitId) {
      tenant.unitId = newUnitId;
    }

    await tenant.save({ session });
    await session.commitTransaction();

    // Return populated tenant data
    const updatedTenant = await Tenant.findById(tenant._id)
      .populate("unitId")
      .populate("propertyId", "name");

    res.json(updatedTenant);
  } catch (error) {
    await session.abortTransaction();
    logger.error(`Error updating tenant: ${error.message}`);
    res.status(400).json({ error: error.message });
  } finally {
    session.endSession();
  }
};

export const endTenancy = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const tenant = await Tenant.findById(req.params.id).session(session);
    if (!tenant) {
      return res.status(404).json({ error: "Tenant not found" });
    }

    // Update tenant status
    tenant.status = "past";

    if (req.body.endDate) {
      if (!tenant.leaseDetails) {
        tenant.leaseDetails = {};
      }
      tenant.leaseDetails.endDate = new Date(req.body.endDate);
    } else {
      // If no end date provided, use current date
      if (!tenant.leaseDetails) {
        tenant.leaseDetails = {};
      }
      tenant.leaseDetails.endDate = new Date();
    }

    await tenant.save({ session });

    // Update unit status
    const unit = await Unit.findById(tenant.unitId).session(session);
    if (
      unit &&
      unit.currentTenant &&
      unit.currentTenant.toString() === tenant._id.toString()
    ) {
      unit.status = "available";
      unit.currentTenant = null;
      await unit.save({ session });
    }

    await session.commitTransaction();
    res.json({ message: "Tenancy ended successfully", tenant });
  } catch (error) {
    await session.abortTransaction();
    logger.error(`Error ending tenancy: ${error.message}`);
    res.status(400).json({ error: error.message });
  } finally {
    session.endSession();
  }
};

export const recordPayment = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const tenant = await Tenant.findById(req.params.id).session(session);
    if (!tenant) {
      return res.status(404).json({ error: "Tenant not found" });
    }

    // Create payment record
    const payment = {
      date: new Date(),
      amount: req.body.amount,
      type: req.body.type || "rent",
      status: "completed",
      reference:
        req.body.reference || `REF-${Date.now().toString(36).toUpperCase()}`,
      description: req.body.description,
    };

    // Update current balance
    const previousBalance = tenant.currentBalance || 0;
    tenant.currentBalance = previousBalance - payment.amount;

    // Add balance to payment record
    payment.balance = tenant.currentBalance;

    // Add to payment history
    if (!tenant.paymentHistory) {
      tenant.paymentHistory = [];
    }
    tenant.paymentHistory.push(payment);

    // If unit exists, update its balance and last payment date
    if (tenant.unitId) {
      const unit = await Unit.findById(tenant.unitId).session(session);
      if (unit) {
        unit.balance = (unit.balance || 0) - payment.amount;
        unit.lastPaymentDate = payment.date;
        await unit.save({ session });
      }
    }

    await tenant.save({ session });
    await session.commitTransaction();

    res.json(tenant);
  } catch (error) {
    await session.abortTransaction();
    logger.error(`Error recording payment: ${error.message}`);
    res.status(400).json({ error: error.message });
  } finally {
    session.endSession();
  }
};

export const deleteTenant = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const tenant = await Tenant.findById(req.params.id).session(session);
    if (!tenant) {
      return res.status(404).json({ error: "Tenant not found" });
    }

    // Check if tenant is currently assigned to a unit
    if (tenant.status === "active") {
      const unit = await Unit.findOne({ currentTenant: tenant._id }).session(
        session
      );
      if (unit) {
        return res.status(400).json({
          error:
            "Cannot delete active tenant. Please end tenancy first or update tenant status to inactive.",
        });
      }
    }

    // Safe to delete tenant now
    await tenant.deleteOne({ session });

    await session.commitTransaction();
    res.json({ message: "Tenant deleted successfully" });
  } catch (error) {
    await session.abortTransaction();
    logger.error(`Error deleting tenant: ${error.message}`);
    res.status(500).json({ error: error.message });
  } finally {
    session.endSession();
  }
};

export const getTenantsByProperty = async (req, res) => {
  try {
    const propertyId = req.params.propertyId;

    const tenants = await Tenant.find({ propertyId })
      .populate("unitId")
      .sort("lastName");

    res.json(tenants);
  } catch (error) {
    logger.error(`Error fetching property tenants: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
};

export const getTenantsByUnit = async (req, res) => {
  try {
    const unitId = req.params.unitId;

    const tenants = await Tenant.find({ unitId, status: "active" }).populate(
      "propertyId",
      "name"
    );

    res.json(tenants);
  } catch (error) {
    logger.error(`Error fetching unit tenants: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
};
