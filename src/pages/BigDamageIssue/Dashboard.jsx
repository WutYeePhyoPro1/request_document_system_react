import { useEffect, useMemo, useRef, useState } from "react";
import useSWR from 'swr';
import useSWRImmutable from 'swr/immutable';
import { Link, useSearchParams, useLocation } from "react-router-dom";
import { PlusCircleIcon, FunnelIcon, PlusIcon } from '@heroicons/react/24/solid';
// import { PlusSquareIcon } from '@heroicons/react/24/outline';
import FilterCard from "./FilterCard";
import DamageIssueList from "./DamageIssueList";
import BigDamageIsuueLogo from "../../assets/images/big-dmg-issue-logo.png";
import { filterFormsByRole, getDefaultStatusFilter } from "../../utils/roleBasedFilter";
import { useContext } from 'react';
import { NotificationContext } from '../../context/NotificationContext';

const Dashboard = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  
  // Initialize currentPage from URL or default to 1
  const currentPage = useMemo(() => {
    const pageParam = searchParams.get('page');
    const page = pageParam ? parseInt(pageParam, 10) : 1;
    const finalPage = isNaN(page) || page < 1 ? 1 : page;
    return finalPage;
  }, [searchParams]);

  // Initialize filters from URL params to preserve state when navigating back
  const initializeFiltersFromUrl = useMemo(() => {
    const productName = searchParams.get('search') || '';
    const formDocNo = searchParams.get('form_doc_no') || '';
    const fromDate = searchParams.get('start_date') || '';
    const toDate = searchParams.get('end_date') || '';
    const statusParam = searchParams.get('status');
    const branchParam = searchParams.get('branch');
    
    // Parse status - now a simple string
    let status = statusParam || "";
    
    // Parse branch - will be set after branchOptions are loaded
    let branch = null;
    if (branchParam) {
      branch = { value: branchParam, label: branchParam }; // Label will be updated when branchOptions load
    }
    
    return {
      productName,
      formDocNo,
      fromDate,
      toDate,
      status,
      branch,
    };
  }, [searchParams]);

  const [filters, setFilters] = useState(initializeFiltersFromUrl);
  const perPage = 15;
  const [branchOptions, setBranchOptions] = useState([{ value: '', label: 'All Branch' }]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const filterRef = useRef(null);
  const filtersInitializedRef = useRef(false);

  const token = useMemo(() => localStorage.getItem("token"), []);
  const listAbortRef = useRef(null);
  const lastQueryRef = useRef('');
  const isFilteringRef = useRef(false);
  const filterTimeoutRef = useRef(null);

  const buildQuery = () => {
    const params = new URLSearchParams();
    // Request a very large page size (1000) to get all data for client-side pagination
    // This ensures consistent page sizes after deduplication and filtering
    // The backend returns product items, but we deduplicate by form_id, so we need enough data
    params.set("per_page", "1000");
    
    // Always filter for Big Damage Issues by default (form_id: 8)
    params.set("form_type", "big_damage_issue");
    // Request total amount in response
    params.set("include_total", "true");
    
    // Add other filters
    // NOTE: Do NOT send product filter to backend when doing client-side filtering
    // We fetch all data and filter client-side to ensure we get all products per form
    // if (filters.productName) {
    //   // Send to multiple backend fields to ensure search works
    //   params.set("search", filters.productName);
    //   params.set("product_name", filters.productName);
    //   params.set("product_code", filters.productName);
    // }
    if (filters.formDocNo) {
      params.set("form_doc_no", filters.formDocNo);
      params.set("doc_no", filters.formDocNo); // fallback key some APIs use
      params.set("document_no", filters.formDocNo); // additional fallback
    }
    // Handle status as string
    if (filters.status && filters.status.trim()) {
      params.set("status", filters.status.trim());
    }
    if (filters.branch?.value) params.set("branch", filters.branch.value);
    // Only send date filters if they have actual values (not empty strings)
    if (filters.fromDate && filters.fromDate.trim() !== "") {
      params.set("start_date", filters.fromDate);
      params.set("from_date", filters.fromDate); // fallback key
    }
    if (filters.toDate && filters.toDate.trim() !== "") {
      params.set("end_date", filters.toDate);
      params.set("to_date", filters.toDate); // fallback key
    }
    
    // Don't send page parameter - we'll fetch all data and do client-side pagination
    // This ensures consistent page sizes after deduplication
    // params.set("page", currentPage); // Removed for client-side pagination
    
    return params.toString();
  };

 const query = useMemo(() => buildQuery(), [filters, currentPage]);

  const fetcher = async (url) => {
    const res = await fetch(url, {
      headers: { 
        'Authorization': `Bearer ${token}`, 
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
      },
      credentials: 'include'
    });
    
    if (!res.ok) {
      // Handle 429 Too Many Requests with user-friendly error
      if (res.status === 429) {
        const error = new Error('Too many requests. Please wait a moment and try again.');
        error.status = 429;
        error.userMessage = 'The server is receiving too many requests. Please wait a few seconds and the page will refresh automatically.';
        throw error;
      }
      
      const error = new Error(`HTTP ${res.status}`);
      error.status = res.status;
      throw error;
    }
    
    const data = await res.json();
    return data;
  };

  // Track 429 errors to disable auto-refresh temporarily
  const [has429Error, setHas429Error] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  // List with SWR - optimized for performance
  const { data: listPayload, isLoading: listLoading, error: listError, mutate } = useSWR(
    token ? [`/api/big-damage-issues?${query}`] : null, // Query already includes page parameter
    ([url]) => fetcher(url),
    { 
      revalidateOnFocus: false,  // Disable revalidation on focus to reduce requests
      revalidateOnReconnect: false,  // Disable auto-reconnect to reduce requests
      revalidateOnMount: true,  // Only revalidate on mount
      dedupingInterval: 30000,  // Increase deduping to 30 seconds to prevent duplicate requests
      refreshInterval: 0,  // Disable auto-refresh to reduce server load
      keepPreviousData: true,  // Keep old data when refreshing
      revalidateIfStale: false,  // Disable automatic revalidation of stale data
      onError: (error) => {
        if (error.status === 429) {
          setHas429Error(true);
          setErrorMessage(error.userMessage || 'Too many requests. Please wait a moment.');
          // Auto-reset after 30 seconds
          setTimeout(() => {
            setHas429Error(false);
            setErrorMessage(null);
            mutate(); // Retry the request
          }, 30000);
        } else {
          setErrorMessage(error.message || 'Failed to load data. Please try again.');
        }
      },
      onSuccess: () => {
        // Clear error state on successful fetch
        if (has429Error) {
          setHas429Error(false);
          setErrorMessage(null);
        }
      }
    }
  );

  // Branches load once and cache
  const { data: branchesPayload } = useSWRImmutable(
    token ? ['/api/branches'] : null,
    ([url]) => fetcher(url)
  );

  // Get notifications from context
  const { notifications } = useContext(NotificationContext);
  
  // Get current user from localStorage
  // This should match the user structure from AuthContext
  const currentUser = useMemo(() => {
    try {
      const userStr = localStorage.getItem('user');
      if (!userStr) {
        console.warn('[Dashboard] No user found in localStorage');
        return null;
      }
      const user = JSON.parse(userStr);
      console.log('[Dashboard] Current user loaded:', {
        id: user?.id,
        role: user?.role,
        user_type: user?.user_type,
        from_branch_id: user?.from_branch_id,
        fullUser: user
      });
      return user;
    } catch (e) {
      console.error('[Dashboard] Error parsing user from localStorage:', e);
      return null;
    }
  }, []);

  // Get notification form IDs for Big Damage Issues
  const bigDamageNotificationIds = useMemo(() => {
    if (!currentUser) return [];
    
    
    // First, get all unique form IDs from notifications that match Big Damage Issue Form
    const notificationFormIds = new Set();
    
    notifications.forEach(noti => {
      // Only include notifications with exact form_name 'Big Damage Issue Form'
      // If from_branch_id is undefined, include it (for backward compatibility)
      const matchesForm = noti.form_name === 'Big Damage Issue Form';
      const matchesBranch = !noti.from_branch_id || noti.from_branch_id === currentUser.from_branch_id;
      
      if (matchesForm && matchesBranch) {
        notificationFormIds.add(String(noti.specific_form_id));
      }
    });
    
    const ids = Array.from(notificationFormIds);
    
    
    return ids;
  }, [notifications, currentUser]);

  // Create a map of notification counts per form (by general_form_id)
  // Helper function to check if notification should be shown based on user role and form status
  // Logic: Show notifications until form moves to next status
  // - Checker: Show "Ongoing" until it becomes "Checked" or beyond
  // - Branch Manager: Show "Checked" until it becomes "BM Approved" or beyond
  // - Branch Account: Show "BM Approved" and "Acknowledged" until it becomes "Completed" or beyond
  const shouldShowNotificationForRole = (user, formStatus) => {
    if (!user || !formStatus) {
      console.warn('[Dashboard] shouldShowNotificationForRole: Missing user or status', { user, formStatus });
      return false;
    }
    
    const normalizeText = (text) => (text || '').toString().toLowerCase().trim();
    const userType = normalizeText(user.user_type || '');
    const userRole = normalizeText(user.role || '');
    const status = normalizeText(formStatus);
    
    console.log('[Dashboard] shouldShowNotificationForRole check:', {
      userType,
      userRole,
      status,
      originalStatus: formStatus,
      userObject: user
    });
    
    // Checker (C/CS) - show notifications for "Ongoing" forms only
    // Hide when status changes to "Checked" or beyond
    if (['c', 'cs'].includes(userType)) {
      return status === 'ongoing';
    }
    
    // Approver/BM (A1) - show notifications for "Checked" forms only
    // Hide when status changes to "BM Approved" or beyond
    // Check both user_type (A1) and role name (bm, abm, approver)
    const isBM = userType === 'a1' || 
                 userRole === 'bm' || 
                 userRole === 'abm' || 
                 userRole === 'approver' ||
                 userRole.includes('approver') ||
                 userRole.includes('branch manager');
    
    if (isBM) {
      // BM should ONLY see "Checked" forms
      // Hide if status is "BM Approved", "OP Approved", "Acknowledged", "Completed", etc.
      return status === 'checked';
    }
    
    // Operation Manager (A2) - show notifications for "BM Approved" forms only
    if (userType === 'a2') {
      return status === 'bm approved' || status === 'bmapproved';
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
      if (status === 'ongoing' || status === 'checked') {
        return false;
      }
      // Hide completed statuses
      if (status === 'completed' || status === 'issued' || status === 'supervisorissued') {
        return false;
      }
      // Show only "BM Approved", "OP Approved", and "Acknowledged"
      return status === 'bm approved' || 
             status === 'bmapproved' || 
             status === 'op approved' ||
             status === 'opapproved' ||
             status === 'ac_acknowledged' || 
             status === 'acknowledged';
    }
    
    // For other roles, don't show notifications
    return false;
  };

  // Use a ref to store the previous count to prevent flickering during filter changes
  const notificationCountsByFormRef = useRef(new Map());
  
  // Count forms directly from the form list based on status and user role
  // This is the source of truth - no dependency on notifications API
  const notificationCountsByForm = useMemo(() => {
    // Don't update notification counts while filtering to prevent glitches
    if (isFilteringRef.current) {
      return notificationCountsByFormRef.current;
    }
    
    if (!listPayload) {
      return new Map();
    }
    
    // If currentUser is not loaded yet, try to get it from localStorage directly
    let user = currentUser;
    if (!user) {
      try {
        const userStr = localStorage.getItem('user');
        if (userStr) {
          user = JSON.parse(userStr);
          console.log('[Dashboard] Loaded user from localStorage for notification counting:', {
            role: user?.role,
            user_type: user?.user_type
          });
        }
      } catch (e) {
        console.error('[Dashboard] Error loading user from localStorage:', e);
      }
    }
    
    if (!user) {
      console.warn('[Dashboard] No user available for notification counting');
      return new Map();
    }
    
    const counts = new Map();
    
    // Try multiple possible structures for listPayload
    let formListData = null;
    if (listPayload?.data && Array.isArray(listPayload.data)) {
      formListData = listPayload.data;
    } else if (Array.isArray(listPayload)) {
      formListData = listPayload;
    } else if (listPayload?.data?.data && Array.isArray(listPayload.data.data)) {
      formListData = listPayload.data.data;
    }
    
    if (!formListData || !Array.isArray(formListData) || formListData.length === 0) {
      console.warn('[Dashboard] No form list data available for notification counting');
      return new Map();
    }
    
    // Count forms based on status and user role
    // Logic:
    // - Checker: Count "Ongoing" forms
    // - Branch Manager: Count "Checked" forms
    // - Branch Account: Count "BM Approved" and "Acknowledged" forms
    let matchedCount = 0;
    let checkedForms = [];
    let ongoingForms = [];
    
    formListData.forEach(row => {
      const gf = row?.general_form || row;
      const status = gf?.status || row?.status;
      
      if (!status) return;
      
      // Track statuses for debugging
      const normalizedStatus = (status || '').toString().toLowerCase().trim();
      if (normalizedStatus === 'checked') {
        checkedForms.push({
          formId: row?.general_form_id || gf?.general_form_id || gf?.id || row?.id,
          formDocNo: gf?.form_doc_no || row?.form_doc_no
        });
      }
      if (normalizedStatus === 'ongoing') {
        ongoingForms.push({
          formId: row?.general_form_id || gf?.general_form_id || gf?.id || row?.id,
          formDocNo: gf?.form_doc_no || row?.form_doc_no
        });
      }
      
      // Check if this form should be counted for the current user's role
      if (shouldShowNotificationForRole(user, status)) {
        // Get form ID - try multiple possible fields
        // IMPORTANT: Store with ALL possible ID variations to ensure matching works
        const generalFormId = row?.general_form_id || gf?.general_form_id;
        const gfId = gf?.id;
        const rowId = row?.id;
        
        // Store count with all possible ID keys to ensure we can match it later
        if (generalFormId) {
          counts.set(String(generalFormId), 1);
          matchedCount++;
        }
        if (gfId && String(gfId) !== String(generalFormId)) {
          counts.set(String(gfId), 1);
        }
        if (rowId && String(rowId) !== String(generalFormId) && String(rowId) !== String(gfId)) {
          counts.set(String(rowId), 1);
        }
        
        // Also store a combined key for extra matching
        if (generalFormId || gfId || rowId) {
          const primaryId = generalFormId || gfId || rowId;
          if (primaryId) {
            counts.set(String(primaryId), 1);
          }
        }
      }
    });
    
    // Update the ref with the new counts
    notificationCountsByFormRef.current = counts;
    
    // Debug logging - always log to help diagnose
    // Show status distribution to understand what statuses exist
    const statusDistribution = {};
    formListData.forEach(row => {
      const gf = row?.general_form || row;
      const status = gf?.status || row?.status;
      if (status) {
        statusDistribution[status] = (statusDistribution[status] || 0) + 1;
      }
    });
    
    // Check user role detection
    const normalizeText = (text) => (text || '').toString().toLowerCase().trim();
    const userType = normalizeText(user?.user_type || '');
    const userRole = normalizeText(user?.role || '');
    const isBM = userType === 'a1' || 
                 userRole === 'bm' || 
                 userRole === 'abm' || 
                 userRole === 'approver' ||
                 userRole.includes('approver') ||
                 userRole.includes('branch manager');
    
    console.log('[Dashboard] Notification counts by form (from form list):', {
      totalForms: formListData.length,
      matchedForms: matchedCount,
      countsMapSize: counts.size,
      countsMap: Array.from(counts.entries()).slice(0, 10), // First 10 entries
      currentUserRole: user?.role,
      currentUserType: user?.user_type,
      userTypeNormalized: userType,
      userRoleNormalized: userRole,
      isBM: isBM,
      userObject: { role: user?.role, user_type: user?.user_type, id: user?.id },
      isFiltering: isFilteringRef.current,
      statusDistribution, // Show how many forms have each status
      checkedFormsCount: checkedForms.length,
      checkedForms: checkedForms.slice(0, 5), // First 5 checked forms
      ongoingFormsCount: ongoingForms.length,
      sampleForms: formListData.slice(0, 5).map(row => {
        const gf = row?.general_form || row;
        const status = gf?.status || row?.status;
        const formId = row?.general_form_id || gf?.general_form_id || gf?.id || row?.id;
        const normalizedStatus = (status || '').toString().toLowerCase().trim();
        const shouldShow = shouldShowNotificationForRole(user, status);
        return {
          formId,
          status,
          normalizedStatus,
          formDocNo: gf?.form_doc_no || row?.form_doc_no,
          shouldShow,
          inCountsMap: counts.has(String(formId)),
          // Show why it should or shouldn't show
          reason: normalizedStatus === 'checked' && isBM ? 'BM should see Checked' : 
                  normalizedStatus === 'ongoing' && ['c', 'cs'].includes(userType) ? 'Checker should see Ongoing' :
                  'Not matching criteria'
        };
      })
    });
    
    return counts;
  }, [currentUser, listPayload]);

  // Calculate total notification count from form list (not from notifications API)
  // This is the count that should appear in the notification bell
  const totalNotificationCount = useMemo(() => {
    return notificationCountsByForm.size;
  }, [notificationCountsByForm]);
  
  // Check if there are any unread notifications (for backward compatibility)
  const hasUnreadNotifications = totalNotificationCount > 0;

  const listData = useMemo(() => {
    try {
      // Don't process data if still loading - prevents glitches when filters change
      if (listLoading || !listPayload) {
        return { rows: [], meta: { current_page: currentPage, per_page: perPage, total: 0 } };
      }
      
      // Get current user from localStorage
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      
      // Handle different response formats
      let allRows = [];
      let meta = {
        current_page: currentPage,
        per_page: perPage,
        total: 0,
        last_page: 1
      };
      
      // Case 1: Laravel pagination format (preferred)
      if (listPayload.data && Array.isArray(listPayload.data)) {
        allRows = listPayload.data;
        meta = {
          current_page: listPayload.current_page || currentPage,
          per_page: listPayload.per_page || perPage,
          total: listPayload.total || 0,
          last_page: listPayload.last_page || 1,
        };
        
        // Apply role-based filtering first (before deduplication)
        const filteredRows = filterFormsByRole(allRows, user);
        allRows = filteredRows;
        
        // IMPORTANT: Do NOT deduplicate here when product filter is active
        // DamageIssueList needs all product rows to properly filter by product name/code
        // Deduplication will happen in DamageIssueList after product filtering
        const productFilterFromUrl = searchParams.get('search') || searchParams.get('product_name') || searchParams.get('product_code') || '';
        const hasProductFilter = productFilterFromUrl.trim() !== '' || (filters.productName && filters.productName.trim() !== '');
        
        if (!hasProductFilter) {
          // Only deduplicate when there's no product filter
          // This prevents duplicate forms from showing, but allows product filtering to work
          const seenIds = new Set();
          allRows = allRows.filter((row) => {
            const formId = row?.general_form?.id || row?.id;
            if (!formId) return true;
            
            if (seenIds.has(formId)) {
              console.warn('[Dashboard] Duplicate form detected and removed:', {
                formId,
                form_doc_no: row?.general_form?.form_doc_no,
                row_id: row?.id
              });
              return false;
            }
            
            seenIds.add(formId);
            return true;
          });
        }
        
        // Client-side pagination: Always return exactly perPage items (or less on last page)
        // This ensures consistent page sizes after deduplication and filtering
        // We fetch 1000 items from backend to have enough data for multiple pages
        // When product filter is active, we pass all rows to DamageIssueList for proper filtering
        if (hasProductFilter) {
          // Pass all rows to DamageIssueList - it will handle filtering and deduplication
          return {
            rows: allRows, // Pass all rows, let DamageIssueList handle filtering
            meta: {
              ...meta,
              current_page: currentPage,
              per_page: perPage,
              total: meta.total || allRows.length,
              last_page: meta.last_page || 1,
            },
            hasUnreadNotifications: hasUnreadNotifications
          };
        } else {
          // No product filter - do normal pagination
          const startIndex = (currentPage - 1) * perPage;
          const paginatedRows = allRows.slice(startIndex, startIndex + perPage);
          
          // Calculate total pages based on actual filtered data
          const filteredTotal = allRows.length;
          const actualLastPage = Math.ceil(filteredTotal / perPage) || 1;
          
          return {
            rows: paginatedRows,
            meta: {
              ...meta,
              current_page: currentPage,
              per_page: perPage,
              total: filteredTotal,
              last_page: actualLastPage,
            },
            hasUnreadNotifications: hasUnreadNotifications
          };
        }
      }
      
      // Case 2: Direct array response (fallback)
      if (Array.isArray(listPayload)) {
        allRows = listPayload;
        meta = {
          current_page: 1,
          per_page: perPage,
          total: allRows.length,
          last_page: Math.ceil(allRows.length / perPage) || 1,
        };
      }
      // Case 3: Object with items array (alternative format)
      else if (listPayload.items && Array.isArray(listPayload.items)) {
        allRows = listPayload.items;
        meta = {
          current_page: listPayload.current_page || currentPage,
          per_page: listPayload.per_page || perPage,
          total: listPayload.total || allRows.length,
          last_page: listPayload.last_page || 1,
        };
      }
      // Case 4: Try to find data in other common locations
      else {
        console.warn('[Dashboard] Unexpected data structure:', {
          listPayload,
          hasData: !!listPayload.data,
          hasItems: !!listPayload.items,
          isArray: Array.isArray(listPayload),
          keys: Object.keys(listPayload || {})
        });
        
        // Try to extract data from common alternative structures
        if (listPayload.results && Array.isArray(listPayload.results)) {
          allRows = listPayload.results;
        } else if (listPayload.records && Array.isArray(listPayload.records)) {
          allRows = listPayload.records;
        }
      }
      
      // CRITICAL: Remove duplicates from all data sources (prevent display errors)
      const seenFormIds = new Set();
      allRows = allRows.filter((row) => {
        const formId = row?.general_form?.id || row?.id;
        if (!formId) return true; // Keep rows without ID
        
        if (seenFormIds.has(formId)) {
          console.warn('[Dashboard] Duplicate form detected and removed:', {
            formId,
            form_doc_no: row?.general_form?.form_doc_no,
            row_id: row?.id
          });
          return false; // Remove duplicate
        }
        
        seenFormIds.add(formId);
        return true; // Keep unique form
      });
      
      // Apply role-based filtering
      allRows = filterFormsByRole(allRows, user);
      
      // For non-paginated responses, we need to paginate client-side
      const startIndex = (currentPage - 1) * perPage;
      const paginatedRows = allRows.slice(startIndex, startIndex + perPage);
      
      return {
        rows: paginatedRows,
        meta: {
          ...meta,
          current_page: currentPage,
          per_page: perPage,
          total: meta.total || allRows.length,
          last_page: meta.last_page || Math.ceil((meta.total || allRows.length) / perPage) || 1,
        },
        hasUnreadNotifications
      };
      
    } catch (error) {
      console.error('[Dashboard] Error processing list data:', error, {
        listPayload,
        errorMessage: error.message,
        errorStack: error.stack
      });
      return { 
        rows: [], 
        meta: { 
          current_page: currentPage, 
          per_page: perPage, 
          total: 0,
          last_page: 1
        } 
      };
    }
  }, [listPayload, currentPage, perPage, bigDamageNotificationIds, hasUnreadNotifications, searchParams, filters, listLoading]);
  
  // Debug logging for listData
  useEffect(() => {
    console.log('[Dashboard] listData updated:', {
      rowsCount: listData.rows.length,
      total: listData.meta.total,
      currentPage: listData.meta.current_page,
      hasProductFilter: !!(filters.productName && filters.productName.trim()),
      productFilter: filters.productName,
      urlSearch: searchParams.get('search')
    });
    if (listData.rows.length > 0) {
      console.log('[Dashboard] Sample row:', {
        keys: Object.keys(listData.rows[0] || {}),
        hasProductCode: !!listData.rows[0]?.product_code,
        hasProductName: !!listData.rows[0]?.product_name,
        productCode: listData.rows[0]?.product_code,
        productName: listData.rows[0]?.product_name,
        fullRow: listData.rows[0]
      });
    } else {
      console.warn('[Dashboard] No rows in listData!', {
        listPayload: listPayload?.data?.length || 0,
        hasProductFilter: !!(filters.productName && filters.productName.trim())
      });
    }
  }, [listData, filters.productName, searchParams]);

  const branchList = useMemo(() => {
    const json = branchesPayload || {};
    return Array.isArray(json)
      ? json
      : Array.isArray(json?.data)
        ? json.data
        : Array.isArray(json?.data?.data)
          ? json.data.data
          : [];
  }, [branchesPayload]);

  const branchMap = useMemo(() => {
    const map = {};
    branchList.forEach(b => { if (b?.id) map[b.id] = b.branch_name; });
    return map;
  }, [branchList]);

  useEffect(() => {
    // Filter branches based on user (matching Laravel blade logic)
    // Special users (emp_id in ['000-000046', '000-000024', '000-000067']) see all branches
    // Other users only see branches from their user_branches
    let filteredBranches = branchList;
    
    if (currentUser?.emp_id && !['000-000046', '000-000024', '000-000067'].includes(currentUser.emp_id)) {
      // User is not in special list - filter by user_branches
      // Check multiple possible structures for user_branches
      const userBranches = currentUser.user_branches || currentUser.userBranches || [];
      
      if (Array.isArray(userBranches) && userBranches.length > 0) {
        // Extract branch IDs from user_branches - handle different structures
        const userBranchIds = userBranches.map(ub => {
          // Handle different possible structures: {branch_id: X}, {id: X}, or just X
          return ub?.branch_id || ub?.id || ub;
        }).filter(Boolean);
        
        if (userBranchIds.length > 0) {
          filteredBranches = branchList.filter(b => userBranchIds.includes(b.id));
        } else if (currentUser.from_branch_id) {
          // Fallback to single branch if user_branches array is empty but has from_branch_id
          filteredBranches = branchList.filter(b => b.id === currentUser.from_branch_id);
        } else {
          // If no valid branch IDs, show no branches (empty list)
          filteredBranches = [];
        }
      } else if (currentUser.from_branch_id) {
        // Fallback to single branch if no user_branches
        filteredBranches = branchList.filter(b => b.id === currentUser.from_branch_id);
      } else {
        // If no user_branches and no from_branch_id, show no branches (empty list)
        filteredBranches = [];
      }
      
      // Debug logging
      if (process.env.NODE_ENV !== 'production') {
        console.log('[Dashboard] Branch filtering:', {
          emp_id: currentUser.emp_id,
          hasUserBranches: Array.isArray(userBranches) && userBranches.length > 0,
          userBranchesCount: Array.isArray(userBranches) ? userBranches.length : 0,
          from_branch_id: currentUser.from_branch_id,
          filteredBranchesCount: filteredBranches.length,
          allBranchesCount: branchList.length
        });
      }
    }
    // If user is in special list or has no restrictions, show all branches (filteredBranches = branchList)
    
    const opts = [{ value: '', label: 'All Branch' }, ...filteredBranches.map(b => ({ value: b.id, label: b.branch_name }))];
    setBranchOptions(opts);
    
    // Initialize filters from URL params on mount or when branchOptions are ready
    if (opts.length > 1) {
      const urlFilters = { ...initializeFiltersFromUrl };
      
      // Update branch filter with proper label from branchOptions
      if (urlFilters.branch && urlFilters.branch.value) {
        const branchOption = opts.find(o => String(o.value) === String(urlFilters.branch.value));
        if (branchOption) {
          urlFilters.branch = branchOption;
        }
      }
      
      // Only update filters if they're different (to avoid infinite loops)
      // Skip if we're currently filtering programmatically (from onFilter handler)
      if (isFilteringRef.current) {
        return;
      }
      
      // Check if any URL param differs from current filters
      const hasUrlParams = urlFilters.productName || urlFilters.formDocNo || urlFilters.fromDate || 
                          urlFilters.toDate || urlFilters.status || urlFilters.branch;
      
      if (hasUrlParams && (!filtersInitializedRef.current || 
          filters.productName !== urlFilters.productName ||
          filters.formDocNo !== urlFilters.formDocNo ||
          filters.fromDate !== urlFilters.fromDate ||
          filters.toDate !== urlFilters.toDate ||
          JSON.stringify(filters.status) !== JSON.stringify(urlFilters.status) ||
          filters.branch?.value !== urlFilters.branch?.value)) {
        setFilters(urlFilters);
        filtersInitializedRef.current = true;
      } else if (filters.branch && filters.branch.value && !filters.branch.label) {
        // Update branch label if it's missing (e.g., when branchOptions load after filters are set)
        const branchOption = opts.find(o => String(o.value) === String(filters.branch.value));
        if (branchOption) {
          setFilters(prev => ({ ...prev, branch: branchOption }));
        }
      }
    }
  }, [branchList, initializeFiltersFromUrl, filters, currentUser]);

  useEffect(() => {
    try {
      const storedUser = JSON.parse(localStorage.getItem('user'));
      // Only set default branch if:
      // 1. User has a branch ID
      // 2. No branch filter is currently set
      // 3. No branch is in URL params (to preserve filters when navigating back)
      // 4. Filters have been initialized from URL
      const branchFromUrl = searchParams.get('branch');
      if (storedUser?.from_branch_id && !filters.branch && !branchFromUrl && filtersInitializedRef.current) {
        const defaultBranch = branchOptions.find(o => o.value === storedUser.from_branch_id);
        if (defaultBranch) {
          setFilters(prev => ({ ...prev, branch: defaultBranch }));
        }
      }
    } catch (_) {
      // ignore parsing issues
    }
  }, [branchOptions, filters.branch, searchParams]);

  const hasActiveFilters = useMemo(() => {
    return Boolean(
      filters.productName ||
      filters.formDocNo ||
      filters.fromDate ||
      filters.toDate ||
      (filters.status && (Array.isArray(filters.status) ? filters.status.length > 0 : filters.status.value)) ||
      (filters.branch && filters.branch.value)
    );
  }, [filters]);

  // Function to update page in URL
  const handlePageChange = (newPage) => {
    const newSearchParams = new URLSearchParams(searchParams);
    if (newPage === 1) {
      newSearchParams.delete('page');
    } else {
      newSearchParams.set('page', newPage.toString());
    }
    setSearchParams(newSearchParams, { replace: true });
  };

  // Refresh data when page becomes visible (user returns to tab) - with debounce
  useEffect(() => {
    let timeoutId = null;
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && mutate && !has429Error) {
        // Debounce visibility refresh to prevent rapid requests
        if (timeoutId) clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          mutate(undefined, { revalidate: true });
        }, 2000); // Wait 2 seconds after tab becomes visible
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [mutate, has429Error]);
  
  // Check if we're returning from a form view and force refresh
  useEffect(() => {
    // Check sessionStorage for form update flag
    const formWasUpdated = sessionStorage.getItem('bigDamageFormUpdated');
    const formWasViewed = sessionStorage.getItem('bigDamageFormViewed');
    
    if ((formWasUpdated === 'true' || formWasViewed === 'true') && mutate) {
      // Clear the flags
      sessionStorage.removeItem('bigDamageFormUpdated');
      sessionStorage.removeItem('bigDamageFormViewed');
      // Force immediate refresh with cache bypass
      setTimeout(() => {
        mutate(undefined, { revalidate: true });
      }, 100);
    }
  }, [mutate]);
  
  // Refresh when navigating back to dashboard (location pathname changes) - debounced
  useEffect(() => {
    if (mutate && location.pathname === '/big_damage_issue' && !has429Error) {
      // Debounce navigation refresh to prevent rapid requests
      const timeoutId = setTimeout(() => {
        mutate(undefined, { 
          revalidate: true,
          populateCache: true,
          rollbackOnError: false
        });
      }, 500); // Wait 500ms after navigation
      return () => clearTimeout(timeoutId);
    }
  }, [location.pathname, mutate, has429Error]);
  
  // Also refresh when component first mounts (user navigates to dashboard)
  useEffect(() => {
    if (mutate && token && !has429Error) {
      // Force refresh on mount to get latest data
      const timeoutId = setTimeout(() => {
        mutate(undefined, { revalidate: true });
      }, 500); // Wait 500ms on mount
      return () => clearTimeout(timeoutId);
    }
  }, [mutate, token, has429Error]); // Only run once on mount or when mutate/token changes

  // Refresh list when notifications are updated (form viewed, marked as read)
  useEffect(() => {
    if (!mutate) return;

    const handleNotificationsUpdated = () => {
      // Don't refresh if we're currently filtering to prevent glitches
      if (isFilteringRef.current) {
        return;
      }
      // Refresh the list to update is_viewed status for message icons
      setTimeout(() => {
        if (!isFilteringRef.current) {
          mutate(undefined, { revalidate: true });
        }
      }, 500); // Delay to ensure backend has updated
    };

    const handleFormViewed = () => {
      // Don't refresh if we're currently filtering to prevent glitches
      if (isFilteringRef.current) {
        return;
      }
      // Also refresh when form is viewed (additional trigger)
      setTimeout(() => {
        if (!isFilteringRef.current) {
          mutate(undefined, { revalidate: true });
        }
      }, 500);
    };

    window.addEventListener('notificationsUpdated', handleNotificationsUpdated);
    window.addEventListener('formViewed', handleFormViewed);
    
    return () => {
      window.removeEventListener('notificationsUpdated', handleNotificationsUpdated);
      window.removeEventListener('formViewed', handleFormViewed);
      // Cleanup filter timeout on unmount
      if (filterTimeoutRef.current) {
        clearTimeout(filterTimeoutRef.current);
      }
    };
  }, [mutate]);

  return (
    <div>
      {/* Header with Request Document System and Breadcrumb */}
      <div className="bg-white border-b border-gray-200 px-6 py-3 mb-4">
        <div className="mb-2">
          <h1 className="text-lg font-semibold text-[#012970]">Request Document System</h1>
        </div>
        <nav className="text-sm text-gray-600">
          <span>Home</span>
          <span className="mx-2">/</span>
          <span>Notifications</span>
          <span className="mx-2">/</span>
          <span className="text-[#012970] font-semibold">Big Damage Issue Form</span>
        </nav>
      </div>

      {/* Main Title with Add Button */}
      <div className="px-6 mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-[#012970]">Big Damage Issue Form</h2>
        {/* Green Add Button */}
        <Link
          to="/big-damage-issue-add"
          className="inline-flex items-center justify-center w-10 h-10 bg-[#198754] text-white rounded relative"
          title="Add new"
        >
          {/* White square outline with plus inside */}
          <div className="absolute inset-2 border border-white rounded flex items-center justify-center">
            <PlusIcon className="h-3 w-3 text-white" />
          </div>
        </Link>
      </div>

      {/* Filter Section */}
      <div className="px-6 mb-4">
        <div ref={filterRef} className="relative">
          <FilterCard
          filters={filters}
          onFilter={(v) => {
            console.log('[Dashboard] onFilter called with:', v);
            
            // Set filtering flag FIRST to prevent useEffect from interfering
            isFilteringRef.current = true;
            
            // Clear any existing timeout
            if (filterTimeoutRef.current) {
              clearTimeout(filterTimeoutRef.current);
            }
            
            // Update filters state synchronously (before URL update)
            setFilters(v);
            
            // Update URL params with filter values
            const newSearchParams = new URLSearchParams(searchParams);
            newSearchParams.delete('page'); // Reset to page 1 when filters change
            
            // Set product name filter in URL (use 'search' parameter)
            if (v.productName && v.productName.trim()) {
              newSearchParams.set('search', v.productName.trim());
              console.log('[Dashboard] Setting search param to:', v.productName.trim());
            } else {
              newSearchParams.delete('search');
              newSearchParams.delete('product_name');
              newSearchParams.delete('product_code');
              console.log('[Dashboard] Removing search param');
            }
            
            // Set form doc no filter
            if (v.formDocNo && v.formDocNo.trim()) {
              newSearchParams.set('form_doc_no', v.formDocNo.trim());
            } else {
              newSearchParams.delete('form_doc_no');
            }
            
            // Set date filters
            if (v.fromDate && v.fromDate.trim()) {
              newSearchParams.set('start_date', v.fromDate.trim());
            } else {
              newSearchParams.delete('start_date');
              newSearchParams.delete('from_date');
            }
            
            if (v.toDate && v.toDate.trim()) {
              newSearchParams.set('end_date', v.toDate.trim());
            } else {
              newSearchParams.delete('end_date');
              newSearchParams.delete('to_date');
            }
            
            // Set status filter (now a string)
            if (v.status && v.status.trim()) {
              newSearchParams.set('status', v.status.trim());
            } else {
              newSearchParams.delete('status');
            }
            
            // Set branch filter
            if (v.branch && v.branch.value) {
              newSearchParams.set('branch', v.branch.value);
            } else {
              newSearchParams.delete('branch');
            }
            
            console.log('[Dashboard] New URL params:', newSearchParams.toString());
            
            // Update URL params (this won't trigger filter update because isFilteringRef is true)
            setSearchParams(newSearchParams, { replace: true });
            
            // Reset filtering flag after a delay to allow data to load
            filterTimeoutRef.current = setTimeout(() => {
              isFilteringRef.current = false;
            }, 1000); // Wait 1 second after filter change before allowing notification updates
          }}
          onClear={() => {
            // Set filtering flag to prevent useEffect from interfering
            isFilteringRef.current = true;
            
            // Clear any existing timeout
            if (filterTimeoutRef.current) {
              clearTimeout(filterTimeoutRef.current);
            }
            
            const clearedFilters = {
              productName: "",
              formDocNo: "",
              fromDate: "",
              toDate: "",
              status: "",
              branch: null,
            };
            
            // Update filters state first
            setFilters(clearedFilters);
            
            // Clear all filter params from URL and reset to page 1
            const newSearchParams = new URLSearchParams(searchParams);
            newSearchParams.delete('page');
            newSearchParams.delete('search');
            newSearchParams.delete('product_name');
            newSearchParams.delete('product_code');
            newSearchParams.delete('form_doc_no');
            newSearchParams.delete('start_date');
            newSearchParams.delete('from_date');
            newSearchParams.delete('end_date');
            newSearchParams.delete('to_date');
            newSearchParams.delete('status');
            newSearchParams.delete('branch');
            setSearchParams(newSearchParams, { replace: true });
            
            // Reset filtering flag after a delay
            filterTimeoutRef.current = setTimeout(() => {
              isFilteringRef.current = false;
            }, 1000);
          }}
          externalBranchOptions={branchOptions}
        />
      </div>
      </div>
      
      {/* Error message banner for 429 and other errors */}
      {errorMessage && (
        <div className={`mt-4 rounded-lg border p-4 ${
          listError?.status === 429 
            ? 'bg-amber-50 border-amber-200 text-amber-800' 
            : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          <div className="flex items-start">
            <div className="flex-shrink-0">
              {listError?.status === 429 ? (
                <svg className="h-5 w-5 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              )}
            </div>
            <div className="ml-3 flex-1">
              <h3 className={`text-sm font-medium ${
                listError?.status === 429 ? 'text-amber-800' : 'text-red-800'
              }`}>
                {listError?.status === 429 ? 'Too Many Requests' : 'Error Loading Data'}
              </h3>
              <div className={`mt-2 text-sm ${
                listError?.status === 429 ? 'text-amber-700' : 'text-red-700'
              }`}>
                <p>{errorMessage}</p>
                {listError?.status === 429 && (
                  <p className="mt-1 text-xs">Auto-refresh is temporarily disabled. The page will automatically retry in 30 seconds.</p>
                )}
              </div>
            </div>
            <div className="ml-auto pl-3">
              <button
                type="button"
                onClick={() => {
                  setErrorMessage(null);
                  setHas429Error(false);
                  mutate();
                }}
                className={`inline-flex rounded-md p-1.5 ${
                  listError?.status === 429 
                    ? 'text-amber-500 hover:bg-amber-100' 
                    : 'text-red-500 hover:bg-red-100'
                } focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                  listError?.status === 429 
                    ? 'focus:ring-amber-500' 
                    : 'focus:ring-red-500'
                }`}
              >
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
      
      <div className="overflow-x-auto mt-6">
        <DamageIssueList
          data={listData.rows}
          loading={listLoading}
          currentPage={listData.meta.current_page}
          perPage={listData.meta.per_page}
          totalRows={listData.meta.total}
          branchMap={branchMap}
          onPageChange={handlePageChange}
          productFilter={filters.productName || ''}
          notificationCounts={notificationCountsByForm}
        />
      </div>

      <Link
        to="/big-damage-issue-add"
        className="group fixed bottom-6 right-6 z-40 inline-flex h-14 w-14 items-center justify-center rounded-full bg-blue-500 text-white shadow-xl shadow-blue-500/40 transition-all duration-500 ease-out hover:bg-blue-600 hover:shadow-2xl hover:shadow-blue-500/60 hover:scale-125 hover:-translate-y-2 active:scale-110 active:translate-y-0 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-400 md:hidden overflow-hidden"
        aria-label="Add new big damage issue"
      >
        <PlusIcon className="h-7 w-7 transition-all duration-500 ease-out group-hover:rotate-180 group-hover:scale-125 relative z-10" />
        {/* Animated pulse ring on hover */}
        <span className="absolute inset-0 rounded-full bg-blue-400 opacity-0 group-hover:opacity-50 group-hover:animate-ping"></span>
        {/* Shimmer effect */}
        <span className="absolute inset-0 rounded-full bg-gradient-to-r from-transparent via-white/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 -translate-x-full group-hover:translate-x-full group-hover:animate-shimmer"></span>
      </Link>
    </div>
  );
};

export default Dashboard;
