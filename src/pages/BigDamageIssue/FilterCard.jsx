import React, { useEffect, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import Select from 'react-select';
import { CalendarIcon, XMarkIcon, ArrowPathIcon } from '@heroicons/react/24/solid';
import { STATUS_OPTIONS, STATUS_COLORS } from './utils/constants';
  
const CONTROL_CLASSES = `w-full border px-2 text-[#012970] font-bold rounded-[8px] border-[#2ea2d1]
                           focus:outline-none focus:ring-2 focus:ring-[#2ea2d1] focus:ring-opacity-50`;

  const getStatusColor = (statusValue) => {
  const colors = STATUS_COLORS[statusValue];
  return colors ? { bg: colors.bg, text: colors.text, border: colors.text } : { bg: '#fef3c7', text: '#d97706', border: '#d97706' };
  };

  const customSelectStyles = {
    control: (base, state) => ({
      ...base,
      minHeight: '32px',
      fontSize: '10px',
      fontWeight: 'bold',
      color: '#012970',
      borderRadius: '8px',
    borderColor: '#2ea2d1',
      boxShadow: state.isFocused ? '0 0 0 3px rgba(46, 162, 209, 0.1)' : 'none',
      height: state.selectProps.isMulti ? 'auto' : '32px',
    }),
    singleValue: (base) => ({
      ...base,
      lineHeight: '32px',
      color: '#012970',
      fontWeight: 'bold',
      fontSize: '10px',
    }),
  indicatorsContainer: (base) => ({ ...base, height: '32px' }),
  placeholder: (base) => ({ ...base, fontSize: '10px', color: '#9CA3AF', fontWeight: 'bold' }),
    multiValue: (base, state) => {
    const colors = getStatusColor(state.data?.value);
      return {
        ...base,
        backgroundColor: colors.bg,
        borderRadius: '0.375rem',
        padding: '2px',
        margin: '2px',
        fontSize: '0.75rem',
        fontWeight: '500',
        border: `1px solid ${colors.border}`,
      };
    },
    multiValueLabel: (base, state) => {
    const colors = getStatusColor(state.data?.value);
    return { ...base, color: colors.text, fontSize: '0.75rem', fontWeight: '500', padding: '2px 6px' };
    },
    multiValueRemove: (base, state) => {
    const colors = getStatusColor(state.data?.value);
      return {
        ...base,
        color: colors.text,
        borderRadius: '0 0.25rem 0.25rem 0',
        padding: '2px 6px',
      '&:hover': { backgroundColor: colors.border, color: colors.text, cursor: 'pointer' },
      };
    },
    menu: (base) => ({
      ...base,
      borderRadius: '0.5rem',
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
      border: '1px solid #E5E7EB',
      marginTop: '4px',
    }),
    option: (base, state) => ({
      ...base,
      fontSize: '0.8rem',
      padding: '8px 12px',
    backgroundColor: state.isSelected ? '#DBEAFE' : state.isFocused ? '#F3F4F6' : '#F9FAFB',
      color: state.isSelected ? '#1E40AF' : '#374151',
      fontWeight: state.isSelected ? '600' : '400',
      cursor: 'pointer',
  }),
  valueContainer: (base) => ({ ...base, padding: '1px 4px', gap: '2px' }),
};

export default function FilterCard({ filters, onFilter, onClear, externalBranchOptions, allowAllBranchSelection = false }) {
  const { t } = useTranslation();
  
  const normalizeStatusValue = (status) => {
    if (!status) return [];
    if (Array.isArray(status)) {
      return status.map(s => typeof s === 'string' 
        ? STATUS_OPTIONS.find(o => o.value.toLowerCase() === s.toLowerCase()) || { value: s, label: s }
        : s
      );
    }
    if (typeof status === 'string' && status.trim()) {
      return status.split(',').map(p => p.trim()).filter(Boolean)
        .map(p => STATUS_OPTIONS.find(o => o.value.toLowerCase() === p.toLowerCase()) || { value: p, label: p });
    }
    if (typeof status === 'object' && status.value) {
      return [status];
    }
    return [];
  };

  const [localFilters, setLocalFilters] = useState(() => ({
    productName: filters.productName || '',
    formDocNo: filters.formDocNo || '',
    fromDate: filters.fromDate || '',
    toDate: filters.toDate || '',
    status: normalizeStatusValue(filters.status),
    branch: filters.branch || null,
  }));

  const [branchOptions, setBranchOptions] = useState([{ value: '', label: t('filter.allBranch', { defaultValue: 'All Branch' }) }]);
  const prevFiltersRef = useRef(null);
  const hasInitializedRef = useRef(false);

  useEffect(() => {
    if (prevFiltersRef.current === filters) return;
    
    const newFilters = {
      productName: filters.productName || '',
      formDocNo: filters.formDocNo || '',
      fromDate: filters.fromDate || '',
      toDate: filters.toDate || '',
      status: normalizeStatusValue(filters.status),
      branch: filters.branch || null,
    };
    
    setLocalFilters(newFilters);
    prevFiltersRef.current = filters;
  }, [filters]);

  useEffect(() => {
    if (!externalBranchOptions) return;
    
    const allBranchOption = { value: '', label: t('filter.allBranch', { defaultValue: 'All Branch' }) };
    
    if (allowAllBranchSelection) {
      const opts = externalBranchOptions.find(o => !o.value) 
        ? externalBranchOptions 
        : [allBranchOption, ...externalBranchOptions];
      setBranchOptions(opts);
      return;
    }

    try {
      const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
      const userBranchId = storedUser?.from_branch_id;

      if (!userBranchId) {
        setBranchOptions([allBranchOption]);
        return;
      }

      const filteredOptions = externalBranchOptions.filter(option => 
        !option.value || Number(option.value) === Number(userBranchId)
      );

      setBranchOptions(filteredOptions.length > 0 ? filteredOptions : [allBranchOption]);
    } catch {
      setBranchOptions([allBranchOption]);
    }
    
    hasInitializedRef.current = true;
  }, [externalBranchOptions, allowAllBranchSelection, t]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setLocalFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleClearInput = (fieldName) => {
    setLocalFilters(prev => ({ ...prev, [fieldName]: '' }));
  };

  const handleSelectChange = (selected, action) => {
    setLocalFilters(prev => ({ ...prev, [action.name]: selected }));
  };

  const handleSearch = () => onFilter(localFilters);

  const clearFilters = () => {
    const emptyFilters = {
      productName: '',
      formDocNo: '',
      fromDate: '',
      toDate: '',
      status: [],
      branch: null,
    };
    setLocalFilters(emptyFilters);
    onClear?.();
  };

  const isAnyFilterApplied = Object.entries(localFilters).some(([key, val]) => {
    if (key === 'status') return Array.isArray(val) && val.length > 0;
    if (key === 'branch') return false;
    return val !== null && val !== undefined && val !== '';
  });

  const inputStyle = { fontSize: '11px', height: '30px', paddingTop: '4px', paddingBottom: '4px' };

  return (
    <div className="bg-gray-100 shadow-lg rounded-xl p-4 w-full">
      <form onSubmit={(e) => { e.preventDefault(); handleSearch(); }}>
        <div className="flex flex-wrap lg:flex-nowrap items-end gap-3">
          <div className="w-full sm:w-auto sm:flex-1 min-w-[140px]">
            <label className="block text-[11px] font-medium text-gray-700 mb-1" style={{ whiteSpace: 'nowrap' }}>
              {t('filter.productNameCode', { defaultValue: 'Product Name/Code' })}
            </label>
            <div className="relative">
              <input
                type="text"
                name="productName"
                value={localFilters.productName}
                onChange={handleChange}
                placeholder={t('filter.productNameCodePlaceholder', { defaultValue: 'Enter product name/code' })}
                className={`${CONTROL_CLASSES} ${localFilters.productName ? 'pr-8' : ''}`}
                style={inputStyle}
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

          <div className="w-full sm:w-auto sm:flex-1 min-w-[120px]">
            <label className="block text-[11px] font-medium text-gray-700 mb-1" style={{ whiteSpace: 'nowrap' }}>
              {t('filter.formDocNo', { defaultValue: 'Form Doc No' })}
            </label>
            <div className="relative">
              <input
                type="text"
                name="formDocNo"
                value={localFilters.formDocNo}
                onChange={handleChange}
                placeholder={t('filter.formDocNoPlaceholder', { defaultValue: 'Enter document number' })}
                className={`${CONTROL_CLASSES} ${localFilters.formDocNo ? 'pr-8' : ''}`}
                style={inputStyle}
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

          <div className="w-full sm:w-auto min-w-[130px]">
            <label className="block text-[11px] font-medium text-gray-700 mb-1" style={{ whiteSpace: 'nowrap' }}>
              {t('filter.fromDate', { defaultValue: 'From Date' })}
            </label>
            <div className="relative">
              <input
                type={localFilters.fromDate ? 'date' : 'text'}
                name="fromDate"
                value={localFilters.fromDate}
                onChange={handleChange}
                placeholder={t('filter.datePlaceholder', { defaultValue: 'mm/dd/yyyy' })}
                className={`${CONTROL_CLASSES} ${localFilters.fromDate ? 'pr-14' : 'pr-8'}`}
                style={inputStyle}
                onFocus={(e) => { if (!e.target.value) e.target.type = 'date'; }}
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

          <div className="w-full sm:w-auto min-w-[130px]">
            <label className="block text-[11px] font-medium text-gray-700 mb-1" style={{ whiteSpace: 'nowrap' }}>
              {t('filter.toDate', { defaultValue: 'To Date' })}
            </label>
            <div className="relative">
              <input
                type={localFilters.toDate ? 'date' : 'text'}
                name="toDate"
                value={localFilters.toDate}
                onChange={handleChange}
                placeholder={t('filter.datePlaceholder', { defaultValue: 'mm/dd/yyyy' })}
                className={`${CONTROL_CLASSES} ${localFilters.toDate ? 'pr-14' : 'pr-8'}`}
                style={inputStyle}
                onFocus={(e) => { if (!e.target.value) e.target.type = 'date'; }}
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

          <div className="w-full sm:w-auto min-w-[120px]">
            <label className="block text-[11px] font-medium text-gray-700 mb-1">
              {t('filter.status', { defaultValue: 'Status' })}
            </label>
            <Select
              name="status"
              value={localFilters.status}
              onChange={(selected) => handleSelectChange(selected, { name: 'status' })}
              options={STATUS_OPTIONS}
              placeholder={t('filter.statusPlaceholder', { defaultValue: 'Select status' })}
              isClearable
              isMulti
              closeMenuOnSelect={false}
              styles={{
                ...customSelectStyles,
                control: (base, state) => ({
                  ...customSelectStyles.control(base, state),
                  minHeight: '30px',
                  height: 'auto',
                  fontSize: '11px',
                }),
                indicatorsContainer: (base) => ({ ...base, height: '28px' }),
              }}
            />
          </div>

          <div className="w-full sm:w-auto min-w-[130px]">
            <label className="block text-[11px] font-medium text-gray-700 mb-1">
              {t('filter.branch', { defaultValue: 'Branch' })}
            </label>
            <Select
              name="branch"
              value={localFilters.branch}
              onChange={handleSelectChange}
              options={branchOptions}
              placeholder={t('filter.allBranch', { defaultValue: 'All Branch' })}
              isClearable
              styles={{
                ...customSelectStyles,
                control: (base, state) => ({
                  ...customSelectStyles.control(base, state),
                  minHeight: '30px',
                  height: '30px',
                  fontSize: '11px',
                }),
                indicatorsContainer: (base) => ({ ...base, height: '28px' }),
              }}
            />
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              type="submit"
              className="px-4 bg-[#0dcaf0] text-black rounded-[8px] text-[11px] font-bold hover:bg-[#0bb8d9] transition-colors"
              style={{ height: '30px' }}
            >
              {t('filter.search', { defaultValue: 'Search' })}
            </button>
            <button
              type="button"
              onClick={clearFilters}
              disabled={!isAnyFilterApplied}
              className="px-3 bg-gray-500 text-white rounded-[8px] text-[11px] font-bold hover:bg-gray-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-1"
              style={{ height: '30px' }}
            >
              <ArrowPathIcon className="h-3 w-3" />
              {t('filter.reset', { defaultValue: 'Reset' })}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
