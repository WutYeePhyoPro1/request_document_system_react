import React, { useEffect, useState } from 'react';
import Select from 'react-select';
import { MagnifyingGlassIcon, CalendarIcon, XMarkIcon, ArrowPathIcon } from '@heroicons/react/24/solid';

export default function FilterCard({ filters, onFilter, onClear, externalBranchOptions, allowAllBranchSelection = false }) {
  // Styles matching Laravel blade design
  // custom-fs = font-size: 13px
  // custom-rounded = border-radius: 8px, border-color: #2ea2d1
  // custom-text = color: #012970
  // fw-bold = font-weight: bold
  
  const CONTROL_CLASSES = `w-full border px-2
                           text-[#012970] font-bold
                           rounded-[8px] border-[#2ea2d1]
                           focus:outline-none focus:ring-2 focus:ring-[#2ea2d1] focus:ring-opacity-50`;

  const statusOptions = [
    { value: 'Ongoing', label: 'Ongoing' },
    { value: 'Checked', label: 'Checked' },
    { value: 'BM Approved', label: 'BM Approved' },
    { value: 'OPApproved', label: 'OP Approved' },
    { value: 'Ac_Acknowledged', label: 'Acknowledged' },
    { value: 'Approved', label: 'Approved' },
    { value: 'Completed', label: 'Completed' },
    { value: 'Cancel', label: 'Cancel' },
  ];

  // Initialize local filters from props to prevent flickering on mount
  const getInitialFilters = () => {
    let statusValue = "";
    if (filters.status) {
      if (Array.isArray(filters.status) && filters.status.length > 0) {
        statusValue = filters.status.map(s => s.value || s).join(", ");
      } else if (typeof filters.status === 'object' && filters.status.value) {
        statusValue = filters.status.value;
      } else if (typeof filters.status === 'string') {
        statusValue = filters.status;
      }
    }
    return {
      productName: filters.productName || "",
      formDocNo: filters.formDocNo || "",
      fromDate: filters.fromDate || "",
      toDate: filters.toDate || "",
      status: statusValue,
      branch: filters.branch || null,
    };
  };
  
  // Local state to store filter values before applying
  const [localFilters, setLocalFilters] = useState(getInitialFilters);

  const [branchOptions, setBranchOptions] = useState([
    { value: '', label: 'All Branch' },
  ]);

  // Function to filter branches based on user's branch
  // Use selectedBranch parameter or localFilters.branch as source of truth
  const filterBranchesByUser = (allBranchOptions, selectedBranch = null) => {
    const ensureAllBranchOption = (options) => {
      if (!Array.isArray(options)) {
        return [{ value: '', label: 'All Branch' }];
      }
      const normalized = [...options];
      if (!normalized.find(opt => opt.value === '' || opt.value === null || opt.value === undefined)) {
        normalized.unshift({ value: '', label: 'All Branch' });
      }
      return normalized;
    };

    if (allowAllBranchSelection) {
      const normalizedOptions = ensureAllBranchOption(allBranchOptions);
      if (selectedBranch && selectedBranch.value && !normalizedOptions.find(opt => String(opt.value) === String(selectedBranch.value))) {
        normalizedOptions.push(selectedBranch);
      }
      setBranchOptions(normalizedOptions);
      return;
    }

    try {
      const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
      const userBranchId = storedUser?.from_branch_id;
      
      // Use selectedBranch parameter, then localFilters.branch, then filters.branch as fallback
      const currentBranch = selectedBranch || localFilters.branch || filters.branch;

      if (!userBranchId) {
        // If user has no branch assigned, show only "All Branch" option
        // But preserve selected branch if one exists
        if (currentBranch && currentBranch.value) {
          const branchExists = allBranchOptions.find(opt => String(opt.value) === String(currentBranch.value));
          if (branchExists) {
            setBranchOptions([{ value: '', label: 'All Branch' }, branchExists]);
            return;
          }
        }
        setBranchOptions([{ value: '', label: 'All Branch' }]);
        return;
      }

      // Filter to only show user's branch and "All Branch" option
      const filteredOptions = allBranchOptions.filter(option => {
        // Keep "All Branch" option
        if (!option.value || option.value === '') return true;
        // Keep only the user's branch
        return Number(option.value) === Number(userBranchId);
      });

      // Preserve selected branch even if it's not the user's branch (to prevent glitching)
      if (currentBranch && currentBranch.value) {
        const branchExists = allBranchOptions.find(opt => String(opt.value) === String(currentBranch.value));
        if (branchExists && !filteredOptions.find(opt => String(opt.value) === String(currentBranch.value))) {
          // Add selected branch to options if it's not already there
          filteredOptions.push(branchExists);
        }
      }

      setBranchOptions(filteredOptions.length > 0 ? filteredOptions : [{ value: '', label: 'All Branch' }]);
    } catch (e) {
      console.error('Error filtering branches by user:', e);
      // On error, preserve selected branch if possible
      const currentBranch = selectedBranch || localFilters.branch || filters.branch;
      if (currentBranch && currentBranch.value) {
        const branchExists = allBranchOptions?.find(opt => String(opt.value) === String(currentBranch.value));
        if (branchExists) {
          setBranchOptions([{ value: '', label: 'All Branch' }, branchExists]);
          return;
        }
      }
      setBranchOptions([{ value: '', label: 'All Branch' }]);
    }
  };

  // Sync local filters with props when filters are cleared from parent
  // Use ref to track previous filters and prevent unnecessary updates that cause flickering
  const prevFiltersRef = React.useRef(null);
  const localFiltersRef = React.useRef(localFilters);
  
  // Keep ref in sync with state
  useEffect(() => {
    localFiltersRef.current = localFilters;
  }, [localFilters]);
  
  useEffect(() => {
    // Skip if filters haven't changed (same reference)
    if (prevFiltersRef.current === filters) {
      return;
    }
    
    // Handle status - convert from array/object to string if needed
    let statusValue = "";
    if (filters.status) {
      if (Array.isArray(filters.status) && filters.status.length > 0) {
        statusValue = filters.status.map(s => s.value || s).join(", ");
      } else if (typeof filters.status === 'object' && filters.status.value) {
        statusValue = filters.status.value;
      } else if (typeof filters.status === 'string') {
        statusValue = filters.status;
      }
    }
    
    const newFilters = {
      productName: filters.productName || "",
      formDocNo: filters.formDocNo || "",
      fromDate: filters.fromDate || "",
      toDate: filters.toDate || "",
      status: statusValue,
      branch: filters.branch || null,
    };
    
    // Only update if filters actually changed (prevent flickering on navigation)
    const currentLocal = localFiltersRef.current;
    const hasChanged = 
      newFilters.productName !== currentLocal.productName ||
      newFilters.formDocNo !== currentLocal.formDocNo ||
      newFilters.fromDate !== currentLocal.fromDate ||
      newFilters.toDate !== currentLocal.toDate ||
      newFilters.status !== currentLocal.status ||
      JSON.stringify(newFilters.branch) !== JSON.stringify(currentLocal.branch);
    
    if (hasChanged) {
      setLocalFilters(newFilters);
    }
    
    prevFiltersRef.current = filters;
  }, [filters]);
  
  // Separate effect to ensure selected branch is always in branchOptions
  // Use localFilters.branch to track current selection state
  useEffect(() => {
    const currentBranch = localFilters.branch || filters.branch;
    if (currentBranch && currentBranch.value && externalBranchOptions) {
      setBranchOptions(prev => {
        const branchExists = prev.find(opt => String(opt.value) === String(currentBranch.value));
        if (!branchExists) {
          // Selected branch is not in options, add it
          const branchFromAll = externalBranchOptions.find(opt => String(opt.value) === String(currentBranch.value));
          if (branchFromAll) {
            return [...prev, branchFromAll];
          }
        }
        return prev;
      });
    }
  }, [localFilters.branch, filters.branch, externalBranchOptions]);

  // Use ref to track previous externalBranchOptions to prevent unnecessary re-filtering
  const prevExternalBranchOptionsRef = React.useRef(externalBranchOptions);
  const hasInitializedBranchOptionsRef = React.useRef(false);
  
  useEffect(() => {
    // Only re-filter if externalBranchOptions actually changed (reference or content)
    const optionsChanged = prevExternalBranchOptionsRef.current !== externalBranchOptions ||
      (externalBranchOptions && prevExternalBranchOptionsRef.current && 
       externalBranchOptions.length !== prevExternalBranchOptionsRef.current.length);
    
    // If parent passes branch options (even initially), use them and skip fetching
    if (externalBranchOptions) {
      // Only filter if options changed or if we haven't initialized yet
      if (optionsChanged || !hasInitializedBranchOptionsRef.current) {
        // Use localFilters.branch as source of truth (current state)
        filterBranchesByUser(externalBranchOptions, localFilters.branch || filters.branch);
        prevExternalBranchOptionsRef.current = externalBranchOptions;
        hasInitializedBranchOptionsRef.current = true;
      }
      return;
    }

    const token = localStorage.getItem('token');
    const fetchBranches = async () => {
      try {
        const res = await fetch('/api/branches', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
          },
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const list = Array.isArray(data)
          ? data
          : Array.isArray(data?.data)
            ? data.data
            : Array.isArray(data?.data?.data)
              ? data.data.data
              : [];
        const mapped = list.map(b => ({ value: b.id, label: b.branch_name }));
        const allOptions = [{ value: '', label: 'All Branch' }, ...mapped];
        // Filter branches based on user's branch, passing current branch from localFilters
        filterBranchesByUser(allOptions, localFilters.branch || filters.branch);
      } catch (e) {
        // keep default All Branch only on failure
        setBranchOptions([{ value: '', label: 'All Branch' }]);
      }
    };
    fetchBranches();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [externalBranchOptions, allowAllBranchSelection]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    // Only update local state, don't apply filters
    setLocalFilters({ ...localFilters, [name]: value });
  };

  const handleClearInput = (fieldName) => {
    setLocalFilters({ ...localFilters, [fieldName]: "" });
  };

  const handleSelectChange = (selected, action) => {
    const { name } = action;
    // Only update local state, don't apply filters
    // For multi-select (status), selected is an array or null
    // For single select (branch), selected is an object or null
    setLocalFilters({ ...localFilters, [name]: selected });
  };

  const handleSearch = () => {
    // Apply filters when search button is clicked
    onFilter(localFilters);
  };

  const clearFilters = () => {
    // Reset local filters
    const emptyFilters = {
      productName: "",
      formDocNo: "",
      fromDate: "",
      toDate: "",
      status: "",
      branch: null,
    };
    setLocalFilters(emptyFilters);
    // Clear filters in parent
    onClear?.();
  };

  const isAnyFilterApplied = Object.entries(localFilters).some(([key, val]) => {
    if (key === 'status') {
      // For status (text input), check if it's a non-empty string
      return typeof val === 'string' && val.trim() !== '';
    }
    return val !== null && val !== undefined && val !== '';
  });

  // Get status color based on status value (matching DamageIssueList colors)
  const getStatusColor = (statusValue) => {
    const colorMap = {
      'Ongoing': { bg: '#fbb193', text: '#e1341e', border: '#e1341e' },
      'Checked': { bg: '#fedec3', text: '#fb923c', border: '#fb923c' },
      'BM Approved': { bg: '#ffeaab', text: '#e6ac00', border: '#e6ac00' },
      'BMApproved': { bg: '#ffeaab', text: '#e6ac00', border: '#e6ac00' },
      'OPApproved': { bg: '#e9f9cf', text: '#a3e635', border: '#a3e635' },
      'OP Approved': { bg: '#e9f9cf', text: '#a3e635', border: '#a3e635' },
      'Approved': { bg: '#e9f9cf', text: '#a3e635', border: '#a3e635' },
      'Ac_Acknowledged': { bg: '#aff1d7', text: '#20be7f', border: '#20be7f' },
      'Acknowledged': { bg: '#aff1d7', text: '#20be7f', border: '#20be7f' },
      'Completed': { bg: '#adebbb', text: '#28a745', border: '#28a745' },
      'Issued': { bg: '#adebbb', text: '#28a745', border: '#28a745' },
      'SupervisorIssued': { bg: '#adebbb', text: '#28a745', border: '#28a745' },
      'Cancel': { bg: '#fda19d', text: '#f91206', border: '#f91206' },
      'Cancelled': { bg: '#fda19d', text: '#f91206', border: '#f91206' },
    };
    return colorMap[statusValue] || { bg: '#fef3c7', text: '#d97706', border: '#d97706' };
  };

  // Shared react-select style matching Laravel blade design
  const customSelectStyles = {
    control: (base, state) => ({
      ...base,
      minHeight: '32px',
      fontSize: '10px',
      fontWeight: 'bold',
      color: '#012970',
      borderRadius: '8px',
      borderColor: state.isFocused ? '#2ea2d1' : '#2ea2d1',
      boxShadow: state.isFocused ? '0 0 0 3px rgba(46, 162, 209, 0.1)' : 'none',
      // Allow height to grow for multi-select
      height: state.selectProps.isMulti ? 'auto' : '32px',
    }),
    singleValue: (base) => ({
      ...base,
      lineHeight: '32px',
      color: '#012970',
      fontWeight: 'bold',
      fontSize: '10px',
    }),
    indicatorsContainer: (base) => ({
      ...base,
      height: '32px',
    }),
    placeholder: (base) => ({
      ...base,
      fontSize: '10px',
      color: '#9CA3AF',
      fontWeight: 'bold',
    }),
    multiValue: (base, state) => {
      const statusValue = state.data?.value;
      const colors = getStatusColor(statusValue);
      return {
        ...base,
        backgroundColor: colors.bg,
        borderRadius: '0.375rem',
        padding: '2px',
        margin: '2px',
        fontSize: '0.75rem',
        fontWeight: '500',
        border: `1px solid ${colors.border}`,
        boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
      };
    },
    multiValueLabel: (base, state) => {
      const statusValue = state.data?.value;
      const colors = getStatusColor(statusValue);
      return {
        ...base,
        color: colors.text,
        fontSize: '0.75rem',
        fontWeight: '500',
        padding: '2px 6px',
      };
    },
    multiValueRemove: (base, state) => {
      const statusValue = state.data?.value;
      const colors = getStatusColor(statusValue);
      return {
        ...base,
        color: colors.text,
        borderRadius: '0 0.25rem 0.25rem 0',
        padding: '2px 6px',
        '&:hover': {
          backgroundColor: colors.border,
          color: colors.text,
          cursor: 'pointer',
        },
      };
    },
    menu: (base) => ({
      ...base,
      borderRadius: '0.5rem',
      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      border: '1px solid #E5E7EB',
      marginTop: '4px',
    }),
    option: (base, state) => ({
      ...base,
      fontSize: '0.8rem',
      padding: '8px 12px',
      backgroundColor: state.isSelected
        ? '#DBEAFE'
        : state.isFocused
        ? '#F3F4F6'
        : 'white',
      color: state.isSelected ? '#1E40AF' : '#374151',
      fontWeight: state.isSelected ? '600' : '400',
      cursor: 'pointer',
      '&:active': {
        backgroundColor: '#DBEAFE',
      },
    }),
    valueContainer: (base) => ({
      ...base,
      padding: '1px 4px',
      gap: '2px',
    }),
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    handleSearch();
  };

  return (
    <div className="bg-white shadow-lg rounded-xl p-4 mx-auto">
      <form onSubmit={handleFormSubmit}>
        {/* All filters in one row */}
        <div className="flex flex-wrap lg:flex-nowrap items-end gap-3">
          {/* Product Name / Code */}
          <div className="w-full sm:w-auto sm:flex-1 min-w-[140px]">
            <label className="block text-[11px] font-medium text-gray-700 mb-1" style={{ whiteSpace: 'nowrap' }}>
              Product Name/Code
            </label>
            <div className="relative">
              <input
                type="text"
                name="productName"
                value={localFilters.productName || ""}
                onChange={handleChange}
                placeholder=""
                className={`${CONTROL_CLASSES} ${localFilters.productName ? 'pr-8' : ''}`}
                style={{ fontSize: '11px', height: '30px', paddingTop: '4px', paddingBottom: '4px' }}
              />
              {localFilters.productName && (
                <button
                  type="button"
                  onClick={() => handleClearInput('productName')}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-3 w-3" />
                </button>
              )}
            </div>
          </div>

          {/* Form Doc No */}
          <div className="w-full sm:w-auto sm:flex-1 min-w-[120px]">
            <label className="block text-[11px] font-medium text-gray-700 mb-1" style={{ whiteSpace: 'nowrap' }}>
              Form Doc No
            </label>
            <div className="relative">
              <input
                type="text"
                name="formDocNo"
                value={localFilters.formDocNo || ""}
                onChange={handleChange}
                placeholder=""
                className={`${CONTROL_CLASSES} ${localFilters.formDocNo ? 'pr-8' : ''}`}
                style={{ fontSize: '11px', height: '30px', paddingTop: '4px', paddingBottom: '4px' }}
              />
              {localFilters.formDocNo && (
                <button
                  type="button"
                  onClick={() => handleClearInput('formDocNo')}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-3 w-3" />
                </button>
              )}
            </div>
          </div>

          {/* From Date */}
          <div className="w-full sm:w-auto min-w-[130px]">
            <label className="block text-[11px] font-medium text-gray-700 mb-1" style={{ whiteSpace: 'nowrap' }}>
              From Date
            </label>
            <div className="relative">
              <input
                type={localFilters.fromDate ? "date" : "text"}
                name="fromDate"
                value={localFilters.fromDate || ""}
                onChange={handleChange}
                placeholder="mm/dd/yyyy"
                className={`${CONTROL_CLASSES} ${localFilters.fromDate ? 'pr-14' : 'pr-8'}`}
                style={{ fontSize: '11px', height: '30px', paddingTop: '4px', paddingBottom: '4px' }}
                onFocus={(e) => {
                  if (!e.target.value) {
                    e.target.type = 'date';
                  }
                }}
              />
              {localFilters.fromDate && (
                <button
                  type="button"
                  onClick={() => handleClearInput('fromDate')}
                  className="absolute right-6 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 z-10"
                >
                  <XMarkIcon className="h-3 w-3" />
                </button>
              )}
              <CalendarIcon className="absolute right-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* To Date */}
          <div className="w-full sm:w-auto min-w-[130px]">
            <label className="block text-[11px] font-medium text-gray-700 mb-1" style={{ whiteSpace: 'nowrap' }}>
              To Date
            </label>
            <div className="relative">
              <input
                type={localFilters.toDate ? "date" : "text"}
                name="toDate"
                value={localFilters.toDate || ""}
                onChange={handleChange}
                placeholder="mm/dd/yyyy"
                className={`${CONTROL_CLASSES} ${localFilters.toDate ? 'pr-14' : 'pr-8'}`}
                style={{ fontSize: '11px', height: '30px', paddingTop: '4px', paddingBottom: '4px' }}
                onFocus={(e) => {
                  if (!e.target.value) {
                    e.target.type = 'date';
                  }
                }}
              />
              {localFilters.toDate && (
                <button
                  type="button"
                  onClick={() => handleClearInput('toDate')}
                  className="absolute right-6 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 z-10"
                >
                  <XMarkIcon className="h-3 w-3" />
                </button>
              )}
              <CalendarIcon className="absolute right-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Status Select */}
          <div className="w-full sm:w-auto min-w-[120px]">
            <label className="block text-[11px] font-medium text-gray-700 mb-1">
              Status
            </label>
            <Select
              name="status"
              value={localFilters.status ? statusOptions.find(opt => opt.value === localFilters.status) : null}
              onChange={(selected) => {
                setLocalFilters({ ...localFilters, status: selected ? selected.value : "" });
              }}
              options={statusOptions}
              placeholder=""
              isClearable
              styles={{
                ...customSelectStyles,
                control: (base, state) => ({
                  ...customSelectStyles.control(base, state),
                  minHeight: '30px',
                  height: '30px',
                  fontSize: '11px',
                }),
                indicatorsContainer: (base) => ({
                  ...base,
                  height: '28px',
                }),
              }}
            />
          </div>

          {/* Branch Select */}
          <div className="w-full sm:w-auto min-w-[130px]">
            <label className="block text-[11px] font-medium text-gray-700 mb-1">
              Branch
            </label>
            <Select
              name="branch"
              value={localFilters.branch || null}
              onChange={handleSelectChange}
              options={branchOptions}
              placeholder="All Branch"
              isClearable
              styles={{
                ...customSelectStyles,
                control: (base, state) => ({
                  ...customSelectStyles.control(base, state),
                  minHeight: '30px',
                  height: '30px',
                  fontSize: '11px',
                }),
                indicatorsContainer: (base) => ({
                  ...base,
                  height: '28px',
                }),
              }}
            />
          </div>

          {/* Search and Reset Buttons */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              type="submit"
              className="px-4 bg-[#0dcaf0] text-black rounded-[8px] text-[11px] font-bold hover:bg-[#0bb8d9] transition-colors"
              style={{ height: '30px' }}
            >
              Search
            </button>
            <button
              type="button"
              onClick={clearFilters}
              disabled={!isAnyFilterApplied}
              className="px-3 bg-gray-500 text-white rounded-[8px] text-[11px] font-bold hover:bg-gray-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-1"
              style={{ height: '30px' }}
            >
              <ArrowPathIcon className="h-3 w-3" />
              Reset
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
