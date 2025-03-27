// backend/routes/dashboard.js
import express from "express";
import {
  getDashboardStats,
  getRecentActivities,
} from "../controllers/dashboardController.js";
import auth from "../middleware/auth.js";

const router = express.Router();

router.use(auth);

router.get("/stats", getDashboardStats);
router.get("/activities", getRecentActivities);

export default router;
