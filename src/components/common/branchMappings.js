/**
 * Resolves branch display name from branch ID or name
 * @param {object} options - Options object
 * @param {string|number} options.branchId - Branch ID
 * @param {string} options.branchName - Branch name
 * @param {string} options.fallback - Fallback text if no branch info available
 * @returns {string} Display name for the branch
 */
export const resolveBranchDisplay = ({ branchId, branchName, fallback = 'N/A' }) => {
  // If branch name is provided, use it
  if (branchName && typeof branchName === 'string' && branchName.trim()) {
    return branchName.trim();
  }

  // If branch ID is provided, try to resolve it
  if (branchId) {
    // You can add branch ID to name mapping here if needed
    // For example:
    // const branchMap = {
    //   '1': 'Main Branch',
    //   '2': 'Secondary Branch',
    // };
    // return branchMap[branchId] || `Branch ${branchId}`;
    return `Branch ${branchId}`;
  }

  // Return fallback if nothing is available
  return fallback;
};

/**
 * Branch mappings (can be extended as needed)
 */
export const BRANCH_MAPPINGS = {
  // Add your branch mappings here
  // '1': 'Main Branch',
  // '2': 'Secondary Branch',
};

/**
 * Gets branch name from ID
 * @param {string|number} branchId - Branch ID
 * @returns {string|null} Branch name or null
 */
export const getBranchName = (branchId) => {
  if (!branchId) return null;
  return BRANCH_MAPPINGS[branchId] || null;
};

/**
 * Gets branch ID from name
 * @param {string} branchName - Branch name
 * @returns {string|null} Branch ID or null
 */
export const getBranchId = (branchName) => {
  if (!branchName) return null;
  const entries = Object.entries(BRANCH_MAPPINGS);
  const found = entries.find(([_, name]) => name === branchName);
  return found ? found[0] : null;
};

