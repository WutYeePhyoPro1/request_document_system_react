/**
 * Filters forms based on user role
 * @param {Array} forms - Array of form objects
 * @param {object} user - User object with role information
 * @returns {Array} Filtered forms
 */
export const filterFormsByRole = (forms, user) => {
  if (!Array.isArray(forms)) {
    return [];
  }

  if (!user) {
    return forms;
  }

  // Extract role from user object
  const role = extractRoleValue(user);

  // If no role or role is admin, return all forms
  if (!role || role.toLowerCase() === 'admin') {
    return forms;
  }

  // Filter based on role-specific logic
  // You can customize this logic based on your requirements
  return forms.filter(form => {
    // Add your role-based filtering logic here
    // For example:
    // if (role === 'manager') return form.status !== 'draft';
    // if (role === 'user') return form.created_by === user.id;
    return true; // Default: return all forms
  });
};

/**
 * Gets default status filter based on user role
 * @param {object} user - User object with role information
 * @returns {string|null} Default status filter
 */
export const getDefaultStatusFilter = (user) => {
  if (!user) {
    return null;
  }

  const role = extractRoleValue(user);

  // Customize default status based on role
  switch (role?.toLowerCase()) {
    case 'admin':
      return null; // Show all statuses
    case 'manager':
      return 'pending'; // Show pending items
    case 'user':
      return 'draft'; // Show draft items
    default:
      return null;
  }
};

/**
 * Extracts role value from user object
 * @param {object} user - User object
 * @returns {string} Role value
 */
const extractRoleValue = (user) => {
  if (!user || typeof user !== 'object') return '';

  const roleKeys = [
    'role',
    'role_name',
    'roleName',
    'user_role',
    'userRole',
  ];

  for (const key of roleKeys) {
    if (user[key]) {
      return typeof user[key] === 'object' ? user[key].name : user[key];
    }
  }

  return '';
};

