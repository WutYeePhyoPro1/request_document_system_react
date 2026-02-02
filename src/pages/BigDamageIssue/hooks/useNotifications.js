import { useMemo, useRef, useContext } from 'react';
import { NotificationContext } from '../../../context/NotificationContext';
import { BIG_DAMAGE_FORM_ID } from '../utils/constants';

export const useNotifications = (currentUser, canViewAllBranchesAccess, listPayload, isFilteringRef) => {
  const { notifications } = useContext(NotificationContext);
  const notificationCountsByFormRef = useRef(new Map());

  const notificationCountsByForm = useMemo(() => {
    if (isFilteringRef?.current) {
      return notificationCountsByFormRef.current;
    }
    
    let notiData = [];
    if (listPayload?.noti_data && Array.isArray(listPayload.noti_data)) {
      notiData = listPayload.noti_data;
    }
    
    const contextUnreadNoti = notifications?.getUnreadNoti || [];
    
    const allNotifications = Array.isArray(contextUnreadNoti) && contextUnreadNoti.length > 0 
      ? contextUnreadNoti.filter(noti => {
          const data = noti?.data || noti;
          const formId = Number(data?.form_id) || data?.form_id;
          return formId === BIG_DAMAGE_FORM_ID;
        })
      : notiData;
    
    if (!Array.isArray(allNotifications) || allNotifications.length === 0) {
      return new Map();
    }
    
    const counts = new Map();
    
    allNotifications.forEach((noti) => {
      const data = noti?.data || noti;
      const formId = Number(data?.form_id) || data?.form_id;
      
      if (formId !== BIG_DAMAGE_FORM_ID) return;
      
      if (!canViewAllBranchesAccess && currentUser?.from_branch_id) {
        const notiBranchId = noti?.from_branch_id || data?.from_branch_id;
        if (notiBranchId && String(notiBranchId) !== String(currentUser.from_branch_id)) {
          return;
        }
      }
      
      const specificFormId = data?.specific_form_id || data?.general_form_id || noti?.specific_form_id || noti?.general_form_id;
      
      if (specificFormId) {
        const keyStr = String(specificFormId);
        const currentCount = counts.get(keyStr) || 0;
        counts.set(keyStr, currentCount + 1);
        
        const numKey = Number(specificFormId);
        if (!isNaN(numKey)) {
          counts.set(numKey, currentCount + 1);
        }
      }
    });
    
    notificationCountsByFormRef.current = counts;
    return counts;
  }, [notifications, currentUser, canViewAllBranchesAccess, listPayload, isFilteringRef]);

  const totalNotificationCount = useMemo(() => notificationCountsByForm.size, [notificationCountsByForm]);
  const hasUnreadNotifications = totalNotificationCount > 0;

  return {
    notificationCountsByForm,
    totalNotificationCount,
    hasUnreadNotifications,
  };
};

