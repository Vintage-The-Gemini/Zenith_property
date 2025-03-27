// backend/middleware/roleCheck.js
import logger from "../utils/logger.js";

/**
 * Middleware to check if user has one of the required roles
 * @param {Array} roles - Array of allowed roles
 * @returns {Function} Middleware function
 */
export const checkRole = (roles) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Authentication required" });
      }

      if (!roles.includes(req.user.role)) {
        logger.warn(
          `User ${req.user._id} with role ${req.user.role} attempted to access restricted route`
        );
        return res
          .status(403)
          .json({ error: "Access denied: insufficient permissions" });
      }

      next();
    } catch (error) {
      logger.error(`Error in role check middleware: ${error.message}`);
      res
        .status(500)
        .json({ error: "Server error during authorization check" });
    }
  };
};

/**
 * Middleware to check if user is the owner of the resource or has admin role
 * @param {Function} getResourceOwner - Function to get the owner ID from the request
 * @returns {Function} Middleware function
 */
export const checkOwnership = (getResourceOwner) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Authentication required" });
      }

      // Admin can access any resource
      if (req.user.role === "admin") {
        return next();
      }

      const ownerId = await getResourceOwner(req);

      // If no owner found or owner doesn't match current user
      if (!ownerId || ownerId.toString() !== req.user._id.toString()) {
        logger.warn(
          `User ${req.user._id} attempted to access resource owned by ${ownerId}`
        );
        return res
          .status(403)
          .json({ error: "Access denied: you do not own this resource" });
      }

      next();
    } catch (error) {
      logger.error(`Error in ownership check middleware: ${error.message}`);
      res
        .status(500)
        .json({ error: "Server error during authorization check" });
    }
  };
};
