// frontend/src/services/propertyService.js
import api from "./api";

// Development mode flag
const DEV_MODE = true;

/**
 * Get all properties
 * @returns {Promise<Array>} Array of properties
 */
export const getAllProperties = async () => {
  if (DEV_MODE) {
    // Return mock data in development mode
    return [
      {
        _id: "1",
        name: "Sunset Apartments",
        address: "123 Main St, City, State",
        propertyType: "apartment",
        floors: [
          {
            floorNumber: 1,
            units: [
              { unitNumber: "101", monthlyRent: 1200, isOccupied: true },
              { unitNumber: "102", monthlyRent: 1100, isOccupied: false },
            ],
          },
        ],
        createdAt: new Date().toISOString(),
      },
      {
        _id: "2",
        name: "Ocean View Condos",
        address: "456 Beach Rd, City, State",
        propertyType: "condo",
        floors: [
          {
            floorNumber: 1,
            units: [
              { unitNumber: "101", monthlyRent: 1500, isOccupied: true },
              { unitNumber: "102", monthlyRent: 1550, isOccupied: true },
            ],
          },
        ],
        createdAt: new Date().toISOString(),
      },
    ];
  }

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
  if (DEV_MODE) {
    // Return mock property data in development mode
    return {
      _id: id,
      name: "Sunset Apartments",
      address: "123 Main St, City, State",
      description: "A beautiful apartment complex near downtown.",
      propertyType: "apartment",
      type: "apartment",
      floors: [
        {
          floorNumber: 1,
          units: [
            { unitNumber: "101", monthlyRent: 1200, isOccupied: true },
            { unitNumber: "102", monthlyRent: 1100, isOccupied: false },
          ],
        },
        {
          floorNumber: 2,
          units: [
            { unitNumber: "201", monthlyRent: 1300, isOccupied: true },
            { unitNumber: "202", monthlyRent: 1250, isOccupied: true },
          ],
        },
      ],
      createdAt: new Date().toISOString(),
    };
  }

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
  if (DEV_MODE) {
    // Mock creating a property
    return {
      _id: "new-property-id",
      ...propertyData,
      createdAt: new Date().toISOString(),
    };
  }

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
  if (DEV_MODE) {
    // Mock updating a property
    return {
      _id: id,
      ...propertyData,
      updatedAt: new Date().toISOString(),
    };
  }

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
  if (DEV_MODE) {
    // Mock deleting a property
    return { success: true, message: "Property deleted successfully" };
  }

  try {
    const response = await api.delete(`/properties/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error deleting property:", error);
    throw error;
  }
};

// Keep the rest of your service functions intact...

export default {
  getAllProperties,
  getPropertyById,
  createProperty,
  updateProperty,
  deleteProperty,
  // other functions...
};
