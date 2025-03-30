// backend/controllers/reportController.js
import mongoose from "mongoose";
import Property from "../models/Property.js";
import Unit from "../models/Unit.js";
import Tenant from "../models/Tenant.js";
import Payment from "../models/Payment.js";
import Expense from "../models/Expense.js";
import logger from "../utils/logger.js";

/**
 * Get financial summary report
 */
export const getFinancialSummary = async (req, res) => {
  try {
    // Extract filter parameters
    const { startDate, endDate, propertyId } = req.query;
    
    // Build date filter
    const dateFilter = {};
    if (startDate) dateFilter.$gte = new Date(startDate);
    if (endDate) dateFilter.$lte = new Date(endDate);
    
    // Build property filter
    const propertyFilter = {};
    if (propertyId) propertyFilter.property = mongoose.Types.ObjectId(propertyId);
    
    // Query payments
    const payments = await Payment.find({
      ...(Object.keys(dateFilter).length > 0 ? { paymentDate: dateFilter } :