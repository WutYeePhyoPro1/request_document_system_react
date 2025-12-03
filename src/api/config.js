const getBrowserOrigin = () =>
  typeof window !== "undefined" && window.location?.origin
    ? window.location.origin
    : "";

const deriveApiBaseUrl = () => {
  const fallbackOrigin = getBrowserOrigin();
  const raw = import.meta.env?.VITE_API_URL;

  if (!raw) {
    return fallbackOrigin;
  }

  try {
    const parsed = new URL(raw, fallbackOrigin || "http://localhost");
    const trimmedPath = parsed.pathname.replace(/\/api\/?$/, "");
    const base = `${parsed.origin}${trimmedPath}`.replace(/\/$/, "");
    return base || parsed.origin;
  } catch (error) {
    return fallbackOrigin;
  }
};

export const API_BASE_URL = deriveApiBaseUrl() + "/api";
export const SANCTUM_URL = deriveApiBaseUrl();

// API fetch helper
export const apiFetch = async (endpoint, options = {}) => {
  const token = localStorage.getItem("token");
  
  // Don't set Content-Type for FormData - let browser set it automatically with boundary
  const headers = {
    'Accept': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
    ...options.headers,
  };
  
  // Only set Content-Type if not FormData
  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  // Handle endpoint - if it already starts with http, use as-is, otherwise prepend API_BASE_URL
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include', // ✅ CRITICAL: Include cookies for Laravel session
  });

  if (!response.ok) {
    // Try to parse error response for better error messages
    let errorMessage = `HTTP error! status: ${response.status}`;
    let errorData = null;
    
    try {
      errorData = await response.json();
      console.error('Server validation error response:', errorData);
      
      if (errorData.message) {
        errorMessage = errorData.message;
      } else if (errorData.errors) {
        // Laravel validation errors format
        console.error('Validation errors:', errorData.errors);
        const errors = Object.values(errorData.errors).flat();
        errorMessage = errors.join(', ');
      }
    } catch (e) {
      // If parsing fails, use the default error message
      console.error('Could not parse error response:', e);
    }
    
    const error = new Error(errorMessage);
    error.status = response.status;
    error.errorData = errorData;
    throw error;
  }

  return response.json();
};

