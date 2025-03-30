// frontend/src/services/reportService.js
import api from "./api";
import { getErrorMessage } from "../utils/errorHandling";

/**
 * Get financial summary report
 * @param {Object} filters - Filter parameters including date range, propertyId, etc.
 * @returns {Promise<Object>} Financial summary data
 */
export const getFinancialSummary = async (filters = {}) => {
  try {
    const queryParams = new URLSearchParams();

    // Add filters to query params
    Object.keys(filters).forEach((key) => {
      if (filters[key]) {
        queryParams.append(key, filters[key]);
      }
    });

    const queryString = queryParams.toString();
    const url = queryString
      ? `/reports/financial?${queryString}`
      : "/reports/financial";

    const response = await api.get(url);
    return response.data;
  } catch (error) {
    console.error("Error fetching financial summary:", error);
    throw new Error(getErrorMessage(error));
  }
};

/**
 * Get occupancy report
 * @param {Object} filters - Filter parameters including propertyId, etc.
 * @returns {Promise<Object>} Occupancy data
 */
export const getOccupancyReport = async (filters = {}) => {
  try {
    const queryParams = new URLSearchParams();

    // Add filters to query params
    Object.keys(filters).forEach((key) => {
      if (filters[key]) {
        queryParams.append(key, filters[key]);
      }
    });

    const queryString = queryParams.toString();
    const url = queryString
      ? `/reports/occupancy?${queryString}`
      : "/reports/occupancy";

    const response = await api.get(url);
    return response.data;
  } catch (error) {
    console.error("Error fetching occupancy report:", error);
    throw new Error(getErrorMessage(error));
  }
};

/**
 * Get tenant payment report
 * @param {Object} filters - Filter parameters including date range, propertyId, etc.
 * @returns {Promise<Object>} Tenant payment data
 */
export const getTenantPaymentReport = async (filters = {}) => {
  try {
    const queryParams = new URLSearchParams();

    // Add filters to query params
    Object.keys(filters).forEach((key) => {
      if (filters[key]) {
        queryParams.append(key, filters[key]);
      }
    });

    const queryString = queryParams.toString();
    const url = queryString
      ? `/reports/tenant-payments?${queryString}`
      : "/reports/tenant-payments";

    const response = await api.get(url);
    return response.data;
  } catch (error) {
    console.error("Error fetching tenant payment report:", error);
    throw new Error(getErrorMessage(error));
  }
};

/**
 * Get revenue vs expenses report
 * @param {Object} filters - Filter parameters including date range, propertyId, period, etc.
 * @returns {Promise<Object>} Revenue vs expenses data
 */
export const getRevenueVsExpenses = async (filters = {}) => {
  try {
    const queryParams = new URLSearchParams();

    // Add filters to query params
    Object.keys(filters).forEach((key) => {
      if (filters[key]) {
        queryParams.append(key, filters[key]);
      }
    });

    const queryString = queryParams.toString();
    const url = queryString
      ? `/reports/revenue-expenses?${queryString}`
      : "/reports/revenue-expenses";

    const response = await api.get(url);
    return response.data;
  } catch (error) {
    console.error("Error fetching revenue vs expenses report:", error);
    throw new Error(getErrorMessage(error));
  }
};

/**
 * Get lease expiration report
 * @param {Object} filters - Filter parameters including propertyId, etc.
 * @returns {Promise<Array>} Lease expiration data
 */
export const getLeaseExpirationReport = async (filters = {}) => {
  try {
    const queryParams = new URLSearchParams();

    // Add filters to query params
    Object.keys(filters).forEach((key) => {
      if (filters[key]) {
        queryParams.append(key, filters[key]);
      }
    });

    const queryString = queryParams.toString();
    const url = queryString
      ? `/reports/lease-expiration?${queryString}`
      : "/reports/lease-expiration";

    const response = await api.get(url);
    return response.data;
  } catch (error) {
    console.error("Error fetching lease expiration report:", error);
    throw new Error(getErrorMessage(error));
  }
};

/**
 * Export report data to CSV or PDF
 * @param {string} reportType - Type of report to export
 * @param {string} format - Export format (csv, pdf)
 * @param {Object} filters - Filter parameters
 * @returns {Promise<Blob>} The exported file as a Blob
 */
export const exportReport = async (
  reportType,
  format = "csv",
  filters = {}
) => {
  try {
    const queryParams = new URLSearchParams();

    // Add filters to query params
    Object.keys(filters).forEach((key) => {
      if (filters[key]) {
        queryParams.append(key, filters[key]);
      }
    });

    // Add format
    queryParams.append("format", format);

    const queryString = queryParams.toString();
    const url = `/reports/export/${reportType}?${queryString}`;

    const response = await api.get(url, {
      responseType: "blob", // Important for file downloads
    });

    return response.data;
  } catch (error) {
    console.error(`Error exporting ${reportType} report:`, error);
    throw new Error(getErrorMessage(error));
  }
};

export default {
  getFinancialSummary,
  getOccupancyReport,
  getTenantPaymentReport,
  getRevenueVsExpenses,
  getLeaseExpirationReport,
  exportReport,
};
