// controllers/tenantController.js
import Tenant from "../models/Tenant.js";
import Unit from "../models/Unit.js";
import Payment from "../models/Payment.js";
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

    // Verify that unit belongs to the specified property
    if (unit.propertyId.toString() !== propertyId) {
      return res.status(400).json({
        error: "Unit does not belong to the specified property",
      });
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

    // Calculate initial balance if lease details are provided BEFORE committing transaction
    if (tenant.leaseDetails?.startDate && tenant.leaseDetails?.rentAmount) {
      const leaseStart = new Date(tenant.leaseDetails.startDate);
      const now = new Date();
      let totalAmountDue = 0;

      // Calculate how many rent periods have passed since lease start
      if (leaseStart <= now) {
        const currentDate = new Date(leaseStart);
        
        // Count complete months from lease start to now
        while (currentDate <= now) {
          totalAmountDue += tenant.leaseDetails.rentAmount;
          currentDate.setMonth(currentDate.getMonth() + 1);
        }
      }

      // Update tenant's current balance within the session
      tenant.currentBalance = totalAmountDue;
      await tenant.save({ session });
      
      logger.info(`Initial balance calculated for tenant ${tenant.firstName} ${tenant.lastName}: KES ${totalAmountDue.toLocaleString()}`);
    }

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

// Comprehensive tenant checkout with balance settlement
export const checkoutTenant = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { tenantId } = req.params;
    const { 
      checkoutDate = new Date(),
      finalPayment = 0,
      securityDepositRefund = 0,
      notes = "",
      reason = "lease_ended"
    } = req.body;

    const tenant = await Tenant.findById(tenantId).session(session);
    if (!tenant) {
      return res.status(404).json({ error: "Tenant not found" });
    }

    if (tenant.status === "past") {
      return res.status(400).json({ error: "Tenant is already checked out" });
    }

    // Get tenant's current balance
    const currentBalance = tenant.currentBalance || 0;
    const finalAmount = parseFloat(finalPayment) || 0;
    const depositRefund = parseFloat(securityDepositRefund) || 0;

    // Calculate final balance settlement
    let finalBalance = currentBalance - finalAmount;
    if (depositRefund > 0) {
      finalBalance -= depositRefund; // Refund reduces what tenant owes
    }

    // Create final payment record if there's a payment
    if (finalAmount > 0) {
      const finalPaymentRecord = new Payment({
        tenant: tenantId,
        unit: tenant.unitId,
        property: tenant.propertyId,
        paymentPeriod: {
          month: new Date(checkoutDate).getMonth() + 1,
          year: new Date(checkoutDate).getFullYear(),
          startDate: new Date(checkoutDate),
          endDate: new Date(checkoutDate)
        },
        baseRentAmount: tenant.leaseDetails?.rentAmount || 0,
        balanceBeforePayment: currentBalance,
        amountDue: currentBalance,
        amountPaid: finalAmount,
        balanceAfterPayment: Math.max(0, currentBalance - finalAmount),
        monthlyRentDue: 0,
        cumulativeAmountDue: currentBalance,
        paymentSequence: 1,
        appliedToArears: Math.min(currentBalance, finalAmount),
        appliedToCurrentPeriod: 0,
        isOverpayment: finalAmount > currentBalance,
        isUnderpayment: finalAmount < currentBalance,
        isFullyPaid: finalAmount >= currentBalance,
        paymentDate: new Date(checkoutDate),
        dueDate: new Date(checkoutDate),
        paymentMethod: "cash",
        status: "completed",
        type: "other",
        description: `Final checkout payment - ${reason}`
      });

      await finalPaymentRecord.save({ session });

      // Add to tenant payment history
      if (!tenant.paymentHistory) {
        tenant.paymentHistory = [];
      }
      
      tenant.paymentHistory.push({
        date: new Date(checkoutDate),
        amount: finalAmount,
        type: "other",
        status: "completed",
        reference: finalPaymentRecord.reference,
        balance: Math.max(0, currentBalance - finalAmount),
        description: `Final checkout payment - ${reason}`
      });
    }

    // Create security deposit refund record if applicable
    if (depositRefund > 0) {
      if (!tenant.paymentHistory) {
        tenant.paymentHistory = [];
      }
      
      tenant.paymentHistory.push({
        date: new Date(checkoutDate),
        amount: -depositRefund, // Negative amount for refund
        type: "deposit",
        status: "completed",
        reference: `REFUND-${Date.now().toString(36).toUpperCase()}`,
        balance: finalBalance,
        description: `Security deposit refund - ${reason}`
      });
    }

    // Update tenant details
    tenant.status = "past";
    tenant.currentBalance = Math.max(0, finalBalance);
    
    if (!tenant.leaseDetails) {
      tenant.leaseDetails = {};
    }
    tenant.leaseDetails.endDate = new Date(checkoutDate);
    
    // Add checkout details
    tenant.checkoutDetails = {
      checkoutDate: new Date(checkoutDate),
      finalPayment: finalAmount,
      securityDepositRefund: depositRefund,
      finalBalance: Math.max(0, finalBalance),
      reason,
      notes,
      processedBy: req.user?.id,
      processedAt: new Date()
    };

    await tenant.save({ session });

    // Update unit status to available
    const unit = await Unit.findById(tenant.unitId).session(session);
    if (unit && unit.currentTenant?.toString() === tenantId) {
      unit.status = "available";
      unit.currentTenant = null;
      unit.balance = 0;
      unit.lastCheckoutDate = new Date(checkoutDate);
      await unit.save({ session });
    }

    await session.commitTransaction();

    // Return checkout summary
    const checkoutSummary = {
      message: "Tenant successfully checked out",
      tenant: await Tenant.findById(tenantId)
        .populate("unitId", "unitNumber")
        .populate("propertyId", "name"),
      checkoutSummary: {
        checkoutDate: new Date(checkoutDate),
        initialBalance: currentBalance,
        finalPayment: finalAmount,
        securityDepositRefund: depositRefund,
        finalBalance: Math.max(0, finalBalance),
        balanceStatus: finalBalance > 0 ? "outstanding" : (finalBalance < 0 ? "credit" : "settled"),
        reason,
        notes
      }
    };

    res.json(checkoutSummary);
  } catch (error) {
    await session.abortTransaction();
    logger.error(`Error during tenant checkout: ${error.message}`);
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
