import React, { useState, useEffect, useMemo } from 'react';
import { FaBell, FaCheckDouble, FaEnvelope } from 'react-icons/fa';
import finalLogo from "../assets/images/finallogo.png";
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { canViewAllBranches } from '../utils/userAccess';

export default function Notification({ notifications, formBasedCount = null }) {
    const { user } = useAuth();
    const canViewAllBranchesForUser = useMemo(() => canViewAllBranches(user), [user]);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isNavigating, setIsNavigating] = useState(false);
    const [isMarkingAllAsRead, setIsMarkingAllAsRead] = useState(false);
    const [localNotifications, setLocalNotifications] = useState(notifications || []);
    const [virtualNotifications, setVirtualNotifications] = useState([]);
    const navigate = useNavigate();
    
    // Sync localNotifications with prop notifications
    useEffect(() => {
        if (notifications && Array.isArray(notifications)) {
            setLocalNotifications(notifications);
        } else if (!notifications || !Array.isArray(notifications)) {
            // Reset to empty array if notifications prop is invalid
            setLocalNotifications([]);
        }
        try {
            // eslint-disable-next-line no-console
            console.log('[Notification][SYNC] props notifications changed', {
                propNotificationsLength: Array.isArray(notifications) ? notifications.length : 0,
                localNotificationsLength: localNotifications?.length || 0,
                virtualNotificationsLength: (virtualNotifications || []).length,
                formBasedCount
            });
        } catch (e) {}
    }, [notifications]);
    
    const getTotalAmountFromRow = (row) => {
        const gf = row?.general_form || row;
        const total = Number(
            gf?.total_amount ??
            row?.total_amount ??
            gf?.totalAmount ??
            row?.totalAmount ??
            gf?.total ??
            row?.total ??
            0
        );
        return isNaN(total) ? 0 : total;
    };
    
    // Fetch form list and create virtual notifications when formBasedCount > 0
    // This ensures we show all forms that match the count, even if notifications API doesn't return them
    useEffect(() => {
        const fetchVirtualNotifications = async () => {
            // Always fetch if formBasedCount > 0 to ensure we have all matching forms
            if (formBasedCount > 0) {
                const token = localStorage.getItem("token");
                if (!token || !user) return;
                
                try {
                    // Include branch filter when user is branch-limited to match server-side badge count
                    const branchParam = (!canViewAllBranchesForUser && user?.from_branch_id) ? `&branch=${user.from_branch_id}` : '';
                    const res = await fetch(`/api/big-damage-issues?per_page=1000&form_type=big_damage_issue${branchParam}`, {
                        headers: { 
                            'Authorization': `Bearer ${token}`,
                            'Accept': 'application/json',
                            'Content-Type': 'application/json',
                        },
                        credentials: 'include',
                    });
                    
                    if (!res.ok) return;
                    
                    const data = await res.json();
                    let formListData = null;
                    if (data?.data && Array.isArray(data.data)) {
                        formListData = data.data;
                    } else if (Array.isArray(data)) {
                        formListData = data;
                    } else if (data?.data?.data && Array.isArray(data.data.data)) {
                        formListData = data.data.data;
                    }
                    
                    if (!formListData || !Array.isArray(formListData)) return;
                    
                    // Extract user role info
                    const { userType, userRole } = extractUserRoleInfo(user);
                    const normalizeText = (text) => (text || '').toString().toLowerCase().trim().replace(/\s+/g, ' ');
                    
                    // Helper function to check if form should be counted (same as Navbar)
                    const shouldCountForm = (formStatus) => {
                        const totalAmount = getTotalAmountFromRow(row);
                        const requiresOpManagerApproval = totalAmount > 500000;
                        if (!formStatus) return false;
                        const status = normalizeText(formStatus);
                        
                        if (['c', 'cs'].includes(userType)) {
                            return status === 'ongoing';
                        }
                        
                        const isBM = userType === 'a1' || 
                                    userRole === 'bm' || 
                                    userRole === 'abm' || 
                                    userRole === 'approver' ||
                                    userRole.includes('approver') ||
                                    userRole.includes('branch manager');
                        if (isBM) {
                            const isBMApproved = status === 'bm approved' || 
                                                status === 'bmapproved' || 
                                                status === 'bm_approved' ||
                                                status.includes('bm approved') ||
                                                status.includes('bmapproved');
                            if (isBMApproved) return false;
                            return status === 'checked';
                        }

                        const isOpManager = userType === 'a2' ||
                                           userRole.includes('operation manager') ||
                                           userRole.includes('op manager');
                        if (isOpManager) {
                            if (!requiresOpManagerApproval) return false;
                            return status === 'bm approved' || 
                                   status === 'bmapproved' || 
                                   status === 'bm_approved' ||
                                   status.includes('bm approved') ||
                                   status.includes('bmapproved');
                        }
                        
                        const isAccount = userType === 'ac' || 
                                         userRole === 'account' ||
                                         userRole === 'branch account' ||
                                         userRole.includes('account') ||
                                         userRole.includes('branch account');
                        if (isAccount) {
                            if (status === 'ongoing' || status === 'checked') return false;
                            if (status === 'completed' || 
                                status === 'issued' || 
                                status === 'supervisorissued' ||
                                status.includes('completed') ||
                                status.includes('issued')) return false;
                            return status === 'bm approved' || 
                                   status === 'bmapproved' || 
                                   status === 'bm_approved' ||
                                   status === 'op approved' ||
                                   status === 'opapproved' ||
                                   status === 'op_approved' ||
                                   status === 'ac_acknowledged' || 
                                   status === 'acknowledged' ||
                                   status.includes('bm approved') ||
                                   status.includes('bmapproved') ||
                                   status.includes('op approved') ||
                                   status.includes('opapproved') ||
                                   status.includes('acknowledged');
                        }
                        
                        return false;
                    };
                    
                    // Create virtual notifications from form list
                    const virtual = [];
                    formListData.forEach(row => {
                        const gf = row?.general_form || row;
                        const status = gf?.status || row?.status;
                        
                        if (!status) return;
                        
                        // Check branch match if user has a branch
                        if (!canViewAllBranchesForUser && user.from_branch_id) {
                            const formBranchId = gf?.from_branch_id || row?.from_branch_id;
                            if (formBranchId && formBranchId !== user.from_branch_id) {
                                return;
                            }
                        }
                        
                        if (shouldCountForm(status)) {
                            const generalFormId = row?.general_form_id || gf?.general_form_id || gf?.id || row?.id;
                            virtual.push({
                                form_id: 8, // Big Damage Issue form ID
                                specific_form_id: generalFormId,
                                form_doc_no: gf?.form_doc_no || row?.form_doc_no,
                                form_name: 'Big Damage Issue Form',
                                status: status,
                                is_viewed: false, // Treat as unread
                                created_at: gf?.created_at || row?.created_at || new Date().toISOString(),
                                notification_id: `virtual-${generalFormId}`,
                                data: {
                                    form_id: 8,
                                    specific_form_id: generalFormId,
                                    form_doc_no: gf?.form_doc_no || row?.form_doc_no,
                                    status: status
                                }
                            });
                        }
                    });
                    
                    setVirtualNotifications(virtual);
                } catch (err) {
                    // Silently fail
                }
            } else {
                setVirtualNotifications([]);
            }
        };
        
        fetchVirtualNotifications();
    }, [formBasedCount, localNotifications, user, canViewAllBranchesForUser]);

    // Role ID to Name mapping (matches Navbar.jsx and DamageIssueList.jsx)
    const roleIdToNameMap = {
        1: 'User',
        2: 'Checker',
        3: 'Approver',
        4: 'Super-Admin',
        5: 'Acknowledge',
        6: 'Recorder',
        7: 'Branch Account',
        8: 'Branch IT',
        9: 'Branch HR',
        10: 'Supervisor'
    };

    // Helper function to extract user_type and role from user object
    const extractUserRoleInfo = (user) => {
        if (!user) return { userType: '', userRole: '' };
        
        const normalizeText = (text) => (text || '').toString().toLowerCase().trim().replace(/\s+/g, ' ');
        
        // First, try to get user_type and role directly
        let userType = normalizeText(user.user_type || user.userType || '');
        let userRole = normalizeText(user.role || user.role_name || user.roleName || '');
        
        // If we have role_id but no role name, map it
        if (!userRole && user.role_id && roleIdToNameMap[user.role_id]) {
            userRole = normalizeText(roleIdToNameMap[user.role_id]);
        }
        
        // If we have role name but no user_type, infer user_type from role
        if (!userType && userRole) {
            // Checker role -> user_type C or CS
            if (userRole === 'checker' || userRole.includes('checker')) {
                userType = 'c'; // Use 'c' as default - the check ['c', 'cs'].includes(userType) will work for both
            }
            // Approver/BM role -> user_type A1
            else if (userRole === 'approver' || userRole === 'bm' || userRole === 'abm' || 
                     userRole.includes('approver') || userRole.includes('branch manager')) {
                userType = 'a1';
            }
            // Branch Account role -> user_type AC
            else if (userRole === 'branch account' || userRole === 'account' || 
                     userRole.includes('account')) {
                userType = 'ac';
            }
            // Operation Manager -> user_type A2
            else if (userRole.includes('operation manager') || userRole.includes('op manager')) {
                userType = 'a2';
            }
        }
        
        // Also check if user_type is in nested role object
        if (!userType && user.role && typeof user.role === 'object') {
            userType = normalizeText(user.role.user_type || user.role.userType || '');
        }
        
        return { userType, userRole };
    };

    // Helper function to check if notification should be shown based on user role and form status
    // This matches the logic in Navbar.jsx to ensure consistency
    const shouldShowNotificationForRole = (notification, currentUser) => {
        if (!currentUser || !notification) return false;
        
        // Extract user_type and role from user object (handles role_id mapping)
        const { userType, userRole } = extractUserRoleInfo(currentUser);
        
        const normalizeText = (text) => (text || '').toString().toLowerCase().trim().replace(/\s+/g, ' ');
        // Fallback to action when status is missing so approver/BM sees "Checked" alerts
        const formStatus = normalizeText(
          notification.status ||
          notification.data?.status ||
          notification.action ||
          notification.data?.action ||
          ''
        );
        
        // Extract total amount for operation manager filtering
        const totalAmount = Number(
            notification.total_amount ??
            notification.data?.total_amount ??
            notification.data?.totalAmount ??
            notification.data?.general_form?.total_amount ??
            notification.data?.general_form?.totalAmount ??
            0
        );
        const requiresOpManagerApproval = totalAmount > 500000;
        
        // Checker (C/CS) - show notifications for "Ongoing" forms only
        // Hide when status changes to "Checked" or beyond
        if (['c', 'cs'].includes(userType)) {
            // Show only "Ongoing" status, hide "Checked" and beyond
            return formStatus === 'ongoing';
        }
        
        // Operation Manager (A2) - MUST CHECK BEFORE BM to avoid role conflict
        // Show notifications for "BM Approved" forms ONLY when amount > 500000
        const isOpManager = userType === 'a2' || 
                           userRole.includes('operation manager') || 
                           userRole.includes('op manager') ||
                           (currentUser?.employee_number === '666-666666' && currentUser?.department_id === 8);
        
        if (isOpManager) {
            // Operation manager should ONLY see BM Approved forms that exceed threshold
            // Never show "Checked" or any other status
            if (!requiresOpManagerApproval) return false;
            return formStatus === 'bm approved' || 
                   formStatus === 'bmapproved' || 
                   formStatus === 'bm_approved' ||
                   formStatus.includes('bm approved') ||
                   formStatus.includes('bmapproved');
        }
        
        // Approver/BM (A1) - show notifications for "Checked" forms only
        // Hide when status changes to "BM Approved" or beyond
        // Check both user_type (A1) and role name (bm, abm, approver)
        // NOTE: This check comes AFTER operation manager check to avoid conflicts
        const isBM = userType === 'a1' || 
                     userRole === 'bm' || 
                     userRole === 'abm' || 
                     userRole === 'approver' ||
                     userRole.includes('approver') ||
                     userRole.includes('branch manager');
        
        if (isBM) {
            // BM should ONLY see "Checked" forms
            // Hide if status is "BM Approved", "BMApproved", or beyond
            const isBMApproved = formStatus === 'bm approved' || 
                                formStatus === 'bmapproved' || 
                                formStatus === 'bm_approved' ||
                                formStatus.includes('bm approved') ||
                                formStatus.includes('bmapproved');
            if (isBMApproved) {
                return false; // Hide when status is BM Approved or beyond
            }
            return formStatus === 'checked';
        }
        
        // Branch Account (AC) - show notifications for "BM Approved" and "Acknowledged" forms only
        // Hide when status changes to "Completed" or beyond
        // Check both user_type (AC) and role name (account, branch account)
        const isAccount = userType === 'ac' || 
                          userRole === 'account' ||
                          userRole === 'branch account' ||
                          userRole.includes('account') ||
                          userRole.includes('branch account');
        
        if (isAccount) {
            // Account should see "BM Approved" and "Acknowledged" forms
            // Hide if status is "Completed", "Issued", "SupervisorIssued", etc.
            // Explicitly exclude "Ongoing", "Checked", and completed statuses
            if (formStatus === 'ongoing' || formStatus === 'checked') {
                return false;
            }
            // Hide completed statuses
            if (formStatus === 'completed' || 
                formStatus === 'issued' || 
                formStatus === 'supervisorissued' ||
                formStatus.includes('completed') ||
                formStatus.includes('issued')) {
                return false;
            }
            // Show only "BM Approved", "OP Approved", and "Acknowledged"
            return formStatus === 'bm approved' || 
                   formStatus === 'bmapproved' || 
                   formStatus === 'bm_approved' ||
                   formStatus === 'op approved' ||
                   formStatus === 'opapproved' ||
                   formStatus === 'op_approved' ||
                   formStatus === 'ac_acknowledged' || 
                   formStatus === 'acknowledged' ||
                   formStatus.includes('bm approved') ||
                   formStatus.includes('bmapproved') ||
                   formStatus.includes('op approved') ||
                   formStatus.includes('opapproved') ||
                   formStatus.includes('acknowledged');
        }
        
        // For other roles, don't show notifications
        return false;
    };

    // Filter notifications to only show unread ones that match the user's role and form status
    // This ensures the dropdown only shows the same notifications counted in the badge
    // IMPORTANT: The badge count (formBasedCount) is based on actual form statuses from the API
    // So we need to trust the notification's status field (which comes from GeneralForm's current status)
    // and filter based on that, matching the same logic used for badge counting
    const filteredNotifications = useMemo(() => {
        // The backend API (NotificationController@index) already provides:
        // 1. All unread notifications filtered by form_id (if requested)
        // 2. CURRENT status from GeneralForm table (not stored notification status)
        // 3. form_id, specific_form_id, form_doc_no, form_name, etc.
        // This matches Laravel Blade behavior where getUnreadNoti() returns all unread notifications
        // and the status is fetched from GeneralForm using get_general_form()->status
        
        // Use localNotifications which can be optimistically updated
        // Merge with virtualNotifications to ensure we show all Big Damage Issue forms
        const actualNotifications = localNotifications && Array.isArray(localNotifications) ? localNotifications : [];
        
        // Deduplicate by notification_id or specific_form_id, but include all notifications
        const notificationMap = new Map();
        
        // First add virtual notifications (for Big Damage Issue forms from form API)
        if (virtualNotifications && Array.isArray(virtualNotifications)) {
            virtualNotifications.forEach((n, index) => {
                const key = String(n.specific_form_id || n.data?.specific_form_id || n.notification_id || `virtual-${index}`);
                if (key && key !== 'undefined' && key !== 'null') {
                    notificationMap.set(key, n);
                }
            });
        }
        
        // Then add actual notifications (they take precedence)
        actualNotifications.forEach((n, index) => {
            // Use notification_id as primary key, fall back to specific_form_id or index
            const key = String(n.notification_id || n.id || n.specific_form_id || n.data?.specific_form_id || `idx-${index}`);
            if (key && key !== 'undefined' && key !== 'null') {
                notificationMap.set(key, n);
            }
        });
        
        const notificationsToFilter = Array.from(notificationMap.values());
        if (notificationsToFilter.length === 0) return [];
        
        // Define normalizeText first before using it
        const normalizeText = (text) => (text || '').toString().toLowerCase().trim().replace(/\s+/g, ' ');
        
        // Extract user role info once for all notifications
        const { userType, userRole } = extractUserRoleInfo(user);
        
        // Debug logging (only log first few times to avoid spam)
        if (typeof window._notificationFilterDebugCount === 'undefined') {
            window._notificationFilterDebugCount = 0;
        }
        if (window._notificationFilterDebugCount < 2 && notificationsToFilter.length > 0) {
            // Get all unread Big Damage Issue notifications for debugging
            const unreadBigDamage = notificationsToFilter.filter(n => {
                const isUnread = n.is_viewed === false || n.is_viewed === null || n.is_viewed === undefined;
                const matchesForm = n.form_name === 'Big Damage Issue Form' || 
                                   n.form_name?.toLowerCase().includes('damage') ||
                                   (n.form_doc_no && (n.form_doc_no.startsWith('BDI') || n.form_doc_no.startsWith('ASDLAN'))) ||
                                   (n.data?.form_doc_no && (n.data.form_doc_no.startsWith('BDI') || n.data.form_doc_no.startsWith('ASDLAN'))) ||
                                   (n.form_id === 8 || n.form_id === 1 || n.data?.form_id === 8 || n.data?.form_id === 1);
                return isUnread && matchesForm;
            });
            
            window._notificationFilterDebugCount++;
        }
        
        // Filter notifications based on role and CURRENT status (from backend API)
        // Show ALL forms, not just Big Damage Issue forms
        // Apply role-based filtering for Big Damage Issue forms, but show all other forms
        const filtered = notificationsToFilter.filter(n => {
            // Only show unread notifications
            const isUnread = n.is_viewed === false || n.is_viewed === null || n.is_viewed === undefined;
            if (!isUnread) return false;
            
            // Check if this is a Big Damage Issue form
            const isBigDamageIssue = n.form_name === 'Big Damage Issue Form' || 
                                    n.form_name?.toLowerCase().includes('damage') ||
                                    (n.form_doc_no && (n.form_doc_no.startsWith('BDI') || n.form_doc_no.startsWith('ASDLAN'))) ||
                                    (n.data?.form_doc_no && (n.data.form_doc_no.startsWith('BDI') || n.data.form_doc_no.startsWith('ASDLAN'))) ||
                                    (n.form_id === 8 || n.form_id === 1 || n.data?.form_id === 8 || n.data?.form_id === 1);
            
            // For non-Big Damage Issue forms, show all unread notifications
            if (!isBigDamageIssue) {
                return true; // Show all other forms
            }
            
            // For Big Damage Issue forms, apply role-based status filtering
            
            // Get the form status from notification
            // IMPORTANT: The backend NotificationController@index fetches CURRENT status from GeneralForm table
            // (see NotificationController.php line 45: GeneralForm::whereIn('id', $specificFormIds)->pluck('status', 'id'))
            // So n.status is the CURRENT status from the database, not the notification's stored status
            // This matches Laravel Blade behavior where get_general_form($noti['data']['specific_form_id'])->status
            // is used to display the current status
            const formStatus = normalizeText(
                n.status ||  // Current status from GeneralForm (set by backend API)
                n.data?.status ||
                n.action ||
                n.data?.action ||
                ''
            );

            // Branch filtering (only show forms from user's branch when available)
            const notificationBranchId = n.from_branch_id ||
                                         n.data?.from_branch_id ||
                                         n.general_form?.from_branch_id ||
                                         n.data?.general_form?.from_branch_id ||
                                         n.data?.branch_id ||
                                         n.branch_id;
            const shouldFilterByBranch = !canViewAllBranchesForUser;
            if (shouldFilterByBranch && user?.from_branch_id && notificationBranchId && String(notificationBranchId) !== String(user.from_branch_id)) {
                return false;
            }

            // Extract total amount for Operation Manager filtering
            const totalAmount = Number(
                n.total_amount ??
                n.data?.total_amount ??
                n.data?.totalAmount ??
                n.data?.general_form?.total_amount ??
                n.data?.general_form?.totalAmount ??
                0
            );
            const requiresOpManagerApproval = totalAmount > 500000;
            
            // If status is missing but formBasedCount > 0, it means there are forms that match
            // This can happen if the backend API didn't include status for some reason
            if (!formStatus && formBasedCount > 0) {
                // Show all unread Big Damage Issue notifications when badge shows count but status is missing
                return true;
            }
            
            // Apply the same filtering logic as formBasedCount (shouldCountForm in Navbar.jsx)
            // This ensures notifications shown match exactly what the badge counts
            
            // Checker (C/CS) - show notifications for "Ongoing" forms only
            if (['c', 'cs'].includes(userType)) {
                const matches = formStatus === 'ongoing';
                return matches;
            }
            
            // Operation Manager (A2) - MUST CHECK BEFORE BM to avoid role conflict
            // Show notifications for "BM Approved" forms ONLY when amount > 500000
            const isOpManager = userType === 'a2' ||
                                userRole.includes('operation manager') ||
                                userRole.includes('op manager') ||
                                (user?.employee_number === '666-666666' && user?.department_id === 8);
            
            if (isOpManager) {
                // Operation manager should ONLY see BM Approved forms that exceed threshold
                if (!requiresOpManagerApproval) return false;
                const matches = formStatus === 'bm approved' || 
                               formStatus === 'bmapproved' || 
                               formStatus === 'bm_approved' ||
                               formStatus.includes('bm approved') ||
                               formStatus.includes('bmapproved');
                return matches;
            }
            
            // Branch Manager (A1/BM) - show notifications for "Checked" forms only
            // NOTE: This check comes AFTER operation manager to avoid conflicts
            const isBM = userType === 'a1' || 
                         userRole === 'bm' || 
                         userRole === 'abm' || 
                         userRole === 'approver' ||
                         userRole.includes('approver') ||
                         userRole.includes('branch manager');
            
            if (isBM) {
                // Hide if status is "BM Approved" or beyond
                const isBMApproved = formStatus === 'bm approved' || 
                                    formStatus === 'bmapproved' || 
                                    formStatus === 'bm_approved' ||
                                    formStatus.includes('bm approved') ||
                                    formStatus.includes('bmapproved');
                if (isBMApproved) {
                    return false;
                }
                const matches = formStatus === 'checked';
                return matches;
            }
            
            // Branch Account (AC) - show notifications for "BM Approved" and "Acknowledged" forms only
            const isAccount = userType === 'ac' || 
                              userRole === 'account' ||
                              userRole === 'branch account' ||
                              userRole.includes('account') ||
                              userRole.includes('branch account');
            
            if (isAccount) {
                // Hide "Ongoing", "Checked", and completed statuses
                if (formStatus === 'ongoing' || formStatus === 'checked') {
                    return false;
                }
                // Hide completed statuses
                if (formStatus === 'completed' || 
                    formStatus === 'issued' || 
                    formStatus === 'supervisorissued' ||
                    formStatus.includes('completed') ||
                    formStatus.includes('issued')) {
                    return false;
                }
                // Show only "BM Approved", "OP Approved", and "Acknowledged"
                const matches = formStatus === 'bm approved' || 
                               formStatus === 'bmapproved' || 
                               formStatus === 'bm_approved' ||
                               formStatus === 'op approved' ||
                               formStatus === 'opapproved' ||
                               formStatus === 'op_approved' ||
                               formStatus === 'ac_acknowledged' || 
                               formStatus === 'acknowledged' ||
                               formStatus.includes('bm approved') ||
                               formStatus.includes('bmapproved') ||
                               formStatus.includes('op approved') ||
                               formStatus.includes('opapproved') ||
                               formStatus.includes('acknowledged');
                return matches;
            }
            
            return false;
        });
        
        // Return all filtered notifications (includes all forms, with role-based filtering for Big Damage Issue only)
        // No need to merge with virtual notifications since we're showing all notifications from API
        return filtered;
    }, [localNotifications, user, formBasedCount, virtualNotifications, canViewAllBranchesForUser]);

    // Prepare a deduplicated combined list helper
    const dedupNotifications = (list) => {
        const map = new Map();
        const out = [];
        (list || []).forEach(n => {
            const key = n.notification_id || n.id || n.specific_form_id || (n.data && n.data.specific_form_id) || `${n.form_id || 'f'}-${n.specific_form_id || ''}`;
            if (key && !map.has(String(key))) {
                map.set(String(key), true);
                out.push(n);
            }
        });
        return out;
    };

    // Decide which notifications to display in the dropdown.
    const displayNotifications = useMemo(() => {
        // If formBasedCount is present (>0) prefer virtualNotifications + localNotifications (branch-filtered)
        if (formBasedCount > 0) {
            const combined = [];
            if (Array.isArray(virtualNotifications)) combined.push(...virtualNotifications);
            if (Array.isArray(localNotifications)) combined.push(...localNotifications);
            return dedupNotifications(combined);
        }
        // Otherwise prefer filteredNotifications, fallback to local then virtual
        if (Array.isArray(filteredNotifications) && filteredNotifications.length > 0) {
            return dedupNotifications(filteredNotifications);
        }
        if (Array.isArray(localNotifications) && localNotifications.length > 0) {
            return dedupNotifications(localNotifications);
        }
        if (Array.isArray(virtualNotifications) && virtualNotifications.length > 0) {
            return dedupNotifications(virtualNotifications);
        }
        return [];
    }, [formBasedCount, filteredNotifications, localNotifications, virtualNotifications]);

    // Compute badge count as the maximum of authoritative formBasedCount and available notification sets
    const localLen = (localNotifications && Array.isArray(localNotifications)) ? dedupNotifications(localNotifications).length : 0;
    const virtualLen = (virtualNotifications && Array.isArray(virtualNotifications)) ? dedupNotifications(virtualNotifications).length : 0;
    const notificationCount = Math.max(formBasedCount || 0, localLen, virtualLen, displayNotifications.length || 0);
    const hasNotifications = notificationCount > 0;
    
    // Debug: Log when badge shows but dropdown is empty
    useEffect(() => {
        if (hasNotifications && filteredNotifications.length === 0 && localNotifications && localNotifications.length > 0) {
            console.warn('[Notification] Badge shows count but no notifications in dropdown:', {
                formBasedCount,
                filteredCount: filteredNotifications.length,
                totalNotifications: notifications.length,
                userType: extractUserRoleInfo(user).userType,
                userRole: extractUserRoleInfo(user).userRole,
                sampleNotifications: notifications.slice(0, 3).map(n => ({
                    form_name: n.form_name,
                    form_doc_no: n.form_doc_no,
                    status: n.status,
                    action: n.action,
                    is_viewed: n.is_viewed,
                    data: n.data
                }))
            });
        }
    }, [hasNotifications, filteredNotifications.length, localNotifications, formBasedCount, user]);

    useEffect(() => {
        // Component mounted or notifications changed
    }, [notifications]);

    const toggleDropdown = () => {
        setIsDropdownOpen(prev => !prev);
    };

  // Mark a single notification as read immediately on click to keep UI in sync
  const markNotificationAsRead = async (noti) => {
    const token = localStorage.getItem("token");
    if (!token) {
      console.warn('[Notification] No token for mark-as-read');
      return;
    }

    const formId = typeof noti.form_id === 'string' ? parseInt(noti.form_id, 10) : noti.form_id;
    const specificFormId = typeof noti.specific_form_id === 'string' ? parseInt(noti.specific_form_id, 10) : noti.specific_form_id;
    const formDocNo = noti.form_doc_no ?? noti.data?.form_doc_no;

    // Optimistically update local state immediately (before API call)
    setLocalNotifications(prev => {
      return prev.map(n => {
        // Match by specific_form_id (most reliable)
        const nSpecificId = n.specific_form_id || n.data?.specific_form_id;
        const nFormId = n.form_id || n.data?.form_id;
        
        if ((nSpecificId && String(nSpecificId) === String(specificFormId)) ||
            (nFormId && String(nFormId) === String(formId) && formDocNo && (n.form_doc_no || n.data?.form_doc_no) === formDocNo)) {
          return { ...n, is_viewed: true };
        }
        return n;
      });
    });
    
    // Also remove from virtual notifications if it exists there
    setVirtualNotifications(prev => {
      return prev.filter(n => {
        const nSpecificId = String(n.specific_form_id || n.data?.specific_form_id || '');
        return nSpecificId !== String(specificFormId);
      });
    });

    try {
      const response = await fetch('/api/notifications/mark-as-read', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          form_id: formId,
          general_form_id: specificFormId,
          specific_form_id: specificFormId,
          form_doc_no: formDocNo,
        })
      });

      if (!response.ok) {
        console.warn('[Notification] Mark-as-read failed:', response.status);
        // Revert optimistic update on error
        setLocalNotifications(notifications || []);
      }

      // Trigger immediate refresh for other listeners (Navbar) to update badge
      // Use forceRefresh: true to bypass debounce
      window.dispatchEvent(new CustomEvent('notificationsUpdated', { detail: { forceRefresh: true, immediate: true } }));
    } catch (error) {
      console.warn('[Notification] Error marking as read:', error);
      // Revert optimistic update on error
      setLocalNotifications(notifications || []);
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    const token = localStorage.getItem("token");
    if (!token || !hasNotifications || isMarkingAllAsRead) {
      return;
    }

    setIsMarkingAllAsRead(true);

    try {
      // Try to mark all notifications at once by sending all notification IDs
      // Use filteredNotifications to only mark the visible unread notifications
      // First, try a bulk endpoint if available
      const notificationIds = filteredNotifications
        .map(noti => noti.notification_id || noti.id)
        .filter(id => id);

      if (notificationIds.length > 0) {
        // Try bulk mark-as-read endpoint
        try {
          const bulkResponse = await fetch('/api/notifications/mark-all-as-read', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
              'Accept': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({
              notification_ids: notificationIds
            })
          });

          if (bulkResponse.ok) {
            // Trigger refresh
            window.dispatchEvent(new CustomEvent('notificationsUpdated', { detail: { forceRefresh: true } }));
            setIsMarkingAllAsRead(false);
            return;
          }
        } catch (bulkError) {
          // Bulk endpoint not available, marking individually
        }
      }

      // Fallback: Mark each notification individually
      // Use filteredNotifications to only mark the visible unread notifications
      const markPromises = filteredNotifications.map(noti => {
        const formId = typeof noti.form_id === 'string' ? parseInt(noti.form_id, 10) : noti.form_id;
        const specificFormId = typeof noti.specific_form_id === 'string' ? parseInt(noti.specific_form_id, 10) : noti.specific_form_id;
        const formDocNo = noti.form_doc_no ?? noti.data?.form_doc_no;

        return fetch('/api/notifications/mark-as-read', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            form_id: formId,
            general_form_id: specificFormId,
            specific_form_id: specificFormId,
            form_doc_no: formDocNo,
          })
        });
      });

      // Optimistically update local state immediately
      setLocalNotifications(prev => {
        const specificFormIds = new Set(filteredNotifications.map(n => 
          String(n.specific_form_id || n.data?.specific_form_id)
        ).filter(Boolean));
        
        return prev.map(n => {
          const nSpecificId = String(n.specific_form_id || n.data?.specific_form_id || '');
          if (specificFormIds.has(nSpecificId)) {
            return { ...n, is_viewed: true };
          }
          return n;
        });
      });
      
      // Also remove from virtual notifications
      setVirtualNotifications(prev => {
        const specificFormIds = new Set(filteredNotifications.map(n => 
          String(n.specific_form_id || n.data?.specific_form_id)
        ).filter(Boolean));
        
        return prev.filter(n => {
          const nSpecificId = String(n.specific_form_id || n.data?.specific_form_id || '');
          return !specificFormIds.has(nSpecificId);
        });
      });

      // Wait for all requests to complete
      await Promise.allSettled(markPromises);

      // Trigger immediate refresh for other listeners (Navbar) to update badge
      // Use forceRefresh: true and immediate: true to bypass debounce
      window.dispatchEvent(new CustomEvent('notificationsUpdated', { detail: { forceRefresh: true, immediate: true } }));
    } catch (error) {
      console.error('[Notification] Error marking all as read:', error);
    } finally {
      setIsMarkingAllAsRead(false);
    }
  };

    const handleNotificationClick = async (noti, e) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
      
        if (isNavigating) {
            return;
        }
        setIsNavigating(true);
      
        // Normalize IDs from possible locations - check multiple sources
        const rawFormId = noti.form_id ?? noti.data?.form_id ?? noti.data?.formId;
        const rawSpecificId = noti.specific_form_id ?? noti.data?.specific_form_id ?? noti.data?.general_form_id ?? noti.data?.generalFormId;

        let formId = null;
        let specificFormId = null;
        
        if (rawFormId !== null && rawFormId !== undefined) {
            formId = typeof rawFormId === 'string' ? parseInt(rawFormId, 10) : rawFormId;
            if (isNaN(formId)) formId = null;
        }
        
        if (rawSpecificId !== null && rawSpecificId !== undefined) {
            specificFormId = typeof rawSpecificId === 'string' ? parseInt(rawSpecificId, 10) : rawSpecificId;
            if (isNaN(specificFormId)) specificFormId = null;
        }
        
        const formDocNo = noti.form_doc_no ?? noti.data?.form_doc_no ?? noti.data?.formDocNo;

        // If we cannot resolve IDs, bail out
        if (!formId || !specificFormId) {
            console.error('[Notification] Missing required IDs:', { 
                formId, 
                specificFormId, 
                rawFormId,
                rawSpecificId,
                noti 
            });
            alert(`Cannot navigate: Missing form information. Form ID: ${formId}, Specific ID: ${specificFormId}`);
            setIsNavigating(false);
            setIsDropdownOpen(false);
            return;
        }

        // Determine if this is a Big Damage Issue or CCTV
        // Check multiple indicators: form_id, form_name, form_doc_no pattern
        const formName = noti.form_name ?? noti.data?.form_name ?? '';
        const isBigDamageByName = formName.toLowerCase().includes('damage');
        const isBigDamageByDocNo = formDocNo && (formDocNo.startsWith('BDI') || formDocNo.startsWith('ASDLAN') || formDocNo.includes('ASDLAN') || formDocNo.includes('BDI'));
        
        // Check form_id (could be 1, 8, or other values depending on backend)
        const isBigDamageById = formId === 8 || formId === 1;
        
        // Determine if this is a Big Damage Issue notification
        const isBigDamage = isBigDamageByName || isBigDamageByDocNo || isBigDamageById;

        // Mark this notification as read immediately (best-effort, don't wait)
        markNotificationAsRead(noti).catch(err => {
            console.warn('[Notification] Failed to mark as read:', err);
        });
            
        // Helper function to navigate to Big Damage Issue form (defined outside try-catch for scope)
        const navigateToBigDamage = (bigDamageId) => {
            // Store notification data for DamageView to use
            sessionStorage.setItem('lastNotification', JSON.stringify({
                ...noti,
                isFromNotification: true,
                timestamp: new Date().toISOString(),
                form_id: formId,
                specific_form_id: specificFormId,
                generalFormId: specificFormId,
                form_doc_no: formDocNo,
            }));

            // Close dropdown immediately
            setIsDropdownOpen(false);

            const targetPath = `/big-damage-issue-add/${bigDamageId}`;
            
            // Use window.location.href for reliable navigation
            // Store state in sessionStorage since window.location doesn't support state
            sessionStorage.setItem('navigationState', JSON.stringify({
                bigDamageId: bigDamageId,
                generalFormId: specificFormId,
                fromNotification: true
            }));
            
            // Navigate using window.location for maximum reliability
            window.location.href = targetPath;
        };
        
        // Close dropdown immediately
        setIsDropdownOpen(false);

        try {
            if (isBigDamage) {
                const token = localStorage.getItem("token");
                
                if (!token) {
                    console.error('[Notification] No token found, redirecting to login');
                    window.location.href = '/login';
                    setIsNavigating(false);
                    return;
                }
                
                // Try to fetch the big_damage_issues record using general_form_id
                // Use Promise.race to timeout after 3 seconds
                const fetchPromise = fetch(`/api/general-forms/${specificFormId}/big-damage-issues`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Accept': 'application/json',
                    },
                    credentials: 'include'
                });

                const timeoutPromise = new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('Request timeout')), 3000)
                );

                try {
                    console.log('[Notification] Fetching big_damage_issues for general_form_id:', specificFormId);
                    const response = await Promise.race([fetchPromise, timeoutPromise]);
                    
                    if (response.ok) {
                        const data = await response.json();
                        console.log('[Notification] API response:', data);
                        
                        const payload = data?.data ?? data;
                        let bigDamageId = null;

                        if (Array.isArray(payload) && payload.length > 0) {
                            bigDamageId = payload[0]?.id || payload[0]?.big_damage_issue_id || payload[0]?.big_damage_id;
                            console.log('[Notification] Found big_damage_issues.id from array:', bigDamageId);
                        } else if (payload && typeof payload === 'object' && !Array.isArray(payload)) {
                            bigDamageId = payload.id || payload.big_damage_issue_id || payload.big_damage_id || null;
                            console.log('[Notification] Found big_damage_issues.id from object:', bigDamageId);
                        }

                        // Always navigate, even if bigDamageId is null (fallback to generalFormId)
                        navigateToBigDamage(bigDamageId || specificFormId);
                    } else {
                        const errorText = await response.text().catch(() => 'Unknown error');
                        console.warn('[Notification] API call failed:', response.status, errorText);
                        // Navigate with fallback
                        navigateToBigDamage(specificFormId);
                    }
                } catch (fetchError) {
                    console.error('[Notification] Error fetching big_damage_issues:', fetchError);
                    // Navigate with fallback immediately
                    navigateToBigDamage(specificFormId);
                }
            } else {
                // For other forms (like CCTV), use the specific_form_id directly
                setIsDropdownOpen(false);
                setTimeout(() => {
                    navigate(`/cctv-details/${specificFormId}`);
                }, 100);
            }
        } catch (error) {
            console.error('[Notification] Navigation error:', error);
            if (isBigDamage) {
                navigateToBigDamage(specificFormId);
            } else {
                setIsDropdownOpen(false);
                setTimeout(() => {
                    navigate(`/cctv-details/${specificFormId}`);
                }, 100);
            }
        } finally {
            // Reset navigating state after a delay
            setTimeout(() => {
                setIsNavigating(false);
            }, 2000);
        }
    };


    return (
        <div className="relative">
            {/* Bell Icon with Badge */}
            <div className="relative cursor-pointer group" onClick={toggleDropdown}>
                <div className="p-2 rounded-full transition-all duration-200 group-hover:bg-blue-50">
                    <FaBell className="text-2xl text-gray-700 group-hover:text-blue-600 transition-colors" />
                </div>
                {hasNotifications && (
                    <span className="absolute -top-1 -right-1 flex items-center justify-center 
                                    min-w-[20px] h-5 px-1.5 bg-gradient-to-br from-red-500 to-red-600 
                                    rounded-full border-2 border-white shadow-lg animate-pulse text-white text-xs font-bold">
                        {notificationCount > 99 ? '99+' : notificationCount}
                    </span>
                )}
            </div>

            {/* Modern Dropdown */}
            {isDropdownOpen && (
                <>
                    {/* Backdrop overlay for mobile */}
                    <div 
                        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[9998] lg:hidden"
                        onClick={toggleDropdown}
                    ></div>
                    <div className="fixed top-16 right-4 sm:absolute sm:top-auto sm:right-0 sm:mt-3 w-[calc(100vw-2rem)] max-w-sm sm:w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 z-[9999] animate-slideDown">
                        {/* Header */}
                        <div className="flex items-center justify-between px-4 sm:px-5 py-3 sm:py-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-2xl">
                            <h3 className="text-base sm:text-lg font-bold text-gray-800">Notifications</h3>
                            <div className="flex items-center gap-2">
                                {hasNotifications && (
                                    <button
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            markAllAsRead();
                                        }}
                                        disabled={isMarkingAllAsRead}
                                        className="flex items-center justify-center p-1.5 sm:p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-100 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                        title="Mark all as read"
                                    >
                                        {isMarkingAllAsRead ? (
                                            <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                            </svg>
                                        ) : (
                                            <FaCheckDouble className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                        )}
                                    </button>
                                )}
                            </div>
                        </div>

                    {/* Notifications List or Empty State */}
                    {/* Decide which notifications to actually display in the dropdown.
                        Prefer filteredNotifications (role+status filtered). If empty but badge shows,
                        fall back to localNotifications, then virtualNotifications so users always see items. */}
                    {hasNotifications ? (
                        (() => {
                            // If formBasedCount is present (>0) it is the source-of-truth for the badge.
                            // In that case prefer virtualNotifications (derived from form list API using same logic)
                            // combined with localNotifications so the dropdown reflects the same set that produced the badge.
                            let displayNotifications = [];
                            if (formBasedCount > 0) {
                                const combined = [];
                                if (Array.isArray(virtualNotifications) && virtualNotifications.length > 0) {
                                    combined.push(...virtualNotifications);
                                }
                                if (Array.isArray(localNotifications) && localNotifications.length > 0) {
                                    combined.push(...localNotifications);
                                }
                                displayNotifications = combined;
                            } else {
                                displayNotifications = (filteredNotifications && filteredNotifications.length > 0)
                                    ? filteredNotifications
                                    : (localNotifications && localNotifications.length > 0)
                                        ? localNotifications
                                        : (virtualNotifications && virtualNotifications.length > 0)
                                            ? virtualNotifications
                                            : [];
                            }

                            // Deduplicate by notification_id / specific_form_id to avoid duplicates from virtual+local merge
                            const dedupMap = new Map();
                            const deduped = [];
                            displayNotifications.forEach((n) => {
                                const key = String(n.notification_id || n.id || n.specific_form_id || n.data?.specific_form_id || `${n.form_id}-${n.specific_form_id}`);
                                if (key && !dedupMap.has(key)) {
                                    dedupMap.set(key, true);
                                    deduped.push(n);
                                }
                            });
                            displayNotifications = deduped;

                            if (displayNotifications.length === 0) {
                                return (
                                    <div className="flex flex-col items-center justify-center py-12 px-6">
                                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                                            <FaBell className="text-3xl text-gray-400" />
                                        </div>
                                        <p className="text-gray-600 font-medium text-base mb-1">No notifications</p>
                                        <p className="text-gray-400 text-sm text-center">You're all caught up! Check back later for updates.</p>
                                    </div>
                                );
                            }

                            return (
                                <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                                    {displayNotifications.map((noti, index) => {
                                // Ensure we have a unique key
                                const itemKey = noti.notification_id || noti.id || noti.specific_form_id || noti.data?.specific_form_id || `noti-${index}`;
                                
                                // Get document number
                                const itemDocNo = noti?.form_doc_no || noti?.data?.form_doc_no || 'N/A';

                                // Get form name and normalize for Big Damage Issue forms
                                let itemFormName = noti?.form_name || noti?.data?.form_name || 'Unknown Form';
                                const lowerName = String(itemFormName || '').toLowerCase();
                                const formIdFromNoti = noti?.form_id || noti?.data?.form_id || noti?.data?.general_form?.form_id;
                                const docNoUpper = String(itemDocNo || '').toUpperCase();
                                // Heuristics: form_id 8, doc no prefixes, or name containing asset damage/big damage
                                if (
                                    formIdFromNoti === 8 ||
                                    lowerName.includes('asset damage') ||
                                    lowerName.includes('big damage') ||
                                    docNoUpper.startsWith('BDI') ||
                                    docNoUpper.startsWith('BDILAN') ||
                                    docNoUpper.startsWith('ASDLAN') ||
                                    (String(noti?.form_id || '').trim() === '8')
                                ) {
                                    itemFormName = 'Big Damage Issue Form';
                                }

                                // Debug: help identify why some items still show wrong title
                                if (process.env.NODE_ENV !== 'production') {
                                    try {
                                        // eslint-disable-next-line no-console
                                        console.debug('[Notification] titleNormalize', {
                                            original: noti?.form_name || noti?.data?.form_name,
                                            resolved: itemFormName,
                                            formId: formIdFromNoti,
                                            docNo: itemDocNo
                                        });
                                    } catch (e) {}
                                }

                                // Get status
                                const itemStatus = noti?.status || noti?.data?.status || '';
                                
                                // Status badge color mapping (reuse)
                                const getBadgeClass = (s) => {
                                    const normalizedStatus = (s || '').toLowerCase().trim();
                                    if (normalizedStatus === 'checked') {
                                        return 'bg-orange-100 text-orange-700 border-orange-200';
                                    } else if (normalizedStatus === 'ongoing') {
                                        return 'bg-orange-100 text-orange-700 border-orange-200';
                                    } else if (normalizedStatus.includes('approved')) {
                                        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
                                    } else if (normalizedStatus === 'completed' || normalizedStatus === 'issued') {
                                        return 'bg-green-100 text-green-700 border-green-200';
                                    }
                                    return 'bg-gray-100 text-gray-700 border-gray-200';
                                };
                                
                                return (
                                    <div
                                        key={itemKey}
                                        role="button"
                                        tabIndex={0}
                                        className="relative group px-4 py-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors duration-150 last:border-b-0"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            handleNotificationClick(noti, e);
                                        }}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' || e.key === ' ') {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                handleNotificationClick(noti, e);
                                            }
                                        }}
                                    >
                                        <div className="flex items-start gap-3">
                                            {/* Small PRO Global Logo */}
                                            <div className="flex-shrink-0 w-8 h-8 mt-0.5">
                                                <img
                                                    src={finalLogo}
                                                    alt="PRO Global"
                                                    className="w-full h-full object-contain"
                                                />
                                            </div>

                                            {/* Content */}
                                            <div className="flex-1 min-w-0">
                                                {/* Form Type Name */}
                                                <p className="text-sm font-medium text-gray-900 mb-1.5 leading-tight">
                                                    {itemFormName}
                                                </p>
                                                {/* Document Number and Status Row */}
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    {/* Document Number */}
                                                    <p className="text-xs text-gray-600 font-medium">
                                                        {itemDocNo}
                                                    </p>
                                                    
                                                    {/* Status Badge */}
                                                    {itemStatus && (
                                                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${getBadgeClass(itemStatus)}`}>
                                                            {itemStatus}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                                    })}
                                </div>
                            );
                        })()
                    ) : (
                        <div className="flex flex-col items-center justify-center py-12 px-6">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                                <FaBell className="text-3xl text-gray-400" />
                            </div>
                            <p className="text-gray-600 font-medium text-base mb-1">No notifications</p>
                            <p className="text-gray-400 text-sm text-center">You're all caught up! Check back later for updates.</p>
                        </div>
                    )}
                    {/* End conditional rendering */}

                    {/* Footer */}
                    <button
                        onClick={toggleDropdown}
                        className="w-full text-center text-blue-600 font-medium text-sm py-2.5 sm:py-3 
                                 hover:bg-blue-50 border-t border-gray-100 rounded-b-2xl 
                                 transition-colors duration-200"
                    >
                        Close
                    </button>
                </div>
                </>
            )}

            {/* Custom Scrollbar Styles */}
            <style>{`
                @keyframes slideDown {
                    from {
                        opacity: 0;
                        transform: translateY(-10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                .animate-slideDown {
                    animation: slideDown 0.2s ease-out;
                }
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: #f1f1f1;
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #cbd5e1;
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #94a3b8;
                }
            `}</style>
        </div>
    );
}
