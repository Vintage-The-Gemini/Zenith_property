// backend/server.js
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import morgan from "morgan";
import path from "path";
import { fileURLToPath } from "url";

import connectDB from "./config/db.js";
import logger from "./utils/logger.js";
import errorHandler from "./middleware/errorHandler.js";

// Routes imports
import authRoutes from "./routes/auth.js";
import propertyRoutes from "./routes/properties.js";
import tenantRoutes from "./routes/tenants.js";
import unitRoutes from "./routes/units.js";
import expenseRoutes from "./routes/expenses.js";
import dashboardRoutes from "./routes/dashboard.js";
import paymentRoutes from "./routes/payments.js";
import maintenanceRoutes from "./routes/maintenance.js";
import floorRoutes from "./routes/floors.js"; // Add floor routes import

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

// Root route
app.get("/", (req, res) => {
  res.json({
    message: "Welcome to Property Management System API",
    version: "1.0",
    endpoints: {
      auth: "/api/auth",
      dashboard: "/api/dashboard",
      properties: "/api/properties",
      floors: "/api/floors", // Add floors endpoint
      units: "/api/units",
      tenants: "/api/tenants",
      expenses: "/api/expenses",
      payments: "/api/payments",
      maintenance: "/api/maintenance",
    },
  });
});

// Static folder for uploads
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/properties", propertyRoutes);
app.use("/api/floors", floorRoutes); // Add floor routes
app.use("/api/tenants", tenantRoutes);
app.use("/api/units", unitRoutes);
app.use("/api/expenses", expenseRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/maintenance", maintenanceRoutes);

// Error handling
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    const server = app.listen(PORT, () => {
      logger.info(
        `Server running in ${process.env.NODE_ENV} mode on port ${PORT}`
      );
      console.log(`Server is running on http://localhost:${PORT}`);
    });

    server.on("error", (error) => {
      if (error.code === "EADDRINUSE") {
        logger.warn(`Port ${PORT} is busy, trying ${PORT + 1}`);
        server.close();
        app.listen(PORT + 1, () => {
          logger.info(`Server started on port ${PORT + 1}`);
        });
      } else {
        logger.error("Server error:", error);
      }
    });
  } catch (error) {
    logger.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();

// Handle unhandled promise rejections
process.on("unhandledRejection", (err) => {
  logger.error("Unhandled Rejection:", err);
  process.exit(1);
});
