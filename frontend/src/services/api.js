// frontend/src/services/api.js
import axios from "axios";

// Development mode flag
const DEV_MODE = true;

const api = axios.create({
  baseURL: "http://localhost:5000/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// Add auth token to requests
api.interceptors.request.use(
  (config) => {
    if (DEV_MODE) {
      // In development mode, add a mock token
      config.headers.Authorization = `Bearer dev-mock-token-12345`;
      return config;
    }

    // In production mode
    const user = localStorage.getItem("user");
    if (user) {
      // In a real app, you'd extract the token from the user object
      const token = localStorage.getItem("token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Error handling interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (DEV_MODE && error.response && error.response.status === 401) {
      // In development mode, log but don't redirect or throw on auth errors
      console.warn("Authentication error (ignored in development mode)");
      return Promise.resolve({ data: { data: [] } }); // Return empty data
    }

    if (error.response) {
      switch (error.response.status) {
        case 401:
          if (!DEV_MODE) {
            console.error("Unauthorized access");
            localStorage.removeItem("user");
            localStorage.removeItem("token");
            window.location.href = "/login";
          }
          break;
        case 404:
          console.error("Resource not found");
          break;
        case 500:
          console.error("Server error");
          break;
        default:
          console.error("API Error:", error.response.data);
      }
    } else if (error.request) {
      console.error("Network Error:", error.request);
    } else {
      console.error("Error:", error.message);
    }

    if (DEV_MODE) {
      // In development mode, for other errors, return mock data
      return Promise.resolve({
        data: {
          message: "Error handled in development mode",
          data: [],
        },
      });
    }

    return Promise.reject(error);
  }
);

// Keep your existing API endpoints
// Property endpoints
export const fetchProperties = async () => {
  if (DEV_MODE) {
    // Return mock data in development mode
    return {
      data: [
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
      ],
    };
  }

  try {
    const response = await api.get("/properties");
    return response;
  } catch (error) {
    console.error("API Error:", error);
    throw error;
  }
};

export const getProperty = async (id) => {
  if (DEV_MODE) {
    // Return mock property data in development mode
    return {
      data: {
        _id: id,
        name: "Sunset Apartments",
        address: "123 Main St, City, State",
        description: "A beautiful apartment complex near downtown.",
        propertyType: "apartment",
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
      },
    };
  }

  try {
    const response = await api.get(`/properties/${id}`);
    return response;
  } catch (error) {
    console.error("API Error:", error);
    throw error;
  }
};

export const createProperty = async (data) => {
  if (DEV_MODE) {
    // Mock creating a property
    return {
      data: {
        _id: "new-property-id",
        ...data,
        createdAt: new Date().toISOString(),
      },
    };
  }

  const response = await api.post("/properties", data);
  return response;
};

// Keep the rest of your API functions intact...

export default api;
