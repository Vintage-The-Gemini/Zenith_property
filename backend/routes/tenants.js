// backend/routes/tenants.js
import express from 'express';
import {
  createTenant,
  getTenants,
  getTenantById,
  updateTenant,
  updateTenantStatus,
  uploadTenantDocument,
  verifyTenantDocument,
  deleteTenant,
  getTenantPaymentSummary
} from '../controllers/tenantController.js';
import auth from '../middleware/auth.js';
import { checkPermission } from '../middleware/rbac.js';
import { validateTenant, validate } from '../middleware/validators.js';
import { upload } from '../middleware/upload.js';

const router = express.Router();

// All routes require authentication
router.use(auth);

// GET /api/tenants - Get all tenants with filtering
router.get('/', 
  checkPermission('tenants', 'read'),
  getTenants
);

// POST /api/tenants - Create new tenant
router.post('/', 
  checkPermission('tenants', 'create'),
  upload.array('documents', 5), // Allow up to 5 document uploads
  validateTenant,
  validate,
  createTenant
);

// GET /api/tenants/:id - Get single tenant
router.get('/:id', 
  checkPermission('tenants', 'read'),
  getTenantById
);

// PUT /api/tenants/:id - Update tenant
router.put('/:id', 
  checkPermission('tenants', 'update'),
  upload.array('documents', 5),
  updateTenant
);

// PATCH /api/tenants/:id/status - Update tenant status
router.patch('/:id/status', 
  checkPermission('tenants', 'update'),
  updateTenantStatus
);

// POST /api/tenants/:id/documents - Upload tenant document
router.post('/:id/documents', 
  checkPermission('tenants', 'update'),
  upload.single('document'),
  uploadTenantDocument
);

// PATCH /api/tenants/:id/documents/:documentId/verify - Verify document
router.patch('/:id/documents/:documentId/verify', 
  checkPermission('tenants', 'verify'),
  verifyTenantDocument
);

// GET /api/tenants/:id/payments - Get tenant payment summary
router.get('/:id/payments', 
  checkPermission('tenants', 'read'),
  getTenantPaymentSummary
);

// DELETE /api/tenants/:id - Delete tenant (soft delete)
router.delete('/:id', 
  checkPermission('tenants', 'delete'),
  deleteTenant
);


// GET /api/tenants - Get all tenants with filtering
router.get('/', 
  checkPermission('tenants', 'read'),
  getTenants
);

// POST /api/tenants - Create new tenant
router.post('/', 
  checkPermission('tenants', 'create'),
  upload.array('documents', 5), // Allow up to 5 document uploads
  validateTenant,
  validate,
  createTenant
);

// GET /api/tenants/:id - Get single tenant
router.get('/:id', 
  checkPermission('tenants', 'read'),
  getTenantById
);

// PUT /api/tenants/:id - Update tenant
router.put('/:id', 
  checkPermission('tenants', 'update'),
  upload.array('documents', 5),
  updateTenant
);

// PATCH /api/tenants/:id/status - Update tenant status
router.patch('/:id/status', 
  checkPermission('tenants', 'update'),
  updateTenantStatus
);

// POST /api/tenants/:id/documents - Upload tenant document
router.post('/:id/documents', 
  checkPermission('tenants', 'update'),
  upload.single('document'),
  uploadTenantDocument
);

// PATCH /api/tenants/:id/documents/:documentId/verify - Verify document
router.patch('/:id/documents/:documentId/verify', 
  checkPermission('tenants', 'verify'),
  verifyTenantDocument
);

// GET /api/tenants/:id/payments - Get tenant payment summary
router.get('/:id/payments', 
  checkPermission('tenants', 'read'),
  getTenantPaymentSummary
);

// DELETE /api/tenants/:id - Delete tenant (soft delete)
router.delete('/:id', 
  checkPermission('tenants', 'delete'),
  deleteTenant
);

export default router;