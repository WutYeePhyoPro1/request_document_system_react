

import React, { useState, useRef, useEffect, useContext } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { AiOutlineMenu } from "react-icons/ai";
import finalLogo from "../assets/images/finallogo.png";
import { useTranslation } from 'react-i18next';

import { useAuth } from '../context/AuthContext';
import NotificationIcon from './Notification';
import { NotificationContext } from "../context/NotificationContext"; // ✅
import LanguageSwitcher from './LanguageSwitcher';

// Role ID to Name mapping (fallback if API fails)
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

// Department ID to Name mapping (fallback if API fails)
const departmentIdToNameMap = {
    1: 'Construction',
    2: 'Designer',
    3: 'Finance & Accounting',
    4: 'HR',
    5: 'Marketing',
    6: 'Merchandise',
    7: 'Online Sale',
    8: 'Operation',
    9: 'Project Sale',
    10: 'Sourcing',
    11: 'System Development',
    12: 'M&E',
    13: 'Admin'
};

export default function Navbar({ toggleSidebar }) {
    const { t } = useTranslation();
    const { user, logout } = useAuth();
    const { notifications, setNotifications } = useContext(NotificationContext); // ✅
    const token = localStorage.getItem("token");
    const userRoleId = user?.id;
    const location = useLocation();

    const [menuOpen, setMenuOpen] = useState(false);
    const dropdownRef = useRef(null);
    const previousNotificationIds = useRef(new Set());
    const shownBrowserNotificationIds = useRef(new Set()); // Track which notifications we've shown browser notifications for
    const isFirstLoad = useRef(true);
    const navigate = useNavigate();
    const [roleName, setRoleName] = useState(null);
    const [branchName, setBranchName] = useState(null);
    const [departmentName, setDepartmentName] = useState(null);

    const subscribeToPush = async () => {
        if (!('serviceWorker' in navigator)) {
            return;
        }

        const registration = await navigator.serviceWorker.register('/sw.js');

        // Request Notification Permission
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
            return;
        }

        // Subscribe to Push
        const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: 'BCPKeVfYglhfqpsmmQXv-MP7oihVtZiVzRUXkVxojeQgAlGOWB07YI77J-A8awLcqv4ZKNPHVFQimsrutIIeRhM', // Replace with your VAPID_PUBLIC_KEY
        });

        // Send subscription to backend
        await fetch('/api/notifications/push/subscribe', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(subscription),
        });

        void endpoint;
    };


    // Set role name immediately from mapping if available
    useEffect(() => {
        if (user?.role_id && roleIdToNameMap[user.role_id] && !roleName) {
            setRoleName(roleIdToNameMap[user.role_id]);
        }
    }, [user?.role_id, roleName]);

    // Set department name immediately from mapping if available
    useEffect(() => {
        if (user?.department_id && departmentIdToNameMap[user.department_id] && !departmentName) {
            setDepartmentName(departmentIdToNameMap[user.department_id]);
        }
    }, [user?.department_id, departmentName]);

    // Fetch role, branch, and department names from API (to get latest data)
    useEffect(() => {
        const fetchUserDetails = async () => {
            if (!user || !token) return;

            try {
                // Fetch role name if role_id exists
                if (user.role_id) {
                    let fetchedRoleName = null;
                    
                    // Try multiple API endpoint patterns
                    const apiEndpoints = [
                        `/api/roles/${user.role_id}`,
                        `/api/role/${user.role_id}`,
                        `/api/user-roles/${user.role_id}`
                    ];

                    for (const endpoint of apiEndpoints) {
                        try {
                            const roleRes = await fetch(endpoint, {
                                headers: {
                                    'Authorization': `Bearer ${token}`,
                                    'Accept': 'application/json',
                                },
                                credentials: 'include'
                            });
                            
                            if (roleRes.ok) {
                                const roleData = await roleRes.json();
                                fetchedRoleName = roleData?.name || roleData?.data?.name || roleData?.role?.name || null;
                                if (fetchedRoleName) {
                                    setRoleName(fetchedRoleName);
                                    break; // Use API data if available
                                }
                            }
                        } catch (err) {
                            // Try next endpoint
                            continue;
                        }
                    }

                    // If API call failed and we don't have a name yet, use fallback mapping
                    if (!fetchedRoleName && roleIdToNameMap[user.role_id] && !roleName) {
                        setRoleName(roleIdToNameMap[user.role_id]);
                    }
                }

                // Fetch branch name if from_branch_id exists and branch_name is not already available
                if (user.from_branch_id && !user.from_branch_name && !user.branch_name) {
                    try {
                        const branchRes = await fetch(`/api/branches/${user.from_branch_id}`, {
                            headers: {
                                'Authorization': `Bearer ${token}`,
                                'Accept': 'application/json',
                            },
                            credentials: 'include'
                        });
                        if (branchRes.ok) {
                            const branchData = await branchRes.json();
                            setBranchName(branchData?.branch_name || branchData?.data?.branch_name || branchData?.name || null);
                        }
                    } catch (err) {
                        // Silently fail
                    }
                }

                // Fetch department name if department_id exists
                if (user.department_id) {
                    let fetchedDeptName = null;
                    
                    // Try multiple API endpoint patterns
                    const deptApiEndpoints = [
                        `/api/departments/${user.department_id}`,
                        `/api/department/${user.department_id}`,
                        `/api/user-departments/${user.department_id}`
                    ];

                    for (const endpoint of deptApiEndpoints) {
                        try {
                            const deptRes = await fetch(endpoint, {
                                headers: {
                                    'Authorization': `Bearer ${token}`,
                                    'Accept': 'application/json',
                                },
                                credentials: 'include'
                            });
                            
                            if (deptRes.ok) {
                                const deptData = await deptRes.json();
                                fetchedDeptName = deptData?.name || deptData?.data?.name || deptData?.department?.name || null;
                                if (fetchedDeptName) {
                                    setDepartmentName(fetchedDeptName);
                                    break; // Use API data if available
                                }
                            }
                        } catch (err) {
                            // Try next endpoint
                            continue;
                        }
                    }

                    // If API call failed and we don't have a name yet, use fallback mapping
                    if (!fetchedDeptName && departmentIdToNameMap[user.department_id] && !departmentName) {
                        setDepartmentName(departmentIdToNameMap[user.department_id]);
                    }
                }
            } catch (err) {
                // Silently fail
            }
        };

        fetchUserDetails();
    }, [user, token]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setMenuOpen(false);
            }
        };

        if (menuOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [menuOpen]);

    useEffect(() => {
        const fetchNotifications = async () => {
            if (!user || !token) return;
            try {
                // Add cache-busting parameter to ensure we get fresh data
                const cacheBuster = `?t=${Date.now()}`;
                const res = await fetch(`/api/notifications/${userRoleId}${cacheBuster}`, {
                    headers: { 
                        'Authorization': `Bearer ${token}`,
                        'Accept': 'application/json',
                        'Content-Type': 'application/json',
                        'X-Requested-With': 'XMLHttpRequest',
                        'Cache-Control': 'no-cache'
                    },
                    credentials: 'include',
                    cache: 'no-store'
                });
                
                if (!res.ok) {
                    const errorData = await res.json().catch(() => ({}));
                    if (res.status === 401) {
                        // Handle unauthorized (e.g., token expired)
                        localStorage.removeItem('token');
                        localStorage.removeItem('user');
                        window.location.href = '/login';
                        return;
                    }
                    throw new Error(errorData.message || 'Failed to fetch notifications');
                }

                const data = await res.json();
                
                if (!Array.isArray(data)) {
                    return;
                }

                const parsed = data.map((n, idx) => {
                    // Try to get notification ID from multiple possible locations
                    const notificationId = n.id || 
                                          n.notification_id || 
                                          n.notificationId ||
                                          n.data?.id ||
                                          n.data?.notification_id ||
                                          // Fallback: create unique ID from available data
                                          `${n.data?.form_id || 'unknown'}-${n.data?.specific_form_id || 'unknown'}-${n.created_at || Date.now()}-${idx}`;
                    
                    return {
                        form_id: n.data?.form_id,
                        specific_form_id: n.data?.specific_form_id,
                        form_doc_no: n.data?.form_doc_no,
                        created_at: n.created_at,
                        form_name: n.form_name || 'Unknown Form',
                        status: n.status || 'pending',
                        is_viewed: n.is_viewed !== undefined ? n.is_viewed : (n.data?.is_viewed !== undefined ? n.data.is_viewed : null),
                        // Include actor information and action for notification display
                        actor_name: n.actor_name ?? n.data?.actor_name ?? null,
                        actor_role: n.actor_role ?? n.data?.actor_role ?? null,
                        action: n.action ?? n.data?.action ?? null,
                        // Also include full data object for backward compatibility
                        data: n.data || {},
                        // Add unique ID for tracking
                        notification_id: notificationId,
                    };
                });

                // Filter to only show unread notifications (is_viewed is false, null, or undefined)
                const unreadNotifications = parsed.filter(n => 
                    n.is_viewed === false || n.is_viewed === null || n.is_viewed === undefined
                );

                // Detect new notifications by comparing with previous set
                const currentNotificationIds = new Set(unreadNotifications.map(n => n.notification_id));
                
                console.log('[Notification] Tracking:', {
                    isFirstLoad: isFirstLoad.current,
                    currentNotificationCount: unreadNotifications.length,
                    currentNotificationIds: Array.from(currentNotificationIds),
                    previousNotificationIds: Array.from(previousNotificationIds.current),
                    unreadNotifications: unreadNotifications.map(n => ({
                        id: n.notification_id,
                        action: n.action,
                        status: n.status,
                        form_doc_no: n.form_doc_no,
                        is_viewed: n.is_viewed
                    }))
                });
                
                // On first load, initialize the previous set but don't show notifications
                // (to avoid showing notifications for old unread items on page load)
                if (isFirstLoad.current) {
                    previousNotificationIds.current = currentNotificationIds;
                    isFirstLoad.current = false;
                    console.log('[Notification] First load - initialized previous IDs, skipping notifications');
                    // Skip showing notifications on first load
                } else {
                    // After first load, detect and show new notifications
                    // Only show browser notifications for notifications that are:
                    // 1. New (not in previousNotificationIds) AND
                    // 2. Haven't been shown as browser notification before
                    const newNotifications = unreadNotifications.filter(n => {
                        const isNewById = !previousNotificationIds.current.has(n.notification_id);
                        const notShownBefore = !shownBrowserNotificationIds.current.has(n.notification_id);
                        
                        // Only consider it new if it's a new ID AND we haven't shown it before
                        const isNew = isNewById && notShownBefore;
                        
                        if (isNew) {
                            console.log('[Notification] New notification detected:', {
                                id: n.notification_id,
                                action: n.action,
                                status: n.status,
                                form_doc_no: n.form_doc_no,
                                actor_name: n.actor_name,
                                created_at: n.created_at,
                                isNewById,
                                notShownBefore,
                                reason: 'new ID and not shown before'
                            });
                        }
                        return isNew;
                    });

                    // Debug logging for new notifications
                    if (newNotifications.length > 0) {
                        console.log('[Notification] New notifications detected:', newNotifications.map(n => ({
                            id: n.notification_id,
                            action: n.action,
                            status: n.status,
                            form_doc_no: n.form_doc_no,
                            actor_name: n.actor_name,
                            actor_role: n.actor_role,
                            data: n.data
                        })));
                    }

                    // Helper function to show notifications (defined before use)
                    const showNotificationsForItems = (notificationsToShow) => {
                        if (!notificationsToShow || notificationsToShow.length === 0) return;
                        
                        notificationsToShow.forEach((notification, index) => {
                            // Mark this notification as shown to prevent showing it again
                            shownBrowserNotificationIds.current.add(notification.notification_id);
                            
                            // Add a small delay between notifications to avoid overwhelming the user
                            setTimeout(() => {
                                const action = (notification.action || notification.data?.action || '').toString().toLowerCase().trim();
                                const status = (notification.status || notification.data?.status || '').toString().toLowerCase().trim();
                                const actorName = notification.actor_name || notification.data?.actor_name || 'Someone';
                                const actorRole = notification.actor_role || notification.data?.actor_role || '';
                                const formDocNo = notification.form_doc_no || notification.data?.form_doc_no || 'Unknown';
                                
                                console.log('[Notification] Processing notification:', {
                                    action,
                                    status,
                                    actorName,
                                    actorRole,
                                    formDocNo,
                                    notification_id: notification.notification_id
                                });
                                
                                // Create notification message based on action and status
                                let title = 'New Notification';
                                let body = '';
                                
                                // Check action first, then fall back to status
                                // Also check if status indicates checked or completed
                                if (action === 'checked' || action === 'check' || status === 'checked' || status.includes('check')) {
                                    title = 'Form Checked';
                                    body = `${actorName}${actorRole ? ` (${actorRole})` : ''} checked your form ${formDocNo}`;
                                } else if (action === 'approved' || action === 'approve' || action === 'bm_approved' || 
                                          status === 'bm approved' || status === 'bmapproved' || status.includes('approved')) {
                                    title = 'Form Approved';
                                    body = `${actorName}${actorRole ? ` (${actorRole})` : ''} approved your form ${formDocNo}`;
                                } else if (action === 'acknowledged' || action === 'acknowledge' || action === 'op_acknowledged' ||
                                          status === 'ac_acknowledged' || status === 'acknowledged' || status.includes('acknowledge')) {
                                    title = 'Form Acknowledged';
                                    body = `${actorName}${actorRole ? ` (${actorRole})` : ''} acknowledged your form ${formDocNo}`;
                                } else if (action === 'issued' || action === 'issue' || action === 'completed' || action === 'complete' ||
                                          status === 'completed' || status === 'issued' || status === 'supervisorissued' || 
                                          status.includes('complete') || status.includes('issue')) {
                                    title = 'Form Issued';
                                    body = `${actorName}${actorRole ? ` (${actorRole})` : ''} issued your form ${formDocNo}`;
                                } else if (action === 'created' || action === 'create' || status === 'ongoing') {
                                    title = 'New Form Created';
                                    body = `New form ${formDocNo} has been created`;
                                } else if (actorName && actorName !== 'Someone') {
                                    // If we have an actor name but no specific action, show generic update
                                    title = 'Form Updated';
                                    body = `${actorName}${actorRole ? ` (${actorRole})` : ''} updated your form ${formDocNo}`;
                                } else {
                                    // Fallback: show notification anyway if it's new - this ensures ALL new notifications are shown
                                    title = 'New Notification';
                                    body = `You have a new notification for form ${formDocNo}`;
                                }
                                
                                // Always show notification regardless of action/status matching
                                // This ensures browser notifications appear for check and issue actions
                                
                                console.log('[Notification] Showing browser notification:', { title, body });

                                // Show browser notification
                                try {
                                    // Try using service worker registration first (more reliable)
                                    if ('serviceWorker' in navigator) {
                                        navigator.serviceWorker.ready.then(registration => {
                                            console.log('[Notification] Using service worker to show notification');
                                            return registration.showNotification(title, {
                                                body: body,
                                                icon: '/PRO1logo.png',
                                                badge: '/PRO1logo.png',
                                                tag: `notification-${notification.notification_id}-${Date.now()}`,
                                                requireInteraction: false,
                                                data: {
                                                    form_id: notification.form_id,
                                                    specific_form_id: notification.specific_form_id,
                                                    form_doc_no: notification.form_doc_no,
                                                    url: `/big-damage-issue-add/${notification.specific_form_id}`
                                                }
                                            });
                                        }).catch((error) => {
                                            console.warn('[Notification] Service worker failed, using direct API:', error);
                                            // Fallback to direct Notification API
                                            const browserNotification = new Notification(title, {
                                                body: body,
                                                icon: '/PRO1logo.png',
                                                badge: '/PRO1logo.png',
                                                tag: `notification-${notification.notification_id}-${Date.now()}`,
                                                requireInteraction: false,
                                                data: {
                                                    form_id: notification.form_id,
                                                    specific_form_id: notification.specific_form_id,
                                                    form_doc_no: notification.form_doc_no,
                                                    url: `/big-damage-issue-add/${notification.specific_form_id}`
                                                }
                                            });

                                            // Handle notification click
                                            browserNotification.onclick = () => {
                                                window.focus();
                                                if (notification.specific_form_id) {
                                                    window.location.href = `/big-damage-issue-add/${notification.specific_form_id}`;
                                                }
                                                browserNotification.close();
                                            };
                                            console.log('[Notification] Direct notification shown');
                                        });
                                    } else {
                                        // Fallback to direct Notification API if service worker not available
                                        console.log('[Notification] Service worker not available, using direct API');
                                        const browserNotification = new Notification(title, {
                                            body: body,
                                            icon: '/PRO1logo.png',
                                            badge: '/PRO1logo.png',
                                            tag: `notification-${notification.notification_id}-${Date.now()}`,
                                            requireInteraction: false,
                                            data: {
                                                form_id: notification.form_id,
                                                specific_form_id: notification.specific_form_id,
                                                form_doc_no: notification.form_doc_no,
                                                url: `/big-damage-issue-add/${notification.specific_form_id}`
                                            }
                                        });

                                        // Handle notification click
                                        browserNotification.onclick = () => {
                                            window.focus();
                                            if (notification.specific_form_id) {
                                                window.location.href = `/big-damage-issue-add/${notification.specific_form_id}`;
                                            }
                                            browserNotification.close();
                                        };
                                        console.log('[Notification] Direct notification shown');
                                    }
                                } catch (error) {
                                    console.error('[Notification] Error showing browser notification:', error);
                                }
                            }, index * 500); // Stagger notifications by 500ms
                        });
                    };
                    
                    // Show browser notification for new notifications
                    if (newNotifications.length > 0) {
                        // Check notification support and permission
                        const hasNotificationSupport = 'Notification' in window;
                        let hasPermission = Notification.permission === 'granted';
                        
                        console.log('[Notification] Browser notification check:', {
                            hasNotificationSupport,
                            permission: Notification.permission,
                            hasPermission,
                            newNotificationsCount: newNotifications.length,
                            previousCount: previousNotificationIds.current.size,
                            currentCount: currentNotificationIds.size
                        });
                        
                        // If permission is default, try to request it
                        if (hasNotificationSupport && Notification.permission === 'default') {
                            console.log('[Notification] Requesting notification permission...');
                            Notification.requestPermission().then(permission => {
                                console.log('[Notification] Permission result:', permission);
                                if (permission === 'granted') {
                                    hasPermission = true;
                                    // Show notifications after permission is granted
                                    showNotificationsForItems(newNotifications);
                                }
                            });
                        }
                        
                        if (hasNotificationSupport && hasPermission) {
                            showNotificationsForItems(newNotifications);
                        } else if (!hasPermission && hasNotificationSupport) {
                            console.warn('[Notification] Cannot show notifications - permission not granted');
                        }
                    }

                    // Update previous notification IDs after processing new notifications
                    // This tracks which notifications exist, regardless of whether we showed browser notifications
                    previousNotificationIds.current = currentNotificationIds;
                    
                    // Clean up shownBrowserNotificationIds - remove IDs that are no longer in unread notifications
                    // This prevents the set from growing indefinitely
                    const currentIds = new Set(unreadNotifications.map(n => n.notification_id));
                    shownBrowserNotificationIds.current = new Set(
                        Array.from(shownBrowserNotificationIds.current).filter(id => currentIds.has(id))
                    );
                }

                setNotifications(unreadNotifications);
                localStorage.setItem("notifications", JSON.stringify(unreadNotifications));
            } catch (err) {
                // Don't throw to prevent uncaught promise rejection
            }
        };

        fetchNotifications();
        subscribeToPush();
        
        // Listen for custom event to refresh notifications immediately
        const handleNotificationsUpdated = (event) => {
            // Force immediate refresh when notifications are updated
            console.log('[Navbar] Notifications updated event received, refreshing...', event.detail);
            // Refresh immediately
            fetchNotifications();
            // Add a small delay to ensure backend has processed the update, then refresh again
            setTimeout(() => {
                fetchNotifications();
            }, 300);
            // Also refresh after a longer delay to catch any delayed backend updates
            setTimeout(() => {
                fetchNotifications();
            }, 1500);
        };
        window.addEventListener('notificationsUpdated', handleNotificationsUpdated);
        
        // Also listen for storage events in case notifications are updated in another tab
        const handleStorageChange = (e) => {
            if (e.key === 'notifications') {
                try {
                    const updatedNotifications = JSON.parse(e.newValue || '[]');
                    setNotifications(updatedNotifications);
                } catch (err) {
                }
            }
        };
        window.addEventListener('storage', handleStorageChange);
        
        const interval = setInterval(fetchNotifications, 10000);
        return () => {
            clearInterval(interval);
            window.removeEventListener('notificationsUpdated', handleNotificationsUpdated);
            window.removeEventListener('storage', handleStorageChange);
        };
    }, [userRoleId, token, setNotifications]);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    // Get page name based on current route
    const getPageName = () => {
        const path = location.pathname;
        
        if (path.includes('/big-damage-issue')) {
            return t('navbar.bigDamageIssue', { defaultValue: 'Big Damage Issue' });
        }
        if (path.includes('/dashboard')) {
            return t('navbar.dashboard', { defaultValue: 'Dashboard' });
        }
        if (path.includes('/cctv')) {
            return t('navbar.cctv', { defaultValue: 'CCTV' });
        }
        if (path.includes('/small-damage')) {
            return t('navbar.smallDamage', { defaultValue: 'Small Damage' });
        }
        // Add more routes as needed
        return '';
    };

    const pageName = getPageName();

    return (
        <nav className="bg-gradient-to-r from-blue-50 via-cyan-50 to-blue-50 backdrop-blur-sm border-b border-blue-100/50 text-gray-800 py-3 sm:py-4 px-4 sm:px-6 flex items-center gap-2 sm:gap-3 relative shadow-sm z-50">
            {/* Logo Section */}
            <Link to="/dashboard" className="flex items-center space-x-2 sm:space-x-3 group flex-shrink-0">
                <div className="relative">
                    <img src={finalLogo} alt="homepage" className="h-7 w-auto sm:h-9 md:h-11 object-contain transition-transform duration-300 group-hover:scale-105" />
                </div>
                <span className="hidden lg:block text-lg sm:text-xl md:text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent sm:pl-2">
                    {t('navbar.requestDocumentSystem')}
                </span>
            </Link>

            {/* Page Name - Mobile Only */}
            {pageName && (
                <span className="lg:hidden text-sm sm:text-base font-semibold text-gray-800 truncate flex-1 text-center min-w-0">
                    {pageName}
                </span>
            )}

            {/* Right Side Actions */}
            <div className="flex items-center space-x-2 sm:space-x-3 lg:space-x-4 flex-shrink-0 ml-auto">
                <LanguageSwitcher />
                <NotificationIcon notifications={notifications} />
                <div className="relative z-50" ref={dropdownRef}>
                    <button
                        onClick={() => setMenuOpen(!menuOpen)}
                        className="flex items-center space-x-2 bg-white/80 backdrop-blur-sm px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg shadow-sm hover:bg-white hover:shadow-md transition-all duration-200 text-sm cursor-pointer border border-gray-100/50"
                    >
                        <div className="w-6 h-6 sm:w-7 sm:h-7 lg:hidden bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-white text-xs font-semibold shadow-sm">
                            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <svg
                            className="hidden sm:block w-5 h-5 lg:hidden text-gray-600"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                            />
                        </svg>
                        <span className="hidden lg:inline font-semibold text-gray-700">{user?.name || t('navbar.user')}</span>
                        <svg
                            className="w-4 h-4 text-gray-500 transition-transform duration-200"
                            style={{ transform: menuOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
                            fill="currentColor"
                            viewBox="0 0 20 20"
                        >
                            <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                        </svg>
                    </button>

                    {menuOpen && (
                        <>
                            {/* Backdrop overlay for mobile */}
                            <div 
                                className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[9998] lg:hidden"
                                onClick={() => setMenuOpen(false)}
                            ></div>
                            <div className="absolute right-0 mt-2 w-64 sm:w-80 max-w-sm bg-white/95 backdrop-blur-lg border border-gray-200/50 rounded-lg sm:rounded-xl shadow-2xl z-[9999] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 max-h-[calc(100vh-6rem)] overflow-y-auto">
                            {/* User Info Header */}
                            <div className="bg-gradient-to-br from-blue-500 via-cyan-500 to-blue-600 px-3 py-3 sm:px-5 sm:py-5 border-b border-blue-400/20">
                                <div className="flex items-center space-x-2 sm:space-x-3">
                                    <div className="flex-shrink-0">
                                        <div className="w-10 h-10 sm:w-14 sm:h-14 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white font-bold text-base sm:text-xl shadow-lg ring-2 ring-white/30">
                                            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                                        </div>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs sm:text-sm font-bold text-white truncate drop-shadow-sm">
                                            {user?.name || t('navbar.user')}
                                        </p>
                                        {user?.emp_id && (
                                            <p className="text-[10px] sm:text-xs text-blue-100 truncate mt-0.5">
                                                ID: {user.emp_id}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* User Details Section */}
                            <div className="px-3 py-2.5 sm:px-5 sm:py-4 bg-white/50 backdrop-blur-sm border-b border-gray-100">
                                <div className="space-y-2 sm:space-y-3">
                                    {/* Role - Always displayed */}
                                    <div className="flex items-start space-x-2 sm:space-x-3 p-1.5 sm:p-2 rounded-md sm:rounded-lg hover:bg-white/60 transition-colors">
                                        <div className="flex-shrink-0 mt-0.5">
                                            <div className="w-7 h-7 sm:w-9 sm:h-9 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg sm:rounded-xl flex items-center justify-center shadow-sm">
                                                <svg className="w-3.5 h-3.5 sm:w-4.5 sm:h-4.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                                </svg>
                                            </div>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[10px] sm:text-xs font-semibold text-gray-500 uppercase tracking-wider mb-0.5">Role</p>
                                            <p className="text-xs sm:text-sm font-bold text-gray-900 truncate">
                                                {roleName || user?.role?.name || user?.role_name || user?.roleName || user?.role?.user_type || (user?.role_id && roleIdToNameMap[user.role_id]) || (user?.role_id ? `Role ID: ${user.role_id}` : 'N/A')}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Branch */}
                                    {(branchName || user?.from_branch_name || user?.branch_name || user?.from_branch?.branch_name || user?.branch?.branch_name) && (
                                        <div className="flex items-start space-x-2 sm:space-x-3 p-1.5 sm:p-2 rounded-md sm:rounded-lg hover:bg-white/60 transition-colors">
                                            <div className="flex-shrink-0 mt-0.5">
                                                <div className="w-7 h-7 sm:w-9 sm:h-9 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg sm:rounded-xl flex items-center justify-center shadow-sm">
                                                    <svg className="w-3.5 h-3.5 sm:w-4.5 sm:h-4.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                                    </svg>
                                                </div>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-[10px] sm:text-xs font-semibold text-gray-500 uppercase tracking-wider mb-0.5">Branch</p>
                                                <p className="text-xs sm:text-sm font-bold text-gray-900 truncate">
                                                    {branchName || user?.from_branch_name || user?.branch_name || user?.from_branch?.branch_name || user?.branch?.branch_name || 'N/A'}
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    {/* Department */}
                                    {(departmentName || user?.department?.name || user?.departments?.name || user?.department_name || (user?.department_id && departmentIdToNameMap[user.department_id])) && (
                                        <div className="flex items-start space-x-2 sm:space-x-3 p-1.5 sm:p-2 rounded-md sm:rounded-lg hover:bg-white/60 transition-colors">
                                            <div className="flex-shrink-0 mt-0.5">
                                                <div className="w-7 h-7 sm:w-9 sm:h-9 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg sm:rounded-xl flex items-center justify-center shadow-sm">
                                                    <svg className="w-3.5 h-3.5 sm:w-4.5 sm:h-4.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                                    </svg>
                                                </div>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-[10px] sm:text-xs font-semibold text-gray-500 uppercase tracking-wider mb-0.5">Department</p>
                                                <p className="text-xs sm:text-sm font-bold text-gray-900 truncate">
                                                    {departmentName || user?.department?.name || user?.departments?.name || user?.department_name || (user?.department_id && departmentIdToNameMap[user.department_id]) || (user?.department_id ? `Dept ID: ${user.department_id}` : 'N/A')}
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Menu Items */}
                            <ul className="text-sm text-gray-700 bg-white/50 backdrop-blur-sm">
                                <li>
                                    <button
                                        onClick={handleLogout}
                                        className="w-full text-left px-3 py-2 sm:px-5 sm:py-3 hover:bg-gradient-to-r hover:from-red-50 hover:to-pink-50 text-red-600 font-semibold transition-all duration-200 flex items-center space-x-2 sm:space-x-3 group text-xs sm:text-sm"
                                    >
                                        <svg className="w-4 h-4 sm:w-5 sm:h-5 group-hover:scale-110 transition-transform flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                        </svg>
                                        <span>{t('navbar.signOut')}</span>
                                    </button>
                                </li>
                            </ul>
                            </div>
                        </>
                    )}
                </div>

                <button 
                    onClick={toggleSidebar} 
                    className="block lg:hidden p-2 rounded-lg bg-white/80 backdrop-blur-sm hover:bg-white hover:shadow-md transition-all duration-200 text-gray-700 border border-gray-100/50"
                >
                    <AiOutlineMenu size={24} />
                </button>
            </div>
        </nav>
    );
}
