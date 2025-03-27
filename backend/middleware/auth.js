// middleware/auth.js
import jwt from "jsonwebtoken";
import User from "../models/User.js";

const auth = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      throw new Error("No authentication token provided");
    }

    // Verify token with the JWT_SECRET from environment variables
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Find user by ID from token payload
    const user = await User.findById(decoded.user.id);

    if (!user) {
      throw new Error("User not found");
    }

    // Set user and token on request object
    req.token = token;
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ error: "Please authenticate" });
  }
};

export const checkRole = (roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: "Access denied" });
    }
    next();
  };
};

export default auth;
