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
    case 'Ac_Acknowledge':
    case 'Ac_Acknowledged':
    case 'Acknowledged':
      // custom-badge-bg-acknowledged: match OP Approved colors bg #e9f9cf, text #a3e635
      colorClasses = 'rounded-full';
      return (
        <span
          className={`inline-flex items-center px-3 py-1 text-xs font-semibold ${colorClasses}`}
          style={{ backgroundColor: '#e9f9cf', color: '#a3e635' }}
        >
          {'Operation Manager Approved'}
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
  // Coerce to numbers to avoid string/number mismatches that prevent active styling
  const total = Number(totalRows) || 0;
  const perPage = Number(rowsPerPage) || 1;
  const current = Number(currentPage) || 1;
  const totalPages = Math.max(1, Math.ceil(total / perPage));

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages = [];

    if (totalPages <= 12) {
      // If total pages is small, show all pages
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
      return pages;
    }
    
    // Always show first page
    pages.push(1);
    
    // Show pages 2-10 if current page is in early range (1-6)
    if (currentPage <= 6) {
      for (let i = 2; i <= 10; i++) {
        pages.push(i);
      }
      // Add ellipsis and last two pages
      pages.push('ellipsis');
      pages.push(totalPages - 1);
      pages.push(totalPages);
    }
    // Show pages around current if in middle range
    else if (currentPage > 6 && currentPage < totalPages - 5) {
      // Show first page, ellipsis, then pages around current
      pages.push('ellipsis-start');
      for (let i = currentPage - 2; i <= currentPage + 2; i++) {
        pages.push(i);
      }
      // Add ellipsis and last two pages
      pages.push('ellipsis-end');
      pages.push(totalPages - 1);
      pages.push(totalPages);
    }
    // Show last pages if current is near the end
    else {
      // Show first page, ellipsis, then last 10 pages
      pages.push('ellipsis');
      for (let i = totalPages - 9; i <= totalPages; i++) {
        pages.push(i);
      }
    }
    
    return pages;
  };

  const pageNumbers = getPageNumbers();

  return (
    <div className="flex items-center space-x-1">
      <button
        className="px-3 py-2 text-blue-600 hover:bg-blue-50 rounded disabled:opacity-50 disabled:cursor-not-allowed"
        onClick={() => onPageChange?.(Math.max(1, current - 1))}
        disabled={current <= 1}
      >
        &lt;
      </button>
      {pageNumbers.map((page, index) => {
        if (page === 'ellipsis' || page === 'ellipsis-start' || page === 'ellipsis-end') {
          return (
            <span key={`ellipsis-${index}`} className="px-2 py-2 text-blue-600">
              ...
            </span>
          );
        }
        
        return (
          <button
            key={page}
            className={`px-4 py-2 text-sm font-semibold rounded ${
              page === current
                ? 'bg-blue-600 text-white'
                : 'text-blue-600 hover:bg-blue-50'
            }`}
            onClick={() => onPageChange?.(page)}
          >
            {page}
          </button>
        );
      })}
      <button
        className="px-3 py-2 text-blue-600 hover:bg-blue-50 rounded disabled:opacity-50 disabled:cursor-not-allowed"
        onClick={() => onPageChange?.(Math.min(totalPages, current + 1))}
        disabled={current >= totalPages}
      >
        &gt;
      </button>
    </div>
  );
};

function DamageIssueList({ data = [], loading = false, currentPage = 1, perPage = 15, totalRows = 0, onPageChange, branchMap = {}, productFilter = '', notificationCounts = new Map(), suppressUnreadForFormIds = [] }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams(); // Use React Router's searchParams to react to URL changes
  
  // Get current user to check if they've completed their action
  const currentUser = React.useMemo(() => {
    try {
      const userStr = localStorage.getItem('user');
      if (!userStr) {
        return null;
      }
      const user = JSON.parse(userStr);
      return user;
    } catch (e) {
      return null;
    }
  }, []);
  
  
  
  // Helper function to normalize text (case-insensitive, trim whitespace)
  const normalizeText = (text) => {
    if (!text) return '';
    return String(text).trim().replace(/\s+/g, ' ').toLowerCase();
  };
  
  // Role ID to Name mapping (matches Navbar.jsx)
  const roleIdToNameMap = {
    1: 'User',
    2: 'Checker',
    3: 'Approver',
    4: 'Super-Admin',
    5: 'Acknowledge',
    6: 'Recorder',
    7: 'Branch Account',
    8: 'Branch IT',
    9: 'Branch HR',
    10: 'Supervisor'
  };

  // Helper function to extract user_type and role from user object
  const extractUserRoleInfo = (user) => {
    if (!user) return { userType: '', userRole: '' };
    
    const normalizeText = (text) => (text || '').toString().toLowerCase().trim().replace(/\s+/g, ' ');
    
    // First, try to get user_type and role directly
    let userType = normalizeText(user.user_type || user.userType || '');
    let userRole = normalizeText(user.role || user.role_name || user.roleName || '');
    
    // If we have role_id but no role name, map it
    if (!userRole && user.role_id && roleIdToNameMap[user.role_id]) {
      userRole = normalizeText(roleIdToNameMap[user.role_id]);
    }
    
    // If we have role name but no user_type, infer user_type from role
    if (!userType && userRole) {
      // Checker role -> user_type C or CS
      // role_id 2 = Checker, which can be user_type 'C' or 'CS' depending on form type
      // For notification purposes, both 'c' and 'cs' are treated the same
      if (userRole === 'checker' || userRole.includes('checker')) {
        userType = 'c'; // Use 'c' as default - the check ['c', 'cs'].includes(userType) will work for both
      }
      // Approver/BM role -> user_type A1
      else if (userRole === 'approver' || userRole === 'bm' || userRole === 'abm' || 
               userRole.includes('approver') || userRole.includes('branch manager')) {
        userType = 'a1';
      }
      // Branch Account role -> user_type AC
      else if (userRole === 'branch account' || userRole === 'account' || 
               userRole.includes('account')) {
        userType = 'ac';
      }
      // Operation Manager -> user_type A2
      else if (userRole.includes('operation manager') || userRole.includes('op manager')) {
        userType = 'a2';
      }
    }
    
    // Also check common alternative fields that may contain role/user_type info
    // Normalize role string to be more forgiving (handle snake_case, kebab-case, etc.)
    const rawRoleString = (user.role || user.role_name || user.roleName || user.position || user.job_title || user.jobTitle || '').toString().toLowerCase();
    const normalizedRoleString = rawRoleString.replace(/[_-]/g, ' ').replace(/\s+/g, ' ').trim();

    // If still no userType, try to infer from the normalized role string
    if (!userType && normalizedRoleString) {
      if (normalizedRoleString.includes('checker')) {
        userType = 'c';
      } else if (normalizedRoleString.includes('approver') || normalizedRoleString.includes('bm') || normalizedRoleString.includes('branch manager')) {
        userType = 'a1';
      } else if (normalizedRoleString.includes('account')) {
        userType = 'ac';
      } else if ((normalizedRoleString.includes('operation') && normalizedRoleString.includes('manager')) || normalizedRoleString.includes('op manager') || normalizedRoleString.includes('operation-manager')) {
        userType = 'a2';
      }
    }

    // Also check if user_type is in nested role object
    if (!userType && user.role && typeof user.role === 'object') {
      userType = normalizeText(user.role.user_type || user.role.userType || '');
    }

    return { userType, userRole };
  };

  // Helper to get notification count supporting both string and numeric Map keys
  const getNotificationCount = (possibleIds = []) => {
    for (const id of possibleIds) {
      // Try exact key as string first, then numeric form (some producers use number keys)
      const keyStr = String(id);
      let count = undefined;
      if (notificationCounts && typeof notificationCounts.get === 'function') {
        count = notificationCounts.get(keyStr);
        if ((count === undefined || count === null) && !isNaN(Number(id))) {
          count = notificationCounts.get(Number(id));
        }
      }
      if (count !== undefined && count > 0) {
        return { count, matchedFormId: id };
      }
    }
    return { count: 0, matchedFormId: null };
  };

  // Helper function to check if form is relevant to current user's role
  // Returns true only if the form status matches what the user should see notifications for
  const isFormRelevantToUser = (gfOrRow) => {
    // Accept either a general_form object or a raw row (which may contain general_form)
    const gf = (gfOrRow && gfOrRow.general_form) ? gfOrRow.general_form : (gfOrRow || {});
    if (!gf) return false;
    
    // Try to get user from currentUser, or fallback to localStorage
    let user = currentUser;
    if (!user) {
      try {
        const userStr = localStorage.getItem('user');
        if (userStr) {
          user = JSON.parse(userStr);
        }
      } catch (e) {
      }
    }
    
    if (!user) {
      return false;
    }
    
    // Extract user_type and role from user object
    const { userType, userRole } = extractUserRoleInfo(user);
    const normalizeText = (text) => (text || '').toString().toLowerCase().trim().replace(/\s+/g, ' ');
    const formStatus = normalizeText(gf.status || '');
    
    // Checker (C/CS) - only relevant for "Ongoing" forms
    if (['c', 'cs'].includes(userType)) {
      return formStatus === 'ongoing';
    }
    
  // Operation Manager (A2) - only relevant for "BM Approved" forms
  // Check this BEFORE BM check to avoid role conflicts for users who have multiple roles
  const isOpManager = userType === 'a2' ||
                      (userRole || '').includes('operation manager') ||
                      (userRole || '').includes('op manager') ||
                      // Special legacy override: treat this specific employee as OP manager (matches Dashboard logic)
                      (user?.employee_number === '666-666666' && user?.department_id === 8);
  if (isOpManager) {
    return formStatus === 'bm approved' || formStatus === 'bmapproved';
  }

  // Approver/BM (A1) - only relevant for "Checked" forms (NOT Ongoing)
  // Check both user_type (A1) and role name (bm, abm, approver)
  const isBM = userType === 'a1' || 
               userRole === 'bm' || 
               userRole === 'abm' || 
               userRole === 'approver' ||
               userRole.includes('approver') ||
               userRole.includes('branch manager');
  
  if (isBM) {
    // BM should ONLY see "Checked" forms, NOT "Ongoing" forms
    return formStatus === 'checked';
  }
    
    // Branch Account (AC) - only relevant for "BM Approved" and "Acknowledged" forms
    // Hide when status changes to "Completed" or beyond
    // Check both user_type (AC) and role name (account, branch account)
    const isAccount = userType === 'ac' || 
                      userRole === 'account' ||
                      userRole === 'branch account' ||
                      userRole.includes('account') ||
                      userRole.includes('branch account');
    
    if (isAccount) {
      // Account should see BM/OP/Acknowledged and Completed forms.
      // Exclude only Ongoing and Checked (they are earlier workflow stages).
      if (formStatus === 'ongoing' || formStatus === 'checked') {
        return false;
      }
      // Show BM Approved, OP Approved, Acknowledged, and Completed statuses
      return [
        'bm approved',
        'bmapproved',
        'op approved',
        'opapproved',
        'ac_acknowledged',
        'acknowledged',
        'completed',
        'issued',
        'supervisorissued'
      ].includes(formStatus);
    }
    
    // For other roles, form is not relevant
    return false;
  };

  // Helper function to check if current user has completed their required action
  // Badge should disappear when the user completes their action for their role
  const hasUserCompletedAction = (row, gf) => {
    if (!currentUser) {
      // If we can't determine user, default to showing badge
      return false;
    }
    
    const userType = normalizeText(currentUser.user_type || currentUser.role || '');
    const formStatus = normalizeText(gf.status || '');
    const totalAmount = parseFloat(gf.total_amount || row.total_amount || 0);
    
    // Define status progression order
    const statusOrder = {
      'ongoing': 1,
      'checked': 2,
      'bm approved': 3,
      'bmapproved': 3,
      'opapproved': 4,
      'op approved': 4,
      'ac_acknowledged': 5,
      'acknowledged': 5,
      'completed': 6,
      'issued': 6,
      'supervisorissued': 6
    };
    
    const currentStatusOrder = statusOrder[formStatus] || 0;
    
    // Checker (C/CS) - action is to check (move from Ongoing to Checked)
    if (['c', 'cs'].includes(userType)) {
      // If status is Checked or beyond, checker has completed their action
      return currentStatusOrder >= 2;
    }
    
    // BM (A1) - action is to approve (move from Checked to BM Approved)
    if (userType === 'a1' || normalizeText(currentUser.role) === 'bm' || normalizeText(currentUser.role) === 'abm') {
      // If status is BM Approved or beyond, BM has completed their action
      return currentStatusOrder >= 3;
    }
    
    // OP Manager (A2) - action is to approve (move from BM Approved to OP Approved, only if amount > 500k)
    if (userType === 'a2') {
      if (totalAmount > 500000) {
        // If amount > 500k, OP Manager needs to approve
        // If status is OP Approved or beyond, OP Manager has completed their action
        return currentStatusOrder >= 4;
      } else {
        // If amount <= 500k, OP Manager doesn't need to approve, so they've "completed" (no action needed)
        return true;
      }
    }
    
    // Account (AC) - action is to acknowledge (move from BM/OP Approved to Acknowledged), then issue (move to Completed/Issued)
    if (userType === 'ac' || normalizeText(currentUser.role) === 'account') {
      // Account needs to acknowledge first (if status is BM/OP Approved)
      if (currentStatusOrder >= 3 && currentStatusOrder < 5) {
        // Status is BM Approved or OP Approved, Account needs to acknowledge
        // If status is Acknowledged or beyond, Account has acknowledged
        return currentStatusOrder >= 5;
      }
      // If status is Acknowledged, Account needs to issue/complete
      if (currentStatusOrder === 5) {
        // Status is Acknowledged, Account needs to issue
        // If status is Completed/Issued, Account has issued
        return currentStatusOrder >= 6;
      }
      // If already Completed/Issued, Account has completed their action
      return currentStatusOrder >= 6;
    }
    
    // For other user types or unknown roles, default to showing badge
    return false;
  };

  // Get filter parameters from URL - use searchParams from React Router
  // Also check window.location as fallback in case searchParams hasn't updated yet
  // Also accept productFilter as prop (from Dashboard state) as a fallback
  const searchFromParams = searchParams.get('search');
  const searchFromUrl = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('search') : null;
  const productNameParam = searchParams.get('product_name');
  const productCodeParam = searchParams.get('product_code');
  // Use prop first, then URL params - prop is more reliable as it comes directly from Dashboard state
  const productNameFilter = productFilter || searchFromParams || searchFromUrl || productNameParam || productCodeParam || '';

  // Convert suppression list into a Set of string IDs for fast lookups
  const suppressedUnreadSet = React.useMemo(() => {
    try {
      return new Set((suppressUnreadForFormIds || []).map(id => String(id)));
    } catch (e) {
      return new Set();
    }
  }, [suppressUnreadForFormIds]);

  // Helper to check whether unread badge should be suppressed for this form (by id)
  const isSuppressedForUnread = (row, gf) => {
    const idCandidates = [
      gf?.id,
      row?.general_form_id,
      gf?.general_form_id,
      row?.id
    ].map(id => id !== undefined && id !== null ? String(id) : '').filter(Boolean);
    for (const id of idCandidates) {
      if (suppressedUnreadSet.has(id)) return true;
    }
    return false;
  };
  
  // Log warning if no data received
  React.useEffect(() => {
    if (typeof window !== 'undefined' && window.console && (!Array.isArray(data) || data.length === 0)) {
    }
  }, [data]);

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
  
  
  // Calculate total amounts per form
  const formTotals = React.useMemo(() => {
    const totals = new Map();
    formsWithItems.forEach((formData, formId) => {
      const total = formData.items.reduce((sum, item) => sum + (item.amount || 0), 0);
      // Store totals under multiple key shapes (string and numeric) to avoid type-mismatch lookups
      try {
        totals.set(formId, total);
        totals.set(String(formId), total);
        const numKey = Number(formId);
        if (!isNaN(numKey)) {
          totals.set(numKey, total);
        }
      } catch (e) {
        totals.set(formId, total);
      }
    });
    return totals;
  }, [formsWithItems]);
  
  // Filter forms based on product name/code if filter is active
  // Use useMemo to prevent unnecessary recalculations and glitches
  const filteredForms = React.useMemo(() => {
    let forms = Array.from(formsWithItems.values());
    
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
            return true;
          }
          
          return false;
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
            return true;
          }
        }
        
        return hasMatchingItem;
      });
      
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

  // No client-side pagination — always show all filtered issues in this list.
  // Pagination controls have been removed; server-side paging (if used) is handled upstream.
  const issues = allFilteredIssues;
  
  // Compute visible issues based on user role defaults.
  // Default filtering is applied only when there's no explicit status filter in the URL
  // and when no productFilter is active (i.e. "first view" behavior).
  const visibleIssues = React.useMemo(() => {
    try {
      if (!currentUser) return issues;

      const { userType, userRole } = extractUserRoleInfo(currentUser || {});
      const roleLower = (userRole || '').toString().toLowerCase();

      const isChecker = ['c', 'cs'].includes(userType) || roleLower.includes('checker');
      const isBM = userType === 'a1' || roleLower.includes('approver') || roleLower.includes('branch manager') || roleLower.includes('bm') || roleLower.includes('abm');
      const isOpManager = userType === 'a2' || roleLower.includes('operation manager') || roleLower.includes('op manager') || (currentUser?.employee_number === '666-666666' && currentUser?.department_id === 8);
      const isAccount = userType === 'ac' || roleLower.includes('account') || roleLower.includes('branch account');

      // Determine if user (or URL) already supplied explicit status filter
      const statusParam = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('status') : null;
      const hasExplicitStatus = statusParam && statusParam.toString().trim() !== '';
      const hasProductFilter = productFilter && productFilter.trim() !== '';

      // If explicit filters are present, do not override — return all issues (server/URL-driven)
      if (hasExplicitStatus || hasProductFilter) {
        // But still enforce Operation Manager special view if user is OP manager
        if (isOpManager) {
          return issues.filter((row) => {
            const gf = row.general_form || {};
            const totalAmount = getTotalAmount(row, gf);
            const status = ((gf.status || row.status || '') + '').toString().toLowerCase().trim();
            const isBmApproved = status === 'bm approved' || status === 'bmapproved' || status === 'bm_approved';
            return isBmApproved && Number(totalAmount) > 500000;
          });
        }
        return issues;
      }

      // No explicit filters — show all issues (do not apply role-based defaults).
      // This ensures the list displays all forms unless the user applied an explicit status/product filter.
      return issues;
    } catch (e) {
      return issues;
    }
  }, [issues, currentUser, productFilter]);
  
  // Compute effective total rows: prefer server-provided totalRows when available (no product filter),
  // otherwise fall back to filtered total or visible issues count.
  const effectiveTotalRows = productNameFilterLower ? filteredTotal : (totalRows || visibleIssues.length);
  // Paginate visible issues: show 15 forms per page
  const pageSize = 15;
  // Use effective total rows (server-provided when available) for page count
  const totalForms = effectiveTotalRows || visibleIssues.length;
  const totalPages = Math.max(1, Math.ceil(totalForms / pageSize));
  const safeCurrentPage = Math.max(1, Math.min(Number(currentPage) || 1, totalPages));

  // Determine pagedVisibleIssues:
  // - If the parent/data source already returned a paginated subset (data length <= pageSize
  //   and server totalRows > data length), treat visibleIssues as the current page.
  // - Otherwise, slice the full visibleIssues array client-side.
  let pagedVisibleIssues = [];
  const dataLen = Array.isArray(data) ? data.length : 0;
  if (dataLen > 0 && dataLen <= pageSize && (totalRows && Number(totalRows) > dataLen)) {
    // Server already paginated; use provided rows as current page
    pagedVisibleIssues = visibleIssues;
  } else {
    const startIndexForPage = (safeCurrentPage - 1) * pageSize;
    pagedVisibleIssues = visibleIssues.slice(startIndexForPage, startIndexForPage + pageSize);
  }
  
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
    // Prefer explicit total fields from the general form (server-provided authoritative value)
    let totalAmount =
      gf?.total_amount ||
      gf?.totalAmount ||
      gf?.total_amt ||
      gf?.sum_total ||
      gf?.sumTotal ||
      row?.total_amount ||
      row?.totalAmount ||
      row?.total_amt ||
      row?.sum_total ||
      row?.sumTotal ||
      row?.big_damage_issue?.total_amount ||
      row?.big_damage_issue?.totalAmount ||
      gf?.big_damage_issue?.total_amount ||
      gf?.big_damage_issue?.totalAmount ||
      row?.general_form_total ||
      gf?.general_form_total ||
      0;
    
    if (totalAmount && parseFloat(totalAmount) > 0) {
      return parseFloat(totalAmount);
    }

    // Next, try our pre-calculated formTotals map (derived from row amounts)
    const formId = gf?.id || row?.general_form_id || row?.id;
    if (formId) {
      // Try several key variants to avoid string/number mismatch
      if (formTotals.has(formId)) return formTotals.get(formId);
      if (formTotals.has(String(formId))) return formTotals.get(String(formId));
      const numKey = Number(formId);
      if (!isNaN(numKey) && formTotals.has(numKey)) return formTotals.get(numKey);
    }

    // Fallback: Try direct amount from current row
    const rowAmount = parseFloat(row?.amount || row?.total || 0);
    if (rowAmount > 0) {
      return rowAmount;
    }
    
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
    <div className="mx-auto font-sans px-6">
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
                        className={`px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider ${
                          index === 0 ? 'w-12' :
                          index === 1 ? 'w-28' : // Status
                          index === 2 ? 'w-80 text-left' : // Document No
                          index === 3 ? 'w-36 text-left' : // Sell / Not Sell
                          index === 4 ? 'w-28 text-left' : // Branch
                          index === 5 ? 'w-36 text-left' : // Requested By
                          index === 6 ? 'w-32 text-right pr-6' : // Amount
                          index === 7 ? 'w-44 text-left' : // Created Date (more space)
                          index === 8 ? 'w-48 text-left' : // Modified
                          'text-left'
                        }`}
                      >
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody className="bg-white">
            {pagedVisibleIssues.map((row, idx) => {
                    const gf = row.general_form || {};
                    const detailId = row.id;
                    const displayNo = (safeCurrentPage - 1) * pageSize + idx + 1;
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
                     
                        <td className="px-4 py-3 whitespace-nowrap text-center">
                          <StatusBadge status={gf.status || '-'} />
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 font-medium">
                          <div className="flex items-center gap-2">
                            <span>{gf.form_doc_no || '-'}</span>
                            {(() => {
                              // Try multiple possible ID fields to match with notification counts
                              const possibleFormIds = [
                                String(gf?.id || ''),
                                String(row?.general_form_id || ''),
                                String(gf?.general_form_id || ''),
                                String(row?.id || '')
                              ].filter(id => id && id !== 'undefined' && id !== 'null');
                              
                              // Check each possible form ID against notification counts (supports string/number keys)
                              const { count: notiCount } = getNotificationCount(possibleFormIds);
                              
                              // Check if current user has completed their required action
                              const userCompletedAction = hasUserCompletedAction(row, gf);
                              
                              // Check if form is relevant to user's role (using helper function)
                              const isRelevant = isFormRelevantToUser(gf);

                              // Suppress unread badge if this form id is explicitly listed
                              if (isSuppressedForUnread(row, gf)) {
                                return null;
                              }
                              // Determine OP local flag and BM-approved total to suppress badge for OPs on small forms
                              const { userType: currentUserType, userRole: currentUserRoleName } = extractUserRoleInfo(currentUser || {});
                              const curRoleLower = (currentUserRoleName || '').toString().toLowerCase();
                              const isOpManagerLocalSmall = (currentUserType === 'a2') || curRoleLower.includes('operation') || curRoleLower.includes('op manager') || ((currentUser?.employee_number === '666-666666') && currentUser?.department_id === 8);
                              const formTotalForSmall = (typeof getTotalAmount === 'function') ? getTotalAmount(row, gf) : null;
                              const isBMApprovedSmall = ((gf?.status || row?.status || '') + '').toString().toLowerCase().trim() === 'bm approved';
                              // If OP and BM Approved but total <= 500k, suppress unread bubble
                              if (isOpManagerLocalSmall && isBMApprovedSmall && Number(formTotalForSmall) <= 500000) {
                                return null;
                              }
                              
                              // Original behavior:
                              // Show red speech bubble icon ONLY if:
                              // - Form is relevant to user's role
                              // - User hasn't completed their action
                              // - Form has NO unread notifications (notiCount === 0) - determined by notificationCounts
                              // - Form is not completed
                              const isCompleted = ['Completed', 'Issued', 'SupervisorIssued'].includes(gf.status);
                              if (isRelevant && !userCompletedAction && (notiCount === 0 || notiCount === undefined) && !isCompleted) {
                                return (
                                  <span className="inline-flex items-center justify-center">
                                    <RedSpeechBubbleIcon className="h-4 w-4" />
                                  </span>
                                );
                              }
                              return null;
                            })()}
                               <span className=" whitespace-nowrap">
                          {(() => {
                            // Try multiple possible ID fields to match with notification counts
                            const possibleFormIds = [
                              String(gf?.id || ''),
                              String(row?.general_form_id || ''),
                              String(gf?.general_form_id || ''),
                              String(row?.id || '')
                            ].filter(id => id && id !== 'undefined' && id !== 'null');
                            
                            // Check each possible form ID against notification counts (supports string/number keys)
                            const { count: notiCount, matchedFormId } = getNotificationCount(possibleFormIds);
                              
                              // Only show notification count badge if form is relevant to user's role
                            const isRelevant = isFormRelevantToUser(gf);
                            
                            // Also allow OP to see badge: detect Operation Manager from currentUser
                            const { userType: currentUserType, userRole: currentUserRoleName } = extractUserRoleInfo(currentUser || {});
                            const curRoleLower = (currentUserRoleName || '').toString().toLowerCase();
                            const isOpManagerLocal = (currentUserType === 'a2') || curRoleLower.includes('operation') || curRoleLower.includes('op manager') || ((currentUser?.employee_number === '666-666666') && currentUser?.department_id === 8);
                            // Determine if OP should see badge for BM Approved forms exceeding OP threshold
                            const formTotalForNotif = (typeof getTotalAmount === 'function') ? getTotalAmount(row, gf) : null;
                            const _statusForBadge = ((gf?.status || row?.status || '') + '').toString().toLowerCase();
                            const _compactStatus = _statusForBadge.replace(/[\s_]+/g, '');
                            const isBMApprovedStatus = _compactStatus.includes('bm') && _compactStatus.includes('approved');

                            // Suppress unread badge if this form id is explicitly listed
                            if (isSuppressedForUnread(row, gf)) {
                              return null;
                            }
                            // Explicit suppression: if current user is OP manager and this is a BM Approved form
                            // that does NOT exceed the OP threshold, never show the unread badge.
                            if (isOpManagerLocal && isBMApprovedStatus && Number(formTotalForNotif) <= 500000) {
                              return null;
                            }

                            // If there are unread notifications for this form and it's relevant (or OP manager), show the red speech bubble icon
                            // If notifications exist for this form and it's relevant (or OP manager),
                            // show the red speech bubble icon — but DO NOT show it to OP managers for
                            // BM Approved forms that do NOT exceed the OP threshold.
                            if (
                              notiCount > 0 &&
                              (isRelevant || isOpManagerLocal) &&
                              !(isOpManagerLocal && isBMApprovedStatus && Number(formTotalForNotif) <= 500000)
                            ) {
                              return (
                                <span
                                  onClick={(e) => e.stopPropagation()}
                                  className="inline-flex items-center"
                                  title={`${notiCount} unread notification${notiCount > 1 ? 's' : ''}`}
                                >
                                  <RedSpeechBubbleIcon className="h-4 w-4 text-red-500" />
                                </span>
                              );
                            }

                            // Additionally, show badge for OP managers when form is BM Approved and total exceeds OP threshold
                            if (isOpManagerLocal && isBMApprovedStatus && Number(formTotalForNotif) > 500000) {
                              return (
                                <span
                                  onClick={(e) => e.stopPropagation()}
                                  className="inline-flex items-center"
                                  title={`Requires OP action — total ${Number(formTotalForNotif).toLocaleString()}`}
                                >
                                  <RedSpeechBubbleIcon className="h-4 w-4 text-red-500" />
                                </span>
                              );
                            }

                            return null;
                          })()}
                        </span>
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
                          <div className="flex items-center justify-end gap-2">
                            {exceedsThreshold ? (
                              <ArrowUpIcon className="h-4 w-4 text-green-600" />
                            ) : (
                              <ArrowDownIcon className="h-4 w-4 text-gray-400" />
                            )}
                            <span className="text-sm font-medium text-gray-900">
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
          pagedVisibleIssues.map((row, idx) => {
            const gf = row.general_form || {};
            const detailId = row.id;
            const displayNo = (safeCurrentPage - 1) * pageSize + idx + 1;
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
                      // Try multiple possible ID fields to match with notification counts
                      const possibleFormIds = [
                        String(gf?.id || ''),
                        String(row?.general_form_id || ''),
                        String(gf?.general_form_id || ''),
                        String(row?.id || '')
                      ].filter(id => id && id !== 'undefined' && id !== 'null');
                      
                      // Check each possible form ID against notification counts (supports string/number keys)
                      const { count: notiCount, matchedFormId } = getNotificationCount(possibleFormIds);
                      
                      // Check if form is relevant to user's role
                      const isRelevantMobile = isFormRelevantToUser(gf);
                      
                      // Hide numeric unread-count badge entirely for mobile view as well
                      if (notiCount > 0 && isRelevantMobile) {
                        return null;
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
                          // Try multiple possible ID fields to match with notification counts
                          const possibleFormIds = [
                            String(gf?.id || ''),
                            String(row?.general_form_id || ''),
                            String(gf?.general_form_id || ''),
                            String(row?.id || '')
                          ].filter(id => id && id !== 'undefined' && id !== 'null');
                          
                          // Check each possible form ID against notification counts (supports string/number keys)
                          const { count: notiCount } = getNotificationCount(possibleFormIds);
                          
                          // Check if current user has completed their required action
                          const userCompletedAction = hasUserCompletedAction(row, gf);
                          
                          // Check if form is relevant to user's role
                          const isRelevantMobileIcon = isFormRelevantToUser(gf);
                          
                          // Suppress unread badge if this form id is explicitly listed
                          if (isSuppressedForUnread(row, gf)) {
                            return null;
                          }
                          // Determine OP local flag and BM-approved total to suppress badge for OPs on small forms
                          const { userType: currentUserType, userRole: currentUserRoleName } = extractUserRoleInfo(currentUser || {});
                          const curRoleLower = (currentUserRoleName || '').toString().toLowerCase();
                          const isOpManagerLocalSmall = (currentUserType === 'a2') || curRoleLower.includes('operation') || curRoleLower.includes('op manager') || ((currentUser?.employee_number === '666-666666') && currentUser?.department_id === 8);
                          const formTotalForSmall = (typeof getTotalAmount === 'function') ? getTotalAmount(row, gf) : null;
                          const isBMApprovedSmall = ((gf?.status || row?.status || '') + '').toString().toLowerCase().trim() === 'bm approved';
                          // If OP and BM Approved but total <= 500k, suppress unread bubble
                          if (isOpManagerLocalSmall && isBMApprovedSmall && Number(formTotalForSmall) <= 500000) {
                            return null;
                          }
                          
                          // Original behavior (mobile):
                          // Show red speech bubble icon ONLY if:
                          // - Form is relevant to user's role
                          // - User hasn't completed their action
                          // - Form has NO unread notifications (notiCount === 0) - determined by notificationCounts
                          // - Form is not completed
                          const isCompletedMobile = ['Completed', 'Issued', 'SupervisorIssued'].includes(gf.status);
                          if (isRelevantMobileIcon && !userCompletedAction && (notiCount === 0 || notiCount === undefined) && !isCompletedMobile) {
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
                      <span className="text-sm font-medium text-gray-900 text-right">
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
        <div className="flex justify-center md:justify-start w-full md:w-auto">
          <Pagination
            totalRows={effectiveTotalRows}
            rowsPerPage={pageSize}
            currentPage={safeCurrentPage}
            onPageChange={onPageChange}
          />
        </div>
      </div>
      
      {/* Total rows display - centered at bottom with red number */}
      <div className="mt-2 text-center">
        <span className="text-sm text-gray-600">
          Total <span className="text-red-600 font-semibold">{effectiveTotalRows}</span> Rows
        </span>
      </div>
    </div>
  );
}

export default DamageIssueList;
