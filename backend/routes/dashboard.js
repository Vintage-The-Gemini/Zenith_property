// backend/routes/dashboard.js
import express from "express";
import auth from "../middleware/auth.js";
import { getDashboardSummary } from "../controllers/dashboardController.js";

const router = express.Router();

// Apply authentication to all dashboard routes
router.use(auth);

// Dashboard routes
router.get("/summary", getDashboardSummary);

export default router;