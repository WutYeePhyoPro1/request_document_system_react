import React, { useEffect, useState } from 'react';
import Select from 'react-select';
import { MagnifyingGlassIcon } from '@heroicons/react/24/solid';

export default function FilterCard({ filters, onFilter, onClear, externalBranchOptions }) {
  // Styles and Constants
  const INPUT_TEXT_SIZE = { fontSize: '0.8rem' };

  const CONTROL_CLASSES = `w-full border border-gray-300 rounded-md px-2 py-2
                           text-gray-700
                           focus:outline-none focus:ring-2 focus:ring-blue-500`;

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

  // Local state to store filter values before applying
  const [localFilters, setLocalFilters] = useState({
    productName: "",
    formDocNo: "",
    fromDate: "",
    toDate: "",
    status: null,
    branch: null,
  });

  const [branchOptions, setBranchOptions] = useState([
    { value: '', label: 'All Branch' },
  ]);

  // Function to filter branches based on user's branch
  const filterBranchesByUser = (allBranchOptions) => {
    try {
      const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
      const userBranchId = storedUser?.from_branch_id;

      if (!userBranchId) {
        // If user has no branch assigned, show only "All Branch" option
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

      setBranchOptions(filteredOptions.length > 0 ? filteredOptions : [{ value: '', label: 'All Branch' }]);
    } catch (e) {
      console.error('Error filtering branches by user:', e);
      // On error, show only "All Branch" as fallback
      setBranchOptions([{ value: '', label: 'All Branch' }]);
    }
  };

  // Sync local filters with props when filters are cleared from parent
  useEffect(() => {
    setLocalFilters({
      productName: filters.productName || "",
      formDocNo: filters.formDocNo || "",
      fromDate: filters.fromDate || "",
      toDate: filters.toDate || "",
      status: filters.status || null,
      branch: filters.branch || null,
    });
  }, [filters]);

  useEffect(() => {
    // If parent passes branch options (even initially), use them and skip fetching
    if (externalBranchOptions) {
      // Filter branches based on user's branch
      filterBranchesByUser(externalBranchOptions);
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
        // Filter branches based on user's branch
        filterBranchesByUser(allOptions);
      } catch (e) {
        // keep default All Branch only on failure
        setBranchOptions([{ value: '', label: 'All Branch' }]);
      }
    };
    fetchBranches();
  }, [externalBranchOptions]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    // Only update local state, don't apply filters
    setLocalFilters({ ...localFilters, [name]: value });
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
      status: null,
      branch: null,
    };
    setLocalFilters(emptyFilters);
    // Clear filters in parent
    onClear?.();
  };

  const isAnyFilterApplied = Object.entries(localFilters).some(([key, val]) => {
    if (key === 'status') {
      // For status (multi-select), check if it's an array with items
      return Array.isArray(val) && val.length > 0;
    }
    return val !== null && val !== undefined && val !== '';
  });

  // Get status color based on status value
  const getStatusColor = (statusValue) => {
    const colorMap = {
      'Ongoing': { bg: '#FED7AA', text: '#9A3412', border: '#FB923C' },
      'Checked': { bg: '#FEF3C7', text: '#92400E', border: '#FBBF24' },
      'BM Approved': { bg: '#DBEAFE', text: '#1E40AF', border: '#60A5FA' },
      'OPApproved': { bg: '#E0E7FF', text: '#3730A3', border: '#818CF8' },
      'Ac_Acknowledged': { bg: '#F3E8FF', text: '#6B21A8', border: '#A78BFA' },
      'Approved': { bg: '#D1FAE5', text: '#065F46', border: '#34D399' },
      'Completed': { bg: '#D1FAE5', text: '#065F46', border: '#10B981' },
      'Cancel': { bg: '#F3F4F6', text: '#374151', border: '#9CA3AF' },
    };
    return colorMap[statusValue] || { bg: '#F3F4F6', text: '#374151', border: '#9CA3AF' };
  };

  // Shared react-select style to match input height
  const customSelectStyles = {
    control: (base, state) => ({
      ...base,
      minHeight: '36px',
      fontSize: '0.8rem',
      borderRadius: '0.5rem',
      borderColor: state.isFocused ? '#3B82F6' : '#D1D5DB',
      boxShadow: state.isFocused ? '0 0 0 3px rgba(59, 130, 246, 0.1)' : 'none',
      transition: 'all 0.2s ease',
      // Allow height to grow for multi-select
      height: state.selectProps.isMulti ? 'auto' : '36px',
      '&:hover': {
        borderColor: state.isFocused ? '#3B82F6' : '#9CA3AF',
      },
    }),
    singleValue: (base) => ({
      ...base,
      lineHeight: '36px',
      color: '#374151',
    }),
    indicatorsContainer: (base) => ({
      ...base,
      height: '36px',
    }),
    placeholder: (base) => ({
      ...base,
      fontSize: '0.8rem',
      color: '#9CA3AF',
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
      padding: '4px 8px',
      gap: '4px',
    }),
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    handleSearch();
  };

  return (
    <div className="bg-white shadow-lg rounded-xl p-4 sm:p-6 mx-auto">
      <form onSubmit={handleFormSubmit} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-x-4 sm:gap-x-6 gap-y-4 items-end">

        {/* Product Name / Code */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">
            Product Name / Code
          </label>
          <input
            type="text"
            name="productName"
            value={localFilters.productName || ""}
            onChange={handleChange}
            placeholder="Enter product name or code"
            className={CONTROL_CLASSES}
            style={INPUT_TEXT_SIZE}
          />
        </div>

        {/* Form Doc No */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">
            Form Doc No
          </label>
          <input
            type="text"
            name="formDocNo"
            value={localFilters.formDocNo || ""}
            onChange={handleChange}
            placeholder="Document number"
            className={CONTROL_CLASSES}
            style={INPUT_TEXT_SIZE}
          />
        </div>

        {/* From Date */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">
            From Date
          </label>
          <input
            type="date"
            name="fromDate"
            value={localFilters.fromDate || ""}
            onChange={handleChange}
            className={CONTROL_CLASSES}
            style={INPUT_TEXT_SIZE}
          />
        </div>

        {/* To Date */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">
            To Date
          </label>
          <input
            type="date"
            name="toDate"
            value={localFilters.toDate || ""}
            onChange={handleChange}
            className={CONTROL_CLASSES}
            style={INPUT_TEXT_SIZE}
          />
        </div>

        {/* Status Select */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">
            Status
          </label>
          <Select
            name="status"
            isMulti
            value={localFilters.status || null}
            onChange={handleSelectChange}
            options={statusOptions}
            placeholder="Select Status"
            styles={customSelectStyles}
            isClearable
          />
        </div>

        {/* Branch Select */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">
            Branch
          </label>
          <Select
            name="branch"
            value={localFilters.branch || null}
            onChange={handleSelectChange}
            options={branchOptions}
            placeholder="Select Branch"
            styles={customSelectStyles}
            isClearable
          />
        </div>

        {/* Action Buttons */}
        <div className="col-span-1 sm:col-span-2 md:col-span-3 lg:col-span-6 flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={handleSearch}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-xs font-medium transition duration-150 ease-in-out shadow-sm hover:shadow-md"
            style={INPUT_TEXT_SIZE}
          >
            <MagnifyingGlassIcon className="h-4 w-4" />
            Search
          </button>
          {isAnyFilterApplied && (
            <button
              type="button"
              onClick={clearFilters}
              className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-700 text-xs font-medium transition duration-150 ease-in-out shadow-sm hover:shadow-md"
              style={INPUT_TEXT_SIZE}
            >
              Clear Filters
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
