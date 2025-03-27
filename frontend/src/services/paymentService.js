// frontend/src/services/paymentService.js
import api from "./api";

/**
 * Get all payments
 * @returns {Promise<Array>} Array of payments
 */
const getAllPayments = async () => {
  try {
    const response = await api.get("/payments");
    return response.data;
  } catch (error) {
    console.error("Error fetching payments:", error);
    throw error;
  }
};

/**
 * Get payment by ID
 * @param {string} id - Payment ID
 * @returns {Promise<Object>} Payment data
 */
const getPaymentById = async (id) => {
  try {
    const response = await api.get(`/payments/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching payment details:", error);
    throw error;
  }
};

/**
 * Create a new payment
 * @param {Object} paymentData - Payment data
 * @returns {Promise<Object>} Created payment
 */
const createPayment = async (paymentData) => {
  try {
    const response = await api.post("/payments", paymentData);
    return response.data;
  } catch (error) {
    console.error("Error creating payment:", error);
    throw error;
  }
};

/**
 * Update payment status
 * @param {string} id - Payment ID
 * @param {string} status - New status
 * @param {string} paymentMethod - Payment method (optional)
 * @returns {Promise<Object>} Updated payment
 */
const updatePaymentStatus = async (id, status, paymentMethod = null) => {
  try {
    const data = { status };
    if (paymentMethod) {
      data.paymentMethod = paymentMethod;
    }

    const response = await api.patch(`/payments/${id}/status`, data);
    return response.data;
  } catch (error) {
    console.error("Error updating payment status:", error);
    throw error;
  }
};

/**
 * Get payment summary statistics
 * @returns {Promise<Object>} Payment statistics
 */
const getPaymentSummary = async () => {
  try {
    const response = await api.get("/payments/summary");
    return response.data;
  } catch (error) {
    console.error("Error fetching payment summary:", error);
    throw error;
  }
};

/**
 * Get payments by tenant
 * @param {string} tenantId - Tenant ID
 * @returns {Promise<Array>} Array of payments
 */
const getPaymentsByTenant = async (tenantId) => {
  try {
    const response = await api.get(`/payments/tenant/${tenantId}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching tenant payments:", error);
    throw error;
  }
};

/**
 * Get payments by property
 * @param {string} propertyId - Property ID
 * @returns {Promise<Array>} Array of payments
 */
const getPaymentsByProperty = async (propertyId) => {
  try {
    const response = await api.get(`/payments/property/${propertyId}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching property payments:", error);
    throw error;
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
};
