// frontend/src/services/dashboardService.js
import api from "./api";

/**
 * Get dashboard summary statistics
 * @returns {Promise<Object>} Dashboard stats
 */
const getDashboardStats = async () => {
  try {
    const response = await api.get("/dashboard/stats");
    return response.data;
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
    const response = await api.get(`/dashboard/activities?limit=${limit}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching recent activities:", error);
    return [];
  }
};

export default {
  getDashboardStats,
  getRecentActivities,
};
