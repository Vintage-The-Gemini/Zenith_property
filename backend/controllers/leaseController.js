// controllers/leaseController.js
import Lease from "../models/Lease.js";
import Tenant from "../models/Tenant.js";
import Unit from "../models/Unit.js";
import mongoose from "mongoose";
import logger from "../utils/logger.js";

// Get all leases
export const getLeases = async (req, res) => {
  try {
    // Apply filters if provided
    const filters = {};
    if (req.query.propertyId) filters.property = req.query.propertyId;
    if (req.query.unitId) filters.unit = req.query.unitId;
    if (req.query.tenantId) filters.tenant = req.query.tenantId;
    if (req.query.status) filters.status = req.query.status;

    const leases = await Lease.find(filters)
      .populate("tenant", "firstName lastName email phone")
      .populate("unit", "unitNumber floorNumber")
      .populate("property", "name")
      .sort("-startDate");

    res.json(leases);
  } catch (error) {
    logger.error(`Error fetching leases: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
};

// Get lease by ID
export const getLease = async (req, res) => {
  try {
    const lease = await Lease.findById(req.params.id)
      .populate("tenant", "firstName lastName email phone")
      .populate("unit", "unitNumber floorNumber propertyId")
      .populate("property", "name address");

    if (!lease) {
      return res.status(404).json({ error: "Lease not found" });
    }

    res.json(lease);
  } catch (error) {
    logger.error(`Error fetching lease: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
};

// Create new lease
export const createLease = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Check if unit and tenant exist
    const unit = await Unit.findById(req.body.unit);
    if (!unit) {
      return res.status(404).json({ error: "Unit not found" });
    }

    const tenant = await Tenant.findById(req.body.tenant);
    if (!tenant) {
      return res.status(404).json({ error: "Tenant not found" });
    }

    // Check if unit is available
    if (unit.status !== "available" && unit.status !== "reserved") {
      return res
        .status(400)
        .json({ error: "Unit is not available for leasing" });
    }

    // Create lease
    const lease = new Lease({
      ...req.body,
      property: unit.propertyId, // Ensure property is set from unit
    });

    await lease.save({ session });

    // Update tenant's leaseDetails
    tenant.leaseDetails = {
      startDate: lease.startDate,
      endDate: lease.endDate,
      rentAmount: lease.rentAmount,
      securityDeposit: lease.securityDeposit,
      paymentFrequency: lease.paymentFrequency,
    };

    // Add lease document if provided
    if (req.file) {
      lease.agreementDocument = {
        path: req.file.path,
        uploadDate: new Date(),
        verified: false,
      };

      tenant.documents.push({
        type: "leaseAgreement",
        name: req.file.originalname,
        path: req.file.path,
        uploadDate: new Date(),
        verified: false,
      });
    }

    await tenant.save({ session });

    // Update unit status to occupied
    unit.status = "occupied";
    unit.currentTenant = tenant._id;
    await unit.save({ session });

    await session.commitTransaction();
    res.status(201).json(lease);
  } catch (error) {
    await session.abortTransaction();
    logger.error(`Error creating lease: ${error.message}`);
    res.status(400).json({ error: error.message });
  } finally {
    session.endSession();
  }
};

// Update lease
export const updateLease = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const lease = await Lease.findById(req.params.id);
    if (!lease) {
      return res.status(404).json({ error: "Lease not found" });
    }

    // Handle lease document upload
    if (req.file) {
      lease.agreementDocument = {
        path: req.file.path,
        uploadDate: new Date(),
        verified: false,
      };

      // Update tenant document as well
      await Tenant.updateOne(
        { _id: lease.tenant },
        {
          $push: {
            documents: {
              type: "leaseAgreement",
              name: req.file.originalname,
              path: req.file.path,
              uploadDate: new Date(),
              verified: false,
            },
          },
        },
        { session }
      );
    }

    // Handle lease renewal
    // controllers/leaseController.js (continued)
    // Handle lease renewal
    if (
      req.body.endDate &&
      new Date(req.body.endDate) > new Date(lease.endDate)
    ) {
      lease.renewalHistory.push({
        previousEndDate: lease.endDate,
        newEndDate: new Date(req.body.endDate),
        rentAmount: req.body.rentAmount || lease.rentAmount,
        renewalDate: new Date(),
        notes: req.body.renewalNotes || "Lease renewed",
      });
    }

    // Handle lease termination
    if (req.body.status === "terminated" && lease.status !== "terminated") {
      lease.terminationDate = req.body.terminationDate || new Date();
      lease.terminationReason = req.body.terminationReason;

      // Update unit status
      await Unit.updateOne(
        { _id: lease.unit },
        {
          status: "available",
          $unset: { currentTenant: 1 },
        },
        { session }
      );

      // Update tenant status
      await Tenant.updateOne(
        { _id: lease.tenant },
        { status: "past" },
        { session }
      );
    }

    // Update lease fields
    Object.keys(req.body).forEach((key) => {
      lease[key] = req.body[key];
    });

    await lease.save({ session });

    // If rent amount or dates changed, update tenant's lease details
    if (
      req.body.rentAmount ||
      req.body.startDate ||
      req.body.endDate ||
      req.body.paymentFrequency
    ) {
      const updateFields = {};
      if (req.body.rentAmount)
        updateFields["leaseDetails.rentAmount"] = req.body.rentAmount;
      if (req.body.startDate)
        updateFields["leaseDetails.startDate"] = req.body.startDate;
      if (req.body.endDate)
        updateFields["leaseDetails.endDate"] = req.body.endDate;
      if (req.body.paymentFrequency)
        updateFields["leaseDetails.paymentFrequency"] =
          req.body.paymentFrequency;

      await Tenant.updateOne(
        { _id: lease.tenant },
        { $set: updateFields },
        { session }
      );
    }

    await session.commitTransaction();
    res.json(lease);
  } catch (error) {
    await session.abortTransaction();
    logger.error(`Error updating lease: ${error.message}`);
    res.status(400).json({ error: error.message });
  } finally {
    session.endSession();
  }
};

// Verify lease agreement document
export const verifyLeaseDocument = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const lease = await Lease.findById(req.params.id);
    if (!lease) {
      return res.status(404).json({ error: "Lease not found" });
    }

    if (!lease.agreementDocument || !lease.agreementDocument.path) {
      return res
        .status(400)
        .json({ error: "No lease agreement document found" });
    }

    // Update lease agreement verification status
    lease.agreementDocument.verified = true;
    await lease.save({ session });

    // Update tenant document verification status
    await Tenant.updateOne(
      {
        _id: lease.tenant,
        "documents.type": "leaseAgreement",
      },
      {
        $set: { "documents.$.verified": true },
      },
      { session }
    );

    await session.commitTransaction();
    res.json(lease);
  } catch (error) {
    await session.abortTransaction();
    logger.error(`Error verifying lease document: ${error.message}`);
    res.status(400).json({ error: error.message });
  } finally {
    session.endSession();
  }
};
