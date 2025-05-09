// backend/controllers/expenseController.js
import Expense from "../models/Expense.js";
import Property from "../models/Property.js";
import mongoose from "mongoose";
import logger from "../utils/logger.js";

/**
 * Get all expenses with filters
 */
export const getExpenses = async (req, res) => {
  try {
    // Apply filters
    const filters = {};
    
    if (req.query.category) filters.category = req.query.category;
    if (req.query.status) filters.paymentStatus = req.query.status;
    if (req.query.propertyId) filters.property = req.query.propertyId;
    if (req.query.unitId) filters.unit = req.query.unitId;
    
    // Date range filters
    if (req.query.startDate || req.query.endDate) {
      filters.date = {};
      if (req.query.startDate) {
        filters.date.$gte = new Date(req.query.startDate);
      }
      if (req.query.endDate) {
        const endDate = new Date(req.query.endDate);
        endDate.setHours(23, 59, 59);
        filters.date.$lte = endDate;
      }
    }
    
    const expenses = await Expense.find(filters)
      .populate("property", "name")
      .populate("unit", "unitNumber")
      .sort("-date");
      
    res.json(expenses);
  } catch (error) {
    logger.error(`Error fetching expenses: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get expense by ID
 */
export const getExpense = async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id)
      .populate("property", "name")
      .populate("unit", "unitNumber");
      
    if (!expense) {
      return res.status(404).json({ error: "Expense not found" });
    }
    
    res.json(expense);
  } catch (error) {
    logger.error(`Error fetching expense: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Create a new expense
 */
export const createExpense = async (req, res) => {
  try {
    // Verify property exists
    const property = await Property.findById(req.body.property);
    if (!property) {
      return res.status(404).json({ error: "Property not found" });
    }
    
    // Create the expense
    const expense = new Expense(req.body);
    await expense.save();
    
    // Return populated expense
    const populatedExpense = await Expense.findById(expense._id)
      .populate("property", "name")
      .populate("unit", "unitNumber");
      
    res.status(201).json(populatedExpense);
  } catch (error) {
    logger.error(`Error creating expense: ${error.message}`);
    res.status(400).json({ error: error.message });
  }
};

/**
 * Update an expense
 */
export const updateExpense = async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);
    if (!expense) {
      return res.status(404).json({ error: "Expense not found" });
    }
    
    // Update fields
    const allowedUpdates = [
      "category", 
      "customCategory", 
      "amount", 
      "date", 
      "description", 
      "paymentStatus", 
      "vendor", 
      "recurring",
      "unit"
    ];
    
    // Don't allow changing the property
    delete req.body.property;
    
    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        expense[field] = req.body[field];
      }
    });
    
    await expense.save();
    
    // Return updated expense
    const updatedExpense = await Expense.findById(expense._id)
      .populate("property", "name")
      .populate("unit", "unitNumber");
      
    res.json(updatedExpense);
  } catch (error) {
    logger.error(`Error updating expense: ${error.message}`);
    res.status(400).json({ error: error.message });
  }
};

/**
 * Delete an expense
 */
export const deleteExpense = async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);
    if (!expense) {
      return res.status(404).json({ error: "Expense not found" });
    }
    
    await expense.remove();
    res.json({ message: "Expense deleted successfully" });
  } catch (error) {
    logger.error(`Error deleting expense: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get expenses by property
 */
export const getExpensesByProperty = async (req, res) => {
  try {
    const expenses = await Expense.find({ property: req.params.propertyId })
      .populate("property", "name")
      .populate("unit", "unitNumber")
      .sort("-date");
      
    res.json(expenses);
  } catch (error) {
    logger.error(`Error fetching property expenses: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get expenses by unit
 */
export const getExpensesByUnit = async (req, res) => {
  try {
    const expenses = await Expense.find({ unit: req.params.unitId })
      .populate("property", "name")
      .sort("-date");
      
    res.json(expenses);
  } catch (error) {
    logger.error(`Error fetching unit expenses: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
};

export default {
  getExpenses,
  getExpense,
  createExpense,
  updateExpense,
  deleteExpense,
  getExpensesByProperty,
  getExpensesByUnit
};