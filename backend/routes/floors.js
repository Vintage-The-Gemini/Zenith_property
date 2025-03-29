// backend/routes/floors.js
import express from "express";
import {
  getFloorsByProperty,
  getFloor,
  createFloor,
  updateFloor,
  deleteFloor,
  getUnitsForFloor,
} from "../controllers/floorController.js";
import auth from "../middleware/auth.js";

const router = express.Router();

// Apply authentication to all routes
router.use(auth);

// Get all floors for a property
router.get("/property/:propertyId", getFloorsByProperty);

// Get a specific floor by ID
router.get("/:id", getFloor);

// Get all units for a specific floor
router.get("/:id/units", getUnitsForFloor);

// Create a new floor
router.post("/", createFloor);

// Update an existing floor
router.put("/:id", updateFloor);

// Delete a floor
router.delete("/:id", deleteFloor);

export default router;
