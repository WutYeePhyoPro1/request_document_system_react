/**
 * Translates branch name to current language
 * @param {string} branchName - Branch name from database
 * @param {function} t - Translation function from useTranslation
 * @returns {string} Translated branch name
 */
export const translateBranchName = (branchName, t) => {
  if (!branchName || typeof branchName !== 'string' || !t) {
    return branchName || '';
  }
  
  const normalizedName = branchName.trim().toLowerCase();
  
  // Map branch names to translation keys (order matters - more specific first)
  const branchMappings = [
    { key: 'head office', translationKey: 'branches.headOffice' },
    { key: 'pro1 plus (terminal m)', translationKey: 'branches.pro1PlusTerminalM' },
    { key: 'pro1 plus', translationKey: 'branches.pro1PlusTerminalM' },
    { key: 'terminal m', translationKey: 'branches.pro1PlusTerminalM' },
    { key: 'wh-myo houng', translationKey: 'branches.whMyoHoung' },
    { key: 'wh-mingalardon', translationKey: 'branches.whMingalardon' },
    { key: 'dc-myawaddy', translationKey: 'branches.dcMyawaddy' },
    { key: 'dc-mingalardon2', translationKey: 'branches.dcMingalardon2' },
    { key: 'dc-mingalardon3', translationKey: 'branches.dcMingalardon3' },
    { key: 'project sales', translationKey: 'branches.projectSales' },
    { key: 'online sales', translationKey: 'branches.onlineSales' },
    { key: 'whole sales', translationKey: 'branches.wholeSales' },
    { key: 'outlet sales', translationKey: 'branches.outletSales' },
    { key: 'clearance sale', translationKey: 'branches.clearanceSale' },
    { key: 'south dagon', translationKey: 'branches.southDagon' },
    { key: 'east dagon', translationKey: 'branches.eastDagon' },
    { key: 'da nyin gone', translationKey: 'branches.daNyinGone' },
    { key: 'shwe pyi thar', translationKey: 'branches.shwePyiThar' },
    { key: 'nay pyi taw', translationKey: 'branches.nayPyiTaw' },
    { key: 'theik pan', translationKey: 'branches.theikPan' },
    { key: 'hlaingtharyar', translationKey: 'branches.hlaingtharyar' },
    { key: 'ayetharyar', translationKey: 'branches.ayetharyar' },
    { key: 'mingalardon', translationKey: 'branches.mingalardon' },
    { key: 'lanthit', translationKey: 'branches.lanthit' },
    { key: 'satsan', translationKey: 'branches.satsan' },
    { key: 'mawlamyine', translationKey: 'branches.mawlamyine' },
    { key: 'tampawady', translationKey: 'branches.tampawady' },
    { key: 'bago', translationKey: 'branches.bago' },
  ];
  
  // Check each mapping
  for (const mapping of branchMappings) {
    console.log(normalizedName,'nor name');
    if (normalizedName.includes(mapping.key)) {
      
      return t(mapping.translationKey, { defaultValue: branchName });
    }
  }
  
  // Return original name if no translation found
  return branchName;
};

/**
 * Resolves branch display name from branch ID or name
 * @param {object} options - Options object
 * @param {string|number} options.branchId - Branch ID
 * @param {string} options.branchName - Branch name
 * @param {string} options.fallback - Fallback text if no branch info available
 * @param {function} options.t - Translation function (optional)
 * @returns {string} Display name for the branch
 */
export const resolveBranchDisplay = ({ branchId, branchName, fallback = 'N/A', t = null }) => {
  // If branch name is provided, use it and translate if t function is provided
  if (branchName && typeof branchName === 'string' && branchName.trim()) {
    return t ? translateBranchName(branchName.trim(), t) : branchName.trim();
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

