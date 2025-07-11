// backend/routes/expenses.js
import express from 'express';
import {
  createExpense,
  getExpenses,
  getExpenseById,
  updateExpense,
  deleteExpense,
  getExpenseSummary
} from '../controllers/expenseController.js';
import auth from '../middleware/auth.js';
import { checkPermission } from '../middleware/rbac.js';
import { validateExpense, validate } from '../middleware/validators.js';
import { upload } from '../middleware/upload.js';

const router = express.Router();

// All routes require authentication
router.use(auth);

// GET /api/expenses - Get all expenses with filtering
router.get('/', 
  checkPermission('expenses', 'read'),
  getExpenses
);

// POST /api/expenses - Create new expense
router.post('/', 
  checkPermission('expenses', 'create'),
  upload.single('receipt'),
  validateExpense,
  validate,
  createExpense
);

// GET /api/expenses/summary - Get expense summary and analytics
router.get('/summary', 
  checkPermission('expenses', 'read'),
  getExpenseSummary
);

// GET /api/expenses/:id - Get single expense
router.get('/:id', 
  checkPermission('expenses', 'read'),
  getExpenseById
);

// PUT /api/expenses/:id - Update expense
router.put('/:id', 
  checkPermission('expenses', 'update'),
  upload.single('receipt'),
  updateExpense
);

// DELETE /api/expenses/:id - Delete expense (soft delete)
router.delete('/:id', 
  checkPermission('expenses', 'delete'),
  deleteExpense
);

export default router;