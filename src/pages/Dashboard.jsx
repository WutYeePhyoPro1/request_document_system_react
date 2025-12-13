
import {  useEffect, useState, useContext, useMemo } from "react";
import { Link } from "react-router-dom";
import dashboardPhoto from "../assets/images/reqBa.png";
import BigDamageIsuueLogo from "../assets/images/big-dmg-issue-logo.png";
import NavPath from "../components/NavPath";
import { countFormNoti, getFormsList } from "../api/commonApi";
import { NotificationContext } from "../context/NotificationContext";

const Dashboard = () => {
    const [allForm , setAllForm ] = useState([]) ;
    const [formCounts , setFormCounts] = useState({}) ;
    const [loading , setLoading] = useState(false) ;
    
    // Get notifications from context
    const { notifications, setNotifications } = useContext(NotificationContext);
    
    // Get current user from localStorage
    const currentUser = useMemo(() => {
      try {
        return JSON.parse(localStorage.getItem('user') || '{}');
      } catch (e) {
        return {};
      }
    }, []);
    
    // Calculate notification counts from context for Big Damage Issue Form
    const bigDamageIssueCount = useMemo(() => {
      if (!notifications || !Array.isArray(notifications) || notifications.length === 0) {
        return 0;
      }
      
      if (!currentUser) return 0;
      
      let count = 0;
      const matchedNotifications = [];
      const unmatchedNotifications = [];
      
      notifications.forEach(noti => {
        // Check if notification is for Big Damage Issue Form
        // Method 1: Check form_name (check multiple possible locations with flexible matching)
        const formName = (noti.form_name 
          || noti.data?.form_name 
          || noti.data?.formName
          || '').toString().trim();
        const formNameLower = formName.toLowerCase();
        
        // More flexible matching - check for partial matches too
        const matchesFormName = formName === 'Big Damage Issue Form' 
          || formName === 'Big Damage Issue'
          || formNameLower.includes('big damage issue')
          || formNameLower.includes('big damage')
          || (formNameLower.includes('damage') && formNameLower.includes('issue'));
        
        // Method 2: Check form_id (Big Damage Issue Form has form_id = 8)
        // Check multiple possible locations for form_id
        const formId = noti.form_id 
          || noti.data?.form_id 
          || noti.data?.formId;
        const formIdNum = typeof formId === 'string' ? parseInt(formId, 10) : formId;
        const matchesFormId = formIdNum === 8 || formId === 8 || formId === '8';
        
        // Method 3: Check form_doc_no prefix (BDI = Big Damage Issue)
        // Big Damage Issue forms have document numbers starting with "BDI" (e.g., BDILAN120251213-0001)
        const formDocNo = (noti.form_doc_no 
          || noti.data?.form_doc_no 
          || '').toString().trim().toUpperCase();
        const matchesFormDocNo = formDocNo.startsWith('BDI') || formDocNo.startsWith('BDILAN');
        
        // Method 4: Check if it's unread (is_viewed is false/null/undefined)
        const isUnread = noti.is_viewed === false 
          || noti.is_viewed === null 
          || noti.is_viewed === undefined
          || (noti.data?.is_viewed === false)
          || (noti.data?.is_viewed === null)
          || (noti.data?.is_viewed === undefined);
        
        // Match if ANY of the form identification methods match
        const matchesForm = matchesFormName || matchesFormId || matchesFormDocNo;
        const matchesBranch = !noti.from_branch_id 
          || noti.from_branch_id === currentUser.from_branch_id
          || noti.data?.from_branch_id === currentUser.from_branch_id;
        
        if (matchesForm && matchesBranch && isUnread) {
          count++;
          matchedNotifications.push({
            id: noti.id || noti.notification_id,
            form_name: formName,
            form_id: formId,
            form_doc_no: formDocNo,
            from_branch_id: noti.from_branch_id || noti.data?.from_branch_id,
            is_viewed: noti.is_viewed,
            specific_form_id: noti.specific_form_id || noti.data?.specific_form_id,
            matchedBy: {
              formName: matchesFormName,
              formId: matchesFormId,
              formDocNo: matchesFormDocNo
            }
          });
        } else {
          unmatchedNotifications.push({
            id: noti.id || noti.notification_id,
            form_name: formName,
            form_id: formId,
            form_doc_no: formDocNo,
            from_branch_id: noti.from_branch_id || noti.data?.from_branch_id,
            is_viewed: noti.is_viewed,
            matchesForm,
            matchesBranch,
            isUnread,
            matchedBy: {
              formName: matchesFormName,
              formId: matchesFormId,
              formDocNo: matchesFormDocNo
            },
            fullNotification: noti
          });
        }
      });
      
      // Debug logging
      if (typeof window !== 'undefined' && window.console) {
        window.console.log('[Dashboard] Big Damage Issue notification count:', {
          count,
          notificationsLength: notifications.length,
          currentUserFromBranchId: currentUser?.from_branch_id,
          matchedNotifications: matchedNotifications,
          unmatchedNotifications: unmatchedNotifications.slice(0, 5), // Show first 5 unmatched
          allNotificationFormNames: [...new Set(notifications.map(n => 
            n.form_name || n.data?.form_name || n.data?.formName
          ).filter(Boolean))],
          allNotificationFormIds: [...new Set(notifications.map(n => 
            n.form_id || n.data?.form_id || n.data?.formId
          ).filter(Boolean))],
          sampleNotification: notifications[0]
        });
      }
      
      return count;
    }, [notifications, currentUser]);
    
     useEffect(() => {
    const fetchAllForms = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        console.error("No token found");
        setLoading(false);
        return;
      }

      try {
        const getAllForms = await getFormsList(token);
        const formsData = getAllForms.data.forms || [];
        setAllForm(formsData);

        const counts = {};
        await Promise.all(
          formsData.map(async (form) => {
            // For all forms, use API to get count
            try {
              // Use form.id as the identifier (consistent with how other forms work)
              const formIdentifier = form.id;
              
              // For Big Damage Issue Form, also try form.form_id if form.id doesn't work
              let apiCount = 0;
              try {
                apiCount = await countFormNoti(token, formIdentifier);
              } catch (firstError) {
                // If form.id fails and we have form.form_id, try that
                if (form.name === "Big Damage Issue Form" && form.form_id) {
                  console.log('[Dashboard] Trying form.form_id for Big Damage Issue Form:', form.form_id);
                  try {
                    apiCount = await countFormNoti(token, form.form_id);
                  } catch (secondError) {
                    console.error('[Dashboard] Both form.id and form.form_id failed:', secondError);
                  }
                } else {
                  throw firstError;
                }
              }
              
              // Use form.id as the key to store the count
              // Ensure we convert to number if needed
              const finalCount = typeof apiCount === 'number' ? apiCount : (parseInt(apiCount) || 0);
              counts[form.id] = finalCount;
              
              // For Big Damage Issue Form, always use API count (context might not have Big Damage notifications)
              // The API is the source of truth for the count
              if (form.name === "Big Damage Issue Form") {
                console.log('[Dashboard] Big Damage Issue Form - API response details:', {
                  formId: form.id,
                  form_id: form.form_id,
                  formIdentifier: formIdentifier,
                  rawApiCount: apiCount,
                  apiCountType: typeof apiCount,
                  parsedCount: finalCount,
                  storedInCounts: counts[form.id],
                  contextCount: bigDamageIssueCount,
                  fullFormObject: form,
                  apiUrl: `/api/count_notis/${formIdentifier}`,
                  willUseApiCount: finalCount > 0
                });
                
                // IMPORTANT: Always trust the API count for Big Damage Issue Form
                // The API queries the database directly and is more reliable than context
                // Context might not have loaded Big Damage Issue notifications yet
                if (finalCount > 0) {
                  console.log('[Dashboard] Big Damage Issue Form has notifications from API:', finalCount);
                } else {
                  console.log('[Dashboard] Big Damage Issue Form API returned 0 - no notifications');
                }
              }
              
              // Debug logging for Big Damage Issue Form and Asset Damage / Lost Form
              if (form.name === "Big Damage Issue Form" || form.name === "Asset Damage / Lost Form") {
                console.log(`[Dashboard] ${form.name} count from API:`, {
                  formId: form.id,
                  form_id: form.form_id,
                  formIdentifier: formIdentifier,
                  formName: form.name,
                  apiCount: apiCount,
                  apiCountType: typeof apiCount,
                  apiCountValue: apiCount,
                  contextCount: form.name === "Big Damage Issue Form" ? bigDamageIssueCount : 'N/A',
                  storedInCounts: counts[form.id],
                  fullFormObject: form,
                  apiResponse: apiCount // Show raw response
                });
              }
            } catch (error) {
              console.error(`Error fetching count for ${form.name}:`, error, {
                formId: form.id,
                form_id: form.form_id,
                formName: form.name
              });
              
              // For Big Damage Issue Form, use context count as fallback
              if (form.name === "Big Damage Issue Form") {
                counts[form.id] = bigDamageIssueCount || 0;
              } else {
                counts[form.id] = 0;
              }
            }
          })
        );
        
        // Debug: Log all counts after fetching
        console.log('[Dashboard] All form counts after API fetch:', counts);
        console.log('[Dashboard] Big Damage Issue context count:', bigDamageIssueCount);
        
        // Log specifically for Big Damage Issue Form
        const bigDamageForm = formsData.find(f => f.name === "Big Damage Issue Form");
        if (bigDamageForm) {
          console.log('[Dashboard] Big Damage Issue Form final API count:', {
            formId: bigDamageForm.id,
            form_id: bigDamageForm.form_id,
            apiCount: counts[bigDamageForm.id],
            contextCount: bigDamageIssueCount,
            willUseApiCount: counts[bigDamageForm.id] > 0
          });
        }

        setFormCounts(counts);
      } catch (error) {
        console.error("Error fetching forms or counts:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAllForms();
  }, []); // Only run once on mount - don't depend on bigDamageIssueCount
  
  // Update formCounts when bigDamageIssueCount changes (from context)
  // This ensures real-time updates when notifications are marked as read
  useEffect(() => {
    if (allForm.length > 0 && bigDamageIssueCount >= 0) {
      const bigDamageForm = allForm.find(form => form.name === "Big Damage Issue Form");
      if (bigDamageForm) {
        setFormCounts(prev => {
          const currentCount = prev[bigDamageForm.id] || 0;
          // Always use the higher count (API or context) to ensure we show notifications
          // Context count is more up-to-date for real-time updates
          const newCount = Math.max(currentCount, bigDamageIssueCount);
          
          if (process.env.NODE_ENV !== 'production') {
            console.log('[Dashboard] Updating Big Damage Issue count:', {
              formId: bigDamageForm.id,
              currentCount,
              bigDamageIssueCount,
              newCount,
              willUpdate: newCount !== currentCount
            });
          }
          
          return {
            ...prev,
            [bigDamageForm.id]: newCount
          };
        });
      }
    }
  }, [bigDamageIssueCount, allForm]);
  
  // Listen for notification updates to refresh the count and reload notifications
  useEffect(() => {
    const handleNotificationsUpdated = async (event) => {
      console.log('[Dashboard] notificationsUpdated event received', event?.detail);
      
      // Refresh notifications from API to get updated counts
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const token = localStorage.getItem('token');
      
      if (user?.id && token && setNotifications) {
        try {
          // Add cache-busting parameter to ensure we get fresh data
          const cacheBuster = `?t=${Date.now()}`;
          const notiResponse = await fetch(`/api/notifications/${user.id}${cacheBuster}`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Accept': 'application/json',
              'Cache-Control': 'no-cache'
            },
            credentials: 'include',
            cache: 'no-store'
          });
          
          if (notiResponse.ok) {
            const notiData = await notiResponse.json();
            if (Array.isArray(notiData)) {
              const parsed = notiData.map(n => ({
                form_id: n.data?.form_id,
                specific_form_id: n.data?.specific_form_id,
                form_doc_no: n.data?.form_doc_no,
                created_at: n.created_at,
                form_name: n.form_name || 'Unknown Form',
                status: n.status || 'pending',
                is_viewed: n.is_viewed !== undefined ? n.is_viewed : (n.data?.is_viewed !== undefined ? n.data.is_viewed : null),
                actor_name: n.actor_name ?? n.data?.actor_name ?? null,
                actor_role: n.actor_role ?? n.data?.actor_role ?? null,
                action: n.action ?? n.data?.action ?? null,
                data: n.data || {},
                notification_id: n.id || 
                                n.notification_id || 
                                `${n.data?.form_id || 'unknown'}-${n.data?.specific_form_id || 'unknown'}-${n.created_at || Date.now()}`,
              }));
              
              // Filter to only show unread notifications
              const unreadNotifications = parsed.filter(n => 
                n.is_viewed === false || n.is_viewed === null || n.is_viewed === undefined
              );
              
              // Update NotificationContext
              setNotifications(unreadNotifications);
              localStorage.setItem("notifications", JSON.stringify(unreadNotifications));
              
              console.log('[Dashboard] Notifications refreshed. Total:', parsed.length, 'Unread:', unreadNotifications.length);
            }
          }
        } catch (error) {
          console.warn('[Dashboard] Error refreshing notifications:', error);
        }
      }
      
      // Also update formCounts when bigDamageIssueCount changes
      // The bigDamageIssueCount will automatically update via useMemo when notifications change
      if (allForm.length > 0) {
        const bigDamageForm = allForm.find(form => form.name === "Big Damage Issue Form");
        if (bigDamageForm) {
          // Use a small delay to ensure notifications have been updated
          setTimeout(() => {
            setFormCounts(prev => {
              const newCount = Math.max(prev[bigDamageForm.id] || 0, bigDamageIssueCount);
              
              if (process.env.NODE_ENV !== 'production') {
                console.log('[Dashboard] Notification updated event - updating count:', {
                  formId: bigDamageForm.id,
                  previousCount: prev[bigDamageForm.id],
                  bigDamageIssueCount,
                  newCount
                });
              }
              
              return {
                ...prev,
                [bigDamageForm.id]: newCount
              };
            });
          }, 100);
        }
      }
    };

    window.addEventListener('notificationsUpdated', handleNotificationsUpdated);
    return () => {
      window.removeEventListener('notificationsUpdated', handleNotificationsUpdated);
    };
  }, [bigDamageIssueCount, allForm, setNotifications]);
  
    console.log("Forms>>" , allForm) ;
    const formIcons = {

        "Asset Transfer Form": "📂",
    "Office Use Form": "💼",
    "Asset Damage / Lost Form": "📋",
    "Purchase Request Form": "🛒",
    "Big Damage Issue Form": "📝",
    "Master Data Product Change Form": "📊",
    "Request Discount Form": "💯",
    "New Vendor Create Form": "🆕",
    "Monthly Rotate Form": "📆",
    "Supplier Agreement Form": "📜",
    "Member Issue Form": "🆔",
    "CCTV Request Form": "📹",
    "Stock Adjust Form": "⚙️",
    "Coupon Voucher": "📑",
    }
  const requests = allForm.map((form) => ({
    title:form?.name || '' ,
    icon : formIcons[form?.name] || "" ,
    route: form.route || '' ,
    count : 0 , 
  }))
  console.log("Request Data>>" , requests) ;
    if (loading) {
        return <div className="p-6 text-gray-600">Loading dashboard...</div>;
    }

    return (
        <div className="p-6">
            <div
                className="h-48 w-full bg-cover bg-center rounded-lg shadow-md mb-6"
                style={{ backgroundImage: `url(${dashboardPhoto})` }}
            ></div>

            <NavPath
                segments={[
                    { path: "/dashboard", label: "Home" },
                    { path: "/dashboard", label: "Dashboard" },
                ]}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {allForm.map((form, index) => {
          // Get count from formCounts (fetched from API)
          // Use form.id as the key (consistent with how we stored it)
          let count = formCounts[form.id] || 0;
          
          // For Big Damage Issue Form, use context count as primary source
          // Context count checks form_doc_no (BDI prefix) which is more reliable than form_id
          // Some Big Damage Issue forms may have form_id = 1 instead of 8, so API count may be wrong
          if (form.name === "Big Damage Issue Form") {
            const apiCount = count; // This comes from formCounts[form.id] which is set by API (checks form_id = 8)
            const contextCount = bigDamageIssueCount || 0;
            
            // CRITICAL: Context count is more reliable for Big Damage Issue because:
            // 1. It checks form_doc_no prefix (BDI/BDILAN) which is unique to Big Damage Issue
            // 2. Some Big Damage Issue forms may have form_id = 1 instead of 8
            // 3. API only checks form_id = 8, so it misses notifications with wrong form_id
            // Always use the higher count, but prioritize context if it's > 0
            if (contextCount > 0) {
              count = contextCount;
              console.log('[Dashboard] Using context count for Big Damage Issue Form (checks form_doc_no):', contextCount);
            } else if (apiCount > 0) {
              count = apiCount;
              console.log('[Dashboard] Using API count for Big Damage Issue Form (context returned 0):', apiCount);
            } else {
              count = 0;
              console.log('[Dashboard] No notifications found for Big Damage Issue Form (API: 0, Context: 0)');
            }
            
            // Debug logging for Big Damage Issue Form (always log to help diagnose)
            console.log('[Dashboard] Rendering Big Damage Issue Form card:', {
              formId: form.id,
              form_id: form.form_id,
              apiCount: apiCount,
              contextCount: contextCount,
              finalCount: count,
              willShowBadge: count > 0,
              notificationsLength: notifications?.length || 0,
              allFormCountsKeys: Object.keys(formCounts),
              formCountsObject: formCounts,
              hasNotifications: notifications && notifications.length > 0,
              sampleNotification: notifications?.[0],
              allNotificationFormNames: notifications ? [...new Set(notifications.map(n => n.form_name || n.data?.form_name).filter(Boolean))] : [],
              allNotificationFormIds: notifications ? [...new Set(notifications.map(n => n.form_id || n.data?.form_id).filter(Boolean))] : []
            });
          }
          const icon = formIcons[form.name] || "";
          const isActive =
            form.name === "CCTV Request Form" ||

            form.name === "Big Damage Issue Form" ||
            form.name === "Request Discount Form";


            form.name === "Big Damage Issue Form" ||

            form.name === "Request Discount Form";

          return (
            <Link
              key={index}
              to={`/${form.route?.toLowerCase().replace(/\s+/g, "-")}`}
              className={`relative m-2 border rounded-lg shadow-md p-4 flex items-center space-x-3 transition ${
                isActive
                  ? "bg-white border-blue-300 hover:shadow-lg cursor-pointer"
                  : "bg-gray-300 border-gray-300 opacity-70 cursor-not-allowed"
              }`}
            >
              {form.name === "Big Damage Issue Form" ? (
                <img 
                  src={BigDamageIsuueLogo} 
                  alt="Big Damage Issue" 
                  className="w-6 h-6 object-contain"
                />
              ) : (
              <span className="text-xl">{icon}</span>
              )}
              <span className="font-semibold">{form.name}</span>

             
              {count > 0 && (
                <span 
                  className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full animate-pulse z-10 min-w-[20px] text-center shadow-lg"
                  style={{ 
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    lineHeight: '1.2'
                  }}
                  title={`${count} unread notification${count > 1 ? 's' : ''}`}
                >
                  {count > 99 ? '99+' : count}
                </span>
              )}
              
              {/* Debug: Show badge even if count is 0 for Big Damage Issue Form (for testing) */}
              {form.name === "Big Damage Issue Form" && count === 0 && process.env.NODE_ENV !== 'production' && false && (
                <span 
                  className="absolute top-2 right-2 bg-gray-400 text-white text-xs font-bold px-2 py-1 rounded-full z-10 min-w-[20px] text-center shadow-lg"
                  style={{ 
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    lineHeight: '1.2'
                  }}
                  title="Debug: No notifications (count is 0)"
                >
                  0
                </span>
              )}
            </Link>
          );
        })}
              
            </div>
        </div>
    );
};

export default Dashboard;