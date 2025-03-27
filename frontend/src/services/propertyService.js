import api from "./api";

/**
 * Get all properties
 * @returns {Promise<Array>} Array of properties
 */
export const getAllProperties = async () => {
  try {
    const response = await api.get("/properties");
    return response.data.data || response.data;
  } catch (error) {
    console.error("Error fetching properties:", error);
    throw error;
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
    return response.data.data || response.data;
  } catch (error) {
    console.error("Error fetching property details:", error);
    throw error;
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
    return response.data.data || response.data;
  } catch (error) {
    console.error("Error creating property:", error);
    throw error;
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
    return response.data.data || response.data;
  } catch (error) {
    console.error("Error updating property:", error);
    throw error;
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
    throw error;
  }
};

/**
 * Get property statistics
 * @param {string} id - Property ID
 * @returns {Promise<Object>} Property statistics
 */
export const getPropertyStats = async (id) => {
  try {
    const response = await api.get(`/properties/${id}/stats`);
    return response.data.data || response.data;
  } catch (error) {
    console.error("Error fetching property statistics:", error);
    throw error;
  }
};

/**
 * Get all units for a property
 * @param {string} propertyId - Property ID
 * @returns {Promise<Array>} Array of units
 */
export const getPropertyUnits = async (propertyId) => {
  try {
    const response = await api.get(`/properties/${propertyId}/units`);
    return response.data.data || response.data;
  } catch (error) {
    console.error("Error fetching property units:", error);
    throw error;
  }
};

/**
 * Add a unit to a property
 * @param {string} propertyId - Property ID
 * @param {Object} unitData - Unit data
 * @returns {Promise<Object>} Updated property
 */
export const addUnit = async (propertyId, unitData) => {
  try {
    const response = await api.post(
      `/properties/${propertyId}/units`,
      unitData
    );
    return response.data.data || response.data;
  } catch (error) {
    console.error("Error adding unit:", error);
    throw error;
  }
};

/**
 * Update a unit
 * @param {string} propertyId - Property ID
 * @param {string} unitId - Unit ID or unit number
 * @param {Object} unitData - Updated unit data
 * @returns {Promise<Object>} Updated property
 */
export const updateUnit = async (propertyId, unitId, unitData) => {
  try {
    const response = await api.put(
      `/properties/${propertyId}/units/${unitId}`,
      unitData
    );
    return response.data.data || response.data;
  } catch (error) {
    console.error("Error updating unit:", error);
    throw error;
  }
};

/**
 * Delete a unit
 * @param {string} propertyId - Property ID
 * @param {string} unitId - Unit ID or unit number
 * @returns {Promise<Object>} Updated property
 */
export const deleteUnit = async (propertyId, unitId) => {
  try {
    const response = await api.delete(
      `/properties/${propertyId}/units/${unitId}`
    );
    return response.data.data || response.data;
  } catch (error) {
    console.error("Error deleting unit:", error);
    throw error;
  }
};

export default {
  getAllProperties,
  getPropertyById,
  createProperty,
  updateProperty,
  deleteProperty,
  getPropertyStats,
  getPropertyUnits,
  addUnit,
  updateUnit,
  deleteUnit,
};
