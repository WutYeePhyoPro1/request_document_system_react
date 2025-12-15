import React, { useState, useEffect } from 'react';
import { FaBell, FaCheckDouble, FaEnvelope } from 'react-icons/fa';
import finalLogo from "../assets/images/finallogo.png";
import { useNavigate } from 'react-router-dom';

export default function Notification({ notifications }) {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isNavigating, setIsNavigating] = useState(false);
    const [isMarkingAllAsRead, setIsMarkingAllAsRead] = useState(false);
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

  // Mark all notifications as read
  const markAllAsRead = async () => {
    const token = localStorage.getItem("token");
    if (!token || !hasNotifications || isMarkingAllAsRead) {
      return;
    }

    setIsMarkingAllAsRead(true);

    try {
      // Try to mark all notifications at once by sending all notification IDs
      // First, try a bulk endpoint if available
      const notificationIds = notifications
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
            console.log('[Notification] All notifications marked as read (bulk)');
            // Trigger refresh
            window.dispatchEvent(new CustomEvent('notificationsUpdated', { detail: { forceRefresh: true } }));
            setIsMarkingAllAsRead(false);
            return;
          }
        } catch (bulkError) {
          console.log('[Notification] Bulk endpoint not available, marking individually');
        }
      }

      // Fallback: Mark each notification individually
      const markPromises = notifications.map(noti => {
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

      // Wait for all requests to complete
      const results = await Promise.allSettled(markPromises);
      const successCount = results.filter(r => r.status === 'fulfilled' && r.value.ok).length;
      
      console.log(`[Notification] Marked ${successCount} of ${notifications.length} notifications as read`);

      // Trigger immediate refresh for other listeners (Navbar) to update badge
      window.dispatchEvent(new CustomEvent('notificationsUpdated', { detail: { forceRefresh: true } }));
    } catch (error) {
      console.error('[Notification] Error marking all as read:', error);
    } finally {
      setIsMarkingAllAsRead(false);
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
        const isBigDamageByDocNo = formDocNo && (formDocNo.startsWith('BDI') || formDocNo.startsWith('ASDLAN') || formDocNo.includes('ASDLAN') || formDocNo.includes('BDI'));
        
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
                    <span className="absolute -top-1 -right-1 flex items-center justify-center 
                                    min-w-[20px] h-5 px-1.5 bg-gradient-to-br from-red-500 to-red-600 
                                    rounded-full border-2 border-white shadow-lg animate-pulse text-white text-xs font-bold">
                        {notifications.length > 99 ? '99+' : notifications.length}
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
                    {hasNotifications ? (
                        <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                            {notifications.map((noti, index) => (
                            <div
                                key={index}
                                role="button"
                                tabIndex={0}
                                className="relative group p-3 sm:p-4 border-b border-gray-50 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 cursor-pointer transition-all duration-200 last:border-b-0"
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
                                
                                <div className="flex gap-2 sm:gap-3 items-start ml-1 sm:ml-2">
                                    {/* Logo with modern styling */}
                                    <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl p-1.5 sm:p-2 shadow-sm">
                                        <img
                                            src={finalLogo}
                                            alt="Logo"
                                            className="w-full h-full object-contain"
                                        />
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        {/* Document Number */}
                                        <p className="font-bold text-gray-800 text-xs sm:text-sm truncate mb-1">
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
