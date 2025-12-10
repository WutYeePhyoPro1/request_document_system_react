import React, { useState, useEffect } from 'react';
import { FaBell } from 'react-icons/fa';
import finalLogo from "../assets/images/finallogo.png";
import { useNavigate } from 'react-router-dom';

export default function Notification({ notifications }) {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isNavigating, setIsNavigating] = useState(false);
    const hasNotifications = notifications && notifications.length > 0;
    const navigate = useNavigate();

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

      if (response.ok) {
        console.log('[Notification] Marked as read successfully');
      } else {
        console.warn('[Notification] Mark-as-read failed:', response.status);
      }

      // Trigger immediate refresh for other listeners (Navbar) to update badge
      window.dispatchEvent(new CustomEvent('notificationsUpdated', { detail: { forceRefresh: true } }));
    } catch (error) {
      console.warn('[Notification] Error marking as read:', error);
      // ignore errors here; DamageView will also mark as read
    }
  };

    const handleNotificationClick = async (noti, e) => {
        console.log('[Notification] handleNotificationClick called', { noti, isNavigating });
        
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
      
        if (isNavigating) {
            console.log('[Notification] Already navigating, ignoring click');
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

        console.log('[Notification] Clicked notification:', {
            formId,
            specificFormId,
            formDocNo,
            rawFormId,
            rawSpecificId,
            fullNoti: noti
        });

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
        const isBigDamageByDocNo = formDocNo && (formDocNo.startsWith('ASDLAN') || formDocNo.includes('ASDLAN'));
        
        // Check form_id (could be 1, 8, or other values depending on backend)
        const isBigDamageById = formId === 8 || formId === 1;
        
        // Determine if this is a Big Damage Issue notification
        const isBigDamage = isBigDamageByName || isBigDamageByDocNo || isBigDamageById;
        
        console.log('[Notification] Form type detection:', {
            formId,
            formName,
            formDocNo,
            isBigDamageByName,
            isBigDamageByDocNo,
            isBigDamageById,
            isBigDamage
        });

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

            console.log('[Notification] Navigating to form:', {
                route: `/big-damage-issue-add/${bigDamageId}`,
                bigDamageId,
                generalFormId: specificFormId
            });

            // Close dropdown immediately
            setIsDropdownOpen(false);

            const targetPath = `/big-damage-issue-add/${bigDamageId}`;
            console.log('[Notification] Navigating to:', targetPath);
            console.log('[Notification] Current path:', window.location.pathname);
            
            // Use window.location.href for reliable navigation
            // Store state in sessionStorage since window.location doesn't support state
            sessionStorage.setItem('navigationState', JSON.stringify({
                bigDamageId: bigDamageId,
                generalFormId: specificFormId,
                fromNotification: true
            }));
            
            // Navigate using window.location for maximum reliability
            console.log('[Notification] Using window.location.href for navigation');
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
                console.log('[Notification] Navigating to CCTV form:', specificFormId);
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
                    <span className="absolute top-0 right-0 flex items-center justify-center 
                                    min-w-[22px] h-[22px] px-1.5 text-xs font-bold text-white 
                                    bg-gradient-to-br from-red-500 to-red-600 rounded-full
                                    border-2 border-white shadow-lg animate-pulse">
                        {notifications.length > 99 ? '99+' : notifications.length}
                    </span>
                )}
            </div>

            {/* Modern Dropdown */}
            {isDropdownOpen && (
                <div className="absolute -right-4 mt-3 w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 animate-slideDown">
                    {/* Header */}
                    <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-2xl">
                        <h3 className="text-lg font-bold text-gray-800">Notifications</h3>
                        {hasNotifications && (
                            <span className="px-3 py-1 text-xs font-semibold text-blue-600 bg-blue-100 rounded-full">
                                {notifications.length} new
                            </span>
                        )}
                    </div>

                    {/* Notifications List or Empty State */}
                    {hasNotifications ? (
                        <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                            {notifications.map((noti, index) => (
                            <div
                                key={index}
                                role="button"
                                tabIndex={0}
                                className="relative group p-4 border-b border-gray-50 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 cursor-pointer transition-all duration-200 last:border-b-0"
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
                                {/* Unread Indicator */}
                                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-blue-500 rounded-r-full"></div>
                                
                                <div className="flex gap-3 items-start ml-2">
                                    {/* Logo with modern styling */}
                                    <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl p-2 shadow-sm">
                                        <img
                                            src={finalLogo}
                                            alt="Logo"
                                            className="w-full h-full object-contain"
                                        />
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        {/* Document Number */}
                                        <p className="font-bold text-gray-800 text-sm truncate mb-1">
                                            {noti?.form_doc_no || noti?.data?.form_doc_no || 'Unknown Document'}
                                        </p>
                                        
                                        {/* Actor information or status - check multiple possible paths */}
                                        {(() => {
                                            const actorName = noti?.actor_name || noti?.data?.actor_name;
                                            const action = noti?.action || noti?.data?.action;
                                            const actorRole = noti?.actor_role || noti?.data?.actor_role;
                                            
                                            console.log('[Notification Display]', { 
                                                actorName, 
                                                action, 
                                                actorRole,
                                                noti,
                                                data: noti?.data 
                                            });
                                            
                                            if (actorName && action) {
                                                return (
                                                    <div className="space-y-1">
                                                        <p className="text-sm text-gray-700">
                                                            <span className="font-semibold text-gray-900">{actorName}</span>
                                                            {actorRole && (
                                                                <span className="ml-1 text-xs text-blue-600 font-medium">
                                                                    ({actorRole})
                                                                </span>
                                                            )}
                                                        </p>
                                                        <p className="text-sm text-gray-600">
                                                            {action === 'checked' ? (
                                                                <span className="inline-flex items-center gap-1">
                                                                    <span className="text-green-600">✓</span> Checked your form
                                                                </span>
                                                            ) : action === 'approved' ? (
                                                                <span className="inline-flex items-center gap-1">
                                                                    <span className="text-purple-600">✓</span> Approved your form
                                                                </span>
                                                            ) : action === 'bm_approved' ? (
                                                                <span className="inline-flex items-center gap-1">
                                                                    <span className="text-yellow-600">✓</span> Approved form by BM - Please review
                                                                </span>
                                                            ) : action === 'op_acknowledged' || action === 'acknowledged' ? (
                                                                <span className="inline-flex items-center gap-1">
                                                                    <span className="text-indigo-600">✓</span> Acknowledged form - Please review
                                                                </span>
                                                            ) : action === 'created' ? (
                                                                <span className="inline-flex items-center gap-1">
                                                                    <span className="text-blue-600">📄</span> Created a new form
                                                                </span>
                                                            ) : (
                                                                <span className="inline-flex items-center gap-1">
                                                                    <span className="text-gray-600">•</span> {noti?.status || 'Status update'}
                                                                </span>
                                                            )}
                                                        </p>
                                                    </div>
                                                );
                                            } else {
                                                return (
                                                    <p className="text-sm text-gray-600">
                                                        {noti?.status || 'Status update'}
                                                    </p>
                                                );
                                            }
                                        })()}
                                        
                                        {/* Timestamp */}
                                        <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            {new Date(noti?.created_at).toLocaleString('en-US', { 
                                                year: 'numeric',
                                                month: 'short', 
                                                day: 'numeric', 
                                                hour: '2-digit', 
                                                minute: '2-digit' 
                                            })}
                                        </p>
                                    </div>

                                    {/* Arrow indicator on hover */}
                                    <div className="flex-shrink-0 text-gray-400 group-hover:text-blue-600 transition-colors">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </div>
                                </div>
                            </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-12 px-6">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                                <FaBell className="text-3xl text-gray-400" />
                            </div>
                            <p className="text-gray-600 font-medium text-base mb-1">No notifications</p>
                            <p className="text-gray-400 text-sm text-center">You're all caught up! Check back later for updates.</p>
                        </div>
                    )}

                    {/* Footer */}
                    <button
                        onClick={toggleDropdown}
                        className="w-full text-center text-blue-600 font-medium text-sm py-3 
                                 hover:bg-blue-50 border-t border-gray-100 rounded-b-2xl 
                                 transition-colors duration-200"
                    >
                        Close
                    </button>
                </div>
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
