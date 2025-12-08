

import React, { useState, useRef, useEffect, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
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

    const [menuOpen, setMenuOpen] = useState(false);
    const dropdownRef = useRef(null);
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
                const res = await fetch(`/api/notifications/${userRoleId}`, {
                    headers: { 
                        'Authorization': `Bearer ${token}`,
                        'Accept': 'application/json',
                        'Content-Type': 'application/json',
                        'X-Requested-With': 'XMLHttpRequest'
                    },
                    credentials: 'include'
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

                const parsed = data.map(n => ({
                    form_id: n.data?.form_id,
                    specific_form_id: n.data?.specific_form_id,
                    form_doc_no: n.data?.form_doc_no,
                    created_at: n.created_at,
                    form_name: n.form_name || 'Unknown Form',
                    status: n.status || 'pending',
                    is_viewed: n.is_viewed !== undefined ? n.is_viewed : (n.data?.is_viewed !== undefined ? n.data.is_viewed : null),
                }));

                // Filter to only show unread notifications (is_viewed is false, null, or undefined)
                const unreadNotifications = parsed.filter(n => 
                    n.is_viewed === false || n.is_viewed === null || n.is_viewed === undefined
                );

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
            fetchNotifications();
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

    return (
        <nav className="bg-[#A9D8E9] text-gray-800 py-4 px-6 flex items-center justify-between relative">
            <Link to="/dashboard" className="flex items-center space-x-2">
                <img src={finalLogo} alt="homepage" className="h-8 sm:h-10 md:h-12 object-contain" />
            </Link>
            <span className="hidden lg:block text-xl sm:text-lg md:text-xl lg:text-2xl font-bold text-custom-blue sm:pl-4">
                {t('navbar.requestDocumentSystem')}
            </span>

            <div className="flex items-center space-x-4">
                <LanguageSwitcher />
                <NotificationIcon notifications={notifications} />
                <div className="relative" ref={dropdownRef}>
                    <button
                        onClick={() => setMenuOpen(!menuOpen)}
                        className="flex items-center space-x-2 bg-white px-2 py-1 rounded-md shadow-sm hover:bg-gray-100 text-sm cursor-pointer"
                    >
                        <svg
                            className="w-5 h-5 lg:hidden"
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
                        <span className="hidden lg:inline font-semibold">{user?.name || t('navbar.user')}</span>
                        <svg
                            className="w-4 h-4"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                        >
                            <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                        </svg>
                    </button>

                    {menuOpen && (
                        <div className="absolute right-0 mt-2 w-72 bg-white border border-gray-200 rounded-lg shadow-xl z-50 overflow-hidden">
                            {/* User Info Header */}
                            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-4 py-4 border-b border-gray-200">
                                <div className="flex items-center space-x-3">
                                    <div className="flex-shrink-0">
                                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md">
                                            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                                        </div>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-gray-900 truncate">
                                            {user?.name || t('navbar.user')}
                                        </p>
                                        {user?.emp_id && (
                                            <p className="text-xs text-gray-500 truncate">
                                                ID: {user.emp_id}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* User Details Section */}
                            <div className="px-4 py-3 bg-white border-b border-gray-100">
                                <div className="space-y-2.5">
                                    {/* Role - Always displayed */}
                                    <div className="flex items-start space-x-3">
                                        <div className="flex-shrink-0 mt-0.5">
                                            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                                                <svg className="w-4 h-4 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                                </svg>
                                            </div>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Role</p>
                                            <p className="text-sm font-semibold text-gray-900 truncate">
                                                {roleName || user?.role?.name || user?.role_name || user?.roleName || user?.role?.user_type || (user?.role_id && roleIdToNameMap[user.role_id]) || (user?.role_id ? `Role ID: ${user.role_id}` : 'N/A')}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Branch */}
                                    {(branchName || user?.from_branch_name || user?.branch_name || user?.from_branch?.branch_name || user?.branch?.branch_name) && (
                                        <div className="flex items-start space-x-3">
                                            <div className="flex-shrink-0 mt-0.5">
                                                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                                    <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                                    </svg>
                                                </div>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Branch</p>
                                                <p className="text-sm font-semibold text-gray-900 truncate">
                                                    {branchName || user?.from_branch_name || user?.branch_name || user?.from_branch?.branch_name || user?.branch?.branch_name || 'N/A'}
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    {/* Department */}
                                    {(departmentName || user?.department?.name || user?.departments?.name || user?.department_name || (user?.department_id && departmentIdToNameMap[user.department_id])) && (
                                        <div className="flex items-start space-x-3">
                                            <div className="flex-shrink-0 mt-0.5">
                                                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                                                    <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                                    </svg>
                                                </div>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Department</p>
                                                <p className="text-sm font-semibold text-gray-900 truncate">
                                                    {departmentName || user?.department?.name || user?.departments?.name || user?.department_name || (user?.department_id && departmentIdToNameMap[user.department_id]) || (user?.department_id ? `Dept ID: ${user.department_id}` : 'N/A')}
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Menu Items */}
                            <ul className="text-sm text-gray-700 bg-white">
                                <li>
                                    <button
                                        onClick={handleLogout}
                                        className="w-full text-left px-4 py-2.5 hover:bg-red-50 text-red-600 font-medium transition-colors flex items-center space-x-2"
                                    >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                        </svg>
                                        <span>{t('navbar.signOut')}</span>
                                    </button>
                                </li>
                            </ul>
                        </div>
                    )}
                </div>

                <button onClick={toggleSidebar} className="block lg:hidden  text-gray-700">
                    <AiOutlineMenu size={28} />
                </button>
            </div>
        </nav>
    );
}
