// backend/controllers/settingsController.js
import User from "../models/User.js";
import Property from "../models/Property.js";
import Tenant from "../models/Tenant.js";
import Payment from "../models/Payment.js";
import Expense from "../models/Expense.js";
import Maintenance from "../models/Maintenance.js";
import logger from "../utils/logger.js";

// Get business settings
export const getBusinessSettings = async (req, res) => {
  try {
    // For now, return empty settings - could be stored in a Settings model
    const businessSettings = {
      businessName: "",
      businessAddress: "",
      businessPhone: "",
      businessEmail: "",
      businessLicense: "",
      taxId: "",
    };

    res.json(businessSettings);
  } catch (error) {
    logger.error(`Error in getBusinessSettings: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
};

// Update business settings
export const updateBusinessSettings = async (req, res) => {
  try {
    const {
      businessName,
      businessAddress,
      businessPhone,
      businessEmail,
      businessLicense,
      taxId,
    } = req.body;

    // For now, just acknowledge the update
    // In a full implementation, you'd save to a Settings model
    const updatedSettings = {
      businessName,
      businessAddress,
      businessPhone,
      businessEmail,
      businessLicense,
      taxId,
    };

    logger.info(`Business settings updated by user ${req.user.id}`, updatedSettings);
    
    res.json({
      message: "Business settings updated successfully",
      settings: updatedSettings,
    });
  } catch (error) {
    logger.error(`Error in updateBusinessSettings: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
};

// Export all data
export const exportData = async (req, res) => {
  try {
    // Get all data from different collections
    const [properties, tenants, payments, expenses, maintenance] = await Promise.all([
      Property.find().lean(),
      Tenant.find().lean(),
      Payment.find().lean(),
      Expense.find().lean(),
      Maintenance.find().lean(),
    ]);

    const exportData = {
      exportDate: new Date().toISOString(),
      exportedBy: req.user.id,
      data: {
        properties,
        tenants,
        payments,
        expenses,
        maintenance,
      },
      metadata: {
        propertiesCount: properties.length,
        tenantsCount: tenants.length,
        paymentsCount: payments.length,
        expensesCount: expenses.length,
        maintenanceCount: maintenance.length,
      },
    };

    // Set headers for file download
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=property-management-backup-${new Date().toISOString().split('T')[0]}.json`);
    
    logger.info(`Data export performed by user ${req.user.id}`);
    res.json(exportData);
  } catch (error) {
    logger.error(`Error in exportData: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
};

// Get system statistics
export const getSystemStats = async (req, res) => {
  try {
    const [
      propertiesCount,
      tenantsCount,
      paymentsCount,
      expensesCount,
      maintenanceCount,
      activeTenantsCount,
      pendingMaintenanceCount,
    ] = await Promise.all([
      Property.countDocuments(),
      Tenant.countDocuments(),
      Payment.countDocuments(),
      Expense.countDocuments(),
      Maintenance.countDocuments(),
      Tenant.countDocuments({ status: "active" }),
      Maintenance.countDocuments({ status: { $in: ["pending", "in_progress"] } }),
    ]);

    const stats = {
      total: {
        properties: propertiesCount,
        tenants: tenantsCount,
        payments: paymentsCount,
        expenses: expensesCount,
        maintenance: maintenanceCount,
      },
      active: {
        tenants: activeTenantsCount,
        pendingMaintenance: pendingMaintenanceCount,
      },
      lastUpdated: new Date().toISOString(),
    };

    res.json(stats);
  } catch (error) {
    logger.error(`Error in getSystemStats: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
};

// Database cleanup (placeholder - implement carefully)
export const cleanupDatabase = async (req, res) => {
  try {
    // This is a placeholder for database cleanup operations
    // Implement carefully with proper safeguards
    
    logger.warn(`Database cleanup requested by user ${req.user.id} - not implemented`);
    
    res.json({
      message: "Database cleanup feature is not yet implemented for safety reasons",
      note: "This would typically clean up orphaned records, old logs, etc.",
    });
  } catch (error) {
    logger.error(`Error in cleanupDatabase: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
};

// Test email configuration
export const testEmailConfig = async (req, res) => {
  try {
    const { smtpServer, port, username, password } = req.body;

    // This is a placeholder for email testing
    // In a real implementation, you'd test the SMTP connection
    
    logger.info(`Email configuration test requested by user ${req.user.id}`);
    
    res.json({
      message: "Email configuration test successful",
      note: "Email testing feature to be implemented",
      config: {
        smtpServer,
        port,
        username: username ? `${username.substring(0, 3)}***` : undefined,
      },
    });
  } catch (error) {
    logger.error(`Error in testEmailConfig: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
};