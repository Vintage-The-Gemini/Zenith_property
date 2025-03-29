// routes/leases.js
import express from "express";
import {
  getLeases,
  getLease,
  createLease,
  updateLease,
  verifyLeaseDocument,
} from "../controllers/leaseController.js";
import auth from "../middleware/auth.js";
import { upload } from "../middleware/upload.js";

const router = express.Router();

router.use(auth);

router.get("/", getLeases);
router.get("/:id", getLease);
router.post("/", upload.single("agreementDocument"), createLease);
router.put("/:id", upload.single("agreementDocument"), updateLease);
router.patch("/:id/verify-document", verifyLeaseDocument);

export default router;
