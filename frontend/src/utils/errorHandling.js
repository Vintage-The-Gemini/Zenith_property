// frontend/src/utils/errorHandling.js
/**
 * Extract meaningful error message from API error
 * @param {Error} error - The error object
 * @returns {string} Formatted error message
 */
export const getErrorMessage = (error) => {
  // If it's an Axios error with a response
  if (error.response && error.response.data) {
    // Check for specific error formats
    if (error.response.data.error) {
      return error.response.data.error;
    }
    if (error.response.data.message) {
      return error.response.data.message;
    }
    if (error.response.data.details) {
      // Handle validation errors
      if (Array.isArray(error.response.data.details)) {
        return error.response.data.details.join(", ");
      }
      return error.response.data.details;
    }

    // Return a generic message with status code
    return `Server error (${error.response.status}): ${error.message}`;
  }

  // Network errors
  if (error.request && !error.response) {
    return "Network error - unable to connect to server";
  }

  // Default error message
  return error.message || "An unknown error occurred";
};

/**
 * Handle common API errors and provide appropriate user feedback
 * @param {Error} error - The error object
 * @param {Function} setError - State setter function for error message
 * @param {Function} callback - Optional callback to run after handling error
 */
export const handleApiError = (error, setError, callback = null) => {
  const errorMessage = getErrorMessage(error);
  setError(errorMessage);

  // Log the full error to console for debugging
  console.error("API Error:", error);

  // If it's a 401 Unauthorized, we might want to redirect to login
  if (error.response && error.response.status === 401) {
    // Could redirect to login or refresh token here
    console.log("Authentication error - user may need to login again");
  }

  // Run any additional callback if provided
  if (callback && typeof callback === "function") {
    callback(error);
  }
};
