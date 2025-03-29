// routes/floors.js
import express from "express";
import {
  getFloorsByProperty,
  getFloor,
  createFloor,
  updateFloor,
  deleteFloor,
} from "../controllers/floorController.js";
import auth from "../middleware/auth.js";

const router = express.Router();

router.use(auth);

router.get("/property/:propertyId", getFloorsByProperty);
router.get("/:id", getFloor);
router.post("/", createFloor);
router.put("/:id", updateFloor);
router.delete("/:id", deleteFloor);

export default router;
