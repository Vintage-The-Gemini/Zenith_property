// backend/routes/maintenance.js
import express from "express";
import {
  getAllMaintenanceRequests,
  getMaintenanceRequestById,
  createMaintenanceRequest,
  updateMaintenanceRequest,
  addNoteToMaintenanceRequest,
  getMaintenanceByProperty,
  getMaintenanceByUnit,
  getMaintenanceByTenant,
  getMaintenanceStats,
} from "../controllers/maintenanceController.js"; // Using the existing filename with "maintainence" spelling
import auth from "../middleware/auth.js";
import { checkRole } from "../middleware/roleCheck.js";

const router = express.Router();

// Apply authentication to all routes
router.use(auth);

// Get all maintenance requests
router.get("/", getAllMaintenanceRequests);

// Get maintenance statistics
router.get("/stats", getMaintenanceStats);

// Get maintenance by property
router.get("/property/:propertyId", getMaintenanceByProperty);

// Get maintenance by unit
router.get("/unit/:unitId", getMaintenanceByUnit);

// Get maintenance by tenant
router.get("/tenant/:tenantId", getMaintenanceByTenant);

// Get maintenance request by ID
router.get("/:id", getMaintenanceRequestById);

// Create new maintenance request
router.post("/", createMaintenanceRequest);

// Update maintenance request
router.put("/:id", updateMaintenanceRequest);

// Add note to maintenance request
router.post("/:id/notes", addNoteToMaintenanceRequest);

export default router;
