// backend/routes/reports.js
import express from "express";
import {
  getFinancialSummary,
  getOccupancyReport,
  getTenantPaymentReport,
  getRevenueVsExpenses,
  getLeaseExpirationReport,
  exportReport,
} from "../controllers/reportController.js";
import auth from "../middleware/auth.js";

const router = express.Router();

router.use(auth);

// Get financial summary report
router.get("/financial", getFinancialSummary);

// Get occupancy report
router.get("/occupancy", getOccupancyReport);

// Get tenant payment report
router.get("/tenant-payments", getTenantPaymentReport);

// Get revenue vs expenses report
router.get("/revenue-expenses", getRevenueVsExpenses);

// Get lease expiration report
router.get("/lease-expiration", getLeaseExpirationReport);

// Export report
router.get("/export/:type", exportReport);

export default router;
