const normaliseText = (value) => {
    if (typeof value === 'string') {
        return value.toLowerCase().trim();
    }
    if (typeof value === 'number') {
        return `${value}`.toLowerCase().trim();
    }
    return '';
};

const resolveRoleName = (user) => {
    if (!user || typeof user !== 'object') return '';
    const candidates = [
        user.role,
        user.role_name,
        user.roleName,
        user.user_role,
        user.userRole,
        user.role?.name,
        user.role?.role_name,
        user.role?.roleName,
    ];
    for (const candidate of candidates) {
        if (!candidate) continue;
        if (typeof candidate === 'string') {
            return candidate;
        }
        if (typeof candidate === 'object') {
            if (candidate.name) return candidate.name;
            if (candidate.role_name) return candidate.role_name;
            if (candidate.roleName) return candidate.roleName;
        }
    }
    return '';
};

const specialBranchEmpIds = new Set(['000-000046', '000-000024', '000-000067', '666-666666']);

export const isOperationManagerUser = (user) => {
    if (!user) return false;
    
    // Check by user_type first
    const normalizedType = normaliseText(user.user_type || user.userType || user.user_type_id || user.userTypeId || '');
    if (normalizedType === 'a2') return true;
    
    // Check by role name
    const roleName = normaliseText(resolveRoleName(user));
    if (roleName.includes('operation manager') || roleName.includes('op manager')) return true;
    
    // Check if user is in special employee IDs AND department is Operation (department_id: 8)
    const employeeId = user.emp_id || user.employee_number || user.employeeNumber || user.employee_id || '';
    const departmentId = user.department_id || user.departmentId || 0;
    if (employeeId === '666-666666' && departmentId === 8) return true;
    
    return false;
};

export const hasAllBranchAccessUser = (user) => {
    if (!user || typeof user !== 'object') return false;
    const branchFlags = [
        'all_branch',
        'allBranch',
        'has_all_branch',
        'hasAllBranch',
    ];
    for (const key of branchFlags) {
        if (!(key in user)) continue;
        const value = user[key];
        if (value === true || value === 1 || value === '1' || value === 'true') {
            return true;
        }
    }
    return false;
};

export const hasSpecialBranchAccessUser = (user) => {
    if (!user) return false;
    const employeeId = user.emp_id || user.employee_number || user.employeeNumber || user.employee_id || '';
    return Boolean(employeeId && specialBranchEmpIds.has(employeeId));
};

export const canViewAllBranches = (user) => {
    if (!user) return false;
    return (
        hasAllBranchAccessUser(user) ||
        isOperationManagerUser(user) ||
        hasSpecialBranchAccessUser(user)
    );
};

