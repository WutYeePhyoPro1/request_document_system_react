import { ROLE_ID_MAP, ROLE_KEYS, NESTED_KEYS } from './constants';

export const normalizeRole = (value) => {
  const raw = (value || '').toString().toLowerCase().trim();
  if (!raw) return '';

  if (/assistant.*operation.*manager|assistant.*op.*manager|assistant\s*op\s*manager/i.test(value)) {
    return 'op_manager';
  }
  if (/operation.*manager|op.*manager|operation_manager|op_manager|^op$|^a2$/i.test(raw)) {
    return 'op_manager';
  }
  if (/branch\s*lp|loss\s*prevention|checker|branch_checker|lp/i.test(value)) return 'branch_lp';
  if (/bm|branch manager|abm/.test(raw) && !/operation|assistant.*op|op.*manager/.test(raw)) return 'bm';
  if (/account|ac_?acknowledged|branch.*account/i.test(raw)) return 'account';
  if (/supervisor|cs/.test(raw)) return 'supervisor';
  
  return raw;
};

const extractFromValue = (value) => {
  if (typeof value === 'string') {
    const upperValue = value.toUpperCase().trim();
    if (upperValue === 'A2' || upperValue === 'OP') return 'op_manager';
    return value.trim();
  }
  if (Array.isArray(value)) {
    for (const entry of value) {
      const nested = extractFromValue(entry);
      if (nested) return nested;
    }
  }
  if (typeof value === 'object' && value) {
    for (const key of NESTED_KEYS) {
      const nested = value[key];
      if (typeof nested === 'string' && nested.trim()) {
        if ((key === 'user_type' || key === 'userType') && 
            (nested.toUpperCase().trim() === 'A2' || nested.toUpperCase().trim() === 'OP')) {
          return 'op_manager';
        }
        return nested.trim();
      }
    }
  }
  return '';
};

export const extractRoleValue = (user) => {
  if (!user || typeof user !== 'object') return '';

  const userTypeCandidates = [
    user?.user_type, user?.userType, user?.role?.user_type, user?.role?.userType,
    user?.role_type?.user_type, user?.roleType?.user_type,
  ].filter(Boolean);
  
  for (const candidate of userTypeCandidates) {
    const upperCandidate = candidate.toString().toUpperCase().trim();
    if (upperCandidate === 'A2' || upperCandidate === 'OP') return 'op_manager';
    if (upperCandidate === 'A1' || upperCandidate === 'APPROVER') return 'bm';
  }

  const position = user?.position || user?.designation || '';
  if (position) {
    const positionLower = position.toString().toLowerCase().trim();
    if (positionLower.includes('assistant') && positionLower.includes('operation') && positionLower.includes('manager')) {
      return 'op_manager';
    }
    if (positionLower.includes('operation') && positionLower.includes('manager')) {
      return 'op_manager';
    }
  }

  for (const key of ROLE_KEYS) {
    const value = user[key];
    const extracted = extractFromValue(value);
    if (extracted) {
      const extractedUpper = extracted.toString().toUpperCase().trim();
      if (extractedUpper === 'A2' || extractedUpper === 'OP') return 'op_manager';
      
      const extractedLower = extracted.toString().toLowerCase().trim();
      if (extractedLower.includes('assistant') && extractedLower.includes('operation') && extractedLower.includes('manager')) {
        return 'op_manager';
      }
      if (extractedLower.includes('operation') && extractedLower.includes('manager')) {
        return 'op_manager';
      }
      
      if (extractedLower === 'approver' || extractedLower === 'bm' || extractedLower === 'branch manager') {
        const checkUserType = (user?.user_type || user?.userType || user?.role?.user_type || user?.role?.userType || '').toString().toUpperCase().trim();
        if (checkUserType === 'A2' || checkUserType === 'OP') return 'op_manager';
      }
      
      return extracted;
    }
  }

  const roleIdCandidates = [
    user?.role_id, user?.roleId, user?.role?.id, user?.role?.role_id,
  ].filter((value) => typeof value === 'number' || (typeof value === 'string' && value.trim()));

  if (roleIdCandidates.length) {
    for (const candidate of roleIdCandidates) {
      const numeric = typeof candidate === 'string' ? Number(candidate) : candidate;
      if (!Number.isNaN(numeric) && ROLE_ID_MAP.has(numeric)) {
        return ROLE_ID_MAP.get(numeric);
      }
    }
  }

  return '';
};

export const getRole = () => {
  try {
    const storedUser = JSON.parse(localStorage.getItem('user'));
    if (!storedUser) return '';
    return normalizeRole(extractRoleValue(storedUser));
  } catch { 
    return ''; 
  }
};

export const getUserRole = (currentUser, initialData) => {
  const getAllUserTypes = () => {
    const sources = [];
    
    if (currentUser) {
      sources.push(
        currentUser?.user_type, currentUser?.userType,
        currentUser?.role?.user_type, currentUser?.role?.userType,
        currentUser?.role_type?.user_type, currentUser?.roleType?.user_type,
      );
    }
    
    if (initialData) {
      sources.push(
        initialData?.current_user?.user_type, initialData?.currentUser?.user_type,
        initialData?.current_user?.userType, initialData?.currentUser?.userType,
        initialData?.current_user?.role?.user_type, initialData?.currentUser?.role?.user_type,
        initialData?.user?.user_type, initialData?.user?.userType,
        initialData?.user_type, initialData?.userType,
      );
    }
    
    try {
      const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
      if (storedUser) {
        sources.push(
          storedUser?.user_type, storedUser?.userType,
          storedUser?.role?.user_type, storedUser?.role?.userType,
        );
      }
    } catch {}
    
    return sources.filter(Boolean);
  };
  
  const allUserTypes = getAllUserTypes();
  
  for (const userType of allUserTypes) {
    const upperType = userType.toString().toUpperCase().trim();
    if (upperType === 'A2' || upperType === 'OP') return 'op_manager';
  }

  const backendSources = [
    initialData?.current_user, initialData?.currentUser, initialData?.user,
    initialData?.meta?.current_user, initialData?.meta?.user,
  ].filter(Boolean);

  let backendRole = '';
  for (const source of backendSources) {
    backendRole = extractRoleValue(source);
    if (backendRole) break;
  }

  if (!backendRole) {
    const scalarCandidates = [
      initialData?.current_user_role, initialData?.currentUserRole,
      initialData?.role, initialData?.user_role, initialData?.userRole,
      initialData?.current_role, initialData?.user_type,
    ].filter((item) => typeof item === 'string' && item.trim().length);
    backendRole = scalarCandidates.length ? scalarCandidates[0] : '';
  }

  const extractedFromCurrentUser = extractRoleValue(currentUser);
  const role = extractedFromCurrentUser || backendRole || getRole();
  
  const preNormalizeUserTypes = [
    currentUser?.user_type, currentUser?.userType,
    currentUser?.role?.user_type, currentUser?.role?.userType,
    initialData?.current_user?.user_type, initialData?.currentUser?.user_type,
    initialData?.current_user?.role?.user_type, initialData?.currentUser?.role?.user_type,
    initialData?.user?.user_type, initialData?.user?.userType, initialData?.user_type,
  ].filter(Boolean);
  
  for (const userType of preNormalizeUserTypes) {
    const upperUserType = userType.toString().toUpperCase().trim();
    if (upperUserType === 'A2' || upperUserType === 'OP') return 'op_manager';
  }
  
  const normalized = normalizeRole(role);
  
  if (normalized === 'bm') {
    const allPositionFields = [
      currentUser?.position, currentUser?.designation,
      initialData?.current_user?.position, initialData?.currentUser?.position,
    ].filter(Boolean);
    
    for (const posField of allPositionFields) {
      const posLower = posField.toString().toLowerCase().trim();
      if (posLower.includes('assistant') && posLower.includes('operation') && posLower.includes('manager')) {
        return 'op_manager';
      }
      if (posLower.includes('operation') && posLower.includes('manager')) {
        return 'op_manager';
      }
    }
  }

  const position = currentUser?.position || currentUser?.designation || 
                  initialData?.current_user?.position || initialData?.currentUser?.position || '';
  if (position) {
    const positionLower = position.toString().toLowerCase().trim();
    if (positionLower.includes('assistant') && positionLower.includes('operation') && positionLower.includes('manager')) {
      return 'op_manager';
    }
    if (positionLower.includes('operation') && positionLower.includes('manager')) {
      return 'op_manager';
    }
  }

  return normalized;
};

export const isChecker = (currentUser, initialData) => {
  try {
    const fromGet = (getUserRole(currentUser, initialData) || '').toString().toLowerCase();
    if (fromGet === 'branch_lp') return true;
    if (fromGet.includes('check') || fromGet === 'c' || fromGet === 'cs') return true;
    
    const cur = currentUser || {};
    const roleIdCandidates = [cur.role_id, cur.roleId, cur.role?.id, cur.role?.role_id].filter(Boolean);
    
    for (const rid of roleIdCandidates) {
      if (typeof rid === 'string' && rid.toLowerCase().trim() === 'checker') return true;
      const numeric = typeof rid === 'string' ? Number(rid) : rid;
      if (!Number.isNaN(numeric) && Number(numeric) === 2) return true;
    }
    
    const userType = (cur.user_type || cur.userType || '').toString().toLowerCase();
    if (userType === 'c' || userType === 'cs') return true;
    
    const roleCandidates = [
      cur.role, cur.role_name, cur.roleName, cur.position, cur.job_title, cur.designation
    ].filter(Boolean).map(v => v.toString().toLowerCase());
    
    for (const r of roleCandidates) {
      if (r.includes('check') || r.includes('checker')) return true;
    }
    
    const initRoles = [
      initialData?.current_user?.role, initialData?.current_user?.role_name,
      initialData?.user?.role, initialData?.user?.role_name
    ].filter(Boolean).map(v => v.toString().toLowerCase());
    
    for (const r of initRoles) {
      if (r.includes('check') || r.includes('checker')) return true;
    }
    
    return false;
  } catch {
    return false;
  }
};

export const isAccountUser = (currentUser, initialData) => {
  const role = getUserRole(currentUser, initialData);
  const roleIdStr = (currentUser?.role_id || '').toString().toLowerCase();
  return role === 'account' || 
         role === 'branch_account' ||
         roleIdStr === 'branch account' || 
         roleIdStr === 'account' ||
         Number(currentUser?.role_id) === 7 ||
         (currentUser?.role?.name || '').toLowerCase().includes('branch account') ||
         (currentUser?.role_name || '').toLowerCase().includes('branch account');
};

export const isBranchManager = (currentUser, initialData) => {
  const role = getUserRole(currentUser, initialData);
  return role === 'bm' || role === 'abm' || role === 'bm_abm';
};

export const isOpManager = (currentUser, initialData) => {
  return getUserRole(currentUser, initialData) === 'op_manager';
};

