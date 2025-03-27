import api from "./api";

/**
 * Get dashboard summary statistics
 * @returns {Promise<Object>} Dashboard stats
 */
const getDashboardStats = async () => {
  try {
    const response = await api.get("/dashboard/stats");
    return response.data.data || response.data;
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
const getRecentActivities = async (limit = 5) => {
  try {
    const response = await api.get("/dashboard/activities", {
      params: { limit },
    });
    return response.data.data || response.data;
  } catch (error) {
    console.error("Error fetching recent activities:", error);
    throw error;
  }
};

/**
 * Get rent collection summary
 * @returns {Promise<Object>} Rent collection stats
 */
const getRentCollectionStats = async () => {
  try {
    const response = await api.get("/dashboard/rent-collection");
    return response.data.data || response.data;
  } catch (error) {
    console.error("Error fetching rent collection stats:", error);
    throw error;
  }
};

/**
 * Get occupancy rate stats
 * @returns {Promise<Object>} Occupancy stats
 */
const getOccupancyStats = async () => {
  try {
    const response = await api.get("/dashboard/occupancy");
    return response.data.data || response.data;
  } catch (error) {
    console.error("Error fetching occupancy stats:", error);
    throw error;
  }
};

/**
 * Get maintenance request summary
 * @returns {Promise<Object>} Maintenance stats
 */
const getMaintenanceStats = async () => {
  try {
    const response = await api.get("/dashboard/maintenance");
    return response.data.data || response.data;
  } catch (error) {
    console.error("Error fetching maintenance stats:", error);
    throw error;
  }
};

// Mock data for development/testing
const getMockDashboardData = () => {
  return {
    stats: {
      totalProperties: 15,
      totalUnits: 120,
      occupiedUnits: 102,
      occupancyRate: 85,
      totalTenants: 98,
      monthlyRevenue: 52500,
      pendingMaintenance: 8,
    },
    recentActivities: [
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
      {
        id: 4,
        type: "property",
        title: "Property Added",
        description: 'New property "River View Apartments" added',
        date: new Date(Date.now() - 259200000),
      },
      {
        id: 5,
        type: "tenant",
        title: "Tenant Notice",
        description: "Tenant in Unit 402 gave move-out notice",
        date: new Date(Date.now() - 345600000),
      },
    ],
    rentCollection: {
      collected: 42000,
      outstanding: 10500,
      collectionRate: 80,
      overduePayments: 5,
    },
    occupancyTrend: [
      { month: "Jan", rate: 78 },
      { month: "Feb", rate: 80 },
      { month: "Mar", rate: 82 },
      { month: "Apr", rate: 79 },
      { month: "May", rate: 83 },
      { month: "Jun", rate: 85 },
    ],
  };
};

export default {
  getDashboardStats,
  getRecentActivities,
  getRentCollectionStats,
  getOccupancyStats,
  getMaintenanceStats,
  getMockDashboardData,
};
