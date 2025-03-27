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
      // Return mock data for development
      return Promise.resolve({
        data: {
          // Empty array as fallback data
          data: [],
        },
      });
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

    return Promise.reject(error);
  }
);

export default api;
