
import React, { useEffect, useState, useContext, useMemo } from "react";
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
    
    // Calculate notification count from form list (same as Navbar)
    // This is the source of truth - counts forms based on status, not notifications API
    const [bigDamageIssueCount, setBigDamageIssueCount] = useState(0);
    
    // Fetch form list and count forms that need action based on user role (same logic as Navbar)
    useEffect(() => {
        const fetchFormBasedNotificationCount = async () => {
            if (!currentUser || !currentUser.id) {
                setBigDamageIssueCount(0);
                return;
            }
            
            const token = localStorage.getItem("token");
            if (!token) {
                setBigDamageIssueCount(0);
                return;
            }

            try {
                // Fetch form list with minimal data (just status and IDs) - same as Navbar
                const res = await fetch(`/api/big-damage-issues?per_page=1000&form_type=big_damage_issue`, {
                    headers: { 
                        'Authorization': `Bearer ${token}`,
                        'Accept': 'application/json',
                        'Content-Type': 'application/json',
                    },
                    credentials: 'include',
                });

                if (!res.ok) {
                    console.warn('[Dashboard] Failed to fetch form list for notification count');
                    return;
                }

                const data = await res.json();
                // Handle different response structures
                let formListData = null;
                if (data?.data && Array.isArray(data.data)) {
                    formListData = data.data;
                } else if (Array.isArray(data)) {
                    formListData = data;
                } else if (data?.data?.data && Array.isArray(data.data.data)) {
                    formListData = data.data.data;
                }

                if (!formListData || !Array.isArray(formListData)) {
                    console.warn('[Dashboard] Invalid form list data structure:', { data });
                    return;
                }

                // Debug: show parsed form list and first entries
                // eslint-disable-next-line no-console
                console.log('[Dashboard] parsed formListData length:', formListData.length, 'sample:', formListData.slice(0,5));

                // Role ID to Name mapping (same as Navbar)
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

                // Helper function to extract user_type and role from user object (same as Navbar)
                const extractUserRoleInfo = (userObj) => {
                    if (!userObj) return { userType: '', userRole: '' };
                    
                    const normalizeText = (text) => (text || '').toString().toLowerCase().trim().replace(/\s+/g, ' ');
                    
                    // First, try to get user_type and role directly
                    let userType = normalizeText(userObj.user_type || userObj.userType || '');
                    let userRole = normalizeText(userObj.role || userObj.role_name || userObj.roleName || '');
                    
                    // If we have role_id but no role name, map it
                    if (!userRole && userObj.role_id && roleIdToNameMap[userObj.role_id]) {
                        userRole = normalizeText(roleIdToNameMap[userObj.role_id]);
                    }
                    
                    // If we have role name but no user_type, infer user_type from role
                    if (!userType && userRole) {
                        // Checker role -> user_type C or CS
                        if (userRole === 'checker' || userRole.includes('checker')) {
                            userType = 'c';
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
                    
                    return { userType, userRole };
                };

                // Helper function to check if form should be counted (same as Navbar)
                const shouldCountForm = (formStatus, userObj) => {
                    if (!formStatus) return false;
                    
                    const { userType, userRole } = extractUserRoleInfo(userObj);
                    const normalizeText = (text) => (text || '').toString().toLowerCase().trim();
                    const status = normalizeText(formStatus);
                    
                    // Checker (C/CS) - count "Ongoing" forms
                    if (['c', 'cs'].includes(userType)) {
                        return status === 'ongoing';
                    }
                    
                    // Branch Manager (A1/BM) - count "Checked" forms (not BM Approved)
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
                    
                    // Branch Account (AC) - count "BM Approved", "OP Approved", and "Acknowledged" forms
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
                    
                    // Operation Manager (A2) - count BM Approved only when total_amount > 500k,
                    // and also count OP approved / Acknowledged statuses.
                    const isOpManager = userType === 'a2' || userRole.includes('operation manager') || userRole.includes('op manager');
                    if (isOpManager) {
                        // At this stage we only have status. The caller loop provides the gf/row so
                        // the check for BM Approved + total > 500k is done at call site.
                        // Here, count OP-approved / acknowledged statuses as relevant.
                        if (status === 'opapproved' || status === 'op approved' || status === 'ac_acknowledged' || status === 'acknowledged') {
                            return true;
                        }
                        return false;
                    }
                    
                    return false;
                };
                
                // Count forms based on status and user role (same logic as Navbar)
                let count = 0;
                formListData.forEach(row => {
                    const gf = row?.general_form || row;
                    const status = gf?.status || row?.status;
                    
                    if (!status) return;
                    
                    // Check branch match if user has a branch
                    if (currentUser.from_branch_id) {
                        const formBranchId = gf?.from_branch_id || row?.from_branch_id;
                        if (formBranchId && formBranchId !== currentUser.from_branch_id) {
                            return;
                        }
                    }
                    
                    if (shouldCountForm(status, currentUser)) {
                        count++;
                    } else {
                        // Additional check for Operation Manager (A2): BM Approved forms count only when total_amount > 500k
                        const { userType: curUserType, userRole: curUserRole } = extractUserRoleInfo(currentUser);
                        const isOp = curUserType === 'a2' || curUserRole.includes('operation manager') || curUserRole.includes('op manager');
                        if (isOp) {
                            const isBMApprovedStatus = status === 'bm approved' || status === 'bmapproved' || status.includes('bm approved') || status.includes('bmapproved');
                            const total = parseFloat((gf && (gf.total_amount || gf.total)) || 0) || 0;
                            if (isBMApprovedStatus && total > 500000) {
                                // Debug: log which GF contributed to OP count
                                // eslint-disable-next-line no-console
                                console.log('[Dashboard][OP Count] counting GF for OP:', { gfId: gf?.id, formDocNo: gf?.form_doc_no, total, status });
                                count++;
                            }
                        }
                    }
                });
                
                // Debug: computed count for Big Damage Issue based on form list
                // eslint-disable-next-line no-console
                console.log('[Dashboard] computed bigDamageIssue count from formListData:', { computedCount: count });

                setBigDamageIssueCount(count);
                
                // console.log('[Dashboard] Form-based notification count calculated:', {
                //     count,
                //     totalForms: formListData.length,
                //     userType: extractUserRoleInfo(currentUser).userType,
                //     userRole: extractUserRoleInfo(currentUser).userRole
                // });
            } catch (err) {
                console.error('[Dashboard] Error fetching form-based notification count:', err);
                setBigDamageIssueCount(0);
            }
        };
        
        fetchFormBasedNotificationCount();
        
        // Refresh count when notifications are updated
        const handleNotificationsUpdated = () => {
            fetchFormBasedNotificationCount();
        };
        
        window.addEventListener('notificationsUpdated', handleNotificationsUpdated);
        return () => {
            window.removeEventListener('notificationsUpdated', handleNotificationsUpdated);
        };
    }, [currentUser]);
    
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
                  // console.log('[Dashboard] Trying form.form_id for Big Damage Issue Form:', form.form_id);
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
                // console.log('[Dashboard] Big Damage Issue Form - API response details:', {
                //   formId: form.id,
                //   form_id: form.form_id,
                //   formIdentifier: formIdentifier,
                //   rawApiCount: apiCount,
                //   apiCountType: typeof apiCount,
                //   parsedCount: finalCount,
                //   storedInCounts: counts[form.id],
                //   contextCount: bigDamageIssueCount,
                //   fullFormObject: form,
                //   apiUrl: `/api/count_notis/${formIdentifier}`,
                //   willUseApiCount: finalCount > 0
                // });
                
                // IMPORTANT: Always trust the API count for Big Damage Issue Form
                // The API queries the database directly and is more reliable than context
                // Context might not have loaded Big Damage Issue notifications yet
                if (finalCount > 0) {
                  // console.log('[Dashboard] Big Damage Issue Form has notifications from API:', finalCount);
                } else {
                  // console.log('[Dashboard] Big Damage Issue Form API returned 0 - no notifications');
                }
              }
              
              // Debug logging for Big Damage Issue Form and Asset Damage / Lost Form
              if (form.name === "Big Damage Issue Form" || form.name === "Asset Damage / Lost Form") {
                // console.log(`[Dashboard] ${form.name} count from API:`, {
                //   formId: form.id,
                //   form_id: form.form_id,
                //   formIdentifier: formIdentifier,
                //   formName: form.name,
                //   apiCount: apiCount,
                //   apiCountType: typeof apiCount,
                //   apiCountValue: apiCount,
                //   contextCount: form.name === "Big Damage Issue Form" ? bigDamageIssueCount : 'N/A',
                //   storedInCounts: counts[form.id],
                //   fullFormObject: form,
                //   apiResponse: apiCount // Show raw response
                // });
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
        // console.log('[Dashboard] All form counts after API fetch:', counts);
        // console.log('[Dashboard] Big Damage Issue context count:', bigDamageIssueCount);
        
        // Log specifically for Big Damage Issue Form
        const bigDamageForm = formsData.find(f => f.name === "Big Damage Issue Form");
        if (bigDamageForm) {
          // console.log('[Dashboard] Big Damage Issue Form final API count:', {
          //   formId: bigDamageForm.id,
          //   form_id: bigDamageForm.form_id,
          //   apiCount: counts[bigDamageForm.id],
          //   contextCount: bigDamageIssueCount,
          //   willUseApiCount: counts[bigDamageForm.id] > 0
          // });
        }

        // Debug: all form counts after fetching from API
        // eslint-disable-next-line no-console
        console.log('[Dashboard] setFormCounts - counts from API:', counts);
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
            // console.log('[Dashboard] Updating Big Damage Issue count:', {
            //   formId: bigDamageForm.id,
            //   currentCount,
            //   bigDamageIssueCount,
            //   newCount,
            //   willUpdate: newCount !== currentCount
            // });
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
      // console.log('[Dashboard] notificationsUpdated event received', event?.detail);
      
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
              
              // console.log('[Dashboard] Notifications refreshed. Total:', parsed.length, 'Unread:', unreadNotifications.length);
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
                // console.log('[Dashboard] Notification updated event - updating count:', {
                //   formId: bigDamageForm.id,
                //   previousCount: prev[bigDamageForm.id],
                //   bigDamageIssueCount,
                //   newCount
                // });
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
  
    // console.log("Forms>>" , allForm) ;
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
    "M And E Form": "⚙️",
  };
  const requests = allForm.map((form) => ({
    title: form?.name || "",
    icon: formIcons[form?.name] || "",
    route: form.route || "",
    count: 0,
  }));
  // console.log("Request Data>>", requests);
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
          
          // For Big Damage Issue Form, ALWAYS use form-based count (bigDamageIssueCount)
          // This ensures we ONLY show Big Damage Issue Form notifications, not all notifications
          // The form-based count is calculated from the form list API and filters by status and role
          if (form.name === "Big Damage Issue Form") {
            // ALWAYS use bigDamageIssueCount - this is the source of truth for Big Damage Issue Form
            // It counts forms from /api/big-damage-issues that match the user's role and status
            // This ensures we ONLY show Big Damage Issue Form count, not all notifications
            count = bigDamageIssueCount || 0;
            
            // console.log('[Dashboard] Big Damage Issue Form card count:', {
            //   formId: form.id,
            //   form_id: form.form_id,
            //   bigDamageIssueCount: bigDamageIssueCount,
            //   finalCount: count,
            //   willShowBadge: count > 0
            // });
          }
          const icon = formIcons[form.name] || "";
          const isActive =
            form.name === "CCTV Request Form" ||
            form.name === "Big Damage Issue Form" ||
            form.name === "Request Discount Form" || 
            form.name === "M And E Form";

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
