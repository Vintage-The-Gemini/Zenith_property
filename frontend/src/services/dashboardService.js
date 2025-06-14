// frontend/src/services/dashboardService.js
import api from "./api";
import { getErrorMessage } from "../utils/errorHandling";

/**
 * Get dashboard summary data
 * @returns {Promise<Object>} Dashboard summary
 */
export const getDashboardSummary = async () => {
  try {
    const response = await api.get("/dashboard/summary");
    return response.data;
  } catch (error) {
    console.error("Error fetching dashboard summary:", error);
    throw new Error(getErrorMessage(error));
  }
};

export default {
  getDashboardSummary,
};