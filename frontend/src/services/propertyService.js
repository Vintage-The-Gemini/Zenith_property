// frontend/src/services/propertyService.js
import api from "./api";
import { getErrorMessage } from "../utils/errorHandling";

/**
 * Get all properties
 * @returns {Promise<Array>} Array of properties
 */
export const getAllProperties = async () => {
  try {
    const response = await api.get("/properties");
    return response.data;
  } catch (error) {
    console.error("Error fetching properties:", error);
    throw new Error(getErrorMessage(error));
  }
};

/**
 * Get property by ID
 * @param {string} id - Property ID
 * @returns {Promise<Object>} Property data
 */
export const getPropertyById = async (id) => {
  try {
    const response = await api.get(`/properties/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching property details:", error);
    throw new Error(getErrorMessage(error));
  }
};

/**
 * Create a new property
 * @param {Object} propertyData - Property data
 * @returns {Promise<Object>} Created property
 */
export const createProperty = async (propertyData) => {
  try {
    const response = await api.post("/properties", propertyData);
    return response.data;
  } catch (error) {
    console.error("Error creating property:", error);
    throw new Error(getErrorMessage(error));
  }
};

/**
 * Update property
 * @param {string} id - Property ID
 * @param {Object} propertyData - Updated property data
 * @returns {Promise<Object>} Updated property
 */
export const updateProperty = async (id, propertyData) => {
  try {
    const response = await api.put(`/properties/${id}`, propertyData);
    return response.data;
  } catch (error) {
    console.error("Error updating property:", error);
    throw new Error(getErrorMessage(error));
  }
};

/**
 * Delete property
 * @param {string} id - Property ID
 * @returns {Promise<Object>} Response data
 */
export const deleteProperty = async (id) => {
  try {
    const response = await api.delete(`/properties/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error deleting property:", error);
    throw new Error(getErrorMessage(error));
  }
};

/**
 * Get units for a property
 * @param {string} propertyId - Property ID
 * @returns {Promise<Array>} Array of units
 */
export const getPropertyUnits = async (propertyId) => {
  try {
    const response = await api.get(`/units?propertyId=${propertyId}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching property units:", error);
    throw new Error(getErrorMessage(error));
  }
};

export default {
  getAllProperties,
  getPropertyById,
  createProperty,
  updateProperty,
  deleteProperty,
  getPropertyUnits,
};
