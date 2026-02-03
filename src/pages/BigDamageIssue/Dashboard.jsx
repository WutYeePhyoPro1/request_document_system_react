import React, { useEffect, useMemo, useRef, useState, useContext } from "react";
import useSWR from 'swr';
import { Link, useLocation } from "react-router-dom";
import { PlusIcon, FunnelIcon, XMarkIcon } from '@heroicons/react/24/solid';
import FilterCard from "./FilterCard";
import DamageIssueList from "./DamageIssueList";
import { filterFormsByRole } from "../../utils/roleBasedFilter";
import { useFilters, useBranches, useNotifications } from './hooks';
import { getToken, getCurrentUser } from './utils/helpers';
import { NotificationContext } from '../../context/NotificationContext';
import { BIG_DAMAGE_FORM_ID } from './utils/constants';

const fetcher = async (url) => {
  const token = getToken();
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
    if (res.status === 429) {
      const error = new Error('Too many requests. Please wait a moment and try again.');
      error.status = 429;
      throw error;
    }
    throw new Error(`HTTP ${res.status}`);
  }
  
  return res.json();
};

const Dashboard = () => {
  const location = useLocation();
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [has429Error, setHas429Error] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [perPage] = useState(999999);
  const filterRef = useRef(null);
  const lastPathnameRef = useRef(location.pathname);
  const navigationRefreshDoneRef = useRef(false);

  const token = useMemo(() => getToken(), []);
  const [currentUser, setCurrentUser] = useState(getCurrentUser);

  const {
    filters,
    setFilters,
    currentPage,
    applyFilters,
    clearFilters,
    handlePageChange,
    isFilteringRef,
    initializeFiltersFromUrl,
  } = useFilters();

  const { branchOptions, branchMap, canViewAllBranchesAccess } = useBranches(fetcher);
  
  // Get notifications from context (same source as useNotifications hook)
  const { notifications } = useContext(NotificationContext);
  
  // Extract notiData for Big Damage Issue forms (form_id 8)
  const notiData = useMemo(() => {
    const contextUnreadNoti = notifications?.getUnreadNoti || [];
    
    if (!Array.isArray(contextUnreadNoti) || contextUnreadNoti.length === 0) {
      return [];
    }
    
    // Filter for Big Damage Issue form (form_id 8) and extract data
    const bigDamageNotifications = contextUnreadNoti
      .filter(noti => {
        const data = noti?.data || noti;
        const formId = Number(data?.form_id) || data?.form_id;
        return formId === BIG_DAMAGE_FORM_ID;
      })
      .map(noti => {
        // Extract just the data object (like backend pluck('data'))
        return noti?.data || noti;
      });
    
    return bigDamageNotifications;
  }, [notifications]);

  const buildQuery = () => {
    const params = new URLSearchParams();
    params.set("per_page", "1000");
    params.set("form_type", "big_damage_issue");
    params.set("include_total", "true");
  
    if (filters.formDocNo) {
      params.set("form_doc_no", filters.formDocNo);
      params.set("doc_no", filters.formDocNo);
    }

    if (filters.status) {
      let statusValues = [];
      if (Array.isArray(filters.status) && filters.status.length > 0) {
        statusValues = filters.status.map(s => (typeof s === 'string' ? s : s.value || '')).filter(Boolean);
      } else if (typeof filters.status === 'string' && filters.status.trim()) {
        statusValues = filters.status.split(',').map(s => s.trim()).filter(Boolean);
      } else if (typeof filters.status === 'object' && filters.status.value) {
        statusValues = [filters.status.value];
      }
      
      if (statusValues.includes('Ac_Acknowledged') && !statusValues.includes('OPApproved')) {
        statusValues.push('OPApproved');
      }
      
      if (statusValues.length > 0) {
        params.set('status', statusValues.join(','));
      }
    }

    if (filters.branch?.value) params.set("branch", filters.branch.value);
    if (filters.fromDate?.trim()) params.set("start_date", filters.fromDate);
    if (filters.toDate?.trim()) params.set("end_date", filters.toDate);
    
    return params.toString();
  };

  const query = useMemo(() => buildQuery(), [filters]);

  const { data: listPayload, isLoading: listLoading, error: listError, mutate } = useSWR(
    token ? [`/api/big-damage-issues?${query}`] : null,
    ([url]) => fetcher(url),
    { 
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      revalidateOnMount: true,
      dedupingInterval: 30000,
      refreshInterval: 0,
      keepPreviousData: true,
      revalidateIfStale: false,
      onError: (error) => {
        if (error.status === 429) {
          setHas429Error(true);
          setErrorMessage('Too many requests. Please wait a moment.');
          setTimeout(() => {
            setHas429Error(false);
            setErrorMessage(null);
            mutate();
          }, 30000);
        } else {
          setErrorMessage(error.message || 'Failed to load data.');
        }
      },
      onSuccess: () => {
        if (has429Error) {
          setHas429Error(false);
          setErrorMessage(null);
        }
      }
    }
  );

  const { notificationCountsByForm, hasUnreadNotifications } = useNotifications(
    currentUser, 
    canViewAllBranchesAccess, 
    listPayload, 
    isFilteringRef
  );

  useEffect(() => {
    const refreshUserIfNeeded = async () => {
      if (!currentUser) return;
      
      const needsRefresh = !('all_branch' in currentUser || 'allBranch' in currentUser) || !('emp_id' in currentUser);
      if (!needsRefresh) return;
      
      try {
        const response = await fetch('/api/me', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
          },
          credentials: 'include',
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data?.user) {
            const enrichedUser = { ...data.user };
            if (!enrichedUser.user_type) {
              if (enrichedUser.employee_number === '666-666666' || enrichedUser.emp_id === '666-666666') {
                enrichedUser.user_type = 'A2';
              } else if (Number(enrichedUser.role_id) === 3) {
                enrichedUser.user_type = 'A1';
              }
            }
            localStorage.setItem('user', JSON.stringify(enrichedUser));
            setCurrentUser(enrichedUser);
            window.location.reload();
          }
        }
      } catch {}
    };
    
    refreshUserIfNeeded();
  }, [currentUser, token]);

  useEffect(() => {
    const handler = () => mutate?.();
    window.addEventListener('big-damage-updated', handler);
    return () => window.removeEventListener('big-damage-updated', handler);
  }, [mutate]);

  useEffect(() => {
    if (!mutate) return;

    const handleRefresh = () => {
      if (!isFilteringRef.current) {
        setTimeout(() => mutate(undefined, { revalidate: true }), 500);
      }
    };

    window.addEventListener('notificationsUpdated', handleRefresh);
    window.addEventListener('formViewed', handleRefresh);
    
    return () => {
      window.removeEventListener('notificationsUpdated', handleRefresh);
      window.removeEventListener('formViewed', handleRefresh);
    };
  }, [mutate, isFilteringRef]);

  useEffect(() => {
    const isNavigatingBack = lastPathnameRef.current !== location.pathname && 
                             location.pathname === '/big_damage_issue';
    
    if (isNavigatingBack && mutate && !has429Error && !navigationRefreshDoneRef.current) {
      navigationRefreshDoneRef.current = true;
      const timeoutId = setTimeout(() => {
        mutate(undefined, { revalidate: true });
        setTimeout(() => { navigationRefreshDoneRef.current = false; }, 2000);
      }, 300);
      
      lastPathnameRef.current = location.pathname;
      return () => clearTimeout(timeoutId);
    }
    
    lastPathnameRef.current = location.pathname;
  }, [location.pathname, mutate, has429Error]);
  
  const listData = useMemo(() => {
    if (listLoading || !listPayload) {
      return { rows: [], meta: { current_page: currentPage, per_page: perPage, total: 0 } };
    }
    
    const user = getCurrentUser() || {};
    let allRows = [];
    let meta = { current_page: currentPage, per_page: perPage, total: 0, last_page: 1 };
    
    if (listPayload.data && Array.isArray(listPayload.data)) {
      allRows = filterFormsByRole(listPayload.data, user);
      meta = {
        current_page: listPayload.current_page || currentPage,
        per_page: listPayload.per_page || perPage,
        total: listPayload.total || 0,
        last_page: listPayload.last_page || 1,
      };
    } else if (Array.isArray(listPayload)) {
      allRows = filterFormsByRole(listPayload, user);
      meta.total = allRows.length;
    }
    
    const seenFormIds = new Set();
    allRows = allRows.filter((row) => {
      const formId = row?.general_form?.id || row?.id;
      if (!formId || seenFormIds.has(formId)) return false;
      seenFormIds.add(formId);
      return true;
    });

    const uiPageSize = 15;
    const hasProductFilter = filters.productName?.trim();
    
    if (hasProductFilter) {
      return {
        rows: allRows,
        meta: { ...meta, per_page: uiPageSize, total: allRows.length },
        hasUnreadNotifications
      };
    }

    const startIndex = (currentPage - 1) * uiPageSize;
    return {
      rows: allRows.slice(startIndex, startIndex + uiPageSize),
      meta: {
        ...meta,
        current_page: currentPage,
        per_page: uiPageSize,
        total: allRows.length,
        last_page: Math.ceil(allRows.length / uiPageSize) || 1,
      },
      hasUnreadNotifications
    };
  }, [listPayload, currentPage, perPage, hasUnreadNotifications, filters.productName, listLoading]);

  const totalFormCount = useMemo(() => {
    if (listPayload?.total) return Number(listPayload.total);
    if (listPayload?.meta?.total) return Number(listPayload.meta.total);
    return listData?.meta?.total || 0;
  }, [listPayload, listData]);

  return (
    <div>
      <div className="bg-white border-b border-gray-200 px-6 py-3 mb-4">
        <h1 className="text-lg font-semibold text-[#012970] mb-2">Request Document System</h1>
        <nav className="text-sm text-gray-600">
          <span>Dashboard</span>
          <span className="mx-2">/</span>
          <span className="text-[#012970] font-semibold">Big Damage Issue Form</span>
        </nav>
      </div>

      <div className="px-6 mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-[#012970]">Big Damage Issue Form</h2>
        <Link
          to="/big-damage-issue-add"
          className="hidden md:inline-flex items-center justify-center w-10 h-10 bg-[#198754] text-white rounded relative"
          title="Add new"
        >
          <div className="absolute inset-2 border border-white rounded flex items-center justify-center">
            <PlusIcon className="h-3 w-3 text-white" />
          </div>
        </Link>
      </div>

      <div className="px-6 mb-4">
        <div ref={filterRef} className="relative w-full">
            <div className="hidden md:block">
              <FilterCard
                filters={filters}
                onFilter={applyFilters}
              onClear={clearFilters}
                externalBranchOptions={branchOptions}
                allowAllBranchSelection={canViewAllBranchesAccess}
              />
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={() => setIsFilterOpen(true)}
        className="fixed bottom-6 left-6 z-40 inline-flex h-12 w-12 items-center justify-center rounded-full bg-gray-800 text-white shadow-xl md:hidden"
        aria-label="Open filters"
      >
        <FunnelIcon className="h-6 w-6" />
      </button>

      {isFilterOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black opacity-40" onClick={() => setIsFilterOpen(false)} />
          <div className="relative ml-auto w-full max-w-md bg-white h-full shadow-xl overflow-auto p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-[#012970]">Filters</h3>
              <button onClick={() => setIsFilterOpen(false)} className="p-2 rounded bg-gray-100">
                <XMarkIcon className="h-5 w-5 text-gray-600" />
              </button>
            </div>
            <FilterCard
              filters={filters}
              onFilter={(v) => { applyFilters(v); setIsFilterOpen(false); }}
              onClear={() => { clearFilters(); setIsFilterOpen(false); }}
              externalBranchOptions={branchOptions}
              allowAllBranchSelection={canViewAllBranchesAccess}
            />
          </div>
        </div>
      )}
      
      {errorMessage && (
        <div className={`mx-6 mt-4 rounded-lg border p-4 ${
          listError?.status === 429 ? 'bg-amber-50 border-amber-200 text-amber-800' : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          <div className="flex items-start">
            <div className="flex-1">
              <h3 className="text-sm font-medium">
                {listError?.status === 429 ? 'Too Many Requests' : 'Error Loading Data'}
              </h3>
              <p className="mt-2 text-sm">{errorMessage}</p>
            </div>
              <button
              onClick={() => { setErrorMessage(null); setHas429Error(false); mutate(); }}
              className="ml-auto text-gray-500 hover:text-gray-700"
            >
              <XMarkIcon className="h-5 w-5" />
              </button>
          </div>
        </div>
      )}
      
      <div className="overflow-x-auto mt-6">
            <DamageIssueList
              data={listData.rows}
              loading={listLoading}
              currentPage={currentPage}
              perPage={perPage}
              totalRows={totalFormCount}
              branchMap={branchMap}
              onPageChange={handlePageChange}
              productFilter={filters.productName || ''}
              notificationCounts={notificationCountsByForm}
              notiData={notiData}
            />
      </div>

      <Link
        to="/big-damage-issue-add"
        className="group fixed bottom-6 right-6 z-40 inline-flex h-14 w-14 items-center justify-center rounded-full bg-blue-500 text-white shadow-xl transition-all duration-300 hover:bg-blue-600 hover:scale-110 md:hidden"
        aria-label="Add new big damage issue"
      >
        <PlusIcon className="h-7 w-7" />
      </Link>
    </div>
  );
};

export default Dashboard;
