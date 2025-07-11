// backend/routes/payments.js
import express from 'express';
import {
  createPayment,
  getPayments,
  getPaymentById,
  updatePayment,
  deletePayment,
  getPaymentAnalytics
} from '../controllers/paymentController.js';
import auth from '../middleware/auth.js';
import { checkPermission } from '../middleware/rbac.js';

const router = express.Router();

// All routes require authentication
router.use(auth);

// GET /api/payments - Get all payments with filtering
router.get('/', 
  checkPermission('payments', 'read'),
  getPayments
);

// POST /api/payments - Create new payment
router.post('/', 
  checkPermission('payments', 'create'),
  createPayment
);

// GET /api/payments/analytics - Get payment analytics
router.get('/analytics', 
  checkPermission('payments', 'read'),
  getPaymentAnalytics
);

// GET /api/payments/:id - Get single payment
router.get('/:id', 
  checkPermission('payments', 'read'),
  getPaymentById
);

// PUT /api/payments/:id - Update payment
router.put('/:id', 
  checkPermission('payments', 'update'),
  updatePayment
);

// DELETE /api/payments/:id - Delete payment
router.delete('/:id', 
  checkPermission('payments', 'delete'),
  deletePayment
);

export default router;