// frontend/src/services/paymentService.js
import api from "./api";
import { getErrorMessage } from "../utils/errorHandling";

/**
 * Get all payments with optional filters
 * @param {Object} filters - Filter criteria like status, type, date range
 * @returns {Promise<Array>} Array of payments
 */
export const getAllPayments = async (filters = {}) => {
  try {
    // Convert filters to query params
    const queryParams = new URLSearchParams();
    Object.keys(filters).forEach((key) => {
      if (filters[key]) {
        queryParams.append(key, filters[key]);
      }
    });

    const queryString = queryParams.toString();
    const url = queryString ? `/payments?${queryString}` : "/payments";

    const response = await api.get(url);
    return response.data;
  } catch (error) {
    console.error("Error fetching payments:", error);
    throw new Error(getErrorMessage(error));
  }
};

/**
 * Get payment by ID
 * @param {string} id - Payment ID
 * @returns {Promise<Object>} Payment details
 */
export const getPaymentById = async (id) => {
  try {
    const response = await api.get(`/payments/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching payment details:", error);
    throw new Error(getErrorMessage(error));
  }
};

/**
 * Create a new payment
 * @param {Object} paymentData - Payment data
 * @returns {Promise<Object>} Created payment
 */
export const createPayment = async (paymentData) => {
  try {
    console.log("Creating payment with data:", paymentData);
    const response = await api.post("/payments", paymentData);
    return response.data;
  } catch (error) {
    console.error("Error creating payment:", error);
    throw new Error(getErrorMessage(error));
  }
};

/**
 * Update payment status
 * @param {string} id - Payment ID
 * @param {Object} data - Status update data
 * @returns {Promise<Object>} Updated payment
 */
export const updatePaymentStatus = async (id, data) => {
  try {
    const response = await api.patch(`/payments/${id}/status`, data);
    return response.data;
  } catch (error) {
    console.error("Error updating payment status:", error);
    throw new Error(getErrorMessage(error));
  }
};

/**
 * Get payment summary statistics
 * @returns {Promise<Object>} Payment statistics
 */
export const getPaymentSummary = async () => {
  try {
    const response = await api.get("/payments/summary");
    return response.data;
  } catch (error) {
    console.error("Error fetching payment summary:", error);
    throw new Error(getErrorMessage(error));
  }
};

/**
 * Get payments by tenant
 * @param {string} tenantId - Tenant ID
 * @returns {Promise<Array>} Tenant payments
 */
export const getPaymentsByTenant = async (tenantId) => {
  try {
    const response = await api.get(`/payments/tenant/${tenantId}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching tenant payments:", error);
    throw new Error(getErrorMessage(error));
  }
};

/**
 * Get payments by property
 * @param {string} propertyId - Property ID
 * @returns {Promise<Array>} Property payments
 */
export const getPaymentsByProperty = async (propertyId) => {
  try {
    const response = await api.get(`/payments/property/${propertyId}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching property payments:", error);
    throw new Error(getErrorMessage(error));
  }
};

/**
 * Get payments by unit
 * @param {string} unitId - Unit ID
 * @returns {Promise<Array>} Unit payments
 */
export const getPaymentsByUnit = async (unitId) => {
  try {
    const response = await api.get(`/payments/unit/${unitId}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching unit payments:", error);
    throw new Error(getErrorMessage(error));
  }
};

export default {
  getAllPayments,
  getPaymentById,
  createPayment,
  updatePaymentStatus,
  getPaymentSummary,
  getPaymentsByTenant,
  getPaymentsByProperty,
  getPaymentsByUnit,
};
