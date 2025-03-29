// frontend/src/services/dashboardService.js
import api from "./api";

/**
 * Get dashboard summary statistics
 * @returns {Promise<Object>} Dashboard stats
 */
export const getDashboardStats = async () => {
  try {
    const response = await api.get("/dashboard/stats");
    return response.data;
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    throw error;
  }
};

/**
 * Get recent activities for dashboard
 * @param {number} limit - Number of activities to fetch
 * @returns {Promise<Array>} Recent activities
 */
export const getRecentActivities = async (limit = 5) => {
  try {
    const response = await api.get(`/dashboard/activities?limit=${limit}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching recent activities:", error);
    throw error;
  }
};

export default {
  getDashboardStats,
  getRecentActivities,
};
