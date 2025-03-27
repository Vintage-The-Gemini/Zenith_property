// frontend/src/services/unitService.js
import api from "./api";
import { getErrorMessage } from "../utils/errorHandling";

/**
 * Get all units
 * @param {Object} filters - Filter options
 * @returns {Promise<Array>} Array of units
 */
export const getUnits = async (filters = {}) => {
  try {
    const queryParams = new URLSearchParams(filters).toString();
    const response = await api.get(
      `/units${queryParams ? `?${queryParams}` : ""}`
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching units:", error);
    throw new Error(getErrorMessage(error));
  }
};

/**
 * Get unit by ID
 * @param {string} id - Unit ID
 * @returns {Promise<Object>} Unit data
 */
export const getUnitById = async (id) => {
  try {
    const response = await api.get(`/units/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching unit details:", error);
    throw new Error(getErrorMessage(error));
  }
};

/**
 * Add a unit to a property
 * @param {string} propertyId - Property ID
 * @param {Object} unitData - Unit data
 * @returns {Promise<Object>} Created unit
 */
export const addUnitToProperty = async (propertyId, unitData) => {
  try {
    const unitWithPropertyId = { ...unitData, propertyId };
    const response = await api.post("/units", unitWithPropertyId);
    return response.data;
  } catch (error) {
    console.error("Error adding unit to property:", error);
    throw new Error(getErrorMessage(error));
  }
};

/**
 * Update a unit
 * @param {string} unitId - Unit ID
 * @param {Object} unitData - Updated unit data
 * @returns {Promise<Object>} Updated unit
 */
export const updateUnit = async (unitId, unitData) => {
  try {
    const response = await api.put(`/units/${unitId}`, unitData);
    return response.data;
  } catch (error) {
    console.error("Error updating unit:", error);
    throw new Error(getErrorMessage(error));
  }
};

/**
 * Delete a unit
 * @param {string} unitId - Unit ID
 * @returns {Promise<Object>} Response data
 */
export const deleteUnit = async (unitId) => {
  try {
    const response = await api.delete(`/units/${unitId}`);
    return response.data;
  } catch (error) {
    console.error("Error deleting unit:", error);
    throw new Error(getErrorMessage(error));
  }
};

/**
 * Update unit status
 * @param {string} unitId - Unit ID
 * @param {string} status - New status
 * @returns {Promise<Object>} Updated unit
 */
export const updateUnitStatus = async (unitId, status) => {
  try {
    const response = await api.put(`/units/${unitId}/status`, { status });
    return response.data;
  } catch (error) {
    console.error("Error updating unit status:", error);
    throw new Error(getErrorMessage(error));
  }
};

export default {
  getUnits,
  getUnitById,
  addUnitToProperty,
  updateUnit,
  deleteUnit,
  updateUnitStatus,
};
