import { useMemo } from 'react';
import { getUserRole, isChecker, isAccountUser, isBranchManager, isOpManager } from '../utils';

export const useUserRole = (currentUser, initialData, formData) => {
  const userRole = useMemo(() => getUserRole(currentUser, initialData), [currentUser, initialData]);
  const userRoleLower = userRole.toLowerCase();

  const isCurrentUserChecker = useMemo(() => isChecker(currentUser, initialData), [currentUser, initialData]);
  
  const isAccount = useMemo(() => isAccountUser(currentUser, initialData), [currentUser, initialData]);
  
  const isBM = useMemo(() => isBranchManager(currentUser, initialData), [currentUser, initialData]);
  
  const isOperationManager = useMemo(() => isOpManager(currentUser, initialData), [currentUser, initialData]);

  const isCheckerRole = useMemo(() => {
    const roleLower = userRoleLower;
    return roleLower === 'branch_lp' || roleLower === 'checker' || 
           roleLower === 'c' || roleLower === 'cs' || roleLower.includes('checker');
  }, [userRoleLower]);

  const isApproverRole = useMemo(() => {
    const roleLower = userRoleLower;
    return roleLower === 'bm' || roleLower === 'abm' || roleLower === 'approver' ||
           roleLower.includes('branch manager') || roleLower.includes('approver');
  }, [userRoleLower]);

  const isRegularUser = useMemo(() => {
    const roleLower = userRoleLower;
    const roleId = Number(currentUser?.role_id || initialData?.current_user?.role_id || 0);
    return roleLower === 'user' || roleId === 1;
  }, [userRoleLower, currentUser, initialData]);

  const isUserRole = useMemo(() => {
    const roleLower = userRoleLower;
    const roleId = Number(currentUser?.role_id || 0);
    return roleLower === 'user' || roleId === 1;
  }, [userRoleLower, currentUser]);

  const isDocumentOwner = useMemo(() => {
    const currentUserId = currentUser?.id || currentUser?.admin_id || currentUser?.userId;
    const formOwnerId = formData?.user_id || formData?.created_by || 
                       formData?.general_form?.user_id || formData?.general_form?.created_by ||
                       initialData?.user_id || initialData?.created_by ||
                       initialData?.general_form?.user_id || initialData?.general_form?.created_by;
    
    if (currentUserId && formOwnerId) {
      return String(currentUserId) === String(formOwnerId);
    }
    return false;
  }, [currentUser, formData, initialData]);

  const isOpManagerByApproval = useMemo(() => {
    const currentUserId = currentUser?.id || currentUser?.admin_id || currentUser?.userId;
    if (!currentUserId) return false;
    
    const approvals = Array.isArray(formData?.approvals) ? formData.approvals : [];
    
    return approvals.some(approval => {
      const userType = (approval?.user_type || approval?.raw?.user_type || '').toString().toUpperCase();
      const adminId = approval?.admin_id || approval?.raw?.admin_id;
      const actualUserId = approval?.actual_user_id || approval?.raw?.actual_user_id;
      const userId = approval?.user?.id || approval?.user_id || approval?.user?.admin_id;
      const allUserIds = [adminId, actualUserId, userId].filter(id => id !== undefined && id !== null);

      const userTypeMatches = userType === 'OP' || userType === 'A2';
      const userIdMatches = allUserIds.some(id => String(id) === String(currentUserId) || Number(id) === Number(currentUserId));

      return userTypeMatches && userIdMatches;
    });
  }, [currentUser, formData?.approvals]);

  return {
    userRole,
    userRoleLower,
    isCurrentUserChecker,
    isAccount,
    isBM,
    isOperationManager,
    isCheckerRole,
    isApproverRole,
    isRegularUser,
    isUserRole,
    isDocumentOwner,
    isOpManagerByApproval,
    getUserRole: () => getUserRole(currentUser, initialData),
  };
};

