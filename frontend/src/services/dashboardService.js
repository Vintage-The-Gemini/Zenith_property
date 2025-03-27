// frontend/src/services/dashboardService.js
import api from "./api";

/**
 * Get dashboard summary statistics
 * @returns {Promise<Object>} Dashboard stats
 */
const getDashboardStats = async () => {
  try {
    // In development mode, return mock data
    if (process.env.NODE_ENV === "development") {
      return {
        totalProperties: 15,
        totalUnits: 120,
        occupiedUnits: 102,
        occupancyRate: 85,
        totalTenants: 98,
        monthlyRevenue: 52500,
        pendingMaintenance: 8,
      };
    }

    const propertiesResponse = await api.get("/properties");
    const properties = Array.isArray(propertiesResponse.data)
      ? propertiesResponse.data
      : propertiesResponse.data.data || [];

    const tenantsResponse = await api.get("/tenants");
    const tenants = Array.isArray(tenantsResponse.data)
      ? tenantsResponse.data
      : tenantsResponse.data.data || [];

    // Calculate stats
    let totalUnits = 0;
    let occupiedUnits = 0;
    let monthlyRevenue = 0;

    if (Array.isArray(properties)) {
      properties.forEach((property) => {
        if (property.units && Array.isArray(property.units)) {
          totalUnits += property.units.length;

          property.units.forEach((unit) => {
            if (unit.status === "occupied") {
              occupiedUnits++;
              monthlyRevenue += unit.monthlyRent || 0;
            }
          });
        }
      });
    }

    return {
      totalProperties: Array.isArray(properties) ? properties.length : 0,
      totalUnits,
      occupiedUnits,
      occupancyRate:
        totalUnits > 0 ? Math.round((occupiedUnits / totalUnits) * 100) : 0,
      totalTenants: Array.isArray(tenants) ? tenants.length : 0,
      monthlyRevenue,
      pendingMaintenance: 0,
    };
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);

    // Return fallback data in case of error
    return {
      totalProperties: 0,
      totalUnits: 0,
      occupiedUnits: 0,
      occupancyRate: 0,
      totalTenants: 0,
      monthlyRevenue: 0,
      pendingMaintenance: 0,
    };
  }
};

/**
 * Get recent activities for dashboard
 * @param {number} limit - Number of activities to fetch
 * @returns {Promise<Array>} Recent activities
 */
const getRecentActivities = async (limit = 5) => {
  try {
    // Return mock data for development
    return [
      {
        id: 1,
        type: "payment",
        title: "Rent Payment Received",
        description: "John Doe paid $1,200 for Unit 101",
        date: new Date(),
      },
      {
        id: 2,
        type: "maintenance",
        title: "Maintenance Request",
        description: "Plumbing issue reported in Unit 204",
        date: new Date(Date.now() - 86400000),
      },
      {
        id: 3,
        type: "lease",
        title: "Lease Signed",
        description: "New tenant for Unit 305",
        date: new Date(Date.now() - 172800000),
      },
    ];
  } catch (error) {
    console.error("Error fetching recent activities:", error);
    return [];
  }
};

export default {
  getDashboardStats,
  getRecentActivities,
};
