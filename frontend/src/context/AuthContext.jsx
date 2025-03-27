// frontend/src/context/AuthContext.jsx
import { createContext, useContext, useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

const AuthContext = createContext(null);

// Mock development user
const DEV_USER = {
  id: "dev-user-id",
  firstName: "Development",
  lastName: "User",
  email: "dev@example.com",
  role: "admin",
};

// Development mode flag
const DEV_MODE = true;

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(DEV_MODE ? DEV_USER : null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

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

  // Prevent redirect loops by checking current path
  useEffect(() => {
    // If we're not on the login page and user is not authenticated in production mode
    if (
      !DEV_MODE &&
      !user &&
      !location.pathname.includes("/login") &&
      !location.pathname.includes("/register")
    ) {
      navigate("/login");
    }
  }, [user, location.pathname, navigate]);

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
