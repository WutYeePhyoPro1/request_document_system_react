import { ROLE_ID_MAP, STATUS_ORDER, OP_THRESHOLD } from './constants';

export const normalizeText = (text) => {
  if (!text) return '';
  return String(text).trim().replace(/\s+/g, ' ').toLowerCase();
};

export const formatDateDDMMYY = (dateString) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = String(date.getFullYear()).slice(-2);
  return `${day}/${month}/${year}`;
};

export const formatDateTimeDDMMYY = (dateString) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = String(date.getFullYear()).slice(-2);
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${day}/${month}/${year} ${hours}:${minutes}`;
};

export const extractUserRoleInfo = (user) => {
  if (!user) return { userType: '', userRole: '' };
  
  let userType = normalizeText(user.user_type || user.userType || '');
  let userRole = normalizeText(user.role || user.role_name || user.roleName || '');
  
  if (!userRole && user.role_id && ROLE_ID_MAP[user.role_id]) {
    userRole = normalizeText(ROLE_ID_MAP[user.role_id]);
  }
  
  if (!userType && userRole) {
    if (userRole === 'checker' || userRole.includes('checker')) {
      userType = 'c';
    } else if (userRole === 'approver' || userRole === 'bm' || userRole === 'abm' || 
               userRole.includes('approver') || userRole.includes('branch manager')) {
      userType = 'a1';
    } else if (userRole === 'branch account' || userRole === 'account' || userRole.includes('account')) {
      userType = 'ac';
    } else if (userRole.includes('operation manager') || userRole.includes('op manager')) {
      userType = 'a2';
    }
  }

  const rawRoleString = normalizeText(user.role || user.role_name || user.roleName || user.position || user.job_title || user.jobTitle || '');
  const normalizedRoleString = rawRoleString.replace(/[_-]/g, ' ').trim();

  if (!userType && normalizedRoleString) {
    if (normalizedRoleString.includes('checker')) {
      userType = 'c';
    } else if (normalizedRoleString.includes('approver') || normalizedRoleString.includes('bm') || normalizedRoleString.includes('branch manager')) {
      userType = 'a1';
    } else if (normalizedRoleString.includes('account')) {
      userType = 'ac';
    } else if ((normalizedRoleString.includes('operation') && normalizedRoleString.includes('manager')) || normalizedRoleString.includes('op manager')) {
      userType = 'a2';
    }
  }

  if (!userType && user.role && typeof user.role === 'object') {
    userType = normalizeText(user.role.user_type || user.role.userType || '');
  }

  return { userType, userRole };
};

export const isOpManager = (user) => {
  const { userType, userRole } = extractUserRoleInfo(user);
  return userType === 'a2' || 
         userRole.includes('operation manager') || 
         userRole.includes('op manager') ||
         (user?.employee_number === '666-666666' && user?.department_id === 8);
};

export const isBranchManager = (user) => {
  const { userType, userRole } = extractUserRoleInfo(user);
  return userType === 'a1' || 
         userRole === 'bm' || 
         userRole === 'abm' || 
         userRole === 'approver' ||
         userRole.includes('approver') ||
         userRole.includes('branch manager');
};

export const isChecker = (user) => {
  const { userType, userRole } = extractUserRoleInfo(user);
  const isCheckerByRoleId = user?.role_id === 2 || String(user?.role_id || '').toLowerCase() === 'checker';
  return ['c', 'cs'].includes(userType) || isCheckerByRoleId || userRole === 'checker' || userRole.includes('checker');
};

export const isAccountUser = (user) => {
  const { userType, userRole } = extractUserRoleInfo(user);
  return userType === 'ac' || 
         userRole === 'account' ||
         userRole === 'branch account' ||
         userRole.includes('account') ||
         userRole.includes('branch account') ||
         user?.role_id === 7;
};

export const getTotalAmount = (row, gf, formTotals = new Map()) => {
  let totalAmount =
    gf?.total_amount || gf?.totalAmount || gf?.total_amt || gf?.sum_total || gf?.sumTotal ||
    row?.total_amount || row?.totalAmount || row?.total_amt || row?.sum_total || row?.sumTotal ||
    row?.big_damage_issue?.total_amount || row?.big_damage_issue?.totalAmount ||
    gf?.big_damage_issue?.total_amount || gf?.big_damage_issue?.totalAmount ||
    row?.general_form_total || gf?.general_form_total || 0;
  
  if (totalAmount && parseFloat(totalAmount) > 0) {
    return parseFloat(totalAmount);
  }

  const formId = gf?.id || row?.general_form_id || row?.id;
  if (formId && formTotals.size > 0) {
    const total = formTotals.get(formId) || formTotals.get(String(formId)) || formTotals.get(Number(formId));
    if (total) return total;
  }

  const rowAmount = parseFloat(row?.amount || row?.total || 0);
  if (rowAmount > 0) return rowAmount;

  const calculateFromItems = (items) => {
    if (!Array.isArray(items) || items.length === 0) return 0;
    return items.reduce((sum, item) => {
      let itemAmount = item.amount || item.total_amount || item.totalAmount || item.amt || item.total || 0;
      if (!itemAmount) {
        const price = parseFloat(item.price || item.unit_price || item.unitPrice || 0);
        const qty = parseFloat(item.final_qty || item.finalQty || item.actual_qty || item.actualQty || 
                              item.request_qty || item.requestQty || item.quantity || item.qty || 0);
        itemAmount = price * qty;
      }
      return sum + (parseFloat(itemAmount) || 0);
    }, 0);
  };

  totalAmount = calculateFromItems(gf?.items) || calculateFromItems(row?.items) || calculateFromItems(row?.damage_items);
  
  return parseFloat(totalAmount) || 0;
};

export const exceedsOpThreshold = (amount) => Number(amount) > OP_THRESHOLD;

export const getStatusOrder = (status) => {
  const normalized = normalizeText(status);
  return STATUS_ORDER[normalized] || 0;
};

export const hasUserCompletedAction = (row, gf, currentUser) => {
  if (!currentUser) return false;
  
  const { userType } = extractUserRoleInfo(currentUser);
  const formStatus = normalizeText(gf?.status || '');
  const totalAmount = parseFloat(gf?.total_amount || row?.total_amount || 0);
  const currentStatusOrder = getStatusOrder(formStatus);
  
  if (['c', 'cs'].includes(userType)) {
    return currentStatusOrder >= 2;
  }
  
  if (userType === 'a1' || normalizeText(currentUser.role) === 'bm' || normalizeText(currentUser.role) === 'abm') {
    return currentStatusOrder >= 3;
  }
  
  if (userType === 'a2') {
    if (totalAmount > OP_THRESHOLD) {
      return currentStatusOrder >= 4;
    }
    return true;
  }
  
  if (userType === 'ac' || normalizeText(currentUser.role) === 'account') {
    if (currentStatusOrder >= 3 && currentStatusOrder < 5) {
      return currentStatusOrder >= 5;
    }
    if (currentStatusOrder === 5) {
      return currentStatusOrder >= 6;
    }
    return currentStatusOrder >= 6;
  }
  
  return false;
};

export const isFormRelevantToUser = (gfOrRow, currentUser) => {
  const gf = gfOrRow?.general_form || gfOrRow || {};
  if (!gf || !currentUser) return false;
  
  const { userType, userRole } = extractUserRoleInfo(currentUser);
  const formStatus = normalizeText(gf.status || '');
  
  const roleIdStr = (currentUser?.role_id || '').toString().toLowerCase();
  if (roleIdStr === 'user' || userRole === 'user') {
    return false;
  }
  
  if (isChecker(currentUser)) {
    return formStatus === 'ongoing';
  }
  
  if (isOpManager(currentUser)) {
    return formStatus === 'bm approved' || formStatus === 'bmapproved';
  }

  if (isBranchManager(currentUser)) {
    return formStatus === 'checked';
  }
  
  if (isAccountUser(currentUser)) {
    if (formStatus === 'ongoing' || formStatus === 'checked') {
      return false;
    }
    return ['bm approved', 'bmapproved', 'op approved', 'opapproved', 
            'ac_acknowledged', 'acknowledged', 'completed', 'issued', 'supervisorissued'].includes(formStatus);
  }
  
  return false;
};

export const normalizeBranch = (branch) => {
  if (!branch) return { id: null, name: null };
  if (typeof branch === 'object') {
    return {
      id: branch.id ?? branch.branch_id ?? branch.branch_code ?? null,
      name: branch.branch_name ?? branch.name ?? branch.branch_short_name ?? null,
    };
  }
  return { id: branch, name: null };
};

export const getCurrentUser = () => {
  try {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  } catch {
    return null;
  }
};

export const getToken = () => localStorage.getItem('token');

