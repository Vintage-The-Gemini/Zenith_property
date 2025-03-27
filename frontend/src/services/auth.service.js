// frontend/src/services/auth.service.js
import api from "./api";

// Development mode flag
const DEV_MODE = true;

// Mock user for development
const DEV_USER = {
  id: "dev-user-id",
  email: "dev@example.com",
  firstName: "Dev",
  lastName: "User",
  role: "admin",
  token: "dev-mock-token-12345",
};

// Login user
const login = async (credentials) => {
  try {
    if (DEV_MODE) {
      // In development mode, always succeed and return the mock user
      localStorage.setItem("token", DEV_USER.token);
      localStorage.setItem("user", JSON.stringify(DEV_USER));
      return DEV_USER;
    }

    // Original implementation for production
    const response = await api.post("/auth/login", credentials);
    if (response.data.token) {
      localStorage.setItem("token", response.data.token);
      localStorage.setItem("user", JSON.stringify(response.data.user));
    }
    return response.data;
  } catch (error) {
    console.error("Login error:", error);
    throw error;
  }
};

// Register user
const register = async (userData) => {
  try {
    if (DEV_MODE) {
      // In development mode, always succeed
      return { success: true, message: "Registration successful (DEV MODE)" };
    }

    // Original implementation for production
    const response = await api.post("/auth/register", userData);
    return response.data;
  } catch (error) {
    console.error("Registration error:", error);
    throw error;
  }
};

// Logout user
const logout = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
};

// Get current user
const getCurrentUser = () => {
  if (DEV_MODE) return DEV_USER;

  const userStr = localStorage.getItem("user");
  return userStr ? JSON.parse(userStr) : null;
};

// Check if user is authenticated
const isAuthenticated = () => {
  if (DEV_MODE) return true;
  return !!localStorage.getItem("token");
};

const authService = {
  login,
  register,
  logout,
  getCurrentUser,
  isAuthenticated,
};

export default authService;
