import { API_BASE_URL } from "../api/config";

/**
 * Builds a user-visible message from a thrown API error (422 / Laravel validation).
 * Works with errors from apiRequest (payload) and apiFetch from config (errorData / data).
 *
 * @param {Error & { payload?: object; errorData?: object; data?: object }} error
 * @returns {string}
 */
export function build422UserMessage(error) {
  const payload = error?.payload ?? error?.errorData ?? error?.data ?? null;

  let fromPayload =
    (payload && typeof payload.message === 'string' && payload.message.trim()) ||
    '';

  if (!fromPayload && payload?.errors && typeof payload.errors === 'object') {
    const parts = Object.values(payload.errors)
      .flat()
      .filter((x) => x != null && String(x).trim() !== '');
    fromPayload = parts.join('\n');
  }

  const rawMsg = typeof error?.message === 'string' ? error.message.trim() : '';
  const looksLikeGenericHttp = /^HTTP error!\s*status:/i.test(rawMsg);

  if (fromPayload) {
    return fromPayload;
  }
  if (rawMsg && !looksLikeGenericHttp) {
    return rawMsg;
  }
  return '';
}

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
    credentials: 'include', // ✅ CRITICAL: Include cookies for Laravel session
  };

  const response = await fetch(url, fetchOptions);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    let errorMessage = errorData.message || `HTTP error! status: ${response.status}`;
    if ((!errorData.message || String(errorData.message).trim() === '') && errorData.errors) {
      const flat = Object.values(errorData.errors)
        .flat()
        .filter((x) => x != null && String(x).trim() !== '');
      if (flat.length > 0) {
        errorMessage = flat.join(', ');
      }
    }
    const err = new Error(errorMessage);
    err.status = response.status;
    err.payload = errorData;
    throw err;
  }

  return response.json();
};

