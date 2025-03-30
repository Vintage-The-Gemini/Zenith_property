// frontend/src/services/expenseService.js
import api from "./api";
import { getErrorMessage } from "../utils/errorHandling";

/**
 * Get all expenses with optional filters
 * @param {Object} filters - Filter criteria like category, date range, propertyId
 * @returns {Promise<Array>} Array of expenses
 */
export const getAllExpenses = async (filters = {}) => {
  try {
    // Convert filters to query params
    const queryParams = new URLSearchParams();
    Object.keys(filters).forEach((key) => {
      if (filters[key]) {
        queryParams.append(key, filters[key]);
      }
    });

    const queryString = queryParams.toString();
    const url = queryString ? `/expenses?${queryString}` : "/expenses";

    const response = await api.get(url);
    return response.data;
  } catch (error) {
    console.error("Error fetching expenses:", error);
    throw new Error(getErrorMessage(error));
  }
};

/**
 * Get expense by ID
 * @param {string} id - Expense ID
 * @returns {Promise<Object>} Expense details
 */
export const getExpenseById = async (id) => {
  try {
    const response = await api.get(`/expenses/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching expense details:", error);
    throw new Error(getErrorMessage(error));
  }
};

/**
 * Create a new expense
 * @param {Object} expenseData - Expense data
 * @returns {Promise<Object>} Created expense
 */
export const createExpense = async (expenseData) => {
  try {
    const response = await api.post("/expenses", expenseData);
    return response.data;
  } catch (error) {
    console.error("Error creating expense:", error);
    throw new Error(getErrorMessage(error));
  }
};

/**
 * Update an existing expense
 * @param {string} id - Expense ID
 * @param {Object} expenseData - Updated expense data
 * @returns {Promise<Object>} Updated expense
 */
export const updateExpense = async (id, expenseData) => {
  try {
    const response = await api.put(`/expenses/${id}`, expenseData);
    return response.data;
  } catch (error) {
    console.error("Error updating expense:", error);
    throw new Error(getErrorMessage(error));
  }
};

/**
 * Delete an expense
 * @param {string} id - Expense ID
 * @returns {Promise<Object>} Deletion confirmation
 */
export const deleteExpense = async (id) => {
  try {
    const response = await api.delete(`/expenses/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error deleting expense:", error);
    throw new Error(getErrorMessage(error));
  }
};

/**
 * Get recurring expenses
 * @returns {Promise<Array>} Array of recurring expenses
 */
export const getRecurringExpenses = async () => {
  try {
    const response = await api.get("/expenses/recurring");
    return response.data;
  } catch (error) {
    console.error("Error fetching recurring expenses:", error);
    throw new Error(getErrorMessage(error));
  }
};

/**
 * Get expenses for a specific property
 * @param {string} propertyId - Property ID
 * @returns {Promise<Array>} Array of expenses for the property
 */
export const getExpensesByProperty = async (propertyId) => {
  try {
    const response = await api.get(`/expenses/property/${propertyId}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching property expenses:", error);
    throw new Error(getErrorMessage(error));
  }
};

export default {
  getAllExpenses,
  getExpenseById,
  createExpense,
  updateExpense,
  deleteExpense,
  getRecurringExpenses,
  getExpensesByProperty,
};
