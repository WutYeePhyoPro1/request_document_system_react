/**
 * Big Damage Issue Helper Functions
 * Utility functions for Big Damage Issue forms
 */

/**
 * Format date for display
 * @param {string|Date|null|undefined} dateString - Date string or Date object
 * @param {boolean} withTime - Include time in format
 * @returns {string} Formatted date string
 */
export const formatDate = (dateString, withTime = false) => {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';

  if (withTime) {
    return date.toLocaleDateString('en-GB', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  }

  return date.toLocaleDateString('en-GB', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
};

/**
 * Format date with time
 * @param {string|Date|null|undefined} dateString - Date string or Date object
 * @returns {string} Formatted date time string
 */
export const formatDateTime = (dateString) => {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';

  return date.toLocaleDateString('en-GB', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
};

/**
 * Format number with decimals
 * @param {number|string|null|undefined} value - Number value
 * @param {number} decimal - Decimal places (default: 2)
 * @returns {string} Formatted number string
 */
export const formatNumber = (value, decimal = 2) => {
  if (value === null || value === undefined || value === '') return '-';

  const num = Number(value);
  if (isNaN(num)) return '-';

  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimal,
    maximumFractionDigits: decimal,
  }).format(num);
};

/**
 * Get form document number from data
 * @param {Object} data - Form data
 * @returns {string} Form document number
 */
export const getFormDocNo = (data) => {
  return data?.form_doc_no || data?.form?.form_doc_no || data?.general_form?.form_doc_no || '';
};

/**
 * Copy text to clipboard with fallback
 * @param {string} text - Text to copy
 * @param {Function} onSuccess - Success callback
 * @param {Function} onError - Error callback
 * @returns {Promise<void>}
 */
export const copyToClipboard = async (text, onSuccess, onError) => {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      onSuccess?.();
    } catch (error) {
      console.error('Clipboard copy failed:', error);
      fallbackCopy(text, onSuccess, onError);
    }
  } else {
    fallbackCopy(text, onSuccess, onError);
  }
};

/**
 * Fallback copy method for older browsers
 * @param {string} text - Text to copy
 * @param {Function} onSuccess - Success callback
 * @param {Function} onError - Error callback
 */
const fallbackCopy = (text, onSuccess, onError) => {
  const textArea = document.createElement('textarea');
  textArea.value = text;
  textArea.style.position = 'fixed';
  textArea.style.top = '0';
  textArea.style.left = '0';
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();
  
  try {
    const successful = document.execCommand('copy');
    if (successful) {
      onSuccess?.();
    } else {
      onError?.(new Error('Copy command failed'));
    }
  } catch (error) {
    console.error('Fallback copy failed:', error);
    onError?.(error);
  }
  
  document.body.removeChild(textArea);
};

/**
 * Calculate total amount from items
 * @param {Array} items - Array of items
 * @param {string} qtyField - Quantity field name (default: 'final_qty')
 * @param {string} priceField - Price field name (default: 'unit_price')
 * @returns {number} Total amount
 */
export const calculateTotalAmount = (items = [], qtyField = 'final_qty', priceField = 'unit_price') => {
  if (!Array.isArray(items) || items.length === 0) return 0;

  return items.reduce((total, item) => {
    const qty = parseFloat(item[qtyField] || item.actual_qty || item.request_qty || 0);
    const price = parseFloat(item[priceField] || 0);
    return total + (qty * price);
  }, 0);
};

/**
 * Check if form requires Operation Manager approval
 * @param {number} totalAmount - Total amount
 * @param {number} threshold - Threshold amount (default: 500000)
 * @returns {boolean} True if requires OM approval
 */
export const requiresOperationManagerApproval = (totalAmount, threshold = 500000) => {
  return totalAmount > threshold;
};

/**
 * Get status display name
 * @param {string} status - Status value
 * @returns {string} Display name
 */
export const getStatusDisplayName = (status) => {
  const statusMap = {
    'Ongoing': 'Ongoing',
    'Checked': 'Checked',
    'BM Approved': 'BM Approved',
    'OPApproved': 'Operation Manager Approved',
    'Ac_Acknowledged': 'Operation Manager Approved',
    'Completed': 'Completed',
  };

  return statusMap[status] || status;
};

/**
 * Validate quantity input
 * @param {string|number} value - Input value
 * @param {number} min - Minimum value (default: 0)
 * @param {number} max - Maximum value (optional)
 * @returns {Object} Validation result { isValid: boolean, error: string }
 */
export const validateQuantity = (value, min = 0, max = null) => {
  if (value === '' || value === null || value === undefined) {
    return { isValid: true, error: '' }; // Allow empty
  }

  const num = parseFloat(value);
  
  if (isNaN(num)) {
    return { isValid: false, error: 'Invalid number' };
  }

  if (num < min) {
    return { isValid: false, error: `Minimum value is ${min}` };
  }

  if (max !== null && num > max) {
    return { isValid: false, error: `Maximum value is ${max}` };
  }

  return { isValid: true, error: '' };
};

/**
 * Format file size
 * @param {number} bytes - File size in bytes
 * @returns {string} Formatted file size
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

/**
 * Debounce function
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

/**
 * Build query string from object
 * @param {Object} params - Parameters object
 * @returns {string} Query string
 */
export const buildQueryString = (params) => {
  const queryParams = new URLSearchParams();
  
  Object.keys(params).forEach(key => {
    if (params[key] !== null && params[key] !== undefined && params[key] !== '') {
      if (Array.isArray(params[key])) {
        params[key].forEach(value => {
          queryParams.append(key, value);
        });
      } else {
        queryParams.append(key, params[key]);
      }
    }
  });

  return queryParams.toString();
};

/**
 * Parse query string to object
 * @param {string} queryString - Query string
 * @returns {Object} Parsed parameters
 */
export const parseQueryString = (queryString) => {
  const params = {};
  const searchParams = new URLSearchParams(queryString);
  
  for (const [key, value] of searchParams.entries()) {
    if (params[key]) {
      // Handle multiple values for same key
      if (Array.isArray(params[key])) {
        params[key].push(value);
      } else {
        params[key] = [params[key], value];
      }
    } else {
      params[key] = value;
    }
  }
  
  return params;
};

