// backend/controllers/expenseController.js
import Expense from "../models/Expense.js";
import logger from "../utils/logger.js";

export const createExpense = async (req, res) => {
  try {
    const expenseData = { ...req.body };
    
    // Clean up empty unit field - convert empty string to null
    if (!expenseData.unit || expenseData.unit === "") {
      delete expenseData.unit; // Remove the field entirely
    }

    // Validate property exists
    if (!expenseData.property) {
      return res.status(400).json({ error: "Property is required" });
    }

    // Create the expense
    const expense = new Expense(expenseData);
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

export const getExpenses = async (req, res) => {
  try {
    const filter = {};

    // Apply filters from query params
    if (req.query.propertyId) filter.property = req.query.propertyId;
    if (req.query.unitId) filter.unit = req.query.unitId;
    if (req.query.category) filter.category = req.query.category;
    if (req.query.paymentStatus) filter.paymentStatus = req.query.paymentStatus;

    // Date range filters
    if (req.query.startDate || req.query.endDate) {
      filter.date = {};
      if (req.query.startDate) {
        filter.date.$gte = new Date(req.query.startDate);
      }
      if (req.query.endDate) {
        filter.date.$lte = new Date(req.query.endDate);
      }
    }

    const expenses = await Expense.find(filter)
      .populate("property", "name")
      .populate("unit", "unitNumber")
      .sort("-date");

    res.json(expenses);
  } catch (error) {
    logger.error(`Error fetching expenses: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
};

export const getExpenseById = async (req, res) => {
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

export const updateExpense = async (req, res) => {
  try {
    const updateData = { ...req.body };
    
    // Clean up empty unit field
    if (!updateData.unit || updateData.unit === "") {
      delete updateData.unit;
    }

    const expense = await Expense.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    )
      .populate("property", "name")
      .populate("unit", "unitNumber");

    if (!expense) {
      return res.status(404).json({ error: "Expense not found" });
    }

    res.json(expense);
  } catch (error) {
    logger.error(`Error updating expense: ${error.message}`);
    res.status(400).json({ error: error.message });
  }
};

export const deleteExpense = async (req, res) => {
  try {
    const expense = await Expense.findByIdAndDelete(req.params.id);

    if (!expense) {
      return res.status(404).json({ error: "Expense not found" });
    }

    res.json({ message: "Expense deleted successfully" });
  } catch (error) {
    logger.error(`Error deleting expense: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
};

export const getExpensesByProperty = async (req, res) => {
  try {
    const expenses = await Expense.find({ property: req.params.propertyId })
      .populate("unit", "unitNumber")
      .sort("-date");

    res.json(expenses);
  } catch (error) {
    logger.error(`Error fetching property expenses: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
};

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

export const getExpenseSummary = async (req, res) => {
  try {
    const { propertyId, startDate, endDate } = req.query;
    
    const matchQuery = {};
    if (propertyId) matchQuery.property = propertyId;
    
    if (startDate || endDate) {
      matchQuery.date = {};
      if (startDate) matchQuery.date.$gte = new Date(startDate);
      if (endDate) matchQuery.date.$lte = new Date(endDate);
    }

    const summary = await Expense.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: "$category",
          total: { $sum: "$amount" },
          count: { $sum: 1 },
          avgAmount: { $avg: "$amount" },
        },
      },
      { $sort: { total: -1 } },
    ]);

    const totalExpenses = summary.reduce((sum, cat) => sum + cat.total, 0);

    res.json({
      categories: summary,
      totalExpenses,
      totalCount: summary.reduce((sum, cat) => sum + cat.count, 0),
    });
  } catch (error) {
    logger.error(`Error fetching expense summary: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
};