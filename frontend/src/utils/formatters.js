// frontend/src/utils/formatters.js

/**
 * Format a number as KES currency
 * @param {number} amount - Amount to format
 * @param {number} decimals - Number of decimal places (default 0)
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (amount, decimals = 0) => {
  // Handle undefined or null values
  if (amount === undefined || amount === null) {
    return "KES 0";
  }

  // Format the number with thousands separator and proper decimal places
  return `KES ${Number(amount).toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`;
};

/**
 * Format a date string to local date format
 * @param {string|Date} date - Date to format
 * @param {Object} options - Date formatting options
 * @returns {string} Formatted date string
 */
export const formatDate = (date, options = {}) => {
  if (!date) return "N/A";

  const dateObj = date instanceof Date ? date : new Date(date);

  if (isNaN(dateObj.getTime())) {
    return "Invalid Date";
  }

  const defaultOptions = {
    year: "numeric",
    month: "short",
    day: "numeric",
  };

  return dateObj.toLocaleDateString("en-US", { ...defaultOptions, ...options });
};

/**
 * Format a date to a relative time string (e.g., "2 days ago")
 * @param {string|Date} date - Date to format
 * @returns {string} Relative time string
 */
export const formatRelativeTime = (date) => {
  if (!date) return "N/A";

  const dateObj = date instanceof Date ? date : new Date(date);
  if (isNaN(dateObj.getTime())) {
    return "Invalid Date";
  }

  const now = new Date();
  const diffInSeconds = Math.floor((now - dateObj) / 1000);

  if (diffInSeconds < 60) {
    return "just now";
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} ${diffInMinutes === 1 ? "minute" : "minutes"} ago`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} ${diffInHours === 1 ? "hour" : "hours"} ago`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `${diffInDays} ${diffInDays === 1 ? "day" : "days"} ago`;
  }

  return formatDate(dateObj);
};

/**
 * Format a number as a percentage
 * @param {number} value - Value to format
 * @param {number} decimals - Number of decimal places (default 0)
 * @returns {string} Formatted percentage string
 */
export const formatPercentage = (value, decimals = 0) => {
  if (value === undefined || value === null) {
    return "0%";
  }

  return `${Number(value).toFixed(decimals)}%`;
};

/**
 * Format a number with thousands separators
 * @param {number} number - Number to format
 * @param {number} decimals - Number of decimal places (default 0)
 * @returns {string} Formatted number string
 */
export const formatNumber = (number, decimals = 0) => {
  if (number === undefined || number === null) {
    return "0";
  }

  return Number(number).toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
};
