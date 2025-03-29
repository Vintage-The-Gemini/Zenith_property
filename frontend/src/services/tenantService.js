// frontend/src/services/tenantService.js
import api from "./api";
import { getErrorMessage } from "../utils/errorHandling";

/**
 * Get all tenants with optional filters
 * @param {Object} filters - Filter options
 * @returns {Promise<Array>} Array of tenants
 */
export const getAllTenants = async (filters = {}) => {
  try {
    const queryParams = new URLSearchParams();

    // Add filters to query params
    Object.keys(filters).forEach((key) => {
      if (filters[key]) {
        queryParams.append(key, filters[key]);
      }
    });

    const queryString = queryParams.toString();
    const url = queryString ? `/tenants?${queryString}` : "/tenants";

    const response = await api.get(url);
    return response.data;
  } catch (error) {
    console.error("Error fetching tenants:", error);
    throw new Error(getErrorMessage(error));
  }
};

/**
 * Get tenant by ID
 * @param {string} id - Tenant ID
 * @returns {Promise<Object>} Tenant data
 */
export const getTenantById = async (id) => {
  try {
    const response = await api.get(`/tenants/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching tenant details:", error);
    throw new Error(getErrorMessage(error));
  }
};

/**
 * Get tenants by property
 * @param {string} propertyId - Property ID
 * @returns {Promise<Array>} Array of tenants for the property
 */
export const getTenantsByProperty = async (propertyId) => {
  try {
    const response = await api.get(`/tenants/property/${propertyId}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching property tenants:", error);
    throw new Error(getErrorMessage(error));
  }
};

/**
 * Get tenants by unit
 * @param {string} unitId - Unit ID
 * @returns {Promise<Array>} Array of tenants for the unit
 */
export const getTenantsByUnit = async (unitId) => {
  try {
    const response = await api.get(`/tenants/unit/${unitId}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching unit tenants:", error);
    throw new Error(getErrorMessage(error));
  }
};

/**
 * Create a new tenant
 * @param {Object} tenantData - Tenant data
 * @returns {Promise<Object>} Created tenant
 */
export const createTenant = async (tenantData) => {
  try {
    const response = await api.post("/tenants", tenantData);
    return response.data;
  } catch (error) {
    console.error("Error creating tenant:", error);
    throw new Error(getErrorMessage(error));
  }
};

/**
 * Update a tenant
 * @param {string} id - Tenant ID
 * @param {Object} tenantData - Updated tenant data
 * @returns {Promise<Object>} Updated tenant
 */
export const updateTenant = async (id, tenantData) => {
  try {
    const response = await api.put(`/tenants/${id}`, tenantData);
    return response.data;
  } catch (error) {
    console.error("Error updating tenant:", error);
    throw new Error(getErrorMessage(error));
  }
};

/**
 * End tenancy
 * @param {string} id - Tenant ID
 * @param {Object} data - End tenancy data (reason, date, etc.)
 * @returns {Promise<Object>} Response data
 */
export const endTenancy = async (id, data = {}) => {
  try {
    const response = await api.post(`/tenants/${id}/end-tenancy`, data);
    return response.data;
  } catch (error) {
    console.error("Error ending tenancy:", error);
    throw new Error(getErrorMessage(error));
  }
};

/**
 * Record a payment for a tenant
 * @param {string} id - Tenant ID
 * @param {Object} paymentData - Payment data
 * @returns {Promise<Object>} Updated tenant
 */
export const recordPayment = async (id, paymentData) => {
  try {
    const response = await api.post(`/tenants/${id}/payments`, paymentData);
    return response.data;
  } catch (error) {
    console.error("Error recording payment:", error);
    throw new Error(getErrorMessage(error));
  }
};

/**
 * Upload tenant documents
 * @param {string} id - Tenant ID
 * @param {FormData} formData - Form data with files
 * @returns {Promise<Object>} Updated tenant
 */
export const uploadDocuments = async (id, formData) => {
  try {
    const response = await api.post(`/tenants/${id}/documents`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error uploading documents:", error);
    throw new Error(getErrorMessage(error));
  }
};

/**
 * Delete a tenant
 * @param {string} id - Tenant ID
 * @returns {Promise<Object>} Response data
 */
export const deleteTenant = async (id) => {
  try {
    const response = await api.delete(`/tenants/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error deleting tenant:", error);
    throw new Error(getErrorMessage(error));
  }
};

export default {
  getAllTenants,
  getTenantById,
  getTenantsByProperty,
  getTenantsByUnit,
  createTenant,
  updateTenant,
  endTenancy,
  recordPayment,
  uploadDocuments,
  deleteTenant,
};
