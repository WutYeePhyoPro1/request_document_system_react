import { useState, useMemo, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';

export const useFilters = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const isFilteringRef = useRef(false);
  const filterTimeoutRef = useRef(null);

  const currentPage = useMemo(() => {
    const pageParam = searchParams.get('page');
    const page = pageParam ? parseInt(pageParam, 10) : 1;
    return isNaN(page) || page < 1 ? 1 : page;
  }, [searchParams]);

  const initializeFiltersFromUrl = useMemo(() => {
    const branchParam = searchParams.get('branch');
    return {
      productName: searchParams.get('search') || '',
      formDocNo: searchParams.get('form_doc_no') || '',
      fromDate: searchParams.get('start_date') || '',
      toDate: searchParams.get('end_date') || '',
      status: searchParams.get('status') || '',
      branch: branchParam ? { value: branchParam, label: branchParam } : null,
    };
  }, [searchParams]);

  const [filters, setFilters] = useState(initializeFiltersFromUrl);

  const applyFilters = useCallback((v) => {
    isFilteringRef.current = true;
    if (filterTimeoutRef.current) clearTimeout(filterTimeoutRef.current);

    setFilters(v);

    const newParams = new URLSearchParams(searchParams);
    newParams.delete('page');

    const setOrDelete = (key, value) => {
      if (value?.trim()) newParams.set(key, value.trim());
      else newParams.delete(key);
    };

    setOrDelete('search', v.productName);
    setOrDelete('form_doc_no', v.formDocNo);
    setOrDelete('start_date', v.fromDate);
    setOrDelete('end_date', v.toDate);

    let statusValues = [];
    if (Array.isArray(v.status)) {
      statusValues = v.status.map(s => s?.value || s).filter(Boolean);
    } else if (v.status?.value) {
      statusValues = [v.status.value];
    } else if (typeof v.status === 'string') {
      statusValues = v.status.split(',').map(s => s.trim()).filter(Boolean);
    }
    
    if (statusValues.includes('Ac_Acknowledged') && !statusValues.includes('OPApproved')) {
      statusValues.push('OPApproved');
    }
    
    if (statusValues.length > 0) {
      newParams.set('status', statusValues.join(','));
    } else {
      newParams.delete('status');
    }

    if (v.branch?.value) {
      newParams.set('branch', v.branch.value);
    } else {
      newParams.delete('branch');
    }

    setSearchParams(newParams, { replace: true });

    filterTimeoutRef.current = setTimeout(() => {
      isFilteringRef.current = false;
    }, 1000);
  }, [searchParams, setSearchParams]);

  const clearFilters = useCallback(() => {
    isFilteringRef.current = true;
    if (filterTimeoutRef.current) clearTimeout(filterTimeoutRef.current);

    const emptyFilters = {
      productName: '',
      formDocNo: '',
      fromDate: '',
      toDate: '',
      status: [],
      branch: null,
    };

    setFilters(emptyFilters);

    const newParams = new URLSearchParams();
    setSearchParams(newParams, { replace: true });

    filterTimeoutRef.current = setTimeout(() => {
      isFilteringRef.current = false;
    }, 1000);
  }, [setSearchParams]);

  const handlePageChange = useCallback((newPage) => {
    const newParams = new URLSearchParams(searchParams);
    if (newPage === 1) {
      newParams.delete('page');
    } else {
      newParams.set('page', newPage.toString());
    }
    setSearchParams(newParams, { replace: true });
  }, [searchParams, setSearchParams]);

  const hasActiveFilters = useMemo(() => {
    return Boolean(
      filters.productName ||
      filters.formDocNo ||
      filters.fromDate ||
      filters.toDate ||
      (filters.status && (Array.isArray(filters.status) ? filters.status.length > 0 : filters.status.value)) ||
      filters.branch?.value
    );
  }, [filters]);

  return {
    filters,
    setFilters,
    currentPage,
    applyFilters,
    clearFilters,
    handlePageChange,
    hasActiveFilters,
    initializeFiltersFromUrl,
    isFilteringRef,
  };
};

