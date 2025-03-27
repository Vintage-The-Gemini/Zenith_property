// frontend/src/services/dashboardService.js
import api from "./api";

// Development mode flag
const DEV_MODE = true;

// Mock data
const MOCK_STATS = {
  totalProperties: 3,
  totalUnits: 12,
  occupiedUnits: 8,
  occupancyRate: 67,
  totalTenants: 8,
  monthlyRevenue: 120000,
  yearToDateRevenue: 320000,
  pendingMaintenance: 3,
  pendingRevenue: 15000,
};

const MOCK_ACTIVITIES = [
  {
    id: "1",
    type: "payment",
    title: "Payment Received",
    description: "John Doe - KES 30,000 for Sunset Apartments Unit 101",
    date: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
  },
  {
    id: "2",
    type: "maintenance",
    title: "Maintenance Request In Progress",
    description: "Plumbing issue - Sunset Apartments Unit 303",
    date: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
  },
  {
    id: "3",
    type: "payment",
    title: "Payment Received",
    description: "Jane Smith - KES 25,000 for Ocean View Condos Unit 202",
    date: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
  },
  {
    id: "4",
    type: "maintenance",
    title: "Maintenance Request Completed",
    description: "Electrical repair - Ocean View Condos Unit 105",
    date: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
  },
  {
    id: "5",
    type: "payment",
    title: "Payment Pending",
    description: "Mike Johnson - KES 28,000 for Sunset Apartments Unit 204",
    date: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
  },
];

/**
 * Get dashboard summary statistics
 * @returns {Promise<Object>} Dashboard stats
 */
const getDashboardStats = async () => {
  try {
    if (DEV_MODE) {
      // Return mock data in development mode
      // Add a small delay to simulate network request
      await new Promise((resolve) => setTimeout(resolve, 500));
      return MOCK_STATS;
    }

    const response = await api.get("/dashboard/stats");
    return response.data;
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return MOCK_STATS; // Fallback to mock data in case of error
  }
};

/**
 * Get recent activities for dashboard
 * @param {number} limit - Number of activities to fetch
 * @returns {Promise<Array>} Recent activities
 */
const getRecentActivities = async (limit = 5) => {
  try {
    if (DEV_MODE) {
      // Return mock data in development mode
      // Add a small delay to simulate network request
      await new Promise((resolve) => setTimeout(resolve, 500));
      return MOCK_ACTIVITIES.slice(0, limit);
    }

    const response = await api.get(`/dashboard/activities?limit=${limit}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching recent activities:", error);
    return MOCK_ACTIVITIES.slice(0, limit); // Fallback to mock data
  }
};

export default {
  getDashboardStats,
  getRecentActivities,
};
