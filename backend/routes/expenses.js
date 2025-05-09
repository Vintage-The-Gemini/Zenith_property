// backend/routes/expenses.js
import express from "express";
import {
  getExpenses,
  getExpense,
  createExpense,
  updateExpense,
  deleteExpense,
  getExpensesByProperty,
  getExpensesByUnit
} from "../controllers/expenseController.js";
import auth from "../middleware/auth.js";

const router = express.Router();

// Apply authentication
router.use(auth);

// Get all expenses
router.get("/", getExpenses);

// Get expense by ID
router.get("/:id", getExpense);

// Create expense
router.post("/", createExpense);

// Update expense
router.put("/:id", updateExpense);

// Delete expense
router.delete("/:id", deleteExpense);

// Get expenses by property
router.get("/property/:propertyId", getExpensesByProperty);

// Get expenses by unit
router.get("/unit/:unitId", getExpensesByUnit);

export default router;