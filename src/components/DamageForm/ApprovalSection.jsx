import React, { useEffect, useRef, useState } from "react";
import { User, CheckCircle, Clock, ChevronDown, ChevronUp } from "lucide-react";

const DEFAULT_APPROVALS = [
  { label: "Prepared by", key: "prepared" },
  { label: "Checked by", key: "checked" },
  { label: "Approved by", key: "approved" },
  { label: "Issued by", key: "issued" },
];

const CURRENT_STEP_STATUS = {
  checked: "Checked",
  approved: "Approved",
  issued: "Issued",
};

const USER_TYPE_MAP = {
  C: "Checked by",
  CS: "Checked by",
  A1: "BM Approved by",
  AC: "Operation Manager Approved by",
  ACK: "Issued by",
};

const ROLE_MAP = {
  C: "Branch LP",
  CS: "Branch LP",
  A1: "BM/ABM",
  A2: "Operation Manager",
  AC: "Branch Account",
  ACK: "Supervisor",
};

  const pickFirstFilled = (...values) =>
    values.find((value) => typeof value === "string" && value.trim()) || "";

  // Check if comment is long (more than 50 characters)
  const isCommentLong = (comment) => {
    return comment && comment.length > 50;
  };

  // Get truncated comment (first 50 characters)
  const getTruncatedComment = (comment) => {
    if (!comment || comment.length <= 50) return comment;
    return comment.substring(0, 50) + "...";
  };

export default function ApprovalSection({ approvals = [], status, formData = {}, totalAmount = 0 }) {
  const nameCache = useRef({});
  const safeApprovals = Array.isArray(approvals) ? approvals : [];
  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
  const [expandedComments, setExpandedComments] = useState({});



  // Toggle comment expansion
  const toggleCommentExpansion = (approvalIndex) => {
    setExpandedComments(prev => ({
      ...prev,
      [approvalIndex]: !prev[approvalIndex]
    }));
  };
  
  // Get totalAmount from multiple sources if not passed as prop
  const resolvedTotalAmount = totalAmount || 
    Number(formData?.general_form?.total_amount) ||
    Number(formData?.total_amount) ||
    Number(formData?.general_form?.totalAmount) ||
    Number(formData?.totalAmount) ||
    0;

  // Define resolveLabel before it's used
  const resolveLabel = (approval) => {
    if (!approval) return "";
    
    // If the form is cancelled, show "Cancelled by" instead of "Issued by"
    const isCancelledStatus = (status || '').toString().toLowerCase().includes('cancel');
    if (isCancelledStatus) {
      const rawLabel = (approval.label || '').toLowerCase();
      if (rawLabel.includes('issued') || rawLabel.includes('acknowledged') || approval.user_type === 'ACK') {
        return 'Cancelled by';
      }
    }
    
    if (approval.label) return approval.label;
    return USER_TYPE_MAP[approval.user_type] || "";
  };
  
  // Process approvals

  useEffect(() => {
    // Clear the cache completely to avoid stale data
    nameCache.current = {};
    safeApprovals.forEach((approval) => {
      if (approval?.label && approval?.name) {
        nameCache.current[approval.label] = approval.name;
      } else if (approval?.label) {
        delete nameCache.current[approval.label];
      }
    });
  }, [safeApprovals]);

  const resolveName = (approval, label, formData) => {
    if (!approval) return '';
    const fallbackNames = [
      approval.actual_user_name,
      approval.name,
      approval.assigned_name,
      approval.approver_name,
      approval.user?.name,
      approval.user_name,
    ].filter(Boolean);
    if (fallbackNames.length > 0) {
      return fallbackNames[0];
    }
    if (label === 'Checked by') {
      return (
        formData?.checked_by_name ||
        formData?.checked_by_user?.name ||
        formData?.checker_name ||
        formData?.approvals?.find?.((appr) => appr?.label === 'Checked by')?.name ||
        ''
      );
    }
    if (label === 'Prepared by') {
      return (
        formData?.requester_name ||
        formData?.originator_name ||
        formData?.created_by_name ||
        ''
      );
    }
    if (label === 'Issued by') {
      // Check multiple sources for issued by name
      const issuedByName = 
        formData?.issued_by_name ||
        formData?.issued_by_user?.name ||
        formData?.general_form?.issued_by_name ||
        formData?.general_form?.issued_by_user?.name ||
        '';
      return issuedByName;
    }
    if (label === 'Cancelled by') {
      // Check multiple sources for cancelled by name
      const cancelledByName = 
        formData?.cancelled_by_name ||
        formData?.cancel_by_name ||
        formData?.cancelled_by_user?.name ||
        formData?.cancel_by_user?.name ||
        formData?.general_form?.cancelled_by_name ||
        formData?.general_form?.cancel_by_name ||
        formData?.general_form?.cancelled_by_user?.name ||
        formData?.general_form?.cancel_by_user?.name ||
        '';
      return cancelledByName;
    }
    // Operation Mgr Approved by section removed
    if (label === 'Operation Manager Approved by') {
      // CRITICAL: Check approval object first (actual_user_name, actual_user_full_name, etc.)
      // Then fall back to formData fields
      const acknowledgedName = 
        approval?.actual_user_name ||
        approval?.actual_user_full_name ||
        approval?.name ||
        approval?.user?.name ||
        approval?.assigned_name ||
        approval?.approver_name ||
        formData?.acknowledged_by_name ||
        formData?.acknowledged_by_user?.name ||
        formData?.general_form?.acknowledged_by_name ||
        formData?.general_form?.acknowledged_by_user?.name ||
        '';
      return acknowledgedName;
    }
    return '';
  };

  const resolveRole = (approval, fallbackLabel) => {
    // CRITICAL: Check label FIRST before checking approval.role or user_type
    // This ensures "Operation Manager Approved by" always shows "Operation Manager" even if approval has wrong role
    // "Issued by" should always be "Branch Account", not "Supervisor" (even if user_type is ACK)
    // "Operation Manager Approved by" should always be "Operation Manager", not "Branch Account" or "BM/ABM" (even if approval.role is set)
    const label = (fallbackLabel || '').toLowerCase();
    
    // If label is "Issued by", always return "Branch Account" (don't check approval.role or user_type)
    if (label.includes('issued')) {
      return 'Branch Account';
    }
    
    // If label is "Operation Manager Approved by", always return "Operation Manager" (don't check approval.role or user_type)
    if (label.includes('Operation Manager Approved')) {
      return 'Operation Manager';
    }
    
    if (!approval) {
      // For "Prepared by", try to get role from formData
      if (label.includes('prepared')) {
        return formData?.originator?.title ||
               formData?.user?.title ||
               formData?.created_by?.title ||
               formData?.general_form?.originators?.title ||
               formData?.general_form?.user?.title ||
               'Creator';
      }
      return null;
    }

    // Now check approval.role and user_type (but label already took precedence above)
    if (approval.role) return approval.role;
    if (approval.user_role) return approval.user_role;
    if (approval.user?.role) return approval.user.role;
    if (approval.raw?.role) return approval.raw.role;
    if (approval.raw?.user_role) return approval.raw.user_role;
    if (approval.raw?.user?.role) return approval.raw.user.role;

    // For other labels, check user_type
    if (approval.user_type && ROLE_MAP[approval.user_type]) {
      return ROLE_MAP[approval.user_type];
    }
    if (label.includes('prepared')) {
      return formData?.originator?.title ||
             formData?.user?.title ||
             formData?.created_by?.title ||
             formData?.general_form?.originators?.title ||
             formData?.general_form?.user?.title ||
             'Creator';
    }
    if (label.includes('checked')) return 'Branch LP';
    if (label.includes('approved')) {
      // For "Acknowledged by" when status is OPApproved, return "Operation Manager"
      if (label.includes('acknowledged') && (status === 'OPApproved' || status === 'OP Approved')) {
        return 'Operation Manager';
      }
      return 'BM/ABM';
    }
    if (label.includes('acknowledged') || label.includes('Operation Manager Approved')) {
      // CRITICAL: "Operation Manager Approved by" should ALWAYS show "Operation Manager" role
      // Only use OP approval (A2/OP), never use AC approval for this label
      if (label.includes('Operation Manager Approved')) {
        // Check if this is Operation Manager approval (A2/OP)
        if (approval) {
          const userType = (approval.user_type || approval.raw?.user_type || "").toUpperCase();
          if (userType === 'A2' || userType === 'OP') {
            return 'Operation Manager';
          }
        }
        // Default to Operation Manager for this label
        return 'Operation Manager';
      }
      // For other "acknowledged" labels (not "Operation Manager Approved by"), check user_type
      if (approval) {
        const userType = (approval.user_type || approval.raw?.user_type || "").toUpperCase();
        if (userType === 'A2' || userType === 'OP') {
          return 'Operation Manager';
        }
        if (userType === 'AC') {
          return 'Branch Account';
        }
      }
      // If status is OPApproved, default to Operation Manager
      if (status === 'OPApproved' || status === 'OP Approved') {
        return 'Operation Manager';
      }
      // Otherwise default to Branch Account
      return 'Branch Account';
    }
    if (label.includes('cancelled')) return 'Branch Account';
    // CRITICAL: "Issued by" should ALWAYS show "Branch Account" role, regardless of user_type
    if (label.includes('issued')) return 'Branch Account';
    
    return null;
  };


  const buildDisplayApprovals = () => {
    // First, get all approvals that should be shown
    const approvalsToShow = [];
    
    // Always show Prepared by
    const preparedApproval = safeApprovals.find(a => 
      (resolveLabel(a) || "").toLowerCase().includes("prepared")
    );
    approvalsToShow.push({ label: "Prepared by", key: "prepared", approval: preparedApproval });
    
    // Always show Checked by
    // Prioritize user_type 'C' (actual checker) over 'CS' (prepared/creator)
    // The 'C' type has the actual check comment, 'CS' is just the prepared step
    const cApproval = safeApprovals.find(a => a?.user_type === 'C');
    const csApproval = safeApprovals.find(a => a?.user_type === 'CS');
    const checkedApproval = cApproval || safeApprovals.find(a => (resolveLabel(a) || "").toLowerCase().includes("checked"));
    
    approvalsToShow.push({ label: "Checked by", key: "checked", approval: checkedApproval });
    
    // Always show BM Approved by
    const bmApproval = safeApprovals.find(a =>
      (resolveLabel(a) || "").toLowerCase().includes("bm approved") ||
      ((resolveLabel(a) || "").toLowerCase().includes("approved by") &&
       !(resolveLabel(a) || "").toLowerCase().includes("operation"))
    );

    approvalsToShow.push({ label: "BM Approved by", key: "approved", approval: bmApproval });
    
    // Operation Manager approval section removed
    
    // Show Account Acknowledged by - matching Laravel blade logic exactly:
    // Laravel blade line 951: @if ($getAc_Acknowledged !== null && $general_form->total_amount > 500000)
    // getAc_Acknowledged() returns ApprovalProcessUser with user_type='AC' or null
    const numericTotalAmount = Number(resolvedTotalAmount) || 0;
    const requiresOpManagerApproval = numericTotalAmount > 500000;
    
    // Normalize status for comparison
    const normalizedStatus = (status || '').toString().trim();
    
    // This ensures the section appears when amount exceeds 500k, even if form hasn't reached that stage yet
    // User requirement: Show whenever total amount exceeds 500,000 OR status is OPApproved OR OP approval exists

    // Find approval with user_type='AC' (Account acknowledgment) or 'A2'/'OP' (Operation Manager approval)
    // When status is OPApproved, Operation Manager approval should show in "Acknowledged by"
    const acAcknowledgedApproval = safeApprovals.find(a => {
      const userType = (a?.user_type || a?.raw?.user_type || "").toUpperCase();
      return userType === "AC";
    });

    // Also find Operation Manager approval (A2 or OP) for OPApproved status
    const opApproval = safeApprovals.find(a => {
      const userType = (a?.user_type || a?.raw?.user_type || "").toUpperCase();
      return userType === "A2" || userType === "OP";
    });

    // Statuses that show "Acknowledged by" (from Laravel blade line 952-957)
    // Also include OPApproved since Operation Manager approval should show as "Acknowledged by"
    const statusesForAcknowledged = [
      'Ac_Acknowledged',
      'Acknowledged',
      'OPApproved',
      'OP Approved',
      'Approved',
      'SupervisorIssued',
      'Completed'
    ];

    const statusMatches = statusesForAcknowledged.some(s =>
      normalizedStatus === s || normalizedStatus.toLowerCase() === s.toLowerCase()
    );

    // Special case: Cancel status (from Laravel blade line 957)
    const isCancelWithValidStatus = normalizedStatus === 'Cancel' || normalizedStatus === 'Cancelled';
    const acknowledgedApproval = (normalizedStatus === 'OPApproved' || normalizedStatus === 'OP Approved')
      ? opApproval  // For OPApproved status, ONLY use OP approval, don't fallback to AC
      : (opApproval || acAcknowledgedApproval);  // For other statuses, prefer OP, fallback to AC
    const cancelConditionMet = isCancelWithValidStatus &&
      acknowledgedApproval &&
      acknowledgedApproval.status !== 'Cancel' &&
      acknowledgedApproval.raw?.status !== 'Cancel';

    const hasAcAcknowledgedApproval = acknowledgedApproval !== null && acknowledgedApproval !== undefined;

    const isOPApprovedStatus = normalizedStatus === 'OPApproved' || normalizedStatus === 'OP Approved';
    const hasOpApproval = Boolean(opApproval);

    // Check for cancelled status early
    const isCancelledStatus = (status || '').toString().toLowerCase().includes('cancel');
    const shouldShowAcknowledged = !isCancelledStatus && (
      requiresOpManagerApproval ||
      isOPApprovedStatus ||
      (hasOpApproval && requiresOpManagerApproval) || // Only show if OP approval exists AND amount still > 500k
      (hasAcAcknowledgedApproval && requiresOpManagerApproval && (statusMatches || cancelConditionMet))
    );

    
    
    // Show "Acknowledged by" if:
    // Option 1: Approval exists AND amount > 500000 AND status matches (exact Laravel logic)
    // Option 2: Amount > 500000 (regardless of status - show as placeholder for future acknowledgment)
    // Option 3: Status is OPApproved (Operation Manager has approved)
    // Option 4: OP approval exists (show even if amount conditions don't match)
    if (shouldShowAcknowledged) {
      // Always use "Operation Manager Approved by" label
      // CRITICAL: For OPApproved status, ONLY use OP approval (A2/OP), never use AC or BM approval
      // For other statuses, prefer OP approval but can show section even if no approval exists yet
      const approvalForDisplay = (normalizedStatus === 'OPApproved' || normalizedStatus === 'OP Approved')
        ? opApproval  // For OPApproved status, ONLY use OP approval, don't fallback to AC or BM
        : (opApproval || acknowledgedApproval);  // For other statuses, prefer OP approval, fallback to AC if needed
      
      
      // Show the section when conditions are met (will show as pending if no approval exists)
      approvalsToShow.push({ label: "Operation Manager Approved by", key: "acknowledged", approval: approvalForDisplay });
    }
    
    // Always show Issued by (but skip for cancelled forms - cancellation info shows in header)

    if (!isCancelledStatus) {
      const issuedApproval = safeApprovals.find(a => {
        const label = (resolveLabel(a) || "").toLowerCase();
        return label.includes("issued");
      });
      approvalsToShow.push({ label: "Issued by", key: "issued", approval: issuedApproval });
    }
    
    return approvalsToShow.map(({ label, key, approval: matchingApproval }) => {
      const isCurrentStep = CURRENT_STEP_STATUS[key] === status;
      const isPreparedBy = label === 'Prepared by';
      let hasActed = isPreparedBy || 
                      matchingApproval?.acted || 
                      (matchingApproval?.status && matchingApproval.status !== "Pending");
      
      // For "Checked by", only mark as acted if form status is "Checked" or higher, OR if approval has actual_user_id
      // This prevents "Checked by" from showing as filled when form status is "Ongoing"
      if (label === 'Checked by') {
        // Only show as acted if:
        // 1. Form status is "Checked" or higher (not "Ongoing"), OR
        // 2. The approval has actual_user_id (someone actually checked it), OR
        // 3. The approval status is explicitly "Checked"
        const isCheckedStatus = status === 'Checked' || 
                                status === 'BM Approved' || 
                                status === 'BMApproved' ||
                                status === 'OPApproved' ||
                                status === 'OP Approved' ||
                                status === 'Ac_Acknowledged' ||
                                status === 'Acknowledged' ||
                                status === 'Completed' ||
                                status === 'Issued' ||
                                status === 'SupervisorIssued';
        
        if (status === 'Ongoing' || status === 'ongoing') {
          // Form is still ongoing - only show as acted if approval has actual_user_id
          hasActed = Boolean(matchingApproval?.actual_user_id);
        } else if (isCheckedStatus || matchingApproval?.actual_user_id || matchingApproval?.status === 'Checked') {
          // Form has been checked or approval explicitly shows checked

          hasActed = true;
        } else {
          // Otherwise, don't show as acted
          hasActed = false;
        }
      }

      // For "BM Approved by", mark as acted based on cancellation logic:
      // 1. Form status is "BM Approved" or higher = show as acted
      // 2. Form is cancelled by Operation Manager = show as acted (BM approval is still valid)
      // 3. Form is cancelled by Branch Manager = show as pending (BM didn't actually approve)
      if (label === 'BM Approved by') {
        const isBmApprovedStatus = status === 'BM Approved' ||
                                  status === 'BMApproved' ||
                                  status === 'OPApproved' ||
                                  status === 'OP Approved' ||
                                  status === 'Ac_Acknowledged' ||
                                  status === 'Acknowledged' ||
                                  status === 'Completed' ||
                                  status === 'Issued' ||
                                  status === 'SupervisorIssued';

        const isCancelled = (status || '').toLowerCase().includes('cancel');

        if (isBmApprovedStatus) {
          // Form has been BM Approved or higher - always show as acted
          hasActed = true;
        } else if (isCancelled && matchingApproval && (matchingApproval.acted || matchingApproval.status === 'BM Approved')) {
          // Form is cancelled and has BM approval record - check who cancelled
          // Look for cancel_user in the approvals array
          const cancelUserApproval = safeApprovals.find(a => a?.user_type === 'cancel_user');
          const cancelledByName = cancelUserApproval?.actual_user_name ||
                                 cancelUserApproval?.name ||
                                 formData?.cancelled_by_name ||
                                 formData?.cancel_by_name ||
                                 formData?.cancelled_by_user?.name ||
                                 formData?.cancel_by_user?.name || '';

          // Check if cancelled by operation manager (contains keywords)
          // Expanded list to include common operation manager identifiers
          const cancelledByOpManager = cancelledByName.toLowerCase().includes('operation') ||
                                      cancelledByName.toLowerCase().includes('op') ||
                                      cancelledByName.toLowerCase().includes('manager') ||
                                      cancelledByName.toLowerCase().includes('account') ||
                                      cancelledByName.toLowerCase().includes('accountant') ||
                                      cancelledByName.toLowerCase().includes('p-too') || // Known operation manager
                                      cancelledByName.toLowerCase().includes('too') ||
                                      // Add more patterns as needed
                                      false; // Placeholder for additional logic

          if (cancelledByOpManager) {
            // Operation Manager cancelled - BM approval is still valid
            hasActed = true;
          } else {
            // Branch Manager or other cancelled - BM approval should not show as completed
            hasActed = false;
          }
        } else {
          // Form is still "Checked" or lower, or cancelled without BM approval - don't show as acted
          hasActed = false;
        }
      }

      // For "Operation Mgr Approved by", if status is OPApproved/Completed/Ac_Acknowledged, it should be marked as acted
      if (label === 'Operation Mgr Approved by') {
        if (status === 'OPApproved' || status === 'OP Approved' || status === 'Completed' || status === 'Ac_Acknowledged' || status === 'Acknowledged') {

          hasActed = true;
        } else {
          // Otherwise, don't show as acted
          hasActed = false;
        }
      }


      // Operation Mgr Approved by section removed
      
      // For "Issued by", if status is Completed/Issued/SupervisorIssued, it should be marked as acted
      if (label === 'Issued by') {
        if (status === 'Completed' || status === 'Issued' || status === 'SupervisorIssued') {
          hasActed = true;
        } else if (!matchingApproval || !matchingApproval.actual_user_id) {
          hasActed = false;
        }
      }
      
      // For "Operation Manager Approved by", if status is Ac_Acknowledged/Acknowledged/OPApproved, it should be marked as acted
      if (label === 'Operation Manager Approved by') {
        const originalHasActed = hasActed;
        const isAcknowledgedStatus = status === 'Ac_Acknowledged' || status === 'Acknowledged' || status === 'OPApproved' || status === 'OP Approved';
        if (isAcknowledgedStatus) {
          hasActed = true;
          // If matching approval exists but doesn't have name, try to extract from approval object
          if (matchingApproval && !matchingApproval.actual_user_name && !matchingApproval.name) {
            // Try to get name from various fields in the approval object
            // Check actual_user_name and name first (they might be in the object but not set)
            const approvalName = matchingApproval.actual_user_name ||
              matchingApproval.name ||
              matchingApproval.actual_user_full_name ||
              matchingApproval.raw?.actual_user_name ||
              matchingApproval.raw?.actual_user_full_name ||
              matchingApproval.raw?.name ||
              matchingApproval.acknowledges?.name ||
              matchingApproval.raw?.acknowledges?.name ||
              matchingApproval.approval_users?.name ||
              matchingApproval.raw?.approval_users?.name ||
              matchingApproval.user?.name ||
              matchingApproval.raw?.user?.name ||
              matchingApproval.assigned_name ||
              matchingApproval.raw?.assigned_name ||
              '';
            if (approvalName) {
              // Set the name in the approval object for display
              matchingApproval.actual_user_name = approvalName;
              matchingApproval.name = approvalName;
            }
          }
          // If still no name, try to find from approvals array directly (in case matchingApproval is missing fields)
          if ((!matchingApproval || (!matchingApproval.actual_user_name && !matchingApproval.name)) && isAcknowledgedStatus) {
            // Try to find OP approval directly from safeApprovals
            const directOpApproval = safeApprovals.find(a => {
              const userType = (a?.user_type || a?.raw?.user_type || "").toUpperCase();
              return (userType === "A2" || userType === "OP") && (a?.actual_user_name || a?.name || a?.actual_user_full_name);
            });
            
            if (directOpApproval) {
              const directName = directOpApproval.actual_user_name ||
                directOpApproval.name ||
                directOpApproval.actual_user_full_name ||
                directOpApproval.raw?.actual_user_name ||
                directOpApproval.raw?.name ||
                directOpApproval.raw?.actual_user_full_name ||
                directOpApproval.user?.name ||
                directOpApproval.raw?.user?.name ||
                directOpApproval.approval_users?.name ||
                directOpApproval.raw?.approval_users?.name ||
                '';
              if (directName) {
                matchingApproval = matchingApproval || {};
                matchingApproval.actual_user_name = directName;
                matchingApproval.name = directName;
              }
            }
          }
          
          // If still no name, try to get from formData
          if ((!matchingApproval || (!matchingApproval.actual_user_name && !matchingApproval.name)) && isAcknowledgedStatus) {
            // Try to find the name from formData or other sources
            const acknowledgedName = formData?.acknowledged_by_name || 
              formData?.general_form?.acknowledged_by_name ||
              formData?.acknowledged_by_user?.name ||
              formData?.general_form?.acknowledged_by_user?.name ||
              '';
            if (acknowledgedName) {
              // Create a virtual approval object for display
              matchingApproval = matchingApproval || {};
              matchingApproval.actual_user_name = acknowledgedName;
              matchingApproval.name = acknowledgedName;
            }
          }
        } else if (matchingApproval && matchingApproval.actual_user_id) {
          hasActed = true;
        } else if (matchingApproval && (matchingApproval.acted || matchingApproval.status !== 'Pending')) {
          hasActed = true;
        } else if (!matchingApproval) {
          hasActed = false;
        }
      }
      
      const nameCandidates = [
        // Check the computed 'name' field first (backend formatApprovalsForResponse returns this)
        matchingApproval?.name,
        // Check actual_user_name and actual_user_full_name (direct database fields)
        matchingApproval?.actual_user_name,
        matchingApproval?.actual_user_full_name,
        // Check approval_users (for BM/Checker approvals)
        matchingApproval?.raw?.approval_users?.name,
        matchingApproval?.approval_users?.name,
        // Check acknowledges (for OP Manager/Account approvals)
        matchingApproval?.raw?.acknowledges?.name,
        matchingApproval?.acknowledges?.name,
        // Other name fields
        matchingApproval?.user_name,
        matchingApproval?.acted_by,
        matchingApproval?.acted_by_name,
        matchingApproval?.user?.name,
        matchingApproval?.raw?.actual_user_name,
        matchingApproval?.raw?.actual_user_full_name,
        matchingApproval?.raw?.name,
        matchingApproval?.raw?.user_name,
        matchingApproval?.raw?.acted_by,
        matchingApproval?.raw?.acted_by_name,
        matchingApproval?.raw?.created_by_name,
        matchingApproval?.raw?.originator_name,
        matchingApproval?.raw?.requester_name,
        // For "Operation Mgr Approved by", check approval first, then formData when status is Completed/OPApproved/Ac_Acknowledged
        (label === 'Operation Mgr Approved by')
          ? (
              matchingApproval?.actual_user_name || 
              matchingApproval?.name || 
              matchingApproval?.raw?.actual_user_name ||
              matchingApproval?.acknowledges?.name ||
              matchingApproval?.raw?.acknowledges?.name ||
              matchingApproval?.raw?.approval_users?.name ||
              matchingApproval?.approval_users?.name ||
              matchingApproval?.raw?.user?.name ||
              matchingApproval?.user?.name ||
              matchingApproval?.actual_user_full_name ||
              matchingApproval?.raw?.actual_user_full_name
            )
          : null,
        // For "Issued by" when status is Completed, check approval first, then formData
        (label === 'Issued by' && (status === 'Completed' || status === 'Issued' || status === 'SupervisorIssued')) 
          ? (matchingApproval?.name || matchingApproval?.actual_user_name || formData?.issued_by_name || formData?.general_form?.issued_by_name || formData?.issued_by_user?.name || formData?.general_form?.issued_by_user?.name)
          : null,
        // For "Operation Manager Approved by", check approval first, then formData, and also check if status is Ac_Acknowledged/OPApproved
        (label === 'Operation Manager Approved by')
          ? (() => {
              // First, try to get name from the matching approval
              const fromMatchingApproval = 
              matchingApproval?.actual_user_name || 
                matchingApproval?.actual_user_full_name ||
              matchingApproval?.name || 
              matchingApproval?.raw?.actual_user_name ||
                matchingApproval?.raw?.actual_user_full_name ||
                matchingApproval?.raw?.name ||
                matchingApproval?.acknowledges?.name ||
                matchingApproval?.raw?.acknowledges?.name ||
                matchingApproval?.approval_users?.name ||
                matchingApproval?.raw?.approval_users?.name ||
                matchingApproval?.user?.name ||
                matchingApproval?.raw?.user?.name;
              
              if (fromMatchingApproval) return fromMatchingApproval;
              
              // If matching approval doesn't have name, search all approvals for OP approval with name
              const opApprovalWithName = safeApprovals.find(a => {
                const userType = (a?.user_type || a?.raw?.user_type || "").toUpperCase();
                const isOP = userType === "A2" || userType === "OP";
                const hasName = a?.name || a?.actual_user_name || a?.actual_user_full_name || 
                               a?.raw?.name || a?.raw?.actual_user_name || a?.raw?.actual_user_full_name ||
                               a?.user?.name || a?.raw?.user?.name ||
                               a?.approval_users?.name || a?.raw?.approval_users?.name ||
                               a?.acknowledges?.name || a?.raw?.acknowledges?.name;
                return isOP && hasName;
              });
              
              if (opApprovalWithName) {
                return opApprovalWithName?.actual_user_name || 
                       opApprovalWithName?.actual_user_full_name ||
                       opApprovalWithName?.name || 
                       opApprovalWithName?.raw?.actual_user_name ||
                       opApprovalWithName?.raw?.actual_user_full_name ||
                       opApprovalWithName?.raw?.name ||
                       opApprovalWithName?.user?.name ||
                       opApprovalWithName?.raw?.user?.name ||
                       opApprovalWithName?.approval_users?.name ||
                       opApprovalWithName?.raw?.approval_users?.name ||
                       opApprovalWithName?.acknowledges?.name ||
                       opApprovalWithName?.raw?.acknowledges?.name;
              }
              
              // Fallback to formData
              return (status === 'Ac_Acknowledged' || status === 'Acknowledged' || status === 'OPApproved' || status === 'OP Approved' ? (formData?.acknowledged_by_name || formData?.general_form?.acknowledged_by_name || formData?.acknowledged_by_user?.name || formData?.general_form?.acknowledged_by_user?.name || formData?.current_user?.name || formData?.user?.name) : null) ||
              formData?.acknowledged_by_name || 
              formData?.general_form?.acknowledged_by_name || 
              formData?.acknowledged_by_user?.name || 
                     formData?.general_form?.acknowledged_by_user?.name ||
                     '';
            })()
          : null,
        (hasActed) ? nameCache.current[label] : null,
        // Use resolveName as fallback for "Operation Manager Approved by" if no name found in approval object
        (label === 'Operation Manager Approved by') 
          ? resolveName(matchingApproval, label, formData)
          : null,
        // For "Prepared by", check formData sources if not found in approval
        // Use the same sources as the damage issue list: originators?.name || request_user_name
        // Filter out 0 values - ensure we only use valid string names
        (label === 'Prepared by')
          ? (() => {
              const candidates = [
                formData?.general_form?.originators?.name,
                formData?.general_form?.request_user_name,
                formData?.originators?.name,
                formData?.request_user_name,
                formData?.requester_name,
                formData?.originator_name,
                formData?.created_by_name,
                formData?.user_name,
                formData?.general_form?.requester_name,
                formData?.general_form?.originator_name,
                formData?.general_form?.created_by_name,
                formData?.general_form?.user?.name
              ];
              // Find first valid non-zero string value
              const validName = candidates.find(name => 
                name && 
                name !== 0 && 
                name !== '0' && 
                (typeof name === 'string' ? name.trim() : String(name).trim())
              );
              return validName || '';
            })()
          : null
      ];

      if (hasActed) {
        nameCandidates.splice(6, 0, matchingApproval?.raw?.assigned_name, matchingApproval?.assigned_name);
      }

      const resolvedNameRaw = pickFirstFilled(...nameCandidates);

      // Filter out 0 values - ensure we don't display 0 as a name
      const cleanedNameRaw = (resolvedNameRaw && resolvedNameRaw !== '0' && resolvedNameRaw !== 0) 
        ? resolvedNameRaw 
        : '';

      const hasAssignedName = Boolean(cleanedNameRaw && cleanedNameRaw.trim());
      const showDetails = isPreparedBy || hasActed;

      let resolvedName = hasActed
        ? cleanedNameRaw
        : isCurrentStep
          ? (currentUser?.name || '')
          : null;

      let resolvedDate = '';
      if (hasActed) {
        // Try approval date fields first
        resolvedDate = matchingApproval?.acted_at ||
          matchingApproval?.date ||
          matchingApproval?.updated_at ||
          matchingApproval?.raw?.acted_at ||
          matchingApproval?.raw?.date ||
          matchingApproval?.raw?.updated_at ||
          '';
        
        // For "Prepared by", get the created_at date
        if (!resolvedDate && label === 'Prepared by') {
          resolvedDate = formData?.created_at || 
            formData?.general_form?.created_at || 
            matchingApproval?.created_at ||
            matchingApproval?.raw?.created_at ||
            '';
        }
        
        // For "Issued by" when status is Completed, check formData
        if (!resolvedDate && label === 'Issued by' && (status === 'Completed' || status === 'Issued' || status === 'SupervisorIssued')) {
          resolvedDate = formData?.issued_at || formData?.general_form?.issued_at || formData?.general_form?.updated_at || '';
        }
        
        // For "Operation Manager Approved by" when status is Ac_Acknowledged/OPApproved, check approval date or formData
        if (!resolvedDate && label === 'Operation Manager Approved by' && (status === 'Ac_Acknowledged' || status === 'Acknowledged' || status === 'OPApproved' || status === 'OP Approved')) {
          resolvedDate = matchingApproval?.acted_at || 
            matchingApproval?.date || 
            matchingApproval?.updated_at || 
            formData?.acknowledged_at || 
            formData?.general_form?.acknowledged_at || 
            formData?.general_form?.updated_at || 
            '';
        }
      } else if (isPreparedBy) {
        resolvedDate = formData?.created_at || formData?.general_form?.created_at || new Date().toISOString();
      }

      const currentStageLabel = CURRENT_STEP_STATUS[key];
      const resolvedStatus = () => {
        // If status is Completed/SupervisorIssued and this is "Issued by", it should show as Completed
        if (label === 'Issued by' && (status === 'Completed' || status === 'Issued' || status === 'SupervisorIssued')) {
          return 'Completed';
        }
        // If status is Ac_Acknowledged/Acknowledged/OPApproved and this is "Operation Manager Approved by", it should show as Approved
        if (label === 'Operation Manager Approved by' && (status === 'Ac_Acknowledged' || status === 'Acknowledged' || status === 'OPApproved' || status === 'OP Approved')) {
          return 'Approved';
        }
        // For "Checked by", return "Checked" only when actually acted (has actual_user_id or status is Checked)
        // If form is Ongoing, don't show as "Checked" even if approval exists
        if (label === 'Checked by') {
          if (hasActed && (matchingApproval?.actual_user_id || matchingApproval?.status === 'Checked' || status !== 'Ongoing')) {
            return 'Checked';
          }
          // If form is Ongoing and no actual check has happened, show as Pending
          if (status === 'Ongoing' || status === 'ongoing') {
            return 'Pending';
          }
          return hasActed ? 'Checked' : 'Pending';
        }
        // For "BM Approved by", return "Approved" when acted
        if (label === 'BM Approved by' && hasActed) {
          return 'Approved';
        }
        // Operation Mgr Approved by section removed
        // Use the status from approval if it's valid and not "Pending"
        if (matchingApproval?.status && matchingApproval.status !== 'Pending') {
          return matchingApproval.status;
        }
        if (isPreparedBy) return 'Prepared';
        if (hasActed) return currentStageLabel || 'Approved';
        if (isCurrentStep) return currentStageLabel || 'In Progress';
        return 'Pending';
      };

      // Resolve title and department from approval data
      const resolveTitle = () => {
        // For "Prepared by", try to get title from formData first
        if (label === 'Prepared by') {
          return formData?.originator?.title ||
                 formData?.user?.title ||
                 formData?.created_by?.title ||
                 formData?.general_form?.originators?.title ||
                 formData?.general_form?.user?.title ||
                 matchingApproval?.raw?.approval_users?.title ||
                 matchingApproval?.raw?.user?.title ||
                 matchingApproval?.approval_users?.title ||
                 matchingApproval?.user?.title ||
                 '';
        }
        return matchingApproval?.raw?.approval_users?.title ||
               matchingApproval?.raw?.acknowledges?.title ||
               matchingApproval?.raw?.user?.title ||
               matchingApproval?.approval_users?.title ||
               matchingApproval?.acknowledges?.title ||
               matchingApproval?.user?.title ||
               '';
      };

      const resolveDepartment = () => {
        // For "Prepared by", try to get department from formData first
        if (label === 'Prepared by') {
          return formData?.originator?.departments?.name ||
                 formData?.user?.departments?.name ||
                 formData?.created_by?.departments?.name ||
                 formData?.general_form?.originators?.departments?.name ||
                 formData?.general_form?.user?.departments?.name ||
                 matchingApproval?.raw?.approval_users?.departments?.name ||
                 matchingApproval?.raw?.user?.departments?.name ||
                 matchingApproval?.approval_users?.departments?.name ||
                 matchingApproval?.user?.departments?.name ||
                 '';
        }
        return matchingApproval?.raw?.approval_users?.departments?.name ||
               matchingApproval?.raw?.acknowledges?.departments?.name ||
               matchingApproval?.raw?.user?.departments?.name ||
               matchingApproval?.approval_users?.departments?.name ||
               matchingApproval?.acknowledges?.departments?.name ||
               matchingApproval?.user?.departments?.name ||
               '';
      };

      // Resolve branch from approval data
      const resolveBranch = () => {
        return matchingApproval?.actual_user_branch ||
               matchingApproval?.branch ||
               matchingApproval?.raw?.actual_user_branch ||
               matchingApproval?.raw?.branch ||
               matchingApproval?.user?.from_branches?.branch_short_name ||
               matchingApproval?.approval_users?.from_branches?.branch_short_name ||
               matchingApproval?.assignedUser?.from_branches?.branch_short_name ||
               '';
      };
      
      // For "Prepared by", always try to get name from formData if not in approval
      // Use the same sources as the damage issue list: originators?.name || request_user_name
      if (label === 'Prepared by' && (!resolvedName || (typeof resolvedName === 'string' && !resolvedName.trim()))) {
        const preparedName = formData?.general_form?.originators?.name ||
                            formData?.general_form?.request_user_name ||
                            formData?.originators?.name ||
                            formData?.request_user_name ||
                            formData?.requester_name ||
                            formData?.originator_name ||
                            formData?.created_by_name ||
                            formData?.user_name ||
                            formData?.general_form?.requester_name ||
                            formData?.general_form?.originator_name ||
                            formData?.general_form?.created_by_name ||
                            formData?.general_form?.user?.name ||
                            '';
        // Filter out numeric values like 0 and ensure it's a valid string
        if (preparedName && preparedName !== 0 && preparedName !== '0') {
          const nameStr = typeof preparedName === 'string' ? preparedName : String(preparedName);
          if (nameStr.trim() && nameStr.trim() !== '0') {
            resolvedName = nameStr.trim();
          }
        }
      }
      
      // Filter out 0 values from resolvedName - ensure it's a valid string
      if (resolvedName === 0 || resolvedName === '0' || (typeof resolvedName === 'string' && resolvedName.trim() === '0')) {
        resolvedName = '';
      }
      
      // For "Checked by" in Ongoing forms, don't show name unless actually checked
      const resolvedNameStr = resolvedName && typeof resolvedName === 'string' ? resolvedName.trim() : '';
      let displayName = showDetails
        ? (resolvedNameStr || (isCurrentStep && !hasActed ? "In Progress" : ""))
        : "";
      
      if (label === 'Checked by' && (status === 'Ongoing' || status === 'ongoing') && !hasActed) {
        // Don't show name for unchecked "Checked by" in Ongoing forms
        displayName = "";
      }

      // Resolve comment - for cancelled forms, show the reason/remark from supporting info
      const resolveComment = () => {
        if (!showDetails) return "";
        
        // For "Cancelled by", prioritize reason from formData
        if (label === 'Cancelled by') {
          return formData?.reason ||
                 formData?.cancel_reason ||
                 formData?.cancellation_reason ||
                 formData?.general_form?.reason ||
                 formData?.general_form?.cancel_reason ||
                 formData?.general_form?.cancellation_reason ||
                 matchingApproval?.comment ||
                 "";
        }
        
        // For other approvals, use the comment from approval 
        return matchingApproval?.comment || "";
      };

      const result = {
        label,
        role: showDetails ? (resolveRole(matchingApproval, label) || (isPreparedBy ? 'Creator' : null)) : null,
        status: resolvedStatus(),
        acted: hasActed,
        isCurrentStep: isPreparedBy ? false : isCurrentStep,
        name: displayName,
        title: showDetails ? resolveTitle() : "",
        department: showDetails ? resolveDepartment() : "",
        date: showDetails ? resolvedDate : "",
        comment: resolveComment(),
        branch: showDetails ? resolveBranch() : "",
      };
      
      return result;
    });
  };

  const displayApprovals = buildDisplayApprovals();

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm">
      <div className="grid grid-cols-2 md:flex md:flex-nowrap gap-2 w-full" style={{ fontSize: '13px' }}>
        {displayApprovals.map((approval, index) => {
          const isBmStage = (approval.label || '').toLowerCase().includes('bm approved');
          const isCancelledCard = (approval.label || '').toLowerCase().includes('cancelled');
          const statusClass = approval.acted
            ? isCancelledCard
              ? 'bg-red-100 text-red-700 border-blue-300'
              : isBmStage
                ? 'bg-green-100 text-blue-700 border-green-300'
                : 'bg-green-100 text-green-700 border-green-300'
            : approval.isCurrentStep
            ? isCancelledCard
              ? 'bg-red-100 text-red-700 border-blue-300'
              : 'bg-blue-100 text-blue-700 border-blue-300'
            : (approval.label || '').toLowerCase().includes('prepared')
            ? 'bg-blue-50 text-blue-600 border-blue-200'
            : 'bg-yellow-100 text-yellow-700 border-yellow-300';

          // Determine inner shadow color class for mobile
          const getInnerShadowClass = () => {
        if (isCancelledCard) {
          return '[box-shadow:inset_0_0_30px_rgba(253,161,157,0.4)]'; // Soft red inner shadow matching #fda19d for cancelled card
        }
        if (approval.acted) {
              return isBmStage 
                ? '[box-shadow:inset_0_0_30px_rgba(34,197,94,0.25)]' // Green inner shadow for BM Approved
                : '[box-shadow:inset_0_0_30px_rgba(34,197,94,0.25)]'; // Green inner shadow for acted
            }
            if (approval.isCurrentStep) {
              return '[box-shadow:inset_0_0_30px_rgba(59,130,246,0.25)]'; // Blue inner shadow for current step
            }
            if ((approval.label || '').toLowerCase().includes('prepared')) {
              return '[box-shadow:inset_0_0_30px_rgba(59,130,246,0.2)]'; // Light blue inner shadow for prepared
            }
            return '[box-shadow:inset_0_0_30px_rgba(234,179,8,0.25)]'; // Yellow inner shadow for pending
          };

          return (
            <div
              key={`${approval.label}-${index}`}
              className={`rounded-[8px] p-3 text-[#012970] flex flex-col gap-1 min-w-0 md:flex-1 ${
                (approval.label || '').toLowerCase().includes('cancelled')
                  ? ''
                  : approval.acted
                    ? 'bg-white'
                    : 'bg-white'
              } md:shadow-sm ${getInnerShadowClass()} md:[box-shadow:none]`}
              style={(approval.label || '').toLowerCase().includes('cancelled') 
                ? { backgroundColor: '#fda19d' } 
                : {}}
            >
                <div className="flex items-center justify-between w-full">
                  <p className={`flex items-center gap-1 font-bold ${!approval.acted && !approval.isCurrentStep ? 'text-gray-500' : 'text-gray-700'}`} style={{ fontSize: '13px' }}>
                    <User className={`w-4 h-4 ${!approval.acted && !approval.isCurrentStep ? 'text-gray-500' : 'text-gray-700'}`} />
                    {approval.label}
                  </p>
                </div>
                  
                <div className="mt-1">
                  {approval.acted ? (
                    <>
                      <p className="font-bold text-gray-700" style={{ fontSize: '13px' }}>
                        {approval.title && <span>{approval.title} </span>}
                        {approval.name || (approval.label === 'Prepared by' ? '' : 'N/A')}
                      </p>
                      {(approval.department || approval.role) && (
                        <p className="text-gray-700 mt-0.5" style={{ fontSize: '13px' }}>
                          ({approval.department || approval.role})
                        </p>
                      )}
                    </>
                  ) : (
                    <p className="font-bold text-gray-500" style={{ fontSize: '13px' }}>Pending</p>
                  )}
                </div>

                {approval.date && (
                  <div>
                    <p className={!approval.acted && !approval.isCurrentStep ? 'text-gray-500' : 'text-gray-700'} style={{ fontSize: '13px' }}>
                      {approval.acted
                        ? approval.date ? new Date(approval.date).toLocaleString() : 'N/A'
                        : 'Awaiting action'}
                    </p>
                  </div>
                )}

              {approval.comment && (
                <div>
                  <div className={!approval.acted && !approval.isCurrentStep ? 'text-gray-500' : 'text-gray-700'} style={{ fontSize: '13px' }}>
                    {isCommentLong(approval.comment) ? (
                      <div className="w-full">
                        <div className="mb-1" style={{ maxWidth: '100%', wordWrap: 'break-word', overflowWrap: 'break-word' }}>
                          {expandedComments[index] ? (
                            <div style={{
                              whiteSpace: 'pre-wrap',
                              wordWrap: 'break-word',
                              overflowWrap: 'break-word',
                              maxWidth: '100%',
                              width: '100%'
                            }}>
                              {approval.comment}
                            </div>
                          ) : (
                            <span>{getTruncatedComment(approval.comment)}</span>
                          )}
                        </div>
                        <button
                          onClick={() => toggleCommentExpansion(index)}
                          className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-xs font-medium mt-1"
                        >
                          {expandedComments[index] ? (
                            <>
                              <ChevronUp className="w-3 h-3" />
                              See Less
                            </>
                          ) : (
                            <>
                              <ChevronDown className="w-3 h-3" />
                              See More
                            </>
                          )}
                        </button>
                      </div>
                    ) : (
                      <div style={{
                        whiteSpace: 'pre-wrap',
                        wordWrap: 'break-word',
                        overflowWrap: 'break-word',
                        maxWidth: '100%'
                      }}>
                        {approval.comment}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}