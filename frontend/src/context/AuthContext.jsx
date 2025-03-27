// frontend/src/context/AuthContext.jsx
import { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const AuthContext = createContext(null);

// Mock development user - always authenticated in development
const DEV_USER = {
  id: "dev-user-id",
  firstName: "Development",
  lastName: "User",
  email: "dev@example.com",
  role: "admin",
};

// Development mode flag - set to true to bypass auth
const DEV_MODE = true;

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(DEV_MODE ? DEV_USER : null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // In production, check for user in localStorage on initial load
    if (!DEV_MODE) {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    }
    setLoading(false);
  }, []);

  // Login function
  const login = (userData) => {
    if (DEV_MODE) {
      setUser(DEV_USER);
      localStorage.setItem("user", JSON.stringify(DEV_USER));
      navigate("/");
      return;
    }

    // For production
    setUser(userData);
    localStorage.setItem("user", JSON.stringify(userData));
    navigate("/");
  };

  // Logout function
  const logout = () => {
    setUser(null);
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    navigate("/login");
  };

  // Check if user is authenticated
  const isAuthenticated = () => {
    return DEV_MODE ? true : !!user;
  };

  return (
    <AuthContext.Provider
      value={{ user, login, logout, isAuthenticated, loading }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};