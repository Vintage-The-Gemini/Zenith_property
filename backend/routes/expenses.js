// routes/expenses.js
import express from 'express';
import { 
  getExpenses, 
  createExpense, 
  updateExpense, 
  getRecurringExpenses,
  getExpensesByProperty 
} from '../controllers/expenseController.js';
import auth from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = express.Router();

router.use(auth);

router.get('/', getExpenses);
router.post('/', upload.array('documents'), createExpense);
router.put('/:id', upload.array('documents'), updateExpense);
router.get('/recurring', getRecurringExpenses);
router.get('/property/:propertyId', getExpensesByProperty);

export default router;