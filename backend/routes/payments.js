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

router.use(auth);

router.get("/", getPayments);
router.get("/summary", getPaymentSummary);
router.get("/:id", getPayment);
router.post("/", createPayment);
router.patch("/:id/status", updatePaymentStatus);
router.get("/tenant/:tenantId", getPaymentsByTenant);
router.get("/property/:propertyId", getPaymentsByProperty);
router.get("/unit/:unitId", getPaymentsByUnit);

export default router;
