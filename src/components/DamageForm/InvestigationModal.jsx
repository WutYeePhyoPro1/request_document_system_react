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
import { useTranslation } from "react-i18next";

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
  const { t } = useTranslation();
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
    // Calculate totalAmount from items first (like main totalAmount), then fallback to formData fields
    const totalAmount = formData.items && formData.items.length > 0 
      ? formData.items.reduce((acc, i) => acc + (Number(i.amount) || Number(i.total) || 0), 0)
      : Number(
      formData?.general_form?.total_amount
      ?? formData?.total_amount
      ?? formData?.general_form?.totalAmount
      ?? formData?.totalAmount
          ?? formData?.general_form?.total
          ?? formData?.total
          ?? initialData?.general_form?.total_amount
          ?? initialData?.total_amount
          ?? initialData?.general_form?.total
          ?? initialData?.total
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
  }, [currentUserId, approvals, status, formData, initialData]);
  
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
    
    // Check all possible sources for investigation data
    const existing = formData?.investigation
      || formData?.investigate
      || formData?.general_form?.investigation
      || formData?.general_form?.investigate
      || initialData?.investigation
      || initialData?.investigate
      || initialData?.general_form?.investigation
      || initialData?.general_form?.investigate
      || null;

    console.log('[InvestigationModal] useEffect - Checking investigation data:', {
      isOpen,
      hasFormDataInvestigation: Boolean(formData?.investigation),
      hasFormDataInvestigate: Boolean(formData?.investigate),
      hasGeneralFormInvestigation: Boolean(formData?.general_form?.investigation),
      hasGeneralFormInvestigate: Boolean(formData?.general_form?.investigate),
      hasInitialDataInvestigation: Boolean(initialData?.investigation),
      hasInitialDataGeneralFormInvestigation: Boolean(initialData?.general_form?.investigation),
      existingFound: Boolean(existing),
      existingData: existing ? {
        id: existing.id,
        bdi_reason: existing.bdi_reason,
        bm_reason: existing.bm_reason,
        bm_company: existing.bm_company
      } : null,
    });

    if (!existing) {
      console.log('[InvestigationModal] No investigation data found');
      setInvestigationId(null);
      return;
    }

    const existingId = existing.id || existing.investi_id || null;
    
    // Always update state when investigation data changes (not just when ID changes)
    // This ensures the modal shows the latest data after save
    if (existingId !== investigationId || investigationId === null) {
      console.log('[InvestigationModal] useEffect - Updating modal state from existing data:', {
        existingId,
        currentInvestigationId: investigationId,
        bmReason: existing.bm_reason,
        bmCompany: existing.bm_company,
        opCompany: existing.op_company,
        accCompany: existing.acc_company,
      });
      
      // Handle bdi_reason: convert 'discipl' to 'discipline' for display
      const reason = existing.bdi_reason === 'discipl' ? 'discipline' : existing.bdi_reason;
      const category = (reason && reason[0]?.toUpperCase() + reason.slice(1)) || 'Thief';
      
      setInvestigationId(existingId);
      setSelectedCategory(category);
        setBmReason(existing.bm_reason || '');
      setCompanyPct(existing.bm_company ?? '');
      setUserPct(existing.bm_user ?? '');
      setIncomePct(existing.bm_income ?? '');
      setOpCompanyPct(existing.op_company ?? '');
      setOpUserPct(existing.op_user ?? '');
      setOpIncomePct(existing.op_income ?? '');
      setAccCompanyPct(existing.acc_company ?? '');
      setAccUserPct(existing.acc_user ?? '');
      setAccIncomePct(existing.acc_income ?? '');
    }
  }, [formData?.investigation, formData?.investigate, formData?.general_form?.investigation, formData?.general_form?.investigate, initialData?.investigation, initialData?.general_form?.investigation, isOpen, investigationId]);

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
  
  // Calculate totalAmount to check if form exceeds 500000
  const totalAmount = formData.items && formData.items.length > 0 
    ? formData.items.reduce((acc, i) => acc + (Number(i.amount) || Number(i.total) || 0), 0)
    : Number(
      formData?.general_form?.total_amount
      ?? formData?.total_amount
      ?? formData?.general_form?.totalAmount
      ?? formData?.totalAmount
      ?? formData?.general_form?.total
      ?? formData?.total
      ?? initialData?.general_form?.total_amount
      ?? initialData?.total_amount
      ?? initialData?.general_form?.total
      ?? initialData?.total
      ?? 0
    );
  
  // Permission logic for editing percentages:
  // 1. BM/Operation percentages: Only role 1 (BM) can edit - NEVER allow operation manager or account to edit
  // 2. Operation Manager Review percentages: Only role 2 (Operation Manager) can edit - NEVER allow BM or account to edit
  // 3. Accounts Review percentages: Only role 3 (Account) can edit - NEVER allow BM or operation manager to edit
  
  // Check if form is in acknowledged status (BM/Operation percentages should NOT be editable in this status)
  const isAcknowledgedStatus = ['Ac_Acknowledged', 'Acknowledged'].includes(status);
  
  // BM/Operation percentages: Only Branch Manager (role 1) can edit
  // Operation managers (role 2) and accounts (role 3) should NEVER be able to edit these
  // IMPORTANT: BM/Operation percentages should NOT be editable when form is in Ac_Acknowledged/Acknowledged status
  const canEditBaseFields = role === 1 && !isReadOnly && !isFormFinalized && !isAcknowledgedStatus;
  
  // Operation Manager Review percentages: Only Operation Manager (role 2) can edit
  // Also allow if user has OP approval assignment and form is in appropriate status
  // Branch managers (role 1) and accounts (role 3) should NEVER be able to edit these
  const canEditOperationFields = (
    (role === 2 && !isFormFinalized) || // Op_Manager role (role === 2) can edit
    (isOpManager && !isFormFinalized && (status === 'BM Approved' || status === 'BMApproved' || status === 'OPApproved' || status === 'OP Approved'))
  );
  
  // Accounts Review percentages: Only Account (role 3) can edit
  // Branch managers (role 1) and operation managers (role 2) should NEVER be able to edit these
  const canEditAccountFields = (role === 3 && !isFormFinalized) || canAccountEdit;
  
  const baseFieldsDisabled = !canEditBaseFields;
  const operationFieldsDisabled = !canEditOperationFields;
  const accountFieldsDisabled = !canEditAccountFields;

  const hasOperationManagerStage = useMemo(() => {
    // Calculate totalAmount from items first (like main totalAmount), then fallback to formData fields
    const totalAmount = formData.items && formData.items.length > 0 
      ? formData.items.reduce((acc, i) => acc + (Number(i.amount) || Number(i.total) || 0), 0)
      : Number(
      formData?.general_form?.total_amount
      ?? formData?.total_amount
      ?? formData?.general_form?.totalAmount
      ?? formData?.totalAmount
          ?? formData?.general_form?.total
          ?? formData?.total
          ?? initialData?.general_form?.total_amount
          ?? initialData?.total_amount
          ?? initialData?.general_form?.total
          ?? initialData?.total
      ?? 0
    );

    // Must have total_amount > 500000
    const requiresOpManagerApproval = totalAmount > 500000;
    if (!requiresOpManagerApproval) {
      return false;
    }

    // Check if current user has OP approval entry assigned to them (same logic as showApproveButton)
    const hasOpApprovalAssignment = approvals.some(approval => {
      const userType = (approval?.user_type || approval?.raw?.user_type || '').toString().toUpperCase();
      const adminId = approval?.admin_id || approval?.raw?.admin_id;
      const actualUserId = approval?.actual_user_id || approval?.raw?.actual_user_id;
      const userId = approval?.user?.id || approval?.user_id || approval?.user?.admin_id;
      const allUserIds = [adminId, actualUserId, userId].filter(id => id !== undefined && id !== null);
      
      const userTypeMatches = (userType === 'OP' || userType === 'A2');
      const userIdMatches = currentUserId && allUserIds.some(id => 
        String(id) === String(currentUserId) || Number(id) === Number(currentUserId)
      );
      
      return userTypeMatches && userIdMatches;
    });
    
    // Check role_id directly for Operation Manager (role_id 4 or 5)
    const userRoleId = currentUser?.role_id || currentUser?.roleId || currentUser?.role?.id || currentUser?.role?.role_id;
    const isOpManagerByRoleId = userRoleId === 4 || userRoleId === 5;
    
    // Final check: User is Operation Manager if:
    // 1. role_id is 4 or 5, OR
    // 2. role name is 'op_manager', OR
    // 3. isOpManager is true, OR
    // 4. isOpManagerByApproval is true, OR
    // 5. user has OP approval entry assigned to them
    const isOpManagerFinal = isOpManagerByRoleId || normalizedUserRole === 'op_manager' || isOpManager || isOpManagerByApproval || hasOpApprovalAssignment;

    // Check if status matches conditions from Laravel blade:
    // status === 'OPApproved' || (isOp && status === 'BM Approved') || status === 'Completed'
    // IMPORTANT: When status is 'OPApproved' or 'Completed', the section is VISIBLE to EVERYONE (including BM)
    // but only editable by Op_Manager. When status is 'BM Approved', only Op_Manager can see it.
    const currentStatus = (status || '').trim();
    
    // Status is 'OPApproved' - visible to everyone (BM can see but not edit)
    if (currentStatus === 'OPApproved' || currentStatus === 'OP Approved') {
      return true;
    }
    
    // Status is 'BM Approved' - only visible to Op_Manager (checking both role and approval user_type)
    // If form is 'BM Approved', amount > 500000, and user has OP approval assignment, show it
    // This matches Laravel blade: Op_Manager($general_form) && $general_form->status == 'BM Approved'
    if (currentStatus === 'BM Approved' || currentStatus === 'BMApproved') {
      // Show if user is Operation Manager (using isOpManagerFinal which includes hasOpApprovalAssignment)
      if (isOpManagerFinal) {
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
  }, [approvals, formData, status, normalizedUserRole, isOpManager, isOpManagerByApproval, currentUserId, currentUser, initialData]);

  const showOperationManagerFields = useMemo(() => {
    return hasOperationManagerStage;
  }, [hasOperationManagerStage]);

  const buildRequestBody = (payload) => {
    // Use the outer role variable that was already calculated, don't recalculate it
    const body = new FormData();
    const generalFormId = resolveGeneralFormId();
    
    if (!generalFormId) {
      console.error('[InvestigationModal] buildRequestBody: No generalFormId found!');
      throw new Error('General form ID is required');
    }
    
    // Backend expects 'id' or 'general_form_id' - send both for compatibility
    body.append('id', String(generalFormId));
    body.append('general_form_id', String(generalFormId));
    body.append('role', String(role));
    body.append('action', investigationId ? 'Update' : 'Save');
    
    // Only send BM fields if user can edit them (role 1 - Branch Manager)
    // Operation managers and accounts should NEVER be able to save BM percentages
    if (canEditBaseFields) {
      body.append('bm_reason', String(payload.bmReason || ''));
      body.append('bm_company', String(payload.companyPct || '0'));
      body.append('bm_user', String(payload.userPct || '0'));
      body.append('bm_income', String(payload.incomePct || '0'));
    }

    // Include operation manager percentages ONLY if user can edit operation fields
    // This ensures consistency: if fields are editable, they should be saveable
    // IMPORTANT: Branch managers and account users should NOT be able to save Operation Manager percentages
    // Use canEditOperationFields directly to ensure consistency with UI state
    if (canEditOperationFields) {
      // Always include operation manager percentages if user can edit them, even if values are 0
      body.append('op_company', String(payload.opCompanyPct || '0'));
      body.append('op_user', String(payload.opUserPct || '0'));
      body.append('op_income', String(payload.opIncomePct || '0'));
    }

    // Include account percentages ONLY if user can edit account fields
    // Use canEditAccountFields to ensure consistency with UI state
    // Branch managers and operation managers should NOT be able to save account percentages
    if (canEditAccountFields) {
      body.append('acc_company', String(payload.accCompanyPct || '0'));
      body.append('acc_user', String(payload.accUserPct || '0'));
      body.append('acc_income', String(payload.accIncomePct || '0'));
    }

    // Include investigation ID if updating existing record
    if (investigationId) {
      body.append('investi_id', String(investigationId));
    }

    // Map category to backend reason flag
    const reasonKey = payload.selectedCategory?.toLowerCase() || '';
    const reasonFlags = {
      thief: 'thief',
      delivery: 'delivery',
      'natural accident': 'natural',
      'natural': 'natural', // Support both formats
      discipline: 'discipline', // Backend expects 'discipline' but DB column is VARCHAR(8) - backend should handle truncation
      displine: 'discipline', // Support typo variant for backward compatibility
      accident: 'accident',
      safety: 'safety',
      other: 'other',
    };

    const flagKey = reasonFlags[reasonKey];
    if (flagKey) {
      // Backend uses $request->boolean() which expects '1', 'true', 'on', or 'yes'
      body.append(flagKey, '1');
    }
    
    // Note: The backend code tries to store 'discipline' (10 chars) in a VARCHAR(8) column
    // This is a backend bug that needs to be fixed. The backend should either:
    // 1. Use an abbreviation like 'discipl' (7 chars) or 'disci' (5 chars)
    // 2. Or increase the database column size to VARCHAR(10) or larger
    // For now, we send 'discipline' as the backend expects it, and the backend should handle the truncation/error

    return body;
  };
  
  // Only show Operation Manager section if amount > 500000 (CRITICAL requirement)
  // Even if there are existing OP percentage values, don't show if amount <= 500000
  // Calculate from items first (like main totalAmount), then fallback to formData fields
  const totalAmountForDisplay = formData.items && formData.items.length > 0 
    ? formData.items.reduce((acc, i) => acc + (Number(i.amount) || Number(i.total) || 0), 0)
    : Number(
    formData?.general_form?.total_amount
    ?? formData?.total_amount
    ?? formData?.general_form?.totalAmount
    ?? formData?.totalAmount
        ?? formData?.general_form?.total
        ?? formData?.total
        ?? initialData?.general_form?.total_amount
        ?? initialData?.total_amount
        ?? initialData?.general_form?.total
        ?? initialData?.total
    ?? 0
  );
      
  const requiresOpManagerApproval = totalAmountForDisplay > 500000;
  
  // Debug logging (after totalAmountForDisplay is defined)
  if (process.env.NODE_ENV !== 'production') {
    console.log('[InvestigationModal] Operation Manager section check:', {
      totalAmountForDisplay,
      requiresOpManagerApproval,
      hasOperationManagerStage,
      showOperationManagerFields,
      status,
      isOpManager,
      isOpManagerByApproval,
      normalizedUserRole,
      hasOpPercentages: Boolean(opCompanyPct || opUserPct || opIncomePct)
    });
  }
  
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
    { id: "Thief", label: t('investigation.categories.thief'), icon: User },
    { id: "Delivery", label: t('investigation.categories.delivery'), icon: Truck },
    { id: "Natural Accident", label: t('investigation.categories.naturalAccident'), icon: CloudLightning },
    { id: "Discipline", label: t('investigation.categories.discipline'), icon: Shield },
    { id: "Accident", label: t('investigation.categories.accident'), icon: AlertTriangle },
    { id: "Safety", label: t('investigation.categories.safety'), icon: Users },
    { id: "Other", label: t('investigation.categories.other'), icon: FileText },
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

    // Map label to translation key
    let sectionKey = 'bmOperation';
    if (label === 'Operation Manager Review') {
      sectionKey = 'operationManagerReview';
    } else if (label === 'Accounts Review') {
      sectionKey = 'accountsReview';
    }
    
    // Get translated section label (use existing investigation keys)
    const sectionLabel = t(`investigation.${sectionKey}`, { defaultValue: label });

    if (normalized.every((val) => val === null)) {
      return { valid: false, message: t('investigation.percentagesRequiredForSection', { section: sectionLabel }) };
    }

    if (normalized.some((val) => val === null)) {
      return { valid: false, message: t('investigation.percentagesMustIncludeForSection', { section: sectionLabel }) };
    }

    if (normalized.some((val) => Number.isNaN(val))) {
      return { valid: false, message: t('investigation.percentagesMustBeNumericForSection', { section: sectionLabel }) };
    }

  //message percentages must total 100% currently total tofixed 2%.
    const total = normalized.reduce((sum, val) => sum + val, 0);
    if (Math.abs(total - 100) > 0.01) {
      return {
        valid: false,
        message: t('investigation.percentagesMustTotalForSection', { section: sectionLabel, total: total.toFixed(2) }),
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

    // Validate BM Reason for role 1 (BM can edit base fields)
    if (!baseFieldsDisabled && role === 1) {
      if (!bmReason || bmReason.trim() === '') {
        errors.bmReason = t('investigation.bmReasonRequired');
      }
    }

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
      // Show specific error message
      if (errors.bmReason) {
        toast.error(errors.bmReason);
      } else if (errors.base) {
        toast.error(errors.base);
      } else if (errors.operation) {
        toast.error(errors.operation);
      } else if (errors.account) {
        toast.error(errors.account);
      } else {
        toast.error(t('messages.pleaseFillRequired'));
      }
      return;
    }

    setValidationErrors({});

    const payload = buildPayload();
    const generalFormId = resolveGeneralFormId();
    
    if (!generalFormId) {
      toast.error(t('messages.missingFormIdentifier'));
      setIsSubmitting(false);
      return;
    }

    const body = buildRequestBody(payload);
    
    // Debug: Log the FormData being sent
    console.log('[InvestigationModal] Request payload:', {
      generalFormId,
      role,
      investigationId,
      payload,
      canEditOperationFields,
      canEditAccountFields: role === 3,
    });
    
    // Debug: Log FormData contents
    if (body instanceof FormData) {
      const formDataEntries = {};
      for (const [key, value] of body.entries()) {
        formDataEntries[key] = value;
      }
      console.log('[InvestigationModal] FormData contents:', formDataEntries);
    }

    setIsSubmitting(true);
    try {
      console.log('[InvestigationModal] Sending request to:', '/api/big-damage-issues/investigation');
      
      // apiRequest already parses JSON and throws on error, so we don't need to check response.ok
      const responseData = await apiRequest('/api/big-damage-issues/investigation', {
        method: 'POST',
        body,
      });
      
      // Extract investigation data from response
      // Laravel returns: { message: '...', data: investigation }
      const investigationData = responseData?.data || responseData?.investigation || responseData;
    
      console.log('[InvestigationModal] Save response:', {
        responseData,
        investigationData,
        hasData: Boolean(investigationData),
        investigationId: investigationData?.id || investigationData?.investi_id,
      });
    
      toast.success(responseData?.message || t('investigation.updateSuccess'));
      
      // Update modal state with saved data FIRST (before calling onSave)
      if (investigationData) {
        const newInvestigationId = investigationData.id || investigationData.investi_id || null;
        setInvestigationId(newInvestigationId);
        
        // Update all fields from response, including account percentages
        setBmReason(investigationData.bm_reason || '');
        setCompanyPct(investigationData.bm_company ?? investigationData.bm_company ?? '');
        setUserPct(investigationData.bm_user ?? investigationData.bm_user ?? '');
        setIncomePct(investigationData.bm_income ?? investigationData.bm_income ?? '');
        setOpCompanyPct(investigationData.op_company ?? investigationData.op_company ?? '');
        setOpUserPct(investigationData.op_user ?? investigationData.op_user ?? '');
        setOpIncomePct(investigationData.op_income ?? investigationData.op_income ?? '');
        setAccCompanyPct(investigationData.acc_company ?? investigationData.acc_company ?? '');
        setAccUserPct(investigationData.acc_user ?? investigationData.acc_user ?? '');
        setAccIncomePct(investigationData.acc_income ?? investigationData.acc_income ?? '');
        
        // Update category from bdi_reason
        if (investigationData.bdi_reason) {
          // Handle both 'discipl' (stored) and 'discipline' (display) formats
          const reason = investigationData.bdi_reason === 'discipl' ? 'discipline' : investigationData.bdi_reason;
          const category = reason[0]?.toUpperCase() + reason.slice(1);
          setSelectedCategory(category || 'Thief');
        }
        
        console.log('[InvestigationModal] Updated modal state:', {
          investigationId: newInvestigationId,
          bmReason: investigationData.bm_reason,
          bmCompany: investigationData.bm_company,
          bmUser: investigationData.bm_user,
          bmIncome: investigationData.bm_income,
          opCompany: investigationData.op_company,
          opUser: investigationData.op_user,
          opIncome: investigationData.op_income,
          accCompany: investigationData.acc_company,
          accUser: investigationData.acc_user,
          accIncome: investigationData.acc_income,
          bdiReason: investigationData.bdi_reason,
        });
      }
      
      // Call onSave callback AFTER updating modal state to refresh formData in parent
      if (onSave && typeof onSave === 'function') {
        console.log('[InvestigationModal] Calling onSave callback with:', { investigation: investigationData });
        onSave({ investigation: investigationData });
      }
      
      // Close modal after a short delay to show success message
      setTimeout(() => {
      onClose();
      }, 1000);
    } catch (error) {
      console.error('[InvestigationModal] Save error:', {
        error,
        message: error.message,
        response: error.response,
        responseData: error.response?.data,
        stack: error.stack,
      });
      
      // Show specific error message from backend if available
      const errorMessage = error.message || error.response?.data?.message || error.response?.data?.error || t('investigation.updateFailed');
      toast.error(errorMessage);
      
      // If there's a field-specific error, set it in validation errors
      if (error.response?.data?.field === 'bm_reason') {
        setValidationErrors(prev => ({
          ...prev,
          bmReason: errorMessage
        }));
      }
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
                {t('investigation.title')}
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
                  {t('investigation.category')}
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
                  {t('investigation.bmReason')} {!baseFieldsDisabled && role === 1 && <span className="text-red-500">*</span>}
                </label>
                <textarea
                  id="bmReason"
                  rows="4"
                  className={`w-full p-3 border rounded-lg focus:ring-blue-500 focus:border-blue-500 transition ${
                    validationErrors.bmReason ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300'
                  }`}
                  placeholder={t('investigation.bmReasonPlaceholder')}
                  value={bmReason}
                  onChange={(e) => {
                    if (!isReadOnly) {
                      setBmReason(e.target.value);
                      // Clear error when user starts typing
                      if (validationErrors.bmReason) {
                        setValidationErrors(prev => {
                          const newErrors = { ...prev };
                          delete newErrors.bmReason;
                          return newErrors;
                        });
                      }
                    }
                  }}
                  readOnly={isReadOnly}
                />
                {validationErrors.bmReason && (
                  <p className="text-sm text-red-600 mt-2">{validationErrors.bmReason}</p>
                )}
              </div>

              <hr className="border-t border-gray-200" />

              <div>
                <h3 className="text-sm font-semibold mb-3 text-gray-600 uppercase tracking-wider">
                  {t('investigation.responsibilityDistribution')}
                </h3>

                <div className="space-y-6">
                  <div>
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                      {t('investigation.bmOperation')}
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {[
                        { id: "companyPct", label: t('investigation.company'), value: companyPct, set: setCompanyPct },
                        { id: "userPct", label: t('investigation.user'), value: userPct, set: setUserPct },
                        { id: "incomePct", label: t('investigation.income'), value: incomePct, set: setIncomePct },
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
                        {t('investigation.operationManagerReview')}
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {[
                          { id: "opCompanyPct", label: t('investigation.company'), value: opCompanyPct, set: setOpCompanyPct },
                          { id: "opUserPct", label: t('investigation.user'), value: opUserPct, set: setOpUserPct },
                          { id: "opIncomePct", label: t('investigation.income'), value: opIncomePct, set: setOpIncomePct },
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
                        {t('investigation.accountsReview')}
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {[
                          { id: "accCompanyPct", label: t('investigation.company'), value: accCompanyPct, set: setAccCompanyPct },
                          { id: "accUserPct", label: t('investigation.user'), value: accUserPct, set: setAccUserPct },
                          { id: "accIncomePct", label: t('investigation.income'), value: accIncomePct, set: setAccIncomePct },
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
                      {t('common.close')}
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
                      {t('common.cancel')}
                    </button>
                    <button
                      type="submit"
                      disabled={isSaveDisabled}
                      className="inline-flex items-center justify-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-blue-300"
                    >
                      <Save className="h-4 w-4 flex-shrink-0" />
                      <span>{isSubmitting ? t('investigation.saving') : t('investigation.saveInvestigation')}</span>
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
