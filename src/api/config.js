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
    const parsed = new URL(raw, fallbackOrigin);
    const trimmedPath = parsed.pathname.replace(/\/api\/?$/, "");
    const base = `${parsed.origin}${trimmedPath}`.replace(/\/$/, "");
    return base || parsed.origin;
  } catch (error) {
    return fallbackOrigin;
  }
};

export const API_BASE_URL = deriveApiBaseUrl() + "/api";
export const SANCTUM_URL = deriveApiBaseUrl();

// API fetch helper with timeout support
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

  // Set timeout based on operation type
  // Issuance operations take longer, so use extended timeout
  const isIssuanceOperation = endpoint.includes('big-damage-issues') &&
                              (options.body instanceof FormData) &&
                              (options.body.get('status') === 'Issued' || options.body.get('status') === 'Completed');

  const timeoutMs = isIssuanceOperation ? 300000 : 60000; // 5 minutes for issuance, 1 minute for others

  // Create AbortController for timeout handling
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, timeoutMs);

  try {
  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include', // ✅ CRITICAL: Include cookies for Laravel session
      signal: controller.signal,
  });

    clearTimeout(timeoutId);

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
  } catch (error) {
    clearTimeout(timeoutId);

    // Handle timeout errors specifically - check for various timeout indicators
    const isTimeoutError = error.name === 'AbortError' ||
                          error.message?.includes('timeout') ||
                          error.message?.includes('Timeout') ||
                          error.code === 'ECONNABORTED' ||
                          error.status === 408 ||
                          (error.response && error.response.status === 408) ||
                          (error.response && error.response.status === 504);

    if (isTimeoutError) {
      const timeoutError = new Error(
        isIssuanceOperation
          ? 'The issuance operation is taking longer than expected. Please wait - the operation continues in the background and will complete soon. Check the form list to see if it completed successfully.'
          : 'Request timed out. Please try again.'
      );
      timeoutError.status = 408; // Request Timeout
      timeoutError.isTimeout = true;
      timeoutError.isIssuanceOperation = isIssuanceOperation;
      throw timeoutError;
    }

    // Re-throw other errors
    throw error;
  }
};

