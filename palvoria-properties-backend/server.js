import express from "express";
import { createServer } from "http";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import rateLimit from "express-rate-limit";
import morgan from "morgan";
import dotenv from "dotenv";
import mongoose from "mongoose";
import path from "path";
import { fileURLToPath } from "url";

// Import services and utilities
import connectDB from "./config/database.js";
import logger from "./utils/logger.js";

// Import routes
import authRoutes from "./routes/auth.js";
import propertyRoutes from "./routes/properties-simple.js";
import userRoutes from "./routes/users.js";
import leadRoutes from "./routes/leads.js";
import chatRoutes from "./routes/chat.js";
import searchRoutes from "./routes/search.js";
import analyticsRoutes from "./routes/analytics.js";
import mortgageRoutes from "./routes/mortgage.js";
import neighborhoodRoutes from "./routes/neighborhoods.js";
import uploadRoutes from "./routes/uploads.js";

// Load environment variables
dotenv.config();

// Get directory name for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = createServer(app);

// Security middleware
app.use(
  helmet({
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'", "ws:", "wss:"],
      },
    },
  })
);

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
  message: {
    error: "Too many requests from this IP, please try again later.",
    retryAfter: Math.ceil(
      (parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000) / 1000 / 60
    ),
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use("/api/", limiter);

// Basic middleware
app.use(compression());
app.use(
  cors({
    origin: [
      process.env.FRONTEND_URL || "http://localhost:5173",
      "http://localhost:5174",
      "https://www.palvoria.com",
      "https://palvoria.com",
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: [
      "Content-Type", 
      "Authorization", 
      "X-Requested-With",
      "Cache-Control",
      "Pragma",
      "Expires"
    ],
  })
);

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Force no-cache headers for fresh data
app.use((req, res, next) => {
  res.set({
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
    'X-Timestamp': Date.now()
  });
  next();
});

// Logging
app.use(
  morgan("combined", {
    stream: {
      write: (message) => logger.info(message.trim()),
    },
  })
);

// Serve static files (uploaded media)
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Connect to MongoDB
connectDB();

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/properties", propertyRoutes);
app.use("/api/users", userRoutes);
app.use("/api/leads", leadRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/search", searchRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/mortgage", mortgageRoutes);
app.use("/api/neighborhoods", neighborhoodRoutes);
app.use("/api/uploads", uploadRoutes);

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    service: "Palvoria Properties Backend",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || "development",
    database:
      mongoose.connection.readyState === 1 ? "connected" : "disconnected",
  });
});

// Root endpoint
app.get("/", (req, res) => {
  res.json({
    message: "Palvoria Properties Kenya - Advanced Real Estate Platform API",
    version: "1.0.0",
    environment: process.env.NODE_ENV || "development",
    documentation: "https://docs.palvoriaproperties.com",
    endpoints: {
      auth: "/api/auth",
      properties: "/api/properties",
      users: "/api/users",
      leads: "/api/leads",
      chat: "/api/chat",
      search: "/api/search",
      analytics: "/api/analytics",
      mortgage: "/api/mortgage",
      neighborhoods: "/api/neighborhoods",
      uploads: "/api/uploads",
      health: "/api/health",
    },
    features: [
      "Real-time WebSocket communication",
      "Advanced property search with AI",
      "Lead scoring and nurturing",
      "Virtual property tours",
      "Mortgage calculator",
      "Neighborhood insights",
      "Email automation",
      "Progressive Web App support",
    ],
  });
});

// WebSocket 404 handler (must come before general error handler)
app.use("/socket.io/", (req, res) => {
  res.status(404).json({
    error: "WebSocket endpoint not available via HTTP",
    message: "Use WebSocket client to connect to /socket.io/",
  });
});

// Error handling middleware
const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
};

app.use(errorHandler);

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    error: "Route not found",
    method: req.method,
    url: req.originalUrl,
    availableRoutes: [
      "/api/auth",
      "/api/properties",
      "/api/users",
      "/api/leads",
      "/api/chat",
      "/api/search",
      "/api/analytics",
      "/api/mortgage",
      "/api/neighborhoods",
      "/api/uploads",
    ],
  });
});

// Start server
const PORT = process.env.PORT || 5001;

const startServer = async () => {
  try {
    // Try to connect to database (optional)
    const dbConnected = await connectDB();

    // Start HTTP server
    server.listen(PORT, () => {
      logger.info(
        `🚀 Palvoria Properties Backend running in ${process.env.NODE_ENV || "development"} mode`
      );
      logger.info(`🌐 Server: http://localhost:${PORT}`);
      logger.info(`📚 API Documentation: http://localhost:${PORT}/`);
      logger.info(`🗄️ Database: ${process.env.MONGODB_URI ? process.env.MONGODB_URI.split('@')[1].split('?')[0] : 'Not configured'}`);
      logger.info(`⚡ WebSocket: ws://localhost:${PORT}/socket.io/`);

      const separator = "=".repeat(60);
      console.log(
        "\n🏢 Palvoria Properties Kenya - Advanced Real Estate Platform"
      );
      console.log(separator);
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`📊 Health Check: http://localhost:${PORT}/api/health`);
      console.log(`🔌 WebSocket: ws://localhost:${PORT}/socket.io/`);
      console.log(
        `📅 Database: ${dbConnected ? "Connected" : "Standalone Mode"}`
      );
      console.log(separator);
    });
  } catch (error) {
    logger.error("Failed to start server:", error);
    process.exit(1);
  }
};

// Graceful shutdown handling
const gracefulShutdown = async (signal) => {
  logger.info(`${signal} received. Starting graceful shutdown...`);

  server.close(async () => {
    logger.info("HTTP server closed");

    // Close database connection
    try {
      await mongoose.connection.close();
      logger.info("MongoDB connection closed");
    } catch (error) {
      logger.warn("Error closing MongoDB connection:", error.message);
    }

    logger.info("Graceful shutdown completed");
    process.exit(0);
  });

  // Force shutdown after 10 seconds
  setTimeout(() => {
    logger.error("Forced shutdown due to timeout");
    process.exit(1);
  }, 10000);
};

// Handle various shutdown signals
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

// Handle unhandled promise rejections
process.on("unhandledRejection", (err, promise) => {
  logger.error(`Unhandled Rejection: ${err.message}`);
  gracefulShutdown("UNHANDLED_REJECTION");
});

// Handle uncaught exceptions
process.on("uncaughtException", (err) => {
  logger.error(`Uncaught Exception: ${err.message}`);
  gracefulShutdown("UNCAUGHT_EXCEPTION");
});

// Start the server
startServer();

export default app;
