// backend/server.js
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import morgan from "morgan";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

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
import floorRoutes from "./routes/floors.js";
// Remove the reports import since the file doesn't exist yet
// import reportRoutes from "./routes/reports.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

// Create uploads directories if they don't exist
const uploadDirs = [
  "uploads",
  "uploads/properties",
  "uploads/tenants",
  "uploads/leases",
  "uploads/maintenance",
  "uploads/payments",
  "uploads/identification",
];

uploadDirs.forEach((dir) => {
  const dirPath = path.join(__dirname, dir);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    logger.info(`Created upload directory: ${dirPath}`);
  }
});

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
    documentation: "/api-docs",
    endpoints: {
      auth: "/api/auth",
      dashboard: "/api/dashboard",
      properties: "/api/properties",
      floors: "/api/floors",
      units: "/api/units",
      tenants: "/api/tenants",
      expenses: "/api/expenses",
      payments: "/api/payments",
      maintenance: "/api/maintenance",
      // reports: "/api/reports", // Remove this line
    },
  });
});

// Static folder for uploads
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/properties", propertyRoutes);
app.use("/api/floors", floorRoutes);
app.use("/api/tenants", tenantRoutes);
app.use("/api/units", unitRoutes);
app.use("/api/expenses", expenseRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/maintenance", maintenanceRoutes);
// Remove the reports route since the file doesn't exist yet
// app.use("/api/reports", reportRoutes);

// Error handling middleware
app.use(errorHandler);

// Handle 404 routes
app.use((req, res) => {
  res.status(404).json({
    error: "Not Found",
    message: "The requested resource does not exist",
  });
});

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
        console.warn(`Port ${PORT} is busy, trying ${PORT + 1}`);
        server.close();
        app.listen(PORT + 1, () => {
          logger.info(`Server started on port ${PORT + 1}`);
          console.log(`Server started on port ${PORT + 1}`);
        });
      } else {
        logger.error("Server error:", error);
        console.error("Server error:", error);
      }
    });
  } catch (error) {
    logger.error("Failed to start server:", error);
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();

// Handle unhandled promise rejections
process.on("unhandledRejection", (err) => {
  logger.error("Unhandled Rejection:", err);
  console.error("Unhandled Rejection:", err);
  // Don't exit the process in development to avoid shutting down the server
  if (process.env.NODE_ENV === "production") {
    process.exit(1);
  }
});

// Handle uncaught exceptions
process.on("uncaughtException", (err) => {
  logger.error("Uncaught Exception:", err);
  console.error("Uncaught Exception:", err);
  // Don't exit the process in development to avoid shutting down the server
  if (process.env.NODE_ENV === "production") {
    process.exit(1);
  }
});

export default app;
