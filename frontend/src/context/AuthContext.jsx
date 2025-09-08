// frontend/src/context/AuthContext.jsx
import { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Initialize authentication
    const initAuth = async () => {
      try {
        // Check if we have a token
        const token = localStorage.getItem("token");
        if (!token) {
          setLoading(false);
          return;
        }

        // Set token in localStorage to ensure it's used for API calls
        localStorage.setItem("token", token);

        // Get user info with token
        try {
          const response = await api.get("/auth/me");
          setUser(response.data);
        } catch (error) {
          // If error, token might be invalid - clear it
          console.error("Error fetching user data:", error);
          localStorage.removeItem("token");
          localStorage.removeItem("user");
        }
      } catch (error) {
        console.error("Auth initialization error:", error);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  // Login function
  const login = async (credentials) => {
    try {
      const response = await api.post("/auth/login", credentials);
      const { token } = response.data;

      // Store token
      localStorage.setItem("token", token);

      // Get user data using the token
      try {
        const userResponse = await api.get("/auth/me");
        const userData = userResponse.data;
        
        localStorage.setItem("user", JSON.stringify(userData));
        setUser(userData);
      } catch (userError) {
        console.error("Error fetching user data after login:", userError);
        // Clear token if user fetch fails
        localStorage.removeItem("token");
        return {
          success: false,
          message: "Login succeeded but failed to get user data",
        };
      }

      return { success: true };
    } catch (error) {
      console.error("Login error:", error);
      return {
        success: false,
        message: error.response?.data?.msg || error.response?.data?.message || "Login failed",
      };
    }
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    navigate("/login");
  };

  // Check if user is authenticated
  const isAuthenticated = () => {
    return !!localStorage.getItem("token");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        isAuthenticated,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
