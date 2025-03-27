import api from "./api";

// Login user
const login = async (email, password) => {
  try {
    const response = await api.post("/auth/login", { email, password });

    if (response.data.token) {
      localStorage.setItem("token", response.data.token);
      localStorage.setItem("user", JSON.stringify(response.data.user));
    }

    return response.data;
  } catch (error) {
    throw error;
  }
};

// Register user
const register = async (userData) => {
  try {
    const response = await api.post("/auth/register", userData);
    return response.data;
  } catch (error) {
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
  const userStr = localStorage.getItem("user");
  return userStr ? JSON.parse(userStr) : null;
};

// Check if user is authenticated
const isAuthenticated = () => {
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
