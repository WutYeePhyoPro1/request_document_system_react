import { apiRequest } from '../../utils/api';

/**
 * Big Damage Issue API Service
 * Centralized API calls for Big Damage Issue forms
 */

/**
 * Get list of Big Damage Issue forms with filters
 * @param {Object} params - Query parameters
 * @param {string} params.search - Product name/code search
 * @param {string} params.form_doc_no - Form document number
 * @param {string} params.start_date - From date
 * @param {string} params.end_date - To date
 * @param {string} params.status - Status filter (comma-separated)
 * @param {string} params.branch - Branch filter
 * @param {number} params.page - Page number
 * @param {number} params.per_page - Items per page
 * @returns {Promise<Object>} Response data
 */
export const getBigDamageIssueList = async (params = {}) => {
  const queryParams = new URLSearchParams();
  
  Object.keys(params).forEach(key => {
    if (params[key] !== null && params[key] !== undefined && params[key] !== '') {
      queryParams.append(key, params[key]);
    }
  });

  const query = queryParams.toString();
  return apiRequest(`/api/big-damage-issues${query ? `?${query}` : ''}`);
};

/**
 * Get single Big Damage Issue form by ID with retry logic
 * @param {number|string} id - Form ID
 * @param {number} maxRetries - Maximum retry attempts (default: 3)
 * @param {number} delay - Delay between retries in ms (default: 1000)
 * @returns {Promise<Object>} Form data
 */
export const getBigDamageIssueById = async (id, maxRetries = 3, delay = 1000) => {
  const fetchWithRetry = async (attempt = 1) => {
    try {
      return await apiRequest(`/api/big-damage-issues/${id}`);
    } catch (error) {
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, delay * attempt));
        return fetchWithRetry(attempt + 1);
      }
      throw error;
    }
  };
  
  return fetchWithRetry();
};

/**
 * Get Big Damage Issue form by general form ID with retry logic
 * @param {number|string} generalFormId - General form ID
 * @param {number} perPage - Items per page (default: 500)
 * @param {number} maxRetries - Maximum retry attempts (default: 3)
 * @param {number} delay - Delay between retries in ms (default: 1000)
 * @returns {Promise<Object>} Form data
 */
export const getBigDamageIssueByGeneralFormId = async (generalFormId, perPage = 500, maxRetries = 3, delay = 1000) => {
  const fetchWithRetry = async (attempt = 1) => {
    try {
      return await apiRequest(`/api/general-forms/${generalFormId}/big-damage-issues?per_page=${perPage}`);
    } catch (error) {
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, delay * attempt));
        return fetchWithRetry(attempt + 1);
      }
      throw error;
    }
  };
  
  return fetchWithRetry();
};

/**
 * Search for product by code and branch
 * @param {string} code - Product code
 * @param {number|string} branchId - Branch ID
 * @returns {Promise<Object>} Product data
 */
export const searchProduct = async (code, branchId) => {
  return apiRequest(
    `/api/big-damage-issues/search_product/${encodeURIComponent(code)}/${branchId}`
  );
};

/**
 * Update system quantity for Big Damage Issue
 * @param {Object} data - Update data
 * @param {Array} data.items - Array of items with system_qty updates
 * @returns {Promise<Object>} Response data
 */
export const updateSystemQuantity = async (data) => {
  return apiRequest('/api/big-damage-issues/sys_update', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

/**
 * Finalize Big Damage Issue form
 * @param {number|string} generalFormId - General form ID
 * @param {Object} data - Finalize data
 * @returns {Promise<Object>} Response data
 */
export const finalizeBigDamageIssue = async (generalFormId, data = {}) => {
  return apiRequest(`/api/big-damage-issues/${generalFormId}/finalize`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

/**
 * Process other income for Big Damage Issue
 * @param {number|string} generalFormId - General form ID
 * @param {Object} data - Process data
 * @returns {Promise<Object>} Response data
 */
export const processOtherIncome = async (generalFormId, data = {}) => {
  return apiRequest(`/api/big-damage-issues/${generalFormId}/process-other-income`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

/**
 * Submit investigation form
 * @param {Object} data - Investigation data
 * @returns {Promise<Object>} Response data
 */
export const submitInvestigation = async (data) => {
  return apiRequest('/api/big-damage-issues/investigation', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

/**
 * Get images for Big Damage Issue form
 * @param {Object} params - Query parameters
 * @param {number|string} params.general_form_id - General form ID
 * @returns {Promise<Object>} Images data
 */
export const getBigDamageIssueImages = async (params = {}) => {
  const queryParams = new URLSearchParams();
  
  Object.keys(params).forEach(key => {
    if (params[key] !== null && params[key] !== undefined && params[key] !== '') {
      queryParams.append(key, params[key]);
    }
  });

  const query = queryParams.toString();
  return apiRequest(`/api/big-damage-issues/get-image${query ? `?${query}` : ''}`);
};

/**
 * Get images by general form ID with retry logic
 * @param {number|string} generalFormId - General form ID
 * @param {number} maxRetries - Maximum retry attempts (default: 3)
 * @param {number} delay - Delay between retries in ms (default: 1000)
 * @returns {Promise<Object>} Images data
 */
export const getImagesByGeneralFormId = async (generalFormId, maxRetries = 3, delay = 1000) => {
  const fetchWithRetry = async (attempt = 1) => {
    try {
      return await apiRequest(`/api/general-forms/${generalFormId}/big-damage-images`);
    } catch (error) {
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, delay * attempt));
        return fetchWithRetry(attempt + 1);
      }
      throw error;
    }
  };
  
  return fetchWithRetry();
};

/**
 * Print/Download PDF for Big Damage Issue form
 * @param {number|string} generalFormId - General form ID
 * @returns {Promise<Blob>} PDF blob
 */
export const printBigDamageIssue = async (generalFormId) => {
  const token = localStorage.getItem('token');
  const response = await fetch(`/api/big-damage-issues/${generalFormId}/print`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.blob();
};

/**
 * Get branches list
 * @returns {Promise<Object>} Branches data
 */
export const getBranches = async () => {
  return apiRequest('/api/branches');
};

