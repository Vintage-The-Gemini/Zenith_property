// frontend/src/services/unitService.js
import api from "./api";
import { getErrorMessage } from "../utils/errorHandling";

/**
 * Get all units with optional filters
 * @param {Object} filters - Filter options like propertyId, floorId, status
 * @returns {Promise<Array>} Array of units
 */
export const getUnits = async (filters = {}) => {
  try {
    const queryParams = new URLSearchParams();

    // Add filters to query params
    Object.keys(filters).forEach((key) => {
      if (filters[key]) {
        queryParams.append(key, filters[key]);
      }
    });

    const queryString = queryParams.toString();
    const url = queryString ? `/units?${queryString}` : "/units";

    const response = await api.get(url);
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
 * Get units by floor
 * @param {string} floorId - Floor ID
 * @returns {Promise<Array>} Array of units on this floor
 */
export const getUnitsByFloor = async (floorId) => {
  try {
    const response = await api.get(`/units?floorId=${floorId}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching units by floor:", error);
    throw new Error(getErrorMessage(error));
  }
};

/**
 * Get available units (useful for tenant assignment)
 * @param {string} propertyId - Optional property ID to filter by
 * @returns {Promise<Array>} Array of available units
 */
export const getAvailableUnits = async (propertyId = null) => {
  try {
    const url = propertyId
      ? `/units?status=available&propertyId=${propertyId}`
      : "/units?status=available";

    const response = await api.get(url);
    return response.data;
  } catch (error) {
    console.error("Error fetching available units:", error);
    throw new Error(getErrorMessage(error));
  }
};

/**
 * Add a unit to a property
 * @param {string} propertyId - Property ID
 * @param {Object} unitData - Unit data including floorId or floorNumber
 * @returns {Promise<Object>} Created unit
 */
export const addUnitToProperty = async (propertyId, unitData) => {
  try {
    const response = await api.post("/units", {
      ...unitData,
      propertyId,
    });
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
 * @param {string} status - New status (available, occupied, maintenance, reserved)
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

/**
 * Add maintenance record to a unit
 * @param {string} unitId - Unit ID
 * @param {Object} maintenanceData - Maintenance data
 * @returns {Promise<Object>} Updated unit
 */
export const addMaintenanceRecord = async (unitId, maintenanceData) => {
  try {
    const response = await api.post(
      `/units/${unitId}/maintenance`,
      maintenanceData
    );
    return response.data;
  } catch (error) {
    console.error("Error adding maintenance record:", error);
    throw new Error(getErrorMessage(error));
  }
};

export default {
  getUnits,
  getUnitById,
  getUnitsByFloor,
  getAvailableUnits,
  addUnitToProperty,
  updateUnit,
  deleteUnit,
  updateUnitStatus,
  addMaintenanceRecord,
};
