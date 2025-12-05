import { useEffect, useMemo, useRef, useState } from "react";
import useSWR from 'swr';
import useSWRImmutable from 'swr/immutable';
import { Link, useSearchParams, useLocation } from "react-router-dom";
import { PlusCircleIcon, FunnelIcon, PlusIcon } from '@heroicons/react/24/solid';
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
    
    // Parse status - can be comma-separated string or single value
    let status = null;
    if (statusParam) {
      const statusValues = statusParam.split(',').map(s => s.trim()).filter(Boolean);
      if (statusValues.length > 0) {
        // Map to filter format (array of objects with value property)
        status = statusValues.map(s => ({ value: s, label: s }));
      }
    }
    
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

  const buildQuery = () => {
    const params = new URLSearchParams();
    params.set("per_page", String(perPage));
    
    // Always filter for Big Damage Issues by default (form_id: 8)
    params.set("form_type", "big_damage_issue");
    
    // Add other filters
    if (filters.productName) params.set("search", filters.productName);
    if (filters.formDocNo) params.set("form_doc_no", filters.formDocNo);
    // Handle status as array (multi-select) or single value
    if (filters.status) {
      if (Array.isArray(filters.status) && filters.status.length > 0) {
        // Multi-select: send as array or comma-separated string
        const statusValues = filters.status.map(s => s.value || s).filter(Boolean);
        if (statusValues.length > 0) {
          // Send as comma-separated string (common API pattern)
          params.set("status", statusValues.join(','));
        }
      } else if (filters.status.value) {
        // Single select (backward compatibility)
        params.set("status", filters.status.value);
      }
    }
    if (filters.branch?.value) params.set("branch", filters.branch.value);
    // Only send date filters if they have actual values (not empty strings)
    if (filters.fromDate && filters.fromDate.trim() !== "") params.set("start_date", filters.fromDate);
    if (filters.toDate && filters.toDate.trim() !== "") params.set("end_date", filters.toDate);
    
    // Add current page to the query
    if (currentPage > 1) {
      params.set("page", currentPage);
    }
    
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
  const currentUser = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('user') || '{}');
    } catch (e) {
      return {};
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

  // Check if there are any unread notifications
  const hasUnreadNotifications = bigDamageNotificationIds.length > 0;

  const listData = useMemo(() => {
    try {
      if (!listPayload) {
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
        
        // CRITICAL: Remove duplicates based on form ID to prevent display errors
        const seenIds = new Set();
        allRows = allRows.filter((row) => {
          const formId = row?.general_form?.id || row?.id;
          if (!formId) return true; // Keep rows without ID (shouldn't happen, but be safe)
          
          if (seenIds.has(formId)) {
            console.warn('[Dashboard] Duplicate form detected and removed:', {
              formId,
              form_doc_no: row?.general_form?.form_doc_no,
              row_id: row?.id
            });
            return false; // Remove duplicate
          }
          
          seenIds.add(formId);
          return true; // Keep unique form
        });
        
        // Apply role-based filtering
        const filteredRows = filterFormsByRole(allRows, user);
        
        allRows = filteredRows;
        
        // Note: We don't update meta.total here because:
        // 1. Role restrictions are disabled, so filtering shouldn't remove items
        // 2. If filtering does remove items, we'd need server-side filtering to get accurate total
        // 3. meta.total represents total across all pages, not just current page
        
        return {
          rows: allRows,
          meta,
          hasUnreadNotifications: hasUnreadNotifications
        };
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
  }, [listPayload, currentPage, perPage, bigDamageNotificationIds, hasUnreadNotifications, searchParams]);

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

  return (
    <div>
      <div className="sticky z-40 bg-white border-b border-gray-200 shadow-sm px-6 py-3 mb-4 -mx-3 -mt-3 md:flex-row md:items-center md:justify-between flex flex-col gap-3" style={{ top: '-14px' }}>
        <div className="flex flex-col md:flex-1 md:justify-between">
          <div className="flex items-center justify-between gap-3 md:justify-start">
            <div className="flex items-center space-x-2">
              <img
                src={BigDamageIsuueLogo}
                alt="Big Damage Issue Logo"
                className="h-7 w-7 md:h-8 md:w-8"
              />
              <span className="text-xl font-semibold text-gray-800 md:text-2xl md:font-normal">
                Big Damage Issue 
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                const wasClosed = !isFilterOpen;
                setIsFilterOpen(prev => !prev);
                // Scroll to filter section when opened
                if (wasClosed && filterRef.current) {
                  setTimeout(() => {
                    filterRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }, 100);
                }
              }}
              aria-expanded={isFilterOpen}
              className={`inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-blue-500 md:hidden ${
                hasActiveFilters
                  ? 'border-blue-500 bg-blue-50 text-blue-700 hover:bg-blue-100'
                  : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              <FunnelIcon className="h-5 w-5" />
              <span className="hidden sm:inline">Filters</span>
              {hasActiveFilters && <span className="inline-flex h-2 w-2 rounded-full bg-blue-500" aria-hidden="true" />}
            </button>
          </div>
          <p className="mt-1 text-sm text-gray-500 md:text-base md:mx-8 md:mt-2">/big-damage-issue</p>
        </div>
        <div className="hidden md:flex items-center">
          <button className="bg-blue-500 shadow-lg shadow-blue-500/50">
            <Link
              to="/big-damage-issue-add"
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-sm font-medium"
            >
              <PlusCircleIcon className="h-5 w-5 inline-block mr-1" />
              Add new 
            </Link>
          </button>
        </div>
      </div>
      <div className="mx-6">
      <div ref={filterRef} className={`${isFilterOpen ? 'block' : 'hidden'} md:block mt-2 sticky top-0 z-30 bg-white md:bg-transparent shadow-lg md:shadow-none border-b border-gray-200 md:border-0 py-3 md:py-0 -mx-6 px-6`}>
        <FilterCard
          filters={filters}
          onFilter={(v) => {
            setFilters(v);
            // Reset to page 1 when filters change
            const newSearchParams = new URLSearchParams(searchParams);
            newSearchParams.delete('page');
            setSearchParams(newSearchParams, { replace: true });
          }}
          onClear={() => {
            setFilters({
              productName: "",
              formDocNo: "",
              fromDate: "",
              toDate: "",
              status: null,
              branch: null,
            });
            // Reset to page 1 when clearing filters
            const newSearchParams = new URLSearchParams(searchParams);
            newSearchParams.delete('page');
            setSearchParams(newSearchParams, { replace: true });
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
        />
      </div>

      <Link
        to="/big-damage-issue-add"
        className="fixed bottom-6 right-6 z-40 inline-flex h-14 w-14 items-center justify-center rounded-full bg-blue-500 text-white shadow-xl shadow-blue-500/40 transition hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-400 md:hidden"
        aria-label="Add new big damage issue"
      >
        <PlusIcon className="h-7 w-7" />
      </Link>
    </div>
  );
};

export default Dashboard;
