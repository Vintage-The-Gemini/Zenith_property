// backend/controllers/dashboardController.js
import Property from "../models/Property.js";
import Tenant from "../models/Tenant.js";
import Unit from "../models/Unit.js";
import Payment from "../models/Payment.js";

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

    // Count pending maintenance (placeholder for now)
    const pendingMaintenance = 0;

    // Return dashboard stats
    res.json({
      totalProperties: propertiesCount,
      totalUnits,
      occupiedUnits,
      occupancyRate,
      totalTenants: tenantsCount,
      monthlyRevenue,
      pendingMaintenance,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getRecentActivities = async (req, res) => {
  try {
    // Get recent payments as activities
    const recentPayments = await Payment.find()
      .populate("tenant", "firstName lastName")
      .populate("unit", "unitNumber")
      .populate("property", "name")
      .sort("-createdAt")
      .limit(5);

    // Transform payments into activities
    const activities = recentPayments.map((payment) => ({
      id: payment._id,
      type: "payment",
      title: `Payment ${
        payment.status === "completed" ? "Received" : "Recorded"
      }`,
      description: `${payment.tenant.firstName} ${payment.tenant.lastName} - $${payment.amount} for ${payment.property.name} Unit ${payment.unit.unitNumber}`,
      date: payment.createdAt,
    }));

    res.json(activities);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
