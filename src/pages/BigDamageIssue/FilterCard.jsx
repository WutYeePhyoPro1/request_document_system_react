import React, { useEffect, useState } from 'react';
import Select from 'react-select';

export default function FilterCard({ filters, onFilter, onClear, externalBranchOptions }) {
  // Styles and Constants
  const INPUT_TEXT_SIZE = { fontSize: '0.8rem' };

  const CONTROL_CLASSES = `w-full border border-gray-300 rounded-md px-2 py-2
                           text-gray-700
                           focus:outline-none focus:ring-2 focus:ring-blue-500`;

  const statusOptions = [
<<<<<<< HEAD
=======
    { value: '', label: 'All' },
>>>>>>> c2d7396 (big damage issue update)
    { value: 'Ongoing', label: 'Ongoing' },
    { value: 'Checked', label: 'Checked' },
    { value: 'BM Approved', label: 'BM Approved' },
    { value: 'OPApproved', label: 'OP Approved' },
    { value: 'Ac_Acknowledged', label: 'Acknowledged' },
    { value: 'Approved', label: 'Approved' },
    { value: 'Completed', label: 'Completed' },
    { value: 'Cancel', label: 'Cancel' },
  ];

  const [branchOptions, setBranchOptions] = useState([
    { value: '', label: 'All Branch' },
  ]);

  useEffect(() => {
    // If parent passes branch options (even initially), use them and skip fetching
    if (externalBranchOptions) {
      setBranchOptions(externalBranchOptions);
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
        const options = [{ value: '', label: 'All Branch' }, ...mapped];
        setBranchOptions(options);
      } catch (e) {
        // keep default All Branch only on failure
        setBranchOptions([{ value: '', label: 'All Branch' }]);
      }
    };
    fetchBranches();
  }, [externalBranchOptions]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    onFilter({ ...filters, [name]: value });
  };

  const handleSelectChange = (selected, action) => {
    const { name } = action;
<<<<<<< HEAD
    // For multi-select (status), selected is an array or null
    // For single select (branch), selected is an object or null
=======
>>>>>>> c2d7396 (big damage issue update)
    onFilter({ ...filters, [name]: selected });
  };

  const clearFilters = () => {
    onClear?.();
  };

<<<<<<< HEAD
  const isAnyFilterApplied = Object.entries(filters).some(([key, val]) => {
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
=======
  const isAnyFilterApplied = Object.values(filters).some(val => val);

  // Shared react-select style to match input height
  const customSelectStyles = {
    control: (base) => ({
      ...base,
      minHeight: '36px',
      height: '36px',
      fontSize: '0.8rem',
      borderRadius: '0.375rem',
>>>>>>> c2d7396 (big damage issue update)
    }),
    singleValue: (base) => ({
      ...base,
      lineHeight: '36px',
<<<<<<< HEAD
      color: '#374151',
=======
>>>>>>> c2d7396 (big damage issue update)
    }),
    indicatorsContainer: (base) => ({
      ...base,
      height: '36px',
    }),
    placeholder: (base) => ({
      ...base,
      fontSize: '0.8rem',
<<<<<<< HEAD
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
=======
      color: '#9ca3af', // gray-400
>>>>>>> c2d7396 (big damage issue update)
    }),
  };

  return (
    <div className="bg-white shadow-lg rounded-xl p-4 sm:p-6 mx-auto">
      <form className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-x-4 sm:gap-x-6 gap-y-4 items-end">

        {/* Product Name / Code */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">
            Product Name / Code
          </label>
          <input
            type="text"
            name="productName"
            value={filters.productName}
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
            value={filters.formDocNo}
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
            value={filters.fromDate}
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
            value={filters.toDate}
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
<<<<<<< HEAD
            isMulti
            value={filters.status || null}
=======
            value={filters.status}
>>>>>>> c2d7396 (big damage issue update)
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
            value={filters.branch}
            onChange={handleSelectChange}
            options={branchOptions}
            placeholder="Select Branch"
            styles={customSelectStyles}
            isClearable
          />
        </div>

        {/* Clear Filters Button */}
        {isAnyFilterApplied && (
          <div className="col-span-1 sm:col-span-2 md:col-span-3 lg:col-span-6 flex justify-end pt-2">
            <button
              type="button"
              onClick={clearFilters}
              className="px-4 py-1 bg-red-500 text-white rounded-md hover:bg-red-700 text-xs transition duration-150 ease-in-out"
              style={INPUT_TEXT_SIZE}
            >
              Clear Filters
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
