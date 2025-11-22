import React, { useEffect, useState } from 'react';
import Select from 'react-select';

export default function FilterCard({ filters, onFilter, onClear, externalBranchOptions }) {
  // Styles and Constants
  const INPUT_TEXT_SIZE = { fontSize: '0.8rem' };

  const CONTROL_CLASSES = `w-full border border-gray-300 rounded-md px-2 py-2
                           text-gray-700
                           focus:outline-none focus:ring-2 focus:ring-blue-500`;

  const statusOptions = [
    { value: '', label: 'All' },
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
    onFilter({ ...filters, [name]: selected });
  };

  const clearFilters = () => {
    onClear?.();
  };

  const isAnyFilterApplied = Object.values(filters).some(val => val);

  // Shared react-select style to match input height
  const customSelectStyles = {
    control: (base) => ({
      ...base,
      minHeight: '36px',
      height: '36px',
      fontSize: '0.8rem',
      borderRadius: '0.375rem',
    }),
    singleValue: (base) => ({
      ...base,
      lineHeight: '36px',
    }),
    indicatorsContainer: (base) => ({
      ...base,
      height: '36px',
    }),
    placeholder: (base) => ({
      ...base,
      fontSize: '0.8rem',
      color: '#9ca3af', // gray-400
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
            value={filters.status}
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
