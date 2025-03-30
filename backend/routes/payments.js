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
} from "../controllers/paymentController.js";
import auth from "../middleware/auth.js";

const router = express.Router();

// Apply authentication middleware to all routes
router.use(auth);

// Get all payments
router.get("/", getPayments);

// Get payment summary
router.get("/summary", getPaymentSummary);

// Get payment by ID
router.get("/:id", getPayment);

// Create new payment
router.post("/", createPayment);

// Update payment status
router.patch("/:id/status", updatePaymentStatus);

// Get payments by tenant
router.get("/tenant/:tenantId", getPaymentsByTenant);

// Get payments by property
router.get("/property/:propertyId", getPaymentsByProperty);

// Get payments by unit
router.get("/unit/:unitId", getPaymentsByUnit);

export default router;
