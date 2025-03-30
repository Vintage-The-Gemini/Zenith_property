// backend/controllers/expenseController.js
import mongoose from "mongoose";
import Expense from "../models/Expense.js";
import Property from "../models/Property.js";

export const getExpenses = async (req, res) => {
  try {
    const expenses = await Expense.find().populate("property").populate("unit");
    res.json(expenses);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createExpense = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Create a modified request body that excludes empty unit field
    const expenseData = { ...req.body };

    // If unit is empty string, remove it from the data
    if (expenseData.unit === "") {
      delete expenseData.unit;
    }

    const expense = new Expense(expenseData);
    await expense.save({ session });

    // Add expense to property
    const property = await Property.findById(req.body.property);
    if (property) {
      if (!property.expenses) {
        property.expenses = [];
      }
      property.expenses.push(expense._id);
      await property.save({ session });
    }

    await session.commitTransaction();
    res.status(201).json(expense);
  } catch (error) {
    await session.abortTransaction();
    res.status(400).json({ error: error.message });
  } finally {
    session.endSession();
  }
};

export const updateExpense = async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);
    if (!expense) {
      return res.status(404).json({ error: "Expense not found" });
    }

    // Handle documents if any
    if (req.files) {
      const documents = req.files.map((file) => ({
        title: file.originalname,
        path: file.path,
        uploadDate: new Date(),
      }));
      expense.documents.push(...documents);
    }

    // Create a modified request body that excludes empty unit field
    const expenseData = { ...req.body };

    // If unit is empty string, remove it from the data
    if (expenseData.unit === "") {
      delete expenseData.unit;
    }

    Object.assign(expense, expenseData);
    await expense.save();
    res.json(expense);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const getRecurringExpenses = async (req, res) => {
  try {
    const recurringExpenses = await Expense.find({
      "recurring.isRecurring": true,
    }).populate("property");
    res.json(recurringExpenses);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getExpensesByProperty = async (req, res) => {
  try {
    const expenses = await Expense.find({
      property: req.params.propertyId,
    }).populate("unit");
    res.json(expenses);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
