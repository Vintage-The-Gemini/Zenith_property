// backend/controllers/dashboardController.js
import Property from "../models/Property.js";
import Tenant from "../models/Tenant.js";
import Unit from "../models/Unit.js";
import Payment from "../models/Payment.js";
import Maintenance from "../models/Maintenance.js"; // Using the same spelling as the file
import logger from "../utils/logger.js";

export const getDashboardStats = async (req, res) => {
  try {
    // Count properties
    const propertiesCount = await Property.countDocuments();

    // Count units and calculate occupancy
    const units = await Unit.find();
    const totalUnits = units.length;
    const occupiedUnits = units.filter(
      (unit) => unit.status === "occupied"
    ).length;
    const occupancyRate =
      totalUnits > 0 ? Math.round((occupiedUnits / totalUnits) * 100) : 0;

    // Count tenants
    const tenantsCount = await Tenant.countDocuments();

    // Calculate monthly revenue from payments
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
      23,
      59,
      59
    );

    const completedPayments = await Payment.find({
      status: "completed",
      paymentDate: { $gte: startOfMonth, $lte: endOfMonth },
    });

    const monthlyRevenue = completedPayments.reduce(
      (total, payment) => total + payment.amount,
      0
    );

    // Year to date revenue
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const ytdPayments = await Payment.find({
      status: "completed",
      paymentDate: { $gte: startOfYear, $lte: now },
    });

    const yearToDateRevenue = ytdPayments.reduce(
      (total, payment) => total + payment.amount,
      0
    );

    // Count pending maintenance
    const pendingMaintenance = await Maintenance.countDocuments({
      status: { $in: ["pending", "in_progress"] },
    });

    // Count pending payments (overdue payments)
    const pendingPayments = await Payment.find({
      status: "pending",
      dueDate: { $lt: now },
    });

    const pendingRevenue = pendingPayments.reduce(
      (total, payment) => total + payment.amount,
      0
    );

    // Return dashboard stats
    res.json({
      totalProperties: propertiesCount,
      totalUnits,
      occupiedUnits,
      occupancyRate,
      totalTenants: tenantsCount,
      monthlyRevenue,
      yearToDateRevenue,
      pendingMaintenance,
      pendingRevenue,
    });
  } catch (error) {
    logger.error(`Error in getDashboardStats: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
};

export const getRecentActivities = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 5;

    // Get recent payments as activities
    const recentPayments = await Payment.find()
      .populate("tenant", "firstName lastName")
      .populate("unit", "unitNumber")
      .populate("property", "name")
      .sort("-createdAt")
      .limit(limit);

    // Get recent maintenance requests
    const recentMaintenance = await Maintenance.find()
      .populate("property", "name")
      .populate("unit", "unitNumber")
      .sort("-createdAt")
      .limit(limit);

    // Combine and transform into activities
    const paymentActivities = recentPayments.map((payment) => ({
      id: payment._id,
      type: "payment",
      title: `Payment ${
        payment.status === "completed" ? "Received" : "Recorded"
      }`,
      description: `${payment.tenant.firstName} ${
        payment.tenant.lastName
      } - KES ${payment.amount.toLocaleString()} for ${
        payment.property.name
      } Unit ${payment.unit.unitNumber}`,
      date: payment.createdAt,
    }));

    const maintenanceActivities = recentMaintenance.map((maintenance) => ({
      id: maintenance._id,
      type: "maintenance",
      title: `Maintenance Request ${maintenance.status}`,
      description: `${maintenance.issue} - ${maintenance.property.name} Unit ${maintenance.unit.unitNumber}`,
      date: maintenance.createdAt,
    }));

    // Combine, sort by date (newest first) and limit
    const allActivities = [...paymentActivities, ...maintenanceActivities]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, limit);

    res.json(allActivities);
  } catch (error) {
    logger.error(`Error in getRecentActivities: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
};
