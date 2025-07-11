// backend/routes/units.js
import express from 'express';
import {
  getUnits,
  getUnitById,
  createUnit,
  updateUnit,
  deleteUnit
} from '../controllers/unitController.js';
import auth from '../middleware/auth.js';
import { checkPermission } from '../middleware/rbac.js';
import { validateUnit, validate } from '../middleware/validators.js';

const router = express.Router();

// All routes require authentication
router.use(auth);

// GET /api/units - Get all units with filtering
router.get('/', 
  checkPermission('units', 'read'),
  getUnits
);

// POST /api/units - Create new unit
router.post('/', 
  checkPermission('units', 'create'),
  validateUnit,
  validate,
  createUnit
);

// GET /api/units/:id - Get single unit
router.get('/:id', 
  checkPermission('units', 'read'),
  getUnitById
);

// PUT /api/units/:id - Update unit
router.put('/:id', 
  checkPermission('units', 'update'),
  updateUnit
);

// DELETE /api/units/:id - Delete unit
router.delete('/:id', 
  checkPermission('units', 'delete'),
  deleteUnit
);

export default router;