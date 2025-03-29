// frontend/src/services/floorService.js
import api from "./api";
import { getErrorMessage } from "../utils/errorHandling";

/**
 * Get all floors for a property
 * @param {string} propertyId - Property ID
 * @returns {Promise<Array>} Array of floors
 */
export const getFloorsByProperty = async (propertyId) => {
  try {
    const response = await api.get(`/floors/property/${propertyId}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching floors:", error);
    throw new Error(getErrorMessage(error));
  }
};

/**
 * Get floor by ID
 * @param {string} id - Floor ID
 * @returns {Promise<Object>} Floor data
 */
export const getFloorById = async (id) => {
  try {
    const response = await api.get(`/floors/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching floor details:", error);
    throw new Error(getErrorMessage(error));
  }
};

/**
 * Create a new floor
 * @param {Object} floorData - Floor data
 * @returns {Promise<Object>} Created floor
 */
export const createFloor = async (floorData) => {
  try {
    const response = await api.post("/floors", floorData);
    return response.data;
  } catch (error) {
    console.error("Error creating floor:", error);
    throw new Error(getErrorMessage(error));
  }
};

/**
 * Update floor
 * @param {string} id - Floor ID
 * @param {Object} floorData - Updated floor data
 * @returns {Promise<Object>} Updated floor
 */
export const updateFloor = async (id, floorData) => {
  try {
    const response = await api.put(`/floors/${id}`, floorData);
    return response.data;
  } catch (error) {
    console.error("Error updating floor:", error);
    throw new Error(getErrorMessage(error));
  }
};

/**
 * Delete floor
 * @param {string} id - Floor ID
 * @returns {Promise<Object>} Response data
 */
export const deleteFloor = async (id) => {
  try {
    const response = await api.delete(`/floors/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error deleting floor:", error);
    throw new Error(getErrorMessage(error));
  }
};

export default {
  getFloorsByProperty,
  getFloorById,
  createFloor,
  updateFloor,
  deleteFloor,
};
