// backend/routes/properties.js
import express from 'express';
import {
  getProperties,
  getPropertyById,
  createProperty,
  updateProperty,
  deleteProperty,
  getPropertyDashboard
} from '../controllers/propertyController.js';
import auth from '../middleware/auth.js';
import { checkPermission } from '../middleware/rbac.js';
import { validateProperty, validate } from '../middleware/validators.js';

const router = express.Router();

// All routes require authentication
router.use(auth);

// GET /api/properties - Get all properties
router.get('/', 
  checkPermission('properties', 'read'),
  getProperties
);

// POST /api/properties - Create new property
router.post('/', 
  checkPermission('properties', 'create'),
  validateProperty,
  validate,
  createProperty
);

// GET /api/properties/:id - Get single property
router.get('/:id', 
  checkPermission('properties', 'read'),
  getPropertyById
);

// GET /api/properties/:id/dashboard - Get property dashboard
router.get('/:id/dashboard', 
  checkPermission('properties', 'read'),
  getPropertyDashboard
);

// PUT /api/properties/:id - Update property
router.put('/:id', 
  checkPermission('properties', 'update'),
  updateProperty
);

// DELETE /api/properties/:id - Delete property with safety checks
router.delete('/:id', 
  checkPermission('properties', 'delete'),
  deleteProperty
);

export default router;