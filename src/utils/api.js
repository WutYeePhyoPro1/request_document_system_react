import { API_BASE_URL } from "../api/config";

/**
 * Makes an API request with automatic token handling
 * @param {string} endpoint - The API endpoint (relative or absolute)
 * @param {object} options - Fetch options
 * @returns {Promise<any>} The JSON response
 */
export const apiRequest = async (endpoint, options = {}) => {
  const token = localStorage.getItem("token");
  
  // Handle relative endpoints
  const url = endpoint.startsWith("/api") 
    ? API_BASE_URL.replace("/api", "") + endpoint
    : endpoint.startsWith("http") 
    ? endpoint 
    : `${API_BASE_URL}${endpoint}`;

  const headers = {
    ...options.headers,
  };

  // Only set Content-Type if it's not FormData, otherwise browser handles it
  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const fetchOptions = {
    ...options,
    headers,
  };

  const response = await fetch(url, fetchOptions);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
  }

  return response.json();
};

