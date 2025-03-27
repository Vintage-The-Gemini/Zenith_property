// backend/routes/dashboard.js
import express from "express";
import {
  getDashboardStats,
  getRecentActivities,
} from "../controllers/dashboardController.js";
import auth from "../middleware/auth.js";

const router = express.Router();

// Apply authentication to all routes
router.use(auth);

// Get dashboard statistics
router.get("/stats", getDashboardStats);

// Get recent activities
router.get("/activities", getRecentActivities);

export default router;
