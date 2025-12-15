import React, { useState } from 'react';
import { useNavigate, useSearchParams } from "react-router-dom";
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import { DocumentIcon, ClipboardDocumentIcon, CheckIcon, ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/solid';
import { FaEnvelope } from 'react-icons/fa';
import '../../components/DamageForm/ButtonHoverEffects.css';

// Red Speech Bubble Icon Component
const RedSpeechBubbleIcon = ({ className = "h-4 w-4" }) => {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Speech bubble body with gradient effect */}
      <defs>
        <linearGradient id="speechBubbleGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#ef4444" stopOpacity="1" />
          <stop offset="100%" stopColor="#dc2626" stopOpacity="1" />
        </linearGradient>
      </defs>
      {/* Main speech bubble body */}
      <path
        d="M18 4H6C4.89543 4 4 4.89543 4 6V14C4 15.1046 4.89543 16 6 16H8L12 20L16 16H18C19.1046 16 20 15.1046 20 14V6C20 4.89543 19.1046 4 18 4Z"
        fill="url(#speechBubbleGradient)"
        stroke="#b91c1c"
        strokeWidth="0.5"
      />
      {/* Left eye (white circle) */}
      <circle cx="9" cy="9" r="1.5" fill="#ffffff" />
      {/* Right eye (white circle) */}
      <circle cx="15" cy="9" r="1.5" fill="#ffffff" />
    </svg>
  );
};

// Copy Button Component
const CopyButton = ({ text, size = 'small' }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e) => {
    e.stopPropagation(); // Prevent row click
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const iconSize = size === 'small' ? 'h-4 w-4' : 'h-5 w-5';
  const buttonSize = size === 'small' ? 'p-1.5' : 'p-2';

  return (
    <button
      onClick={handleCopy}
      className={`${buttonSize} ml-2 inline-flex items-center justify-center text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors duration-200`}
      title={copied ? 'Copied!' : 'Copy document number'}
    >
      {copied ? (
        <CheckIcon className={`${iconSize} text-green-600`} />
      ) : (
        <ClipboardDocumentIcon className={iconSize} />
      )}
    </button>
  );
};

const StatusBadge = ({ status }) => {
  // Match Laravel blade badge colors exactly from custom.css
  let colorClasses = '';
  switch (status) {
    case 'Ongoing':
      // custom-badge-bg-ongoing: bg #fbb193, text #e1341e
      colorClasses = 'rounded-full';
      return (
        <span
          className={`inline-flex items-center px-3 py-1 text-xs font-semibold ${colorClasses}`}
          style={{ backgroundColor: '#fbb193', color: '#e1341e' }}
        >
          {status}
        </span>
      );
    case 'Checked':
      // custom-badge-bg-checked: bg #fedec3, text #fb923c
      colorClasses = 'rounded-full';
      return (
        <span
          className={`inline-flex items-center px-3 py-1 text-xs font-semibold ${colorClasses}`}
          style={{ backgroundColor: '#fedec3', color: '#fb923c' }}
        >
          {status}
        </span>
      );
    case 'BM Approved':
    case 'BMApproved':
      // custom-badge-bg-bm-approved: bg #ffeaab, text #e6ac00
      colorClasses = 'rounded-full';
      return (
        <span
          className={`inline-flex items-center px-3 py-1 text-xs font-semibold ${colorClasses}`}
          style={{ backgroundColor: '#ffeaab', color: '#e6ac00' }}
        >
          {status}
        </span>
      );
    case 'OPApproved':
    case 'OP Approved':
    case 'Approved':
      // custom-badge-bg-approved: bg #e9f9cf, text #a3e635
      colorClasses = 'rounded-full';
      return (
        <span
          className={`inline-flex items-center px-3 py-1 text-xs font-semibold ${colorClasses}`}
          style={{ backgroundColor: '#e9f9cf', color: '#a3e635' }}
        >
          {status}
        </span>
      );
    case 'Ac_Acknowledged':
    case 'Acknowledged':
      // custom-badge-bg-acknowledged: bg #aff1d7, text #20be7f
      colorClasses = 'rounded-full';
      return (
        <span
          className={`inline-flex items-center px-3 py-1 text-xs font-semibold ${colorClasses}`}
          style={{ backgroundColor: '#aff1d7', color: '#20be7f' }}
        >
          {status}
        </span>
      );
    case 'Completed':
    case 'Issued':
    case 'SupervisorIssued':
      // custom-badge-bg-completed: bg #adebbb, text #28a745
      colorClasses = 'rounded-full';
      return (
        <span
          className={`inline-flex items-center px-3 py-1 text-xs font-semibold ${colorClasses}`}
          style={{ backgroundColor: '#adebbb', color: '#28a745' }}
        >
          {status}
        </span>
      );
    case 'Cancel':
    case 'Cancelled':
      // custom-badge-bg-cancel: bg #fda19d, text #f91206
      colorClasses = 'rounded-full';
      return (
        <span
          className={`inline-flex items-center px-3 py-1 text-xs font-semibold ${colorClasses}`}
          style={{ backgroundColor: '#fda19d', color: '#f91206' }}
        >
          {status}
        </span>
      );
    default:
      // Default gray for unknown statuses
      colorClasses = 'rounded-full';
      return (
        <span
          className={`inline-flex items-center px-3 py-1 text-xs font-semibold ${colorClasses}`}
          style={{ backgroundColor: '#f3f4f6', color: '#374151' }}
        >
          {status}
        </span>
      );
  }
};

// Animated Empty State Component
const EmptyState = () => {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 animate-fade-in">
      <style>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-20px);
          }
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
        @keyframes rotate {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        .animate-fade-in {
          animation: fadeIn 0.6s ease-out;
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        .animate-pulse-slow {
          animation: pulse 2s ease-in-out infinite;
        }
        .animate-rotate-slow {
          animation: rotate 20s linear infinite;
        }
      `}</style>
  
      {/* Animated Document Icon */}
      <div className="relative mb-6">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-32 h-32 bg-blue-100 rounded-full animate-pulse-slow"></div>
        </div>
        <div className="relative animate-float">
          <DocumentIcon className="w-24 h-24 text-blue-400" />
        </div>
        {/* Floating particles */}
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-4 left-8 w-2 h-2 bg-blue-300 rounded-full animate-pulse-slow" style={{ animationDelay: '0s' }}></div>
          <div className="absolute top-12 right-12 w-2 h-2 bg-blue-300 rounded-full animate-pulse-slow" style={{ animationDelay: '0.5s' }}></div>
          <div className="absolute bottom-8 left-12 w-2 h-2 bg-blue-300 rounded-full animate-pulse-slow" style={{ animationDelay: '1s' }}></div>
          <div className="absolute bottom-4 right-8 w-2 h-2 bg-blue-300 rounded-full animate-pulse-slow" style={{ animationDelay: '1.5s' }}></div>
        </div>
      </div>
      
      {/* Text Content */}
      <div className="text-center space-y-2">
        <h3 className="text-xl font-semibold text-gray-700">
          No Data Available
        </h3>
        <p className="text-sm text-gray-500 max-w-md">
          There are no damage issue records to display at the moment.
        </p>
      </div>
      
      {/* Decorative Elements */}
      <div className="mt-8 flex space-x-2">
        <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse-slow" style={{ animationDelay: '0s' }}></div>
        <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse-slow" style={{ animationDelay: '0.3s' }}></div>
        <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse-slow" style={{ animationDelay: '0.6s' }}></div>
      </div>
    </div>
  );
};

const Pagination = ({ totalRows, rowsPerPage, currentPage, onPageChange }) => {
  const totalPages = Math.max(1, Math.ceil((totalRows || 0) / (rowsPerPage || 1)));
  const pages = [];
  const start = Math.max(1, currentPage - 2);
  const end = Math.min(totalPages, start + 4);
  for (let i = start; i <= end; i++) pages.push(i);

  return (
    <div className="flex items-center space-x-2">
      <button
        className="p-2 text-gray-400 border border-gray-200 rounded-lg hover:bg-gray-50"
        onClick={() => onPageChange?.(Math.max(1, currentPage - 1))}
        disabled={currentPage <= 1}
      >
        &lt;
      </button>
      {pages.map(number => (
        <button
          key={number}
          className={`px-4 py-2 text-sm font-semibold rounded-lg ${
            number === currentPage
              ? 'bg-blue-500 text-white shadow-md'
              : 'text-gray-700 hover:bg-gray-100 border border-gray-200'
          }`}
          onClick={() => onPageChange?.(number)}
        >
          {number}
        </button>
      ))}
      <button
        className="p-2 text-gray-400 border border-gray-200 rounded-lg hover:bg-gray-50"
        onClick={() => onPageChange?.(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage >= totalPages}
      >
        &gt;
      </button>
    </div>
  );
};

function DamageIssueList({ data = [], loading = false, currentPage = 1, perPage = 15, totalRows = 0, onPageChange, branchMap = {}, productFilter = '', notificationCounts = new Map() }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams(); // Use React Router's searchParams to react to URL changes

  // Get filter parameters from URL - use searchParams from React Router
  // Also check window.location as fallback in case searchParams hasn't updated yet
  // Also accept productFilter as prop (from Dashboard state) as a fallback
  const searchFromParams = searchParams.get('search');
  const searchFromUrl = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('search') : null;
  const productNameParam = searchParams.get('product_name');
  const productCodeParam = searchParams.get('product_code');
  // Use prop first, then URL params - prop is more reliable as it comes directly from Dashboard state
  const productNameFilter = productFilter || searchFromParams || searchFromUrl || productNameParam || productCodeParam || '';
  
  // Debug: Log searchParams changes
  React.useEffect(() => {
    if (typeof window !== 'undefined' && window.console) {
      window.console.log('[DamageIssueList] searchParams changed:', {
        searchParam: searchParams.get('search'),
        searchFromParams,
        searchFromUrl,
        productNameParam: searchParams.get('product_name'),
        productCodeParam: searchParams.get('product_code'),
        allParams: searchParams.toString(),
        windowLocationSearch: window.location.search,
        productNameFilter
      });
    }
  }, [searchParams, productNameFilter, searchFromParams, searchFromUrl]);
  
  // Debug logging - always log to see what's happening
  React.useEffect(() => {
    if (typeof window !== 'undefined' && window.console) {
      window.console.log('[DamageIssueList] Component rendered:', {
        dataLength: Array.isArray(data) ? data.length : 0,
        productFilter: productNameFilter,
        currentPage,
        loading,
        totalRows,
        urlSearch: searchParams.toString(),
        searchParamValue: searchParams.get('search')
      });
      
      if (Array.isArray(data) && data.length > 0) {
        window.console.log('[DamageIssueList] Sample data row:', {
          keys: Object.keys(data[0] || {}),
          hasProductCode: !!data[0]?.product_code,
          hasProductName: !!data[0]?.product_name,
          productCode: data[0]?.product_code,
          productName: data[0]?.product_name,
          fullRow: data[0]
        });
      } else {
        window.console.warn('[DamageIssueList] No data received!', { data });
      }
    }
  }, [data, productNameFilter, currentPage, loading, totalRows, searchParams]);

  // Helper function to navigate to detail with page preservation
  const navigateToDetail = (detailId, bigDamageId, generalFormId) => {
    // Store the current URL (with all query params) in sessionStorage for reliable retrieval
    const currentUrl = window.location.pathname + window.location.search;
    sessionStorage.setItem('bigDamageIssueReturnUrl', currentUrl);
    
    navigate(`/big-damage-issue-add/${detailId}`, { 
      state: { 
        bigDamageId, 
        generalFormId, 
        returnPage: currentPage, // Preserve current page
        returnUrl: currentUrl // Preserve full URL with filters
      } 
    });
  };

  // Ensure data is an array and remove duplicates
  const rawIssues = Array.isArray(data) ? data : [];
  const productNameFilterLower = productNameFilter ? productNameFilter.toLowerCase().trim() : '';
  
  // Always log filter status - use window.console to ensure it works
  // Use useEffect to log after render to catch URL changes
  React.useEffect(() => {
    if (typeof window !== 'undefined' && window.console) {
      window.console.log('[DamageIssueList] Processing data (useEffect):', {
        rawIssuesCount: rawIssues.length,
        productFilter: productNameFilter,
        productFilterLower: productNameFilterLower,
        hasFilter: !!productNameFilterLower,
        urlSearch: searchParams.toString(),
        searchParam: searchParams.get('search'),
        allSearchParams: Object.fromEntries(searchParams.entries())
      });
    }
  }, [rawIssues.length, productNameFilter, productNameFilterLower, searchParams]);
  
  // Also log during render for immediate feedback
  if (typeof window !== 'undefined' && window.console && productNameFilter) {
    window.console.log('[DamageIssueList] Processing data (render):', {
      rawIssuesCount: rawIssues.length,
      productFilter: productNameFilter,
      productFilterLower: productNameFilterLower,
      hasFilter: !!productNameFilterLower,
      urlSearch: searchParams.toString(),
      searchParam: searchParams.get('search')
    });
  }
  
  // Group items by general_form_id to collect all products per form
  // This allows us to check if any product in a form matches the filter
  // Memoize this to prevent glitches when filter is first applied
  const formsWithItems = React.useMemo(() => {
    const formsMap = new Map();
    rawIssues.forEach((row) => {
      const formId = row?.general_form?.id || row?.general_form_id;
      if (formId) {
        if (!formsMap.has(formId)) {
          formsMap.set(formId, {
            formId,
            generalForm: row?.general_form,
            items: [],
            formRow: row // Keep the first row as the form representation
          });
        }
        // Add this row's product info to the form's items
        // Check multiple possible locations for product code and name
        // Also check nested structures and alternative field names
        const productCode = (
          row?.product_code || 
          row?.code || 
          row?.productCode || 
          row?.product?.code ||
          row?.product?.product_code ||
          ''
        ).toString().trim();
        const productName = (
          row?.product_name || 
          row?.name || 
          row?.productName || 
          row?.product?.name ||
          row?.product?.product_name ||
          ''
        ).toString().trim();
        formsMap.get(formId).items.push({
          product_code: productCode,
          product_name: productName,
          amount: parseFloat(row?.amount || row?.total || 0),
          rawRow: row // Keep raw row for debugging
        });
      }
    });
    return formsMap;
  }, [data]); // Use data as dependency since rawIssues is derived from it
  
  if (productNameFilterLower) {
    if (typeof window !== 'undefined' && window.console) {
      window.console.log('[DamageIssueList] Forms grouped:', formsWithItems.size);
      window.console.log('[DamageIssueList] Sample form items:', Array.from(formsWithItems.values())[0]?.items);
    }
  }
  
  // Calculate total amounts per form
  const formTotals = React.useMemo(() => {
    const totals = new Map();
    formsWithItems.forEach((formData, formId) => {
      const total = formData.items.reduce((sum, item) => sum + (item.amount || 0), 0);
      totals.set(formId, total);
    });
    return totals;
  }, [formsWithItems]);
  
  // Filter forms based on product name/code if filter is active
  // Use useMemo to prevent unnecessary recalculations and glitches
  const filteredForms = React.useMemo(() => {
    let forms = Array.from(formsWithItems.values());
    
    if (typeof window !== 'undefined' && window.console) {
      window.console.log('[DamageIssueList] Before filtering:', {
        totalForms: forms.length,
        productFilter: productNameFilterLower,
        sampleFormItems: forms[0]?.items || []
      });
    }
    
    if (productNameFilterLower) {
      const beforeFilterCount = forms.length;
      forms = forms.filter(formData => {
        // Check if any item in this form matches the filter
        const hasMatchingItem = formData.items.some(item => {
          // Convert to string and normalize - handle numbers, null, undefined
          const itemCode = String(item.product_code || '').toLowerCase().trim();
          const itemName = String(item.product_name || '').toLowerCase().trim();
          // Use includes for partial matching - also try exact match and startsWith
          const codeMatches = itemCode && (
            itemCode.includes(productNameFilterLower) || 
            itemCode === productNameFilterLower ||
            itemCode.startsWith(productNameFilterLower) ||
            productNameFilterLower.startsWith(itemCode)
          );
          const nameMatches = itemName && (
            itemName.includes(productNameFilterLower) || 
            itemName === productNameFilterLower ||
            itemName.startsWith(productNameFilterLower)
          );
          
          if (codeMatches || nameMatches) {
            if (typeof window !== 'undefined' && window.console) {
              window.console.log('[DamageIssueList] Match found:', {
                itemCode,
                itemName,
                filter: productNameFilterLower,
                codeMatches,
                nameMatches
              });
            }
          }
          
          return codeMatches || nameMatches;
        });
        
        // Also check the form row itself for product info (in case it's a single-item form)
        if (!hasMatchingItem && formData.formRow) {
          const rowCode = (
            formData.formRow?.product_code || 
            formData.formRow?.code || 
            formData.formRow?.productCode ||
            formData.formRow?.product?.code ||
            formData.formRow?.product?.product_code ||
            ''
          ).toString().toLowerCase().trim();
          const rowName = (
            formData.formRow?.product_name || 
            formData.formRow?.name || 
            formData.formRow?.productName ||
            formData.formRow?.product?.name ||
            formData.formRow?.product?.product_name ||
            ''
          ).toString().toLowerCase().trim();
          const codeMatches = rowCode && rowCode.includes(productNameFilterLower);
          const nameMatches = rowName && rowName.includes(productNameFilterLower);
          
          if (codeMatches || nameMatches) {
            if (typeof window !== 'undefined' && window.console) {
              window.console.log('[DamageIssueList] Match found in formRow:', {
                rowCode,
                rowName,
                filter: productNameFilterLower
              });
            }
            return true;
          }
        }
        
        return hasMatchingItem;
      });
      
      if (typeof window !== 'undefined' && window.console) {
        window.console.log('[DamageIssueList] After filtering:', {
          before: beforeFilterCount,
          after: forms.length,
          filter: productNameFilterLower,
          filteredOut: beforeFilterCount - forms.length
        });
        
        if (forms.length === 0 && beforeFilterCount > 0) {
          window.console.warn('[DamageIssueList] No forms matched filter!', {
            filter: productNameFilterLower,
            sampleItems: formsWithItems.values().next().value?.items || [],
            sampleFormRow: formsWithItems.values().next().value?.formRow || null,
            allProductCodes: Array.from(formsWithItems.values()).flatMap(f => f.items.map(i => i.product_code)).filter(Boolean).slice(0, 10),
            allProductNames: Array.from(formsWithItems.values()).flatMap(f => f.items.map(i => i.product_name)).filter(Boolean).slice(0, 10)
          });
        }
      }
    }
    
    return forms;
  }, [formsWithItems, productNameFilterLower]);
  
  // Convert back to row format for compatibility with existing code
  // Remove duplicates by form ID
  const seenFormIds = new Set();
  let allFilteredIssues = filteredForms
    .map(formData => formData.formRow)
    .filter((row) => {
      const formId = row?.general_form?.id || row?.general_form_id || row?.id;
      if (!formId) return true;
    if (seenFormIds.has(formId)) {
        return false;
    }
    seenFormIds.add(formId);
      return true;
    });
  
  // Calculate total after filtering (for pagination)
  const filteredTotal = allFilteredIssues.length;
  
  // Apply client-side pagination if we have a product filter
  // (Dashboard passes all rows when product filter is active)
  let issues = allFilteredIssues;
  if (productNameFilterLower && allFilteredIssues.length > perPage) {
    const startIndex = (currentPage - 1) * perPage;
    issues = allFilteredIssues.slice(startIndex, startIndex + perPage);
  }
  
  // Use filtered total for pagination when product filter is active
  const effectiveTotalRows = productNameFilterLower ? filteredTotal : totalRows;
  
  const hasRecords = issues.length > 0;
  const isEmpty = !loading && !hasRecords;

  const normalizeBranch = (branch) => {
    if (!branch) {
      return { id: null, name: null };
    }

    if (typeof branch === 'object') {
      return {
        id: branch.id ?? branch.branch_id ?? branch.branch_code ?? null,
        name: branch.branch_name ?? branch.name ?? branch.branch_short_name ?? null,
      };
    }

    return { id: branch, name: null };
  };

  const resolveBranchName = (gf, branchInfo) => {
    if (branchInfo.name) return branchInfo.name;
    if (gf?.to_branch_name) return gf.to_branch_name;
    if (gf?.from_branch_name) return gf.from_branch_name;
    if (branchInfo.id != null && branchMap[branchInfo.id]) return branchMap[branchInfo.id];
    if (branchInfo.id != null) return String(branchInfo.id);
    return '-';
  };

  const headers = [
    'No',
    '',
    'Status',
    'Document No',
    'Sell / Not Sell',
    'Branch',
    'Requested By',
    'Amount',
    'Created Date',
    'Modified',
  ];

  // Helper function to get total amount from row data
  const getTotalAmount = (row, gf) => {
    // First, try to get from our pre-calculated formTotals map
    const formId = gf?.id || row?.general_form_id;
    if (formId && formTotals.has(formId)) {
      return formTotals.get(formId);
    }
    
    // Fallback: Try direct amount from current row
    const rowAmount = parseFloat(row?.amount || row?.total || 0);
    if (rowAmount > 0) {
      return rowAmount;
    }
    
    // Try multiple possible locations for total amount
    let totalAmount = 
      // Check general_form first
      gf?.total_amount || 
      gf?.totalAmount || 
      gf?.total_amt ||
      gf?.sum_total ||
      gf?.sumTotal ||
      // Check row directly
      row?.total_amount || 
      row?.totalAmount ||
      row?.total_amt ||
      row?.sum_total ||
      row?.sumTotal ||
      // Check big_damage_issue object if exists
      row?.big_damage_issue?.total_amount ||
      row?.big_damage_issue?.totalAmount ||
      gf?.big_damage_issue?.total_amount ||
      gf?.big_damage_issue?.totalAmount ||
      // Check if there's a calculated total in the response
      row?.general_form_total ||
      gf?.general_form_total ||
      0;
    
    // If no direct total, calculate from items if available
    if (!totalAmount || totalAmount === 0) {
      // Check items in general_form
      if (Array.isArray(gf?.items) && gf.items.length > 0) {
        totalAmount = gf.items.reduce((sum, item) => {
          // Try direct amount field first
          let itemAmount = item.amount || item.total_amount || item.totalAmount || item.amt || item.total || 0;
          
          // If no direct amount, calculate from price * quantity
          if (!itemAmount || itemAmount === 0) {
            const price = parseFloat(item.price || item.unit_price || item.unitPrice || item.unitPrice || 0);
            const qty = parseFloat(item.final_qty || item.finalQty || item.actual_qty || item.actualQty || item.request_qty || item.requestQty || item.quantity || item.qty || 0);
            itemAmount = price * qty;
          }
          
          return sum + (parseFloat(itemAmount) || 0);
        }, 0);
      }
      
      // Check items in row
      if ((!totalAmount || totalAmount === 0) && Array.isArray(row?.items) && row.items.length > 0) {
        totalAmount = row.items.reduce((sum, item) => {
          let itemAmount = item.amount || item.total_amount || item.totalAmount || item.amt || item.total || 0;
          
          if (!itemAmount || itemAmount === 0) {
            const price = parseFloat(item.price || item.unit_price || item.unitPrice || 0);
            const qty = parseFloat(item.final_qty || item.finalQty || item.actual_qty || item.actualQty || item.request_qty || item.requestQty || item.quantity || item.qty || 0);
            itemAmount = price * qty;
          }
          
          return sum + (parseFloat(itemAmount) || 0);
        }, 0);
      }
      
      // Check damage_items if available
      if ((!totalAmount || totalAmount === 0) && Array.isArray(row?.damage_items) && row.damage_items.length > 0) {
        totalAmount = row.damage_items.reduce((sum, item) => {
          let itemAmount = item.amount || item.total_amount || item.totalAmount || item.amt || item.total || 0;
          
          if (!itemAmount || itemAmount === 0) {
            const price = parseFloat(item.price || item.unit_price || item.unitPrice || 0);
            const qty = parseFloat(item.final_qty || item.finalQty || item.actual_qty || item.actualQty || item.request_qty || item.requestQty || item.quantity || item.qty || 0);
            itemAmount = price * qty;
          }
          
          return sum + (parseFloat(itemAmount) || 0);
        }, 0);
      }
    }
    
    const finalAmount = parseFloat(totalAmount) || 0;
    return finalAmount;
  };

  return (
    <div className="mx-auto font-sans">
      <div className="hidden md:block bg-white rounded-xl shadow-lg">
        <div className="overflow-x-auto">
          <div className="overflow-hidden rounded-t-xl border border-gray-200">
            {loading ? (
              <div className="p-4">
                <Skeleton count={5} height={50} className="mb-2" />
              </div>
            ) : isEmpty ? (
              <EmptyState />
            ) : (
              <table className="min-w-full">
                <thead className="bg-white border-b border-gray-200">
                  <tr>
                    {headers.map((header, index) => (
                      <th
                        key={index}
                        scope="col"
                        className={`px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${
                          index === 0 ? 'w-12' : ''
                        }`}
                      >
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody className="bg-white">
                  {issues.map((row, idx) => {
                    const gf = row.general_form || {};
                    const detailId = row.id;
                    const displayNo = (currentPage - 1) * perPage + idx + 1;
                    const toBranchInfo = normalizeBranch(gf.to_branch || gf.toBranch);
                    const fromBranchInfo = normalizeBranch(gf.from_branch || gf.fromBranch);
                    const branchInfo = toBranchInfo.id != null || toBranchInfo.name
                      ? toBranchInfo
                      : fromBranchInfo;
                    const branchName = resolveBranchName(gf, branchInfo);
                    // Determine sell status dynamically:
                    // "Other Income Sell" = item has acc_code (account code is set when form is completed with "Other income sell")
                    // "Not Sell" = item has no acc_code (default)
                    // Note: acc_code is only set when form is completed, so forms in progress will show "Not Sell" until completed
                    const hasAccCode = Boolean(row.acc_code || row.acc_code1);
                    // Check asset_type from backend ("on" = Other income sell, "off" = Not sell)
                    const assetType = gf.asset_type || gf.case_type || gf.caseType;
                    const isAssetTypeOn = assetType === 'on' || assetType === 'Other income sell';
                    // Also check general_form.caseType if available (though it's not typically in API response)
                    const hasCaseType = gf.caseType === 'Other income sell' || gf.case_type === 'Other income sell' || isAssetTypeOn;
                    // Check if items array has any item with acc_code (if items are loaded)
                    const hasItemsWithAccCode = Array.isArray(gf.items) && gf.items.some(item => Boolean(item.acc_code || item.acc_code1));
                    const isOtherIncomeSell = hasAccCode || hasCaseType || hasItemsWithAccCode;
                    const sellStatus = isOtherIncomeSell ? 'Other Income Sell' : 'Not Sell';
                    const totalAmount = getTotalAmount(row, gf);
                    const exceedsThreshold = totalAmount > 500000;
                    return (
                      
                      <tr
                        key={row.id}
                        className="border-b border-gray-200 hover:bg-gray-100 transition duration-150 ease-in-out cursor-pointer"
                        onClick={() => navigateToDetail(detailId, row.id, gf.id || null)}
                      >
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 w-12">
                          {displayNo}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {(() => {
                            const formId = String(gf?.id || '');
                            const notiCount = notificationCounts.get(formId) || 0;
                            
                            // Debug logging for first row
                            if (idx === 0 && process.env.NODE_ENV !== 'production') {
                              console.log('[DamageIssueList] Notification badge check:', {
                                formId,
                                gfId: gf?.id,
                                notiCount,
                                notificationCountsSize: notificationCounts.size,
                                notificationCountsKeys: Array.from(notificationCounts.keys()),
                                hasNotificationCount: notificationCounts.has(formId),
                                formDocNo: gf?.form_doc_no
                              });
                            }
                            
                            // Only show notification count badge in this column
                            if (notiCount > 0) {
                              return (
                                <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 
                                                bg-gradient-to-br from-red-500 to-red-600 rounded-full 
                                                border-2 border-white shadow-lg text-white text-xs font-bold">
                                  {notiCount > 99 ? '99+' : notiCount}
                                </span>
                              );
                            }
                            return null;
                          })()}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <StatusBadge status={gf.status || '-'} />
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 font-medium">
                          <div className="flex items-center gap-2">
                            <span>{gf.form_doc_no || '-'}</span>
                            {(() => {
                              const formId = String(gf?.id || '');
                              const notiCount = notificationCounts.get(formId) || 0;
                              const isUnread = (row.is_viewed === false || row.is_viewed === null || row.is_viewed === undefined) &&
                                             !['Completed', 'Issued', 'SupervisorIssued'].includes(gf.status);
                              
                              // Show red speech bubble icon if unread and no notification count
                              if (isUnread && notiCount === 0) {
                                return (
                                  <span className="inline-flex items-center justify-center">
                                    <RedSpeechBubbleIcon className="h-4 w-4" />
                                  </span>
                                );
                              }
                              return null;
                            })()}
                            {gf.form_doc_no && (
                              <CopyButton text={gf.form_doc_no} size="small" />
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm">
                          <span
                            className={`text-sm font-medium ${
                              sellStatus === 'Other Income Sell' 
                                ? 'text-blue-400' 
                                : 'text-red-500'
                            }`}
                          >
                            {sellStatus}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                          {branchName}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                          {(gf.originators && gf.originators.name) || gf.request_user_name || gf.user_id || '-'}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                          <div className="flex items-center gap-1">
                            {exceedsThreshold ? (
                              <ArrowUpIcon className="h-5 w-5 text-green-600" />
                            ) : (
                              <ArrowDownIcon className="h-5 w-5 text-red-600" />
                            )}
                            <span className="text-gray-700">
                              {Math.round(totalAmount).toLocaleString('en-US')}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                          {gf.created_at ? new Date(gf.created_at).toLocaleDateString() : '-'}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                          {gf.updated_at ? new Date(gf.updated_at).toLocaleString() : '-'}
                        </td>
                        
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      <div className="md:hidden space-y-4">
        {loading ? (
          [...Array(3)].map((_, index) => (
            <div key={`mobile-skeleton-${index}`} className="bg-white rounded-xl shadow-md border border-gray-200 p-4">
              <div className="flex items-start justify-between">
                <Skeleton width={80} height={16} />
                <Skeleton width={90} height={24} borderRadius={999} />
              </div>
              <div className="mt-3 space-y-2">
                <Skeleton height={14} />
                <Skeleton height={14} />
                <Skeleton height={14} />
              </div>
            </div>
          ))
        ) : isEmpty ? (
          <div className="bg-white rounded-xl shadow-md border border-gray-200">
            <EmptyState />
          </div>
        ) : (
          issues.map((row, idx) => {
            const gf = row.general_form || {};
            const detailId = row.id;
            const displayNo = (currentPage - 1) * perPage + idx + 1;
            const toBranchInfo = normalizeBranch(gf.to_branch || gf.toBranch);
            const fromBranchInfo = normalizeBranch(gf.from_branch || gf.fromBranch);
            const branchInfo = toBranchInfo.id != null || toBranchInfo.name ? toBranchInfo : fromBranchInfo;
            const branchName = resolveBranchName(gf, branchInfo);
            // Check multiple sources to determine if it's "Other Income Sell":
            // 1. Check if this item has acc_code (item-level)
            // 2. Check if general_form has caseType set to "Other income sell"
            // 3. Check if general_form has case_type set to "Other income sell"
            // 4. Check if any items in the form have acc_code (if items array is available)
            const hasAccCode = Boolean(row.acc_code || row.acc_code1);
            const assetType = gf.asset_type || gf.case_type || gf.caseType;
            const isAssetTypeOn = assetType === 'on' || assetType === 'Other income sell';
            const hasCaseType = gf.caseType === 'Other income sell' || gf.case_type === 'Other income sell' || isAssetTypeOn;
            const hasItemsWithAccCode = Array.isArray(gf.items) && gf.items.some(item => Boolean(item.acc_code || item.acc_code1));
            const isOtherIncomeSell = hasAccCode || hasCaseType || hasItemsWithAccCode;
            const sellStatus = isOtherIncomeSell ? 'Other Income Sell' : 'Not Sell';
            const totalAmount = getTotalAmount(row, gf);
            const exceedsThreshold = totalAmount > 500000;

            return (
              <div
                key={`mobile-card-${row.id}`}
                role="button"
                tabIndex={0}
                onClick={() => navigateToDetail(detailId, row.id, gf.id || null)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    navigateToDetail(detailId, row.id, gf.id || null);
                  }
                }}
                className="bg-white rounded-xl shadow-md border border-gray-200 p-4 transition hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                <div className="flex items-start justify-between gap-2 min-w-0">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    {(() => {
                      const formId = String(gf?.id || '');
                      const notiCount = notificationCounts.get(formId) || 0;
                      
                      // Debug logging for first row
                      if (idx === 0 && process.env.NODE_ENV !== 'production') {
                        console.log('[DamageIssueList] Mobile notification badge check:', {
                          formId,
                          gfId: gf?.id,
                          notiCount,
                          notificationCountsSize: notificationCounts.size,
                          notificationCountsKeys: Array.from(notificationCounts.keys()),
                          hasNotificationCount: notificationCounts.has(formId),
                          formDocNo: gf?.form_doc_no
                        });
                      }
                      
                      // Only show notification count badge in this position
                      if (notiCount > 0) {
                        return (
                          <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 
                                          bg-gradient-to-br from-red-500 to-red-600 rounded-full 
                                          border-2 border-white shadow-lg text-white text-xs font-bold flex-shrink-0">
                            {notiCount > 99 ? '99+' : notiCount}
                          </span>
                        );
                      }
                      return null;
                    })()}
                    <div className="min-w-0 flex-1">
                      <span className="hidden md:inline text-xs font-semibold text-gray-400">#{displayNo}</span>
                      <div className="mt-1 flex items-center gap-2">
                        <p className="text-base font-semibold text-gray-900 truncate">
                          {gf.form_doc_no || 'Untitled'}
                        </p>
                        {(() => {
                          const formId = String(gf?.id || '');
                          const notiCount = notificationCounts.get(formId) || 0;
                          const isUnread = (row.is_viewed === false || row.is_viewed === null || row.is_viewed === undefined) &&
                                         !['Completed', 'Issued', 'SupervisorIssued'].includes(gf.status);
                          
                          // Show red speech bubble icon if unread and no notification count
                          if (isUnread && notiCount === 0) {
                            return (
                              <span className="inline-flex items-center justify-center flex-shrink-0">
                                <RedSpeechBubbleIcon className="h-4 w-4" />
                              </span>
                            );
                          }
                          return null;
                        })()}
                        {gf.form_doc_no && (
                          <CopyButton text={gf.form_doc_no} size="small" />
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    <StatusBadge status={gf.status || '-'} />
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">Sell Status</span>
                  <span
                    className={`text-sm font-medium ${
                      sellStatus === 'Other Income Sell' 
                        ? 'text-blue-400' 
                        : 'text-red-500'
                    }`}
                  >
                    {sellStatus}
                  </span>
                </div>

                <div className="mt-3 grid grid-cols-1 gap-2 text-sm text-gray-700">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">Branch</span>
                    <span className="text-sm font-medium text-gray-900">
                      {branchName}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">Requested By</span>
                    <span className="text-sm text-gray-700">
                      {(gf.originators && gf.originators.name) || gf.request_user_name || gf.user_id || '-'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">Amount</span>
                    <div className="flex items-center gap-1">
                      {exceedsThreshold ? (
                        <ArrowUpIcon className="h-4 w-4 text-green-600" />
                      ) : (
                        <ArrowDownIcon className="h-4 w-4 text-red-600" />
                      )}
                      <span className="text-sm font-medium text-gray-900">
                        {Math.round(totalAmount).toLocaleString('en-US')}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">Created</span>
                    <span className="text-sm text-gray-700">
                      {gf.created_at ? new Date(gf.created_at).toLocaleDateString() : '-'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">Modified</span>
                    <span className="text-sm text-gray-700">
                      {gf.updated_at ? new Date(gf.updated_at).toLocaleString() : '-'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="mt-4 md:mt-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between md:border-t md:pt-4 border-gray-100">
        <div className="text-sm text-gray-600 text-center md:text-left">
          {(() => {
            const pageStart = (currentPage - 1) * perPage + 1;
            const start = effectiveTotalRows === 0 ? 0 : pageStart;
            const endRaw = (currentPage - 1) * perPage + (issues.length || 0);
            const end = Math.min(effectiveTotalRows || 0, endRaw);
            return (
              <span>
                Showing <span className="font-semibold">{start}</span> - <span className="font-semibold">{end}</span> of <span className="font-semibold">{effectiveTotalRows}</span> rows
              </span>
            );
          })()}
        </div>
        <div className="flex justify-center md:justify-end">
          <Pagination
            totalRows={effectiveTotalRows}
            rowsPerPage={perPage}
            currentPage={currentPage}
            onPageChange={onPageChange}
          />
        </div>
      </div>
    </div>
  );
}

export default DamageIssueList;
