import React, { useEffect, useRef } from "react";
import { User, CheckCircle, Clock, MapPin } from "lucide-react";

const DEFAULT_APPROVALS = [
  { label: "Prepared by", key: "prepared" },
  { label: "Checked by", key: "checked" },
  { label: "Approved by", key: "approved" },
  { label: "Operation Mgr Approved by", key: "operation" },
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
  A2: "Operation Mgr Approved by",
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

export default function ApprovalSection({ approvals = [], status, formData = {} }) {
  const nameCache = useRef({});
  const safeApprovals = Array.isArray(approvals) ? approvals : [];
  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");

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
    if (label === 'Operation Mgr Approved by') {
      // Check multiple sources for Operation Manager name
      const opManagerName = 
        formData?.op_manager_name ||
        formData?.op_manager_user?.name ||
        formData?.general_form?.op_manager_name ||
        formData?.general_form?.op_manager_user?.name ||
        formData?.operation_manager_name ||
        formData?.general_form?.operation_manager_name ||
        '';
      return opManagerName;
    }
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
    if (!approval) return null;

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
    if (label.includes('prepared')) return 'Creator';
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
    const checkedApproval = safeApprovals.find(a => 
      (resolveLabel(a) || "").toLowerCase().includes("checked")
    );
    approvalsToShow.push({ label: "Checked by", key: "checked", approval: checkedApproval });
    
    // Always show BM Approved by
    const bmApproval = safeApprovals.find(a => 
      (resolveLabel(a) || "").toLowerCase().includes("bm approved") ||
      (resolveLabel(a) || "").toLowerCase().includes("approved by") && 
      !(resolveLabel(a) || "").toLowerCase().includes("operation")
    );
    approvalsToShow.push({ label: "BM Approved by", key: "approved", approval: bmApproval });
    
    // Show Operation Manager approval if:
    // 1. It exists in safeApprovals (user_type: 'OP' or 'A2' or label includes 'operation'), OR
    // 2. Status is OPApproved, Completed, or Ac_Acknowledged (even if approval not found yet)
    // Also check if total_amount > 500000 (Operation Manager approval is required for high amounts)
    const totalAmount = Number(
      formData?.general_form?.total_amount
      ?? formData?.total_amount
      ?? formData?.general_form?.totalAmount
      ?? formData?.totalAmount
      ?? 0
    );
    const requiresOpManagerApproval = totalAmount > 500000;
    
    // Find Operation Manager approval - check by user_type first (more reliable)
    const opManagerApproval = safeApprovals.find(a => {
      const userType = (a?.user_type || a?.raw?.user_type || "").toLowerCase();
      if (userType === "op" || userType === "a2") {
        return true;
      }
      const label = (resolveLabel(a) || "").toLowerCase();
      return label.includes("operation");
    });
    
    const shouldShowOpManager = opManagerApproval || 
      (requiresOpManagerApproval && (
        status === 'OPApproved' || 
        status === 'OP Approved' ||
        status === 'Completed' ||
        status === 'Ac_Acknowledged' ||
        status === 'Acknowledged'
      )) ||
      safeApprovals.some(a => {
        const userType = (a?.user_type || a?.raw?.user_type || "").toLowerCase();
        return userType === "op" || userType === "a2";
      });
    
    if (shouldShowOpManager) {
      approvalsToShow.push({ label: "Operation Mgr Approved by", key: "operation", approval: opManagerApproval });
    }
    
    // Always show Account Acknowledged by if:
    // 1. It exists in safeApprovals (user_type: 'AC' or label includes 'acknowledge'), OR
    // 2. Status is Ac_Acknowledged or Acknowledged (even if approval not found yet)
    const accountApproval = safeApprovals.find(a => {
      const label = (resolveLabel(a) || "").toLowerCase();
      const userType = (a?.user_type || a?.raw?.user_type || "").toLowerCase();
      const matches = label.includes("acknowledge") || userType === "ac";
      return matches;
    });
    const shouldShowAcknowledged = accountApproval || 
      status === 'Ac_Acknowledged' || 
      status === 'Acknowledged' ||
      safeApprovals.some(a => {
        const userType = (a?.user_type || a?.raw?.user_type || "").toLowerCase();
        return userType === "ac";
      });
    
    if (shouldShowAcknowledged) {
      approvalsToShow.push({ label: "Acknowledged by", key: "acknowledged", approval: accountApproval });
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

      // For "Operation Mgr Approved by", if status is OPApproved/Completed/Ac_Acknowledged, it should be marked as acted
      if (label === 'Operation Mgr Approved by') {
        if (status === 'OPApproved' || status === 'OP Approved' || status === 'Completed' || status === 'Ac_Acknowledged' || status === 'Acknowledged') {
          hasActed = true;
          // If no matching approval but status indicates OP approval happened, try to get name from formData
          if (!matchingApproval || !matchingApproval.actual_user_name) {
            // Try to find the name from formData or other sources
            const opManagerName = resolveName(matchingApproval, label, formData);
            if (opManagerName) {
              // Create a virtual approval object for display
              matchingApproval = matchingApproval || {};
              matchingApproval.actual_user_name = opManagerName;
              matchingApproval.name = opManagerName;
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
              matchingApproval?.raw?.actual_user_full_name ||
              // For completed forms, also check approvals array directly
              (status === 'Completed' || status === 'OPApproved' || status === 'OP Approved' || status === 'Ac_Acknowledged' || status === 'Acknowledged' ? (
                // First check formData fields
                formData?.op_manager_name || 
                formData?.general_form?.op_manager_name || 
                formData?.op_manager_user?.name || 
                formData?.general_form?.op_manager_user?.name ||
                formData?.operation_manager_name ||
                formData?.general_form?.operation_manager_name ||
                // Then check approvals array for OP Manager approval
                (() => {
                  const allApprovals = Array.isArray(formData?.approvals) ? formData.approvals : [];
                  const opApproval = allApprovals.find(a => {
                    const userType = (a?.user_type || a?.raw?.user_type || "").toLowerCase();
                    return userType === "op" || userType === "a2";
                  });
                  return opApproval?.actual_user_name ||
                         opApproval?.raw?.actual_user_name ||
                         opApproval?.name ||
                         opApproval?.acknowledges?.name ||
                         opApproval?.raw?.acknowledges?.name ||
                         opApproval?.raw?.approval_users?.name ||
                         opApproval?.approval_users?.name ||
                         opApproval?.user?.name ||
                         opApproval?.raw?.user?.name ||
                         null;
                })()
              ) : null)
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
        (hasActed) ? nameCache.current[label] : null
      ];

      if (hasActed) {
        nameCandidates.splice(6, 0, matchingApproval?.raw?.assigned_name, matchingApproval?.assigned_name);
      }

      const resolvedNameRaw = pickFirstFilled(...nameCandidates);

      const hasAssignedName = Boolean(resolvedNameRaw && resolvedNameRaw.trim());
      const showDetails = isPreparedBy || hasActed;

      const resolvedName = hasActed
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
        resolvedDate = new Date().toISOString();
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
        // For "Checked by", always return "Checked" when acted
        if (label === 'Checked by' && hasActed) {
          return 'Checked';
        }
        // For "BM Approved by", return "Approved" when acted
        if (label === 'BM Approved by' && hasActed) {
          return 'Approved';
        }
        // For "Operation Mgr Approved by", return "Approved" when acted
        if (label === 'Operation Mgr Approved by' && hasActed) {
          return 'Approved';
        }
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
        return matchingApproval?.raw?.approval_users?.title ||
               matchingApproval?.raw?.acknowledges?.title ||
               matchingApproval?.raw?.user?.title ||
               matchingApproval?.approval_users?.title ||
               matchingApproval?.acknowledges?.title ||
               matchingApproval?.user?.title ||
               '';
      };

      const resolveDepartment = () => {
        return matchingApproval?.raw?.approval_users?.departments?.name ||
               matchingApproval?.raw?.acknowledges?.departments?.name ||
               matchingApproval?.raw?.user?.departments?.name ||
               matchingApproval?.approval_users?.departments?.name ||
               matchingApproval?.acknowledges?.departments?.name ||
               matchingApproval?.user?.departments?.name ||
               '';
      };

      return {
        label,
        role: showDetails ? (resolveRole(matchingApproval, label) || (isPreparedBy ? 'Creator' : null)) : null,
        status: resolvedStatus(),
        acted: hasActed,
        isCurrentStep: isPreparedBy ? false : isCurrentStep,
        name: showDetails
          ? (resolvedName.trim() || (isCurrentStep && !hasActed ? "In Progress" : ""))
          : "",
        title: showDetails ? resolveTitle() : "",
        department: showDetails ? resolveDepartment() : "",
        date: showDetails ? resolvedDate : "",
        comment: showDetails ? (matchingApproval?.comment || "") : "",
      };
    });
  };

  const displayApprovals = buildDisplayApprovals();

  return (
    <div className="bg-blue-50 rounded-xl p-3 sm:p-4 border border-blue-100">
      <div className="flex items-center justify-between gap-2 mb-4">
        <h4 className="text-sm font-semibold text-blue-600 flex items-center gap-2">
          <CheckCircle size={16} /> Approval Section
        </h4>
        <button
          type="button"
          onClick={() => {
            // Debug button removed
          }}
          className="text-xs font-medium text-blue-600 border border-blue-200 rounded px-2 py-1 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
        >
          Log payload
        </button>
      </div>

      <div className="flex flex-nowrap gap-2 text-sm w-full">
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

          return (
            <div
              key={`${approval.label}-${index}`}
              className={`bg-white border rounded-md p-2 text-gray-700 flex flex-col gap-1 flex-1 ${approval.acted ? 'border-green-200 shadow-sm' : 'border-gray-200 shadow-sm'}`}
            >
              <div className="flex items-center justify-between w-full">
                <p className="font-semibold flex items-center gap-1 text-gray-800 text-sm">
                  <User className="text-blue-500 w-[3vw] h-[3vw] sm:w-4 sm:h-4" />
                  {approval.label}
                </p>
                {approval.acted && approval.branch && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-100 text-blue-600 text-xs">
                  <MapPin size={12} />
                  {approval.branch}
                </span>
              )}
                <span className={`inline-flex items-center justify-center px-1.5 py-0.5 rounded text-sm border ${statusClass}`}>
                  {approval.acted ? (
                    <CheckCircle className="w-[2.6vw] h-[2.6vw] sm:w-3 sm:h-3" />
                  ) : (
                    <Clock className="w-[2.6vw] h-[2.6vw] sm:w-3 sm:h-3" />
                  )}
                </span>
              </div>
                
              <div className="mt-1">
                <p className="text-xs text-gray-500">{approval.acted ? 'Approved By:' : 'Pending Approval:'}</p>
                {approval.acted ? (
                  <>
                    <p className="font-medium text-gray-900 text-sm">
                      {approval.title && <span>{approval.title}</span>}
                      {approval.name || 'N/A'}
                    </p>
                    {(approval.department || approval.role) && (
                      <p className="text-xs text-gray-600 mt-0.5">
                        ({approval.department || approval.role})
                      </p>
                    )}
                  </>
                ) : (
                  <p className="font-medium text-gray-900 text-sm">Pending</p>
                )}
              </div>

              {approval.date && (
                <div>
                  <p className="text-xs text-gray-500">{approval.acted ? 'Date Approved:' : 'Pending since:'}</p>
                  <p className="text-sm text-gray-800">
                    {approval.acted
                      ? approval.date ? new Date(approval.date).toLocaleString() : 'N/A'
                      : 'Awaiting action'}
                  </p>
                </div>
              )}

              {approval.comment && (
                <div>
                  <p className="text-sm text-gray-500 font-medium">Remark:</p>
                  <p className="text-sm text-gray-700 leading-snug">{approval.comment}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}