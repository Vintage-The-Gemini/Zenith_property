// backend/routes/settings.js
import express from "express";
import {
  getBusinessSettings,
  updateBusinessSettings,
  exportData,
  getSystemStats,
  cleanupDatabase,
  testEmailConfig,
} from "../controllers/settingsController.js";
import auth from "../middleware/auth.js";
import { checkRole } from "../middleware/roleCheck.js";

const router = express.Router();

// Apply authentication to all routes
router.use(auth);

// Business settings routes
router.get("/business", getBusinessSettings);
router.put("/business", updateBusinessSettings);

// Data export route
router.get("/export", exportData);

// System statistics
router.get("/stats", getSystemStats);

// Email configuration test
router.post("/test-email", testEmailConfig);

// Database cleanup (admin only for safety)
router.post("/cleanup", checkRole(["admin"]), cleanupDatabase);

export default router;