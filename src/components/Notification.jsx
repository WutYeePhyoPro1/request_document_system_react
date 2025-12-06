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
            <div className="relative cursor-pointer" onClick={toggleDropdown}>
                <FaBell className="text-2xl text-gray-700" />
                {hasNotifications && (
                    <span className="absolute -top-4 -right-3 flex items-center justify-center 
                                    h-6 w-6 text-sm font-bold text-white bg-red-600 rounded-full
                                    border-2 border-white shadow-lg p-3">
                        {notifications.length}
                    </span>
                )}
            </div>
            {isDropdownOpen && hasNotifications && (
                <div className="absolute -right-30 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                    <div className="max-h-60 overflow-y-auto">
                        {notifications.map((noti, index) => (
                            <div
                                key={index}
                                role="button"
                                tabIndex={0}
                                className="flex p-3 border-b border-gray-200 hover:bg-gray-200 cursor-pointer"
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
                                <img
                                    src={finalLogo}
                                    alt="Logo"
                                    className="w-12 h-12 object-contain rounded-full mr-3"
                                />
                                <div className="flex-1">
                                    {noti?.form_id === 15 && (
                                        <h3 className="text-xs font-bold uppercase tracking-wider  mb-1">
                                            {noti?.form_name || 'Unknown Form'}
                                        </h3>
                                    )}
                                    <p className="font-semibold text-sm">{noti?.form_doc_no || 'Unknown Document'}</p>
                                    <p className="font-semibold text-sm">{noti?.status || 'Unknown status'}</p>
                                    <p className="text-xs text-blue-500">
                                        {new Date(noti?.created_at).toLocaleString()}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <button
                        onClick={toggleDropdown}
                        className="w-full text-center text-blue-500 text-sm py-2 hover:bg-gray-100 border-t border-gray-200"
                    >
                        Close
                    </button>
                </div>
            )}
        </div>
    );
}
