// Authentication utility functions

// Cookie helper functions
export const getCookie = (name) => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    return parts.pop().split(';').shift();
  }
  return null;
}

export const setCookie = (name, value, days = 7) => {
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + days);
  document.cookie = `${name}=${value}; expires=${expiryDate.toUTCString()}; path=/; secure; samesite=strict`;
}

export const deleteCookie = (name) => {
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; secure; samesite=strict`;
}

// Auth token management
export const getAuthToken = () => {
  // Try localStorage first, then cookies
  let token = localStorage.getItem('palvoria_admin_token');
  if (!token) {
    token = getCookie('palvoria_token');
    // If found in cookies, sync to localStorage
    if (token) {
      localStorage.setItem('palvoria_admin_token', token);
    }
  }
  return token;
}

export const getAuthUser = () => {
  // Try localStorage first, then cookies
  let userStr = localStorage.getItem('palvoria_admin_user');
  if (!userStr) {
    userStr = getCookie('palvoria_user');
    if (userStr) {
      try {
        userStr = decodeURIComponent(userStr);
        // If found in cookies, sync to localStorage
        localStorage.setItem('palvoria_admin_user', userStr);
      } catch (e) {
        console.error('Error decoding user from cookie:', e);
        return null;
      }
    }
  }

  if (userStr) {
    try {
      return JSON.parse(userStr);
    } catch (e) {
      console.error('Error parsing user data:', e);
      return null;
    }
  }

  return null;
}

export const setAuthData = (token, user) => {
  // Store in localStorage
  localStorage.setItem('palvoria_admin_token', token);
  localStorage.setItem('palvoria_admin_user', JSON.stringify(user));

  // Store in cookies for persistence
  setCookie('palvoria_token', token, 7);
  setCookie('palvoria_user', encodeURIComponent(JSON.stringify(user)), 7);
}

export const clearAuthData = () => {
  // Clear localStorage
  localStorage.removeItem('palvoria_admin_token');
  localStorage.removeItem('palvoria_admin_user');

  // Clear cookies
  deleteCookie('palvoria_token');
  deleteCookie('palvoria_user');
}

export const isAuthenticated = () => {
  const token = getAuthToken();
  return !!token;
}

// Verify token is still valid
export const verifyToken = async () => {
  const token = getAuthToken();
  if (!token) return false;

  try {
    const response = await fetch('/api/auth/verify', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const data = await response.json();
      if (data.success) {
        // Update user data if provided
        if (data.user) {
          const currentUser = getAuthUser();
          if (JSON.stringify(currentUser) !== JSON.stringify(data.user)) {
            setAuthData(token, data.user);
          }
        }
        return true;
      }
    }

    // Token is invalid, clear auth data
    clearAuthData();
    return false;
  } catch (error) {
    console.error('Token verification failed:', error);
    // Don't clear auth data on network errors, just return false
    return false;
  }
}