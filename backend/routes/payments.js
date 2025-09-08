// backend/routes/payments.js
import express from "express";
import {
  getPayments,
  getPayment,
  createPayment,
  updatePaymentStatus,
  getPaymentsByTenant,
  getPaymentsByProperty,
  getPaymentsByUnit,
  getPaymentSummary,
  getTenantBalanceSummary,
  getTenantDetailedBalance,
} from "../controllers/paymentController.js";
import auth from "../middleware/auth.js";

const router = express.Router();

// Apply authentication middleware to all routes
router.use(auth);

// Get all payments (global admin view)
router.get("/", getPayments);

// Get payment summary
router.get("/summary", getPaymentSummary);

// Get tenant balance summary (for payment forms)
router.get("/tenant/:tenantId/balance", getTenantBalanceSummary);

// Get tenant detailed balance (with credits and arrears breakdown)
router.get("/tenant/:tenantId/detailed-balance", getTenantDetailedBalance);

// Get payment by ID
router.get("/:id", getPayment);

// Create new payment
router.post("/", createPayment);

// Update payment status
router.patch("/:id/status", updatePaymentStatus);

// Get payments by tenant
router.get("/tenant/:tenantId", getPaymentsByTenant);

// Get payments by property (property-specific management)
router.get("/property/:propertyId", getPaymentsByProperty);

// Get payments by unit
router.get("/unit/:unitId", getPaymentsByUnit);

export default router;
