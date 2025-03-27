// frontend/src/services/api.js
import axios from "axios";

// Create base API instance
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// Add auth token to requests
api.interceptors.request.use(
  (config) => {
    // Get token from localStorage
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Log request for debugging (remove in production)
    console.log(
      `Making ${config.method.toUpperCase()} request to: ${config.url}`
    );

    return config;
  },
  (error) => {
    console.error("Request error:", error);
    return Promise.reject(error);
  }
);

// Error handling interceptor
api.interceptors.response.use(
  (response) => {
    // Log successful response for debugging (remove in production)
    console.log(`Response from ${response.config.url}:`, response.status);
    return response;
  },
  (error) => {
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error(
        "Response error:",
        error.response.status,
        error.response.data
      );

      switch (error.response.status) {
        case 401:
          console.error("Unauthorized access - redirecting to login");
          localStorage.removeItem("user");
          localStorage.removeItem("token");
          // Use window.location instead of navigate since this is outside React component
          window.location.href = "/login";
          break;
        case 403:
          console.error("Forbidden - insufficient permissions");
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
      // The request was made but no response was received
      console.error("Network Error - No response received:", error.request);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error("Request setup error:", error.message);
    }

    return Promise.reject(error);
  }
);

export default api;
