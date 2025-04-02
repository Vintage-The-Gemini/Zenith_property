// frontend/src/services/bnbService.js
import api from "./api";
import { getErrorMessage } from "../utils/errorHandling";

/**
 * Get BnB calendar for a unit
 * @param {string} unitId - Unit ID
 * @returns {Promise<Object>} BnB calendar data with availability
 */
export const getBnbCalendar = async (unitId) => {
  try {
    const response = await api.get(`/payments/bnb/calendar/${unitId}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching BnB calendar:", error);
    throw new Error(getErrorMessage(error));
  }
};

/**
 * Create a new BnB booking
 * @param {Object} bookingData - Booking data
 * @returns {Promise<Object>} Created booking
 */
export const createBnbBooking = async (bookingData) => {
  try {
    const response = await api.post("/payments/bnb/booking", bookingData);
    return response.data;
  } catch (error) {
    console.error("Error creating BnB booking:", error);
    throw new Error(getErrorMessage(error));
  }
};

/**
 * Update BnB booking status
 * @param {string} bookingId - Booking ID
 * @param {string} status - New status
 * @returns {Promise<Object>} Updated booking
 */
export const updateBnbBookingStatus = async (bookingId, status) => {
  try {
    const response = await api.patch(
      `/payments/bnb/booking/${bookingId}/status`,
      { status }
    );
    return response.data;
  } catch (error) {
    console.error("Error updating BnB booking status:", error);
    throw new Error(getErrorMessage(error));
  }
};

/**
 * Get upcoming BnB bookings
 * @param {Object} filters - Filter parameters
 * @returns {Promise<Array>} Upcoming bookings
 */
export const getUpcomingBookings = async (filters = {}) => {
  try {
    // Build query parameters
    const queryParams = new URLSearchParams();
    Object.keys(filters).forEach((key) => {
      if (filters[key]) {
        queryParams.append(key, filters[key]);
      }
    });

    const queryString = queryParams.toString();
    const url = queryString
      ? `/payments/bnb/upcoming?${queryString}`
      : "/payments/bnb/upcoming";

    const response = await api.get(url);
    return response.data;
  } catch (error) {
    console.error("Error fetching upcoming bookings:", error);
    throw new Error(getErrorMessage(error));
  }
};

/**
 * Calculate BnB booking total
 * @param {Object} bookingParams - Booking parameters
 * @returns {Promise<Object>} Calculation results
 */
export const calculateBookingTotal = async (bookingParams) => {
  try {
    const response = await api.post("/payments/bnb/calculate", bookingParams);
    return response.data;
  } catch (error) {
    console.error("Error calculating booking total:", error);
    throw new Error(getErrorMessage(error));
  }
};

/**
 * Get BnB booking by ID
 * @param {string} bookingId - Booking ID
 * @returns {Promise<Object>} Booking details
 */
export const getBnbBookingById = async (bookingId) => {
  try {
    const response = await api.get(`/payments/bnb/booking/${bookingId}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching BnB booking:", error);
    throw new Error(getErrorMessage(error));
  }
};

export default {
  getBnbCalendar,
  createBnbBooking,
  updateBnbBookingStatus,
  getUpcomingBookings,
  calculateBookingTotal,
  getBnbBookingById,
};
