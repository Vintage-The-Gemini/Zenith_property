// backend/controllers/maintenanceController.js
import Maintenance from "../models/Maintenance.js";
import Property from "../models/Property.js";
import Unit from "../models/Unit.js";
import logger from "../utils/logger.js";

// Get all maintenance requests - primary function name
export const getAllMaintenanceRequests = async (req, res) => {
  try {
    const maintenanceRequests = await Maintenance.find()
      .populate("property", "name")
      .populate("unit", "unitNumber")
      .populate("tenant", "firstName lastName")
      .sort("-createdAt");

    res.json(maintenanceRequests);
  } catch (error) {
    logger.error(`Error in getAllMaintenanceRequests: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
};

// Alias for getAllMaintenanceRequests
export const getMaintenanceRequests = getAllMaintenanceRequests;

// Get maintenance request by ID - primary function name
export const getMaintenanceRequestById = async (req, res) => {
  try {
    const maintenanceRequest = await Maintenance.findById(req.params.id)
      .populate("property", "name address")
      .populate("unit", "unitNumber")
      .populate("tenant", "firstName lastName email phone");

    if (!maintenanceRequest) {
      return res.status(404).json({ error: "Maintenance request not found" });
    }

    res.json(maintenanceRequest);
  } catch (error) {
    logger.error(`Error in getMaintenanceRequestById: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
};

// Alias for getMaintenanceRequestById
export const getMaintenanceById = getMaintenanceRequestById;

// Create new maintenance request
export const createMaintenanceRequest = async (req, res) => {
  try {
    const {
      propertyId,
      unitId,
      tenantId,
      issue,
      description,
      priority,
      category,
    } = req.body;

    // Verify property exists
    const property = await Property.findById(propertyId);
    if (!property) {
      return res.status(404).json({ error: "Property not found" });
    }

    // Verify unit exists
    const unit = await Unit.findById(unitId);
    if (!unit) {
      return res.status(404).json({ error: "Unit not found" });
    }

    const maintenanceRequest = new Maintenance({
      property: propertyId,
      unit: unitId,
      tenant: tenantId,
      issue,
      description,
      priority: priority || "medium",
      category: category || "other",
      reportedBy: req.user
        ? `${req.user.firstName} ${req.user.lastName}`
        : "System",
    });

    await maintenanceRequest.save();

    res.status(201).json(maintenanceRequest);
  } catch (error) {
    logger.error(`Error in createMaintenanceRequest: ${error.message}`);
    res.status(400).json({ error: error.message });
  }
};

// Update maintenance request
export const updateMaintenanceRequest = async (req, res) => {
  try {
    const updates = req.body;
    const maintenanceRequest = await Maintenance.findById(req.params.id);

    if (!maintenanceRequest) {
      return res.status(404).json({ error: "Maintenance request not found" });
    }

    // Handle status change
    if (updates.status && updates.status !== maintenanceRequest.status) {
      if (updates.status === "completed") {
        updates.completionDate = new Date();
      }

      // Add a note about status change
      if (!updates.notes) {
        updates.notes = [...maintenanceRequest.notes];
      }

      updates.notes.push({
        content: `Status changed from ${maintenanceRequest.status} to ${updates.status}`,
        createdBy: req.user
          ? `${req.user.firstName} ${req.user.lastName}`
          : "System",
      });
    }

    // Apply all updates
    Object.keys(updates).forEach((key) => {
      maintenanceRequest[key] = updates[key];
    });

    await maintenanceRequest.save();

    res.json(maintenanceRequest);
  } catch (error) {
    logger.error(`Error in updateMaintenanceRequest: ${error.message}`);
    res.status(400).json({ error: error.message });
  }
};

// Delete maintenance request
export const deleteMaintenanceRequest = async (req, res) => {
  try {
    const maintenanceRequest = await Maintenance.findById(req.params.id);

    if (!maintenanceRequest) {
      return res.status(404).json({ error: "Maintenance request not found" });
    }

    await maintenanceRequest.deleteOne();

    res.json({ message: "Maintenance request deleted successfully" });
  } catch (error) {
    logger.error(`Error in deleteMaintenanceRequest: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
};

// Add note to maintenance request
export const addNoteToMaintenanceRequest = async (req, res) => {
  try {
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({ error: "Note content is required" });
    }

    const maintenanceRequest = await Maintenance.findById(req.params.id);

    if (!maintenanceRequest) {
      return res.status(404).json({ error: "Maintenance request not found" });
    }

    maintenanceRequest.notes.push({
      content,
      createdBy: req.user
        ? `${req.user.firstName} ${req.user.lastName}`
        : "System",
    });

    await maintenanceRequest.save();

    res.json(maintenanceRequest);
  } catch (error) {
    logger.error(`Error in addNoteToMaintenanceRequest: ${error.message}`);
    res.status(400).json({ error: error.message });
  }
};

// Get maintenance requests by property
export const getMaintenanceByProperty = async (req, res) => {
  try {
    const maintenanceRequests = await Maintenance.find({
      property: req.params.propertyId,
    })
      .populate("unit", "unitNumber")
      .populate("tenant", "firstName lastName")
      .sort("-createdAt");

    res.json(maintenanceRequests);
  } catch (error) {
    logger.error(`Error in getMaintenanceByProperty: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
};

// Get maintenance requests by unit
export const getMaintenanceByUnit = async (req, res) => {
  try {
    const maintenanceRequests = await Maintenance.find({
      unit: req.params.unitId,
    })
      .populate("property", "name")
      .populate("tenant", "firstName lastName")
      .sort("-createdAt");

    res.json(maintenanceRequests);
  } catch (error) {
    logger.error(`Error in getMaintenanceByUnit: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
};

// Get maintenance requests by tenant
export const getMaintenanceByTenant = async (req, res) => {
  try {
    const maintenanceRequests = await Maintenance.find({
      tenant: req.params.tenantId,
    })
      .populate("property", "name")
      .populate("unit", "unitNumber")
      .sort("-createdAt");

    res.json(maintenanceRequests);
  } catch (error) {
    logger.error(`Error in getMaintenanceByTenant: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
};

// Get maintenance request statistics
export const getMaintenanceStats = async (req, res) => {
  try {
    const totalRequests = await Maintenance.countDocuments();

    const pendingRequests = await Maintenance.countDocuments({
      status: "pending",
    });
    const inProgressRequests = await Maintenance.countDocuments({
      status: "in_progress",
    });
    const completedRequests = await Maintenance.countDocuments({
      status: "completed",
    });
    const cancelledRequests = await Maintenance.countDocuments({
      status: "cancelled",
    });

    const highPriority = await Maintenance.countDocuments({
      priority: "high",
      status: { $in: ["pending", "in_progress"] },
    });

    const emergencyPriority = await Maintenance.countDocuments({
      priority: "emergency",
      status: { $in: ["pending", "in_progress"] },
    });

    // Calculate average completion time for completed requests
    const completedWithDates = await Maintenance.find({
      status: "completed",
      completionDate: { $exists: true },
    });

    let averageCompletionTime = 0;
    if (completedWithDates.length > 0) {
      const totalCompletionTime = completedWithDates.reduce(
        (total, request) => {
          const reportedDate = new Date(request.reportedDate);
          const completionDate = new Date(request.completionDate);
          const timeDiff = completionDate.getTime() - reportedDate.getTime();
          // Convert to days
          return total + timeDiff / (1000 * 3600 * 24);
        },
        0
      );

      averageCompletionTime = totalCompletionTime / completedWithDates.length;
    }

    res.json({
      totalRequests,
      pendingRequests,
      inProgressRequests,
      completedRequests,
      cancelledRequests,
      highPriority,
      emergencyPriority,
      averageCompletionTime: parseFloat(averageCompletionTime.toFixed(1)),
    });
  } catch (error) {
    logger.error(`Error in getMaintenanceStats: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
};
