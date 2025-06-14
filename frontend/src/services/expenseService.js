// frontend/src/services/expenseService.js
import api from "./api";
import { getErrorMessage } from "../utils/errorHandling";

/**
 * Get all expenses with optional filters
 * @param {Object} filters - Filter options
 * @returns {Promise<Array>} Array of expenses
 */
export const getAllExpenses = async (filters = {}) => {
  try {
    const queryParams = new URLSearchParams();
    
    // Add filters to query params
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
 * @returns {Promise<Object>} Expense data
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
    // Clean up data before sending
    const cleanedData = { ...expenseData };
    
    // If unit is empty string, remove it from the request
    if (!cleanedData.unit || cleanedData.unit === "") {
      delete cleanedData.unit;
    }

    const response = await api.post("/expenses", cleanedData);
    return response.data;
  } catch (error) {
    console.error("Error creating expense:", error);
    throw new Error(getErrorMessage(error));
  }
};

/**
 * Update an expense
 * @param {string} id - Expense ID
 * @param {Object} expenseData - Updated expense data
 * @returns {Promise<Object>} Updated expense
 */
export const updateExpense = async (id, expenseData) => {
  try {
    // Clean up data before sending
    const cleanedData = { ...expenseData };
    
    // If unit is empty string, remove it from the request
    if (!cleanedData.unit || cleanedData.unit === "") {
      delete cleanedData.unit;
    }

    const response = await api.put(`/expenses/${id}`, cleanedData);
    return response.data;
  } catch (error) {
    console.error("Error updating expense:", error);
    throw new Error(getErrorMessage(error));
  }
};

/**
 * Delete an expense
 * @param {string} id - Expense ID
 * @returns {Promise<Object>} Response data
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
 * Get expenses by property
 * @param {string} propertyId - Property ID
 * @returns {Promise<Array>} Property expenses
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

/**
 * Get expenses by unit
 * @param {string} unitId - Unit ID
 * @returns {Promise<Array>} Unit expenses
 */
export const getExpensesByUnit = async (unitId) => {
  try {
    const response = await api.get(`/expenses/unit/${unitId}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching unit expenses:", error);
    throw new Error(getErrorMessage(error));
  }
};

/**
 * Get expense summary statistics
 * @param {Object} filters - Filter options
 * @returns {Promise<Object>} Expense summary
 */
export const getExpenseSummary = async (filters = {}) => {
  try {
    const queryParams = new URLSearchParams();
    
    Object.keys(filters).forEach((key) => {
      if (filters[key]) {
        queryParams.append(key, filters[key]);
      }
    });

    const queryString = queryParams.toString();
    const url = queryString ? `/expenses/summary?${queryString}` : "/expenses/summary";

    const response = await api.get(url);
    return response.data;
  } catch (error) {
    console.error("Error fetching expense summary:", error);
    throw new Error(getErrorMessage(error));
  }
};

export default {
  getAllExpenses,
  getExpenseById,
  createExpense,
  updateExpense,
  deleteExpense,
  getExpensesByProperty,
  getExpensesByUnit,
  getExpenseSummary,
};