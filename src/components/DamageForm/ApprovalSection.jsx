import React, { useEffect, useRef } from "react";
import { User, CheckCircle, Clock } from "lucide-react";

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
  A1: "Approved by",
  AC: "Acknowledged by",
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

export default function ApprovalSection({ approvals = [], status, formData = {}, totalAmount = 0 }) {
  const nameCache = useRef({});
  const safeApprovals = Array.isArray(approvals) ? approvals : [];
  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
  
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
    // Operation Mgr Approved by section removed
    if (label === 'Acknowledged by') {
      // Check multiple sources for account acknowledgment name
      const accountName = 
        formData?.acknowledged_by_name ||
        formData?.acknowledged_by_user?.name ||
        formData?.general_form?.acknowledged_by_name ||
        formData?.general_form?.acknowledged_by_user?.name ||
        '';
      return accountName;
    }
    return '';
  };

  const resolveRole = (approval, fallbackLabel) => {
    if (!approval) {
      // For "Prepared by", try to get role from formData
      const label = (fallbackLabel || '').toLowerCase();
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

    if (approval.role) return approval.role;
    if (approval.user_role) return approval.user_role;
    if (approval.user?.role) return approval.user.role;
    if (approval.raw?.role) return approval.raw.role;
    if (approval.raw?.user_role) return approval.raw.user_role;
    if (approval.raw?.user?.role) return approval.raw.user.role;

    if (approval.user_type && ROLE_MAP[approval.user_type]) {
      return ROLE_MAP[approval.user_type];
    }

    const label = (fallbackLabel || '').toLowerCase();
    if (label.includes('prepared')) {
      return formData?.originator?.title ||
             formData?.user?.title ||
             formData?.created_by?.title ||
             formData?.general_form?.originators?.title ||
             formData?.general_form?.user?.title ||
             'Creator';
    }
    if (label.includes('checked')) return 'Branch LP';
    if (label.includes('approved')) return 'BM/ABM';
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
      (resolveLabel(a) || "").toLowerCase().includes("approved by") && 
      !(resolveLabel(a) || "").toLowerCase().includes("operation")
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
    
    // Find approval with user_type='AC' (matching getAc_Acknowledged() helper)
    const acAcknowledgedApproval = safeApprovals.find(a => {
      const userType = (a?.user_type || a?.raw?.user_type || "").toUpperCase();
      return userType === "AC";
    });
    
    // Laravel blade shows "Acknowledged by" when:
    // 1. $getAc_Acknowledged !== null (approval with user_type='AC' exists), AND
    // 2. $general_form->total_amount > 500000, AND
    // 3. Status matches: 'Ac_Acknowledged', 'Approved', 'SupervisorIssued', 'Completed', or Cancel with conditions
    // 
    // However, we should also show it even if approval doesn't exist yet but conditions are met
    // (for display purposes, showing empty slot like blade does in @elseif condition)
    const hasAcAcknowledgedApproval = acAcknowledgedApproval !== null && acAcknowledgedApproval !== undefined;
    
    // Statuses that show "Acknowledged by" (from Laravel blade line 952-957)
    const statusesForAcknowledged = [
      'Ac_Acknowledged',
      'Acknowledged',
      'Approved',
      'SupervisorIssued',
      'Completed'
    ];
    
    const statusMatches = statusesForAcknowledged.some(s => 
      normalizedStatus === s || normalizedStatus.toLowerCase() === s.toLowerCase()
    );
    
    // Special case: Cancel status (from Laravel blade line 957)
    const isCancelWithValidStatus = normalizedStatus === 'Cancel' || normalizedStatus === 'Cancelled';
    const cancelConditionMet = isCancelWithValidStatus && 
      acAcknowledgedApproval && 
      acAcknowledgedApproval.status !== 'Cancel' && 
      acAcknowledgedApproval.raw?.status !== 'Cancel';
    
    // Show "Acknowledged by" if:
    // Option 1: Approval exists AND amount > 500000 AND status matches (exact Laravel logic)
    // Option 2: Amount > 500000 (regardless of status - show as placeholder for future acknowledgment)
    // This ensures the section appears when amount exceeds 500k, even if form hasn't reached that stage yet
    // User requirement: Show whenever total amount exceeds 500,000
    const shouldShowAcknowledged = requiresOpManagerApproval || 
      (hasAcAcknowledgedApproval && requiresOpManagerApproval && (statusMatches || cancelConditionMet));
    
    // Debug logging
    if (process.env.NODE_ENV !== 'production') {
      console.log('[ApprovalSection] Acknowledged by check (Laravel logic):', {
        totalAmount: numericTotalAmount,
        requiresOpManagerApproval,
        status: normalizedStatus,
        hasAcAcknowledgedApproval,
        acAcknowledgedApproval: acAcknowledgedApproval ? {
          user_type: acAcknowledgedApproval.user_type || acAcknowledgedApproval.raw?.user_type,
          status: acAcknowledgedApproval.status || acAcknowledgedApproval.raw?.status,
          actual_user_id: acAcknowledgedApproval.actual_user_id || acAcknowledgedApproval.raw?.actual_user_id
        } : null,
        statusMatches,
        cancelConditionMet,
        shouldShowAcknowledged,
        allApprovals: safeApprovals.map(a => ({
          user_type: a?.user_type || a?.raw?.user_type,
          label: resolveLabel(a),
          status: a?.status || a?.raw?.status
        }))
      });
    }
    
    if (shouldShowAcknowledged) {
      approvalsToShow.push({ label: "Acknowledged by", key: "acknowledged", approval: acAcknowledgedApproval });
    }
    
    // Always show Issued by
    const issuedApproval = safeApprovals.find(a => 
      (resolveLabel(a) || "").toLowerCase().includes("issued")
    );
    approvalsToShow.push({ label: "Issued by", key: "issued", approval: issuedApproval });
    
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
      
      // For "Acknowledged by", if status is Ac_Acknowledged/Acknowledged, it should be marked as acted
      if (label === 'Acknowledged by') {
        const originalHasActed = hasActed;
        if (status === 'Ac_Acknowledged' || status === 'Acknowledged') {
          hasActed = true;
          // If no matching approval but status is Ac_Acknowledged, try to get name from formData
          if (!matchingApproval || !matchingApproval.actual_user_name) {
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
        // Check approval_users first (for BM/Checker approvals)
        matchingApproval?.raw?.approval_users?.name,
        matchingApproval?.approval_users?.name,
        // Check acknowledges (for OP Manager/Account approvals)
        matchingApproval?.raw?.acknowledges?.name,
        matchingApproval?.acknowledges?.name,
        // Other name fields
        matchingApproval?.actual_user_name,
        matchingApproval?.actual_user_full_name,
        matchingApproval?.name,
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
        // For "Acknowledged by", check approval first, then formData, and also check if status is Ac_Acknowledged
        (label === 'Acknowledged by')
          ? (
              matchingApproval?.actual_user_name || 
              matchingApproval?.name || 
              matchingApproval?.raw?.actual_user_name ||
              (status === 'Ac_Acknowledged' || status === 'Acknowledged' ? (formData?.acknowledged_by_name || formData?.general_form?.acknowledged_by_name || formData?.acknowledged_by_user?.name || formData?.general_form?.acknowledged_by_user?.name || formData?.current_user?.name || formData?.user?.name) : null) ||
              formData?.acknowledged_by_name || 
              formData?.general_form?.acknowledged_by_name || 
              formData?.acknowledged_by_user?.name || 
              formData?.general_form?.acknowledged_by_user?.name
            )
          : null,
        (hasActed) ? nameCache.current[label] : null,
        // For "Prepared by", check formData sources if not found in approval
        (label === 'Prepared by')
          ? (
              formData?.requester_name ||
              formData?.originator_name ||
              formData?.created_by_name ||
              formData?.user_name ||
              formData?.general_form?.requester_name ||
              formData?.general_form?.originator_name ||
              formData?.general_form?.created_by_name ||
              formData?.general_form?.originators?.name ||
              formData?.general_form?.user?.name ||
              ''
            )
          : null
      ];

      if (hasActed) {
        nameCandidates.splice(6, 0, matchingApproval?.raw?.assigned_name, matchingApproval?.assigned_name);
      }

      const resolvedNameRaw = pickFirstFilled(...nameCandidates);

      const hasAssignedName = Boolean(resolvedNameRaw && resolvedNameRaw.trim());
      const showDetails = isPreparedBy || hasActed;

      let resolvedName = hasActed
        ? resolvedNameRaw
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
        
        // For "Acknowledged by" when status is Ac_Acknowledged, check approval date or formData
        if (!resolvedDate && label === 'Acknowledged by' && (status === 'Ac_Acknowledged' || status === 'Acknowledged')) {
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
        // If status is Ac_Acknowledged/Acknowledged and this is "Acknowledged by", it should show as Acknowledged
        if (label === 'Acknowledged by' && (status === 'Ac_Acknowledged' || status === 'Acknowledged')) {
          return 'Acknowledged';
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
      if (label === 'Prepared by' && !resolvedName.trim()) {
        const preparedName = formData?.requester_name ||
                            formData?.originator_name ||
                            formData?.created_by_name ||
                            formData?.user_name ||
                            formData?.general_form?.requester_name ||
                            formData?.general_form?.originator_name ||
                            formData?.general_form?.created_by_name ||
                            formData?.general_form?.originators?.name ||
                            '';
        if (preparedName.trim()) {
          resolvedName = preparedName;
        }
      }
      
      // For "Checked by" in Ongoing forms, don't show name unless actually checked
      let displayName = showDetails
        ? (resolvedName.trim() || (isCurrentStep && !hasActed ? "In Progress" : ""))
        : "";
      
      if (label === 'Checked by' && (status === 'Ongoing' || status === 'ongoing') && !hasActed) {
        // Don't show name for unchecked "Checked by" in Ongoing forms
        displayName = "";
      }

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
        comment: showDetails ? (matchingApproval?.comment || "") : "",
        branch: showDetails ? resolveBranch() : "",
      };
      
      return result;
    });
  };

  const displayApprovals = buildDisplayApprovals();

  return (
    <div className="bg-blue-50 rounded-xl p-3 sm:p-4 border border-blue-100">
      <div className="flex items-center justify-between gap-2 mb-4">
        <h4 className="text-sm font-semibold text-blue-600 flex items-center gap-2">
          <CheckCircle size={16} /> Approval Section
        </h4>
      </div>

      <div className="grid grid-cols-2 md:flex md:flex-nowrap gap-2 text-sm w-full">
        {displayApprovals.map((approval, index) => {
          const isBmStage = (approval.label || '').toLowerCase().includes('bm approved');
          const statusClass = approval.acted
            ? isBmStage
              ? 'bg-blue-100 text-blue-700 border-blue-300'
              : 'bg-green-100 text-green-700 border-green-300'
            : approval.isCurrentStep
            ? 'bg-blue-100 text-blue-700 border-blue-300'
            : (approval.label || '').toLowerCase().includes('prepared')
            ? 'bg-blue-50 text-blue-600 border-blue-200'
            : 'bg-yellow-100 text-yellow-700 border-yellow-300';

          // Determine inner shadow color class for mobile
          const getInnerShadowClass = () => {
            if (approval.acted) {
              return isBmStage 
                ? '[box-shadow:inset_0_0_30px_rgba(59,130,246,0.25)]' // Blue inner shadow for BM Approved
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
              className={`bg-white border rounded-md p-2 text-gray-700 flex flex-col gap-1 min-w-0 md:flex-1 ${approval.acted ? 'border-green-200' : 'border-gray-200'} md:shadow-sm ${getInnerShadowClass()} md:[box-shadow:none]`}
            >
                <div className="flex items-center justify-between w-full">
                  <p className="flex items-center gap-1 text-gray-500 text-xs uppercase tracking-wider">
                    <User className="text-blue-500 w-4 h-4" />
                    {approval.label}
                  </p>
                  <span className={`hidden md:inline-flex items-center justify-center px-1.5 py-0.5 rounded text-xs border ${statusClass}`}>
                    {approval.acted ? (
                      <CheckCircle className="w-3 h-3" />
                    ) : (
                      <Clock className="w-3 h-3" />
                    )}
                  </span>
                </div>
                  
                <div className="mt-1">
                  {approval.acted ? (
                    <>
                      <p className="font-medium text-gray-900 text-xs">
                        {approval.title && <span>{approval.title} </span>}
                        {approval.name || (approval.label === 'Prepared by' ? '' : 'N/A')}
                      </p>
                      {(approval.department || approval.role) && (
                        <p className="text-xs text-gray-600 mt-0.5">
                          ({approval.department || approval.role})
                        </p>
                      )}
                    </>
                  ) : (
                    <p className="font-medium text-gray-900 text-xs">Pending</p>
                  )}
                </div>

                {approval.date && (
                  <div>
                    <p className="text-xs text-gray-800">
                      {approval.acted
                        ? approval.date ? new Date(approval.date).toLocaleString() : 'N/A'
                        : 'Awaiting action'}
                    </p>
                  </div>
                )}

              {approval.comment && (
                <div>
                  <p className="text-xs text-gray-700 leading-snug">{approval.comment}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}