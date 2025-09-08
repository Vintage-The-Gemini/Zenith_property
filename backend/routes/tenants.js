// routes/tenants.js
import express from "express";
import {
  getTenants,
  getTenant,
  createTenant,
  updateTenant,
  endTenancy,
  checkoutTenant,
  recordPayment,
  deleteTenant,
  getTenantsByProperty,
  getTenantsByUnit,
} from "../controllers/tenantController.js";
import auth from "../middleware/auth.js";
import { upload } from "../middleware/upload.js";

const router = express.Router();

router.use(auth);

// Get all tenants with optional filters
router.get("/", getTenants);

// Get tenant by ID
router.get("/:id", getTenant);

// Get tenants by property
router.get("/property/:propertyId", getTenantsByProperty);

// Get tenants by unit
router.get("/unit/:unitId", getTenantsByUnit);

// Create a new tenant
router.post("/", createTenant);

// Update tenant
router.put("/:id", upload.array("documents"), updateTenant);

// End tenancy (simple)
router.post("/:id/end-tenancy", endTenancy);

// Checkout tenant (comprehensive with balance settlement)
router.post("/:tenantId/checkout", checkoutTenant);

// Record payment
router.post("/:id/payments", recordPayment);

// Delete tenant
router.delete("/:id", deleteTenant);

export default router;
