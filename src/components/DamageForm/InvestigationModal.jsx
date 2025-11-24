import React, { useState, useEffect, useMemo } from "react";
import {
  X,
  User,
  Truck,
  CloudLightning,
  FileText,
  Shield,
  AlertTriangle,
  Users,
  Save,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { apiRequest } from "../../utils/api";
import { toast } from "react-toastify";

const InvestigationCategoryButton = ({
  icon: Icon,
  label,
  selected,
  onClick,
}) => (
  <button
    type="button"
    className={`
      flex items-center justify-start p-3 text-sm font-medium rounded-lg transition-colors duration-200
      border ${
        selected
          ? "border-blue-500 bg-blue-50 text-blue-700 ring-2 ring-blue-200"
          : "border-gray-300 hover:bg-gray-50 text-gray-700"
      }
      w-full
    `}
    onClick={onClick}
  >
    <Icon className="w-5 h-5 mr-2" />
    {label}
  </button>
);

const InvestigationFormModal = ({
  isOpen,
  onClose,
  formData = {},
  userRole = '',
  onSave = null,
  initialData = null, // Add initialData prop
}) => {
  const status = (formData?.status || '').trim();
  const isReadOnly = ['BM Approved', 'BMApproved', 'OPApproved', 'Completed'].includes(status);
  const normalizedUserRole = (userRole || '').toString().toLowerCase();
  
  // Get current user from localStorage
  const getCurrentUser = () => {
    try {
      const userData = localStorage.getItem('user');
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      return null;
    }
  };
  
  const currentUser = getCurrentUser();
  const currentUserId = currentUser?.id || currentUser?.admin_id || currentUser?.userId;
  
  // Check if user is operation manager based on:
  // 1. Role name (normalizedUserRole === 'op_manager')
  // 2. OR if they have user_type: 'OP' in approvals array (matching Laravel Op_Manager() function)
  const approvals = useMemo(() => {
    if (Array.isArray(formData?.approvals)) return formData.approvals;
    if (Array.isArray(formData?.general_form?.approvals)) return formData.general_form.approvals;
    return [];
  }, [formData]);
  
  // Check if current user has user_type: 'OP' or 'A2' in approvals (matching Laravel Op_Manager logic)
  // Laravel Op_Manager() checks: ApprovalProcessUser where user_type='OP', admin_id=current_user_id, status in ['BM Approved', 'Approved', 'HR Checked']
  // However, when form status is 'BM Approved', the approval entry might still be 'Pending' until user approves
  // Also, user_type might be 'A2' instead of 'OP' (A2 maps to Operation Manager)
  // CRITICAL: API doesn't return admin_id in response, so we check if OP approval entry exists when form is 'BM Approved'
  const isOpManagerByApproval = useMemo(() => {
    if (!approvals.length) {
      return false;
    }
    
    // Get general_form_id and amount for fallback check
    const generalFormId = formData?.general_form_id || formData?.generalFormId || formData?.id || initialData?.id;
    const totalAmount = Number(
      formData?.general_form?.total_amount
      ?? formData?.total_amount
      ?? formData?.general_form?.totalAmount
      ?? formData?.totalAmount
      ?? 0
    );
    const requiresOpManagerApproval = totalAmount > 500000;
    const formStatus = (status || '').toString().trim();
    const formStatusMatches = formStatus === 'BM Approved' || formStatus === 'BMApproved';
    
    // Check if user has approval entry with user_type: 'OP' or 'A2'
    const opApproval = approvals.find(approval => {
      // Try multiple fields for user ID
      const adminId = approval?.admin_id || approval?.raw?.admin_id;
      const actualUserId = approval?.actual_user_id || approval?.raw?.actual_user_id;
      const userId = approval?.user?.id || approval?.user_id || approval?.user?.admin_id;
      
      // Get all possible user IDs from the approval
      const allUserIds = [adminId, actualUserId, userId].filter(id => id !== undefined && id !== null);
      
      const userType = (approval?.user_type || approval?.raw?.user_type || '').toString().toUpperCase();
      const approvalStatus = (approval?.status || approval?.raw?.status || '').toString().trim();
      
      // Check if user_type matches (OP or A2 for Operation Manager)
      const userTypeMatches = userType === 'OP' || userType === 'A2';
      
      // Check if admin_id matches if available (API doesn't return it, so this might be null)
      const adminIdMatches = adminId ? (String(adminId) === String(currentUserId) || Number(adminId) === Number(currentUserId)) : false;
      
      // Also check other user ID fields as fallback
      const otherUserIdMatches = allUserIds.some(id => 
        String(id) === String(currentUserId) || Number(id) === Number(currentUserId)
      );
      
      // Status check: Laravel checks status in ['BM Approved', 'Approved', 'HR Checked']
      // But when form is at 'BM Approved', approval might be 'Pending' - so we also check form status
      const statusMatches = ['BM Approved', 'BMApproved', 'Approved', 'HR Checked'].includes(approvalStatus);
      
      // Fallback: If form is 'BM Approved', amount > 500000, and we have OP/A2 approval entry,
      // allow it even if we can't verify admin_id (API doesn't return it, backend will verify)
      const hasOPApprovalEntry = userTypeMatches;
      const fallbackMatch = formStatusMatches && requiresOpManagerApproval && hasOPApprovalEntry;
      
      // Match if: 
      // 1. (user_type matches AND admin_id matches AND status matches Laravel's check), OR
      // 2. (fallback: form is BM Approved, amount > 500000, and OP approval entry exists)
      const matches = (userTypeMatches && adminIdMatches && statusMatches) || fallbackMatch;
      
      if (userTypeMatches) {
        // Found OP/A2 approval entry
      }
      
      return matches;
    });
    
    const result = Boolean(opApproval);
    return result;
  }, [currentUserId, approvals, status, formData]);
  
  // User is op_manager if role name matches OR if they have OP approval entry
  const isOpManager = normalizedUserRole === 'op_manager' || isOpManagerByApproval;
  const [selectedCategory, setSelectedCategory] = useState("Thief");
  const [bmReason, setBmReason] = useState("");
  const [companyPct, setCompanyPct] = useState("");
  const [userPct, setUserPct] = useState("");
  const [incomePct, setIncomePct] = useState("");
  const [opCompanyPct, setOpCompanyPct] = useState("");
  const [opUserPct, setOpUserPct] = useState("");
  const [opIncomePct, setOpIncomePct] = useState("");
  const [accCompanyPct, setAccCompanyPct] = useState("");
  const [accUserPct, setAccUserPct] = useState("");
  const [accIncomePct, setAccIncomePct] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [investigationId, setInvestigationId] = useState(null);

  const buildPayload = () => ({
    selectedCategory,
    bmReason,
    companyPct: parseFloat(companyPct) || 0,
    userPct: parseFloat(userPct) || 0,
    incomePct: parseFloat(incomePct) || 0,
    opCompanyPct: parseFloat(opCompanyPct) || 0,
    opUserPct: parseFloat(opUserPct) || 0,
    opIncomePct: parseFloat(opIncomePct) || 0,
    accCompanyPct: parseFloat(accCompanyPct) || 0,
    accUserPct: parseFloat(accUserPct) || 0,
    accIncomePct: parseFloat(accIncomePct) || 0,
  });

  useEffect(() => {
    // Only run when modal opens or when investigation data actually changes
    if (!isOpen) return;
    
    const existing = formData?.investigation
      || formData?.investigate
      || formData?.general_form?.investigation
      || formData?.general_form?.investigate
      || null;

    if (!existing) {
      setInvestigationId(null);
      return;
    }

    const existingId = existing.id || existing.investi_id || null;
    
    // Only update if investigation ID changed (prevent infinite loop)
    setInvestigationId(prevId => {
      if (prevId !== existingId) {
        setSelectedCategory((existing.bdi_reason && existing.bdi_reason[0]?.toUpperCase() + existing.bdi_reason.slice(1)) || 'Thief');
        setBmReason(existing.bm_reason || '');
        setCompanyPct(existing.bm_company ?? existing.companyPct ?? '');
        setUserPct(existing.bm_user ?? existing.userPct ?? '');
        setIncomePct(existing.bm_income ?? existing.incomePct ?? '');
        setOpCompanyPct(existing.op_company ?? existing.opCompanyPct ?? '');
        setOpUserPct(existing.op_user ?? existing.opUserPct ?? '');
        setOpIncomePct(existing.op_income ?? existing.opIncomePct ?? '');
        setAccCompanyPct(existing.acc_company ?? existing.accCompanyPct ?? '');
        setAccUserPct(existing.acc_user ?? existing.accUserPct ?? '');
        setAccIncomePct(existing.acc_income ?? existing.accIncomePct ?? '');
        return existingId;
      }
      return prevId;
    });
  }, [formData?.investigation, formData?.investigate, formData?.general_form?.investigation, formData?.general_form?.investigate, isOpen]);

  const resolveRole = () => {
    // Check if user is op_manager by role name OR by approval user_type
    if (isOpManager) return 2;
    if (/acc|account/.test(normalizedUserRole)) return 3;
    return 1;
  };

  const resolveGeneralFormId = () => {
    // Check multiple sources for general_form_id, including response data after form submission
    let generalFormId = 
      formData?.general_form_id
      ?? formData?.generalFormId
      ?? formData?.general_form?.id
      ?? formData?.general_form?.general_form_id
      ?? formData?.id
      ?? formData?.response?.general_form_id
      ?? formData?.response?.generalFormId
      ?? formData?.response?.general_form?.id
      ?? formData?.response?.id
      ?? formData?.response?.data?.general_form_id
      ?? formData?.response?.data?.generalFormId
      ?? formData?.response?.data?.general_form?.id;
    
    // If still not found, try initialData
    if (!generalFormId && initialData) {
      generalFormId = 
        initialData?.general_form_id
        ?? initialData?.generalFormId
        ?? initialData?.general_form?.id
        ?? initialData?.id;
    }
    
    // If still not found, try to get from URL parameters
    if (!generalFormId) {
      // Try URL params as fallback
      const urlParams = new URLSearchParams(window.location.search);
      const urlId = urlParams.get('id') || urlParams.get('general_form_id');
      if (urlId) {
        return urlId;
      }
      
      // Try to get from route params (React Router)
      const pathParts = window.location.pathname.split('/');
      const potentialId = pathParts[pathParts.length - 1];
      if (potentialId && !isNaN(potentialId)) {
        return potentialId;
      }
    }
    
    return generalFormId;
  };
  
  // Calculate these before buildRequestBody so they're available
  const role = resolveRole();
  const isFormFinalized = ['Completed'].includes(status);
  const canAccountEdit = normalizedUserRole === 'account'
    && ['BM Approved', 'BMApproved', 'OPApproved', 'OP Approved'].includes(status);
  const canEditBaseFields = (!isReadOnly || canAccountEdit || role === 2) && !isFormFinalized;
  // Operation Manager fields: Only Op_Manager can edit (matching Laravel blade: Op_Manager($general_form) ? '' : 'disabled')
  // When status is 'OPApproved' or 'Completed', BM can SEE the section but cannot EDIT it
  // When status is 'BM Approved', only Op_Manager can see and edit it
  // At OP approve stage, Op_Manager can edit their percentages
  // isOpManager now checks both role name AND approval user_type: 'OP'
  // IMPORTANT: Account users should NOT be able to edit Operation Manager fields
  const canEditOperationFields = (
    (role === 2 && !isFormFinalized) || // Op_Manager role (role === 2) can edit
    (isOpManager && !isFormFinalized && (status === 'BM Approved' || status === 'BMApproved' || status === 'OPApproved' || status === 'OP Approved'))
  );
  const canEditAccountFields = ((role === 3 && !isFormFinalized) || canAccountEdit);
  const baseFieldsDisabled = !canEditBaseFields;
  const operationFieldsDisabled = !canEditOperationFields;
  const accountFieldsDisabled = !canEditAccountFields;

  const hasOperationManagerStage = useMemo(() => {
    const totalAmount = Number(
      formData?.general_form?.total_amount
      ?? formData?.total_amount
      ?? formData?.general_form?.totalAmount
      ?? formData?.totalAmount
      ?? 0
    );

    // Must have total_amount > 500000
    const requiresOpManagerApproval = totalAmount > 500000;
    if (!requiresOpManagerApproval) {
      return false;
    }

    // Check if status matches conditions from Laravel blade:
    // status === 'OPApproved' || (isOp && status === 'BM Approved') || status === 'Completed'
    // IMPORTANT: When status is 'OPApproved' or 'Completed', the section is VISIBLE to EVERYONE (including BM)
    // but only editable by Op_Manager. When status is 'BM Approved', only Op_Manager can see it.
    // isOpManager is already calculated above (checks both role name and approval user_type)
    const currentStatus = (status || '').trim();
    
    // Status is 'OPApproved' - visible to everyone (BM can see but not edit)
    if (currentStatus === 'OPApproved' || currentStatus === 'OP Approved') {
      return true;
    }
    
    // Status is 'BM Approved' - only visible to Op_Manager (checking both role and approval user_type)
    // If form is 'BM Approved', amount > 500000, and there's an OP approval entry, show it
    // This matches Laravel blade: Op_Manager($general_form) && $general_form->status == 'BM Approved'
    if (currentStatus === 'BM Approved' || currentStatus === 'BMApproved') {
      // Check if there's an OP approval entry (user will be operation manager if they have it)
      const hasOPApproval = approvals.some(a => {
        const userType = (a?.user_type || a?.raw?.user_type || '').toString().toUpperCase();
        return userType === 'OP' || userType === 'A2';
      });
      
      // Show if user is op_manager OR if there's an OP approval entry (they're the assigned OP manager)
      if (isOpManager || hasOPApproval) {
        return true;
      }
    }
    
    // Status is 'Completed' - visible to everyone (BM can see but not edit)
    if (currentStatus === 'Completed') {
      return true;
    }

    // Fallback: check if approvals array has an operation role
    // BUT only if amount > 500000 (amount requirement must be met)
    if (approvals.length && requiresOpManagerApproval) {
      const hasOpRole = approvals.some((entry) => {
        const role = (entry?.role || entry?.label || '').toString().toLowerCase();
        return role.includes('operation');
      });
      if (hasOpRole) {
        return true;
      }
    }

    return false;
  }, [approvals, formData, status, normalizedUserRole, isOpManager]);

  const showOperationManagerFields = useMemo(() => {
    return hasOperationManagerStage;
  }, [hasOperationManagerStage]);

  const buildRequestBody = (payload) => {
    // Use the outer role variable that was already calculated, don't recalculate it
    const body = new FormData();
    const generalFormId = resolveGeneralFormId();
    body.append('id', generalFormId ?? '');
    body.append('general_form_id', generalFormId ?? '');
    body.append('role', role);
    body.append('action', investigationId ? 'Update' : 'Save');
    body.append('bm_reason', payload.bmReason);
    body.append('bm_company', payload.companyPct);
    body.append('bm_user', payload.userPct);
    body.append('bm_income', payload.incomePct);

    // Include operation manager percentages ONLY if user can edit operation fields
    // This ensures consistency: if fields are editable, they should be saveable
    // IMPORTANT: Account users should NOT be able to save Operation Manager percentages
    // Use canEditOperationFields directly to ensure consistency with UI state
    if (canEditOperationFields) {
      // Always include operation manager percentages if user can edit them, even if values are 0
      body.append('op_company', String(payload.opCompanyPct || '0'));
      body.append('op_user', String(payload.opUserPct || '0'));
      body.append('op_income', String(payload.opIncomePct || '0'));
    }

    if (role === 3) {
      body.append('acc_company', payload.accCompanyPct);
      body.append('acc_user', payload.accUserPct);
      body.append('acc_income', payload.accIncomePct);
    }

    if (investigationId) {
      body.append('investi_id', investigationId);
    }

    const reasonKey = payload.selectedCategory?.toLowerCase() || '';
    const reasonFlags = {
      thief: 'thief',
      delivery: 'delivery',
      'natural accident': 'natural',
      displine: 'discipline',
      accident: 'accident',
      safety: 'safety',
      other: 'other',
    };

    const flagKey = reasonFlags[reasonKey];
    if (flagKey) {
      body.append(flagKey, '1');
    }

    return body;
  };
  
  // Only show Operation Manager section if amount > 500000 (CRITICAL requirement)
  // Even if there are existing OP percentage values, don't show if amount <= 500000
  const totalAmountForDisplay = Number(
    formData?.general_form?.total_amount
    ?? formData?.total_amount
    ?? formData?.general_form?.totalAmount
    ?? formData?.totalAmount
    ?? 0
  );
  const requiresOpManagerApproval = totalAmountForDisplay > 500000;
  
  // Show Operation Manager section only if:
  // 1. hasOperationManagerStage is true (which already checks amount > 500000), OR
  // 2. There are existing OP percentage values AND amount > 500000
  const shouldShowOperationSection = requiresOpManagerApproval && (
    showOperationManagerFields || Boolean(opCompanyPct || opUserPct || opIncomePct)
  );
  const shouldShowAccountSection = normalizedUserRole === 'account'
    || canAccountEdit
    || Boolean(accCompanyPct || accUserPct || accIncomePct);
  const isSaveDisabled = isSubmitting
    || (isFormFinalized && !canAccountEdit)
    || (isReadOnly && !canAccountEdit && role === 1);

  const categories = [
    { id: "Thief", label: "Thief", icon: User },
    { id: "Delivery", label: "Delivery", icon: Truck },
    { id: "Natural Accident", label: "Natural Accident", icon: CloudLightning },
    { id: "Displine", label: "Displine", icon: Shield },
    { id: "Accident", label: "Accident", icon: AlertTriangle },
    { id: "Safety", label: "Safety", icon: Users },
    { id: "Other", label: "Other", icon: FileText },
  ];

  const normalizePct = (raw) => {
    if (raw === null || typeof raw === 'undefined') return null;
    const trimmed = raw.toString().trim();
    if (trimmed === '') return null;
    const parsed = Number(trimmed);
    return Number.isFinite(parsed) ? parsed : NaN;
  };

  const buildSectionValidation = (entries, label) => {
    const normalized = entries.map(({ value }) => normalizePct(value));

    if (normalized.every((val) => val === null)) {
      return { valid: false, message: `${label} percentages are required.` };
    }

    if (normalized.some((val) => val === null)) {
      return { valid: false, message: `${label} percentages must include Company, User, and Income.` };
    }

    if (normalized.some((val) => Number.isNaN(val))) {
      return { valid: false, message: `${label} percentages must be numeric values.` };
    }

  //message percentages must total 100% currently total tofixed 2%.
    const total = normalized.reduce((sum, val) => sum + val, 0);
    if (Math.abs(total - 100) > 0.01) {
      return {
        valid: false,
        message: `${label} percentages must total 100%. Currently ${total.toFixed(2)}%.`,
      };
    }

    return { valid: true };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Allow submission if user can edit any fields (base, operation, or account)
    if (isReadOnly && !canAccountEdit && !canEditBaseFields && !canEditOperationFields && !canEditAccountFields) {
      onClose();
      return;
    }
    if (isSubmitting) return;

    const errors = {};

    if (!baseFieldsDisabled) {
      const result = buildSectionValidation(
        [
          { value: companyPct },
          { value: userPct },
          { value: incomePct },
        ],
        'BM / Operation'
      );
      if (!result.valid) {
        errors.base = result.message;
      }
    }

    if (!operationFieldsDisabled && shouldShowOperationSection) {
      const result = buildSectionValidation(
        [
          { value: opCompanyPct },
          { value: opUserPct },
          { value: opIncomePct },
        ],
        'Operation Manager Review'
      );
      if (!result.valid) {
        errors.operation = result.message;
      }
    }

    if (!accountFieldsDisabled && shouldShowAccountSection) {
      const result = buildSectionValidation(
        [
          { value: accCompanyPct },
          { value: accUserPct },
          { value: accIncomePct },
        ],
        'Accounts Review'
      );
      if (!result.valid) {
        errors.account = result.message;
      }
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      toast.error('Please ensure responsibility percentages total 100% in each section.');
      return;
    }

    setValidationErrors({});

    const payload = buildPayload();
    const generalFormId = resolveGeneralFormId();
    
    if (!generalFormId) {
      toast.error('Missing form identifier. Please refresh and try again.');
      setIsSubmitting(false);
      return;
    }

    const body = buildRequestBody(payload);
    

    setIsSubmitting(true);
    try {
      // apiRequest already parses JSON and throws on error, so we don't need to check response.ok
      const responseData = await apiRequest('/api/big-damage-issues/investigation', {
        method: 'POST',
        body,
      });
      
      // Extract investigation data from response
      // Laravel returns: { message: '...', data: investigation }
      const investigationData = responseData?.data || responseData?.investigation || responseData;
    
      toast.success(responseData?.message || 'Investigation updated successfully');
      
      // Call onSave callback if provided to refresh formData in parent
      if (onSave && typeof onSave === 'function') {
        onSave({ investigation: investigationData });
      }
      
      // Reload investigation data in the modal state
      if (investigationData) {
        setInvestigationId(investigationData.id || investigationData.investi_id || null);
        setOpCompanyPct(investigationData.op_company ?? investigationData.opCompanyPct ?? '');
        setOpUserPct(investigationData.op_user ?? investigationData.opUserPct ?? '');
        setOpIncomePct(investigationData.op_income ?? investigationData.opIncomePct ?? '');
        setCompanyPct(investigationData.bm_company ?? investigationData.companyPct ?? '');
        setUserPct(investigationData.bm_user ?? investigationData.userPct ?? '');
        setIncomePct(investigationData.bm_income ?? investigationData.incomePct ?? '');
        setBmReason(investigationData.bm_reason || '');
        if (investigationData.bdi_reason) {
          const category = investigationData.bdi_reason[0]?.toUpperCase() + investigationData.bdi_reason.slice(1);
          setSelectedCategory(category || 'Thief');
        }
      }
      
      onClose();
    } catch (error) {
      toast.error(error.message || 'Failed to update investigation');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" 
        >

          <div
            className="absolute inset-0"
            onClick={onClose}
            aria-hidden="true"
          ></div>

          <motion.div
            key="modal"
            initial={{ y: 40, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 20, opacity: 0, scale: 0.97 }}
            transition={{
              type: "spring",
              stiffness: 250,
              damping: 25,
            }}
            className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg z-10 max-h-[90vh] overflow-y-auto" 
          >

            <div className="sticky top-0 bg-white z-20 p-4 border-b flex justify-between items-center rounded-t-2xl">
              <h2 className="text-xl font-semibold text-gray-800">
                Investigation Form
              </h2>
              <button
                type="button"
                onClick={onClose}
                className="p-1 rounded-full text-gray-500 hover:bg-gray-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              
              <div>
                <h3 className="text-sm font-semibold mb-3 text-gray-600 uppercase tracking-wider">
                  Investigation Categories
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {categories.map((category) => (
                    <InvestigationCategoryButton
                      key={category.id}
                      icon={category.icon}
                      label={category.label}
                      selected={selectedCategory === category.id}
                      onClick={() => {
                        if (!isReadOnly) {
                          setSelectedCategory(category.id);
                        }
                      }}
                      disabled={isReadOnly}
                    />
                  ))}
                </div>
              </div>

              <hr className="border-t border-gray-200" />

              <div>
                <label
                  htmlFor="bmReason"
                  className="text-sm font-semibold mb-2 block text-gray-600 uppercase tracking-wider"
                >
                  BM Reason
                </label>
                <textarea
                  id="bmReason"
                  rows="4"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition"
                  placeholder="Enter detailed reason ..."
                  value={bmReason}
                  onChange={(e) => {
                    if (!isReadOnly) setBmReason(e.target.value);
                  }}
                  readOnly={isReadOnly}
                />
              </div>

              <hr className="border-t border-gray-200" />

              <div>
                <h3 className="text-sm font-semibold mb-3 text-gray-600 uppercase tracking-wider">
                  Responsibility Distribution
                </h3>

                <div className="space-y-6">
                  <div>
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                      BM / Operation
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {[
                        { id: "companyPct", label: "Company", value: companyPct, set: setCompanyPct },
                        { id: "userPct", label: "User", value: userPct, set: setUserPct },
                        { id: "incomePct", label: "Income", value: incomePct, set: setIncomePct },
                      ].map(({ id, label, value, set }) => (
                        <div key={id}>
                          <label
                            htmlFor={id}
                            className="block text-xs font-medium text-gray-700 mb-1"
                          >
                            {label} (%)
                          </label>
                          <input
                            type="number"
                            id={id}
                            min="0"
                            max="100"
                            step="0.1"
                            inputMode="decimal"
                            value={value ?? ""}
                            onChange={(e) => {
                              if (baseFieldsDisabled) return;
                              set(e.target.value);
                            }}
                            className="w-full rounded-lg border border-gray-300 p-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500"
                            disabled={baseFieldsDisabled}
                          />
                        </div>
                      ))}
                    </div>
                    {validationErrors.base && (
                      <p className="text-sm text-red-600 mt-2">{validationErrors.base}</p>
                    )}
                  </div>

                  {shouldShowOperationSection && (
                    <div>
                      <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                        Operation Manager Review
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {[
                          { id: "opCompanyPct", label: "Company", value: opCompanyPct, set: setOpCompanyPct },
                          { id: "opUserPct", label: "User", value: opUserPct, set: setOpUserPct },
                          { id: "opIncomePct", label: "Income", value: opIncomePct, set: setOpIncomePct },
                        ].map(({ id, label, value, set }) => (
                          <div key={id}>
                            <label
                              htmlFor={id}
                              className="block text-xs font-medium text-gray-700 mb-1"
                            >
                              {label} (%)
                            </label>
                            <input
                              type="number"
                              id={id}
                              min="0"
                              max="100"
                              step="0.1"
                              inputMode="decimal"
                              value={value ?? ""}
                              onChange={(e) => {
                                if (operationFieldsDisabled) return;
                                set(e.target.value);
                              }}
                              className="w-full rounded-lg border border-gray-300 p-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500"
                              disabled={operationFieldsDisabled}
                            />
                          </div>
                        ))}
                      </div>
                      {validationErrors.operation && (
                        <p className="text-sm text-red-600 mt-2">{validationErrors.operation}</p>
                      )}
                    </div>
                  )}

                  {shouldShowAccountSection && (
                    <div>
                      <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                        Accounts Review
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {[
                          { id: "accCompanyPct", label: "Company", value: accCompanyPct, set: setAccCompanyPct },
                          { id: "accUserPct", label: "User", value: accUserPct, set: setAccUserPct },
                          { id: "accIncomePct", label: "Income", value: accIncomePct, set: setAccIncomePct },
                        ].map(({ id, label, value, set }) => (
                          <div key={id}>
                            <label
                              htmlFor={id}
                              className="block text-xs font-medium text-gray-700 mb-1"
                            >
                              {label} (%)
                            </label>
                            <input
                              type="number"
                              id={id}
                              min="0"
                              max="100"
                              step="0.1"
                              inputMode="decimal"
                              value={value ?? ""}
                              onChange={(e) => {
                                if (accountFieldsDisabled) return;
                                set(e.target.value);
                              }}
                              className="w-full rounded-lg border border-gray-300 p-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500"
                              disabled={accountFieldsDisabled}
                            />
                          </div>
                        ))}
                      </div>
                      {validationErrors.account && (
                        <p className="text-sm text-red-600 mt-2">{validationErrors.account}</p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <hr className="border-t border-gray-200" />

              {isFormFinalized && isReadOnly && !canAccountEdit && (
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-end">
                  <div className="ml-auto flex gap-3">
                    <button
                      type="button"
                      onClick={onClose}
                      className="inline-flex items-center justify-center rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                    >
                      Close
                    </button>
                  </div>
                </div>
              )}

              {!isFormFinalized && (
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-end">
                  <div className="ml-auto flex gap-3">
                    <button
                      type="button"
                      onClick={onClose}
                      className="inline-flex items-center justify-center rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSaveDisabled}
                      className="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-blue-300"
                    >
                      <Save className="mr-2 h-4 w-4" />
                      {isSubmitting ? "Saving..." : "Save Investigation"}
                    </button>
                  </div>
                </div>
              )}
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default InvestigationFormModal;
