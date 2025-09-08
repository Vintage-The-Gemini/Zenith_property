// backend/routes/expenses.js
import express from "express";
import {
  getExpenses,
  getExpenseById,  // Changed from getExpense to getExpenseById
  createExpense,
  updateExpense,
  deleteExpense,
  getExpensesByProperty,
  getExpensesByUnit,
  getExpenseSummary,
} from "../controllers/expenseController.js";
import auth from "../middleware/auth.js";

const router = express.Router();

// Apply authentication middleware
router.use(auth);

// Expense routes
router.get("/", getExpenses);
router.get("/summary", getExpenseSummary);
router.get("/:id", getExpenseById);  // Using getExpenseById instead of getExpense
router.post("/", createExpense);
router.put("/:id", updateExpense);
router.delete("/:id", deleteExpense);

// Get expenses by property
router.get("/property/:propertyId", getExpensesByProperty);

// Get expenses by unit
router.get("/unit/:unitId", getExpensesByUnit);

export default router;