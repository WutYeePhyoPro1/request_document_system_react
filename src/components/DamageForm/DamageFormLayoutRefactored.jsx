import React, { useEffect, useMemo, useState, useRef, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from 'react-i18next';
import DamageFormHeader from "./DamageFormHeader";
import DamageItemTable from "./DamageItemTable";
import SupportingInfo from "./SupportingInfo";
import InvestigationFormModal from "./InvestigationModal";
import ApprovalSection from "./ApprovalSection";
import DamageAddProduct from "./DamageAddProduct";
import ActionConfirmationModal from "./ActionConfirmationModal";
import ValidationErrorModal from "./ValidationErrorModal";
import SuccessModal from "./SuccessModal";
import ErrorModal from "./ErrorModal";
import AnimatedBackButton from "../common/AnimatedBackButton";
import { Send, XCircle, Edit3, Hash } from "lucide-react";
import './ButtonHoverEffects.css';
import './BoxesLoader.css';
import Pro1LoadingAnimation from './Pro1LoadingAnimation';

import { 
  getCurrentUser, 
  resolveSubmitterName, 
  resolveInitialAttachments,
  convertAssetTypeToCaseType,
  ensurePreparedApproval,
  getTotalAmount,
  requiresOpManagerApproval
} from './utils';
import { 
  getUserRole, 
  isChecker, 
  isAccountUser, 
  isBranchManager, 
  isOpManager,
  normalizeRole,
  extractRoleValue
} from './utils';

export default function DamageFormLayout({ mode = "add", initialData = null }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [currentUser, setCurrentUser] = useState(() => getCurrentUser());
  const [originalAttachments, setOriginalAttachments] = useState(() => {
    const initialAttachments = resolveInitialAttachments(initialData);
    return initialAttachments.filter(att => att.downloadUrl || att.isRemote || att.id);
  });

  const resolveIssRemark = useCallback(() => {
    if (initialData?.iss_remark) return initialData.iss_remark;
    if (initialData?.iss_remark_type) return initialData.iss_remark_type;
    if (initialData?.general_form?.iss_remark) return initialData.general_form.iss_remark;
    if (initialData?.general_form?.iss_remark_type) return initialData.general_form.iss_remark_type;
    
    const allFiles = [
      ...(Array.isArray(initialData?.general_form?.files) ? initialData.general_form.files : []),
      ...(Array.isArray(initialData?.general_form?.general_form_files) ? initialData.general_form.general_form_files : []),
      ...(Array.isArray(initialData?.general_form_files) ? initialData.general_form_files : []),
      ...(Array.isArray(initialData?.files) ? initialData.files : [])
    ];
    
    const issFiles = allFiles.filter(f => f && f.file === 'ISS_DOCUMENT');
    let issFile = issFiles.find(f => f.name && f.name.trim() !== '' && f.name !== 'ISS_DOCUMENT');
    
    if (!issFile && issFiles.length > 0) {
      issFiles.sort((a, b) => {
        if (a.id && b.id) return b.id - a.id;
        if (a.created_at && b.created_at) return new Date(b.created_at) - new Date(a.created_at);
        return 0;
      });
      issFile = issFiles[0];
    }
    
    return issFile?.reason || null;
  }, [initialData]);

  const [formData, setFormData] = useState(() => {
    const user = getCurrentUser();
    const initialRequester = resolveSubmitterName(initialData);
    
    return {
      branch: "",
      caseType: convertAssetTypeToCaseType(
        initialData?.caseType || initialData?.general_form?.caseType || 
        initialData?.case_type || initialData?.general_form?.case_type ||
        initialData?.asset_type || initialData?.general_form?.asset_type || "off"
      ),
      datetime: new Date().toISOString().slice(0, 16),
      items: [],
      reason: "",
      g_remark: "",
      requester_name: initialRequester || user?.name || "",
      attachments: resolveInitialAttachments(initialData),
      issue_remarks: initialData?.issue_remarks || [],
      iss_remark: resolveIssRemark(),
      iss_numbers: Array.isArray(initialData?.iss_numbers)
        ? [...initialData.iss_numbers]
        : Array.isArray(initialData?.general_form?.iss_numbers)
          ? [...initialData.general_form.iss_numbers]
          : [],
      systemQtyUpdated: Boolean(initialData?.systemQtyUpdated || initialData?.acc_status),
      approvals: [
        { label: "Prepared by", name: initialRequester || user?.name || "", date: new Date().toISOString() },
        { label: "Checked by", name: "", date: "" },
        { label: "Approved by", name: "", date: "" },
        { label: "Issued by", name: "", date: "" },
      ],
    };
  });

  const [hasInvestigation, setHasInvestigation] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [successModalAction, setSuccessModalAction] = useState('');
  const [successModalMessage, setSuccessModalMessage] = useState('');
  const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);
  const [errorModalMessage, setErrorModalMessage] = useState('');
  
  const isSubmittingRef = useRef(false);
  const submissionIdRef = useRef(null);
  const currentSubmittingActionRef = useRef(null);
  const formInitializedRef = useRef(false);
  const approvalsFetchRef = useRef(false);
  const branchBootstrappedRef = useRef(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAddProductModalOpen, setIsAddProductModalOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [dupModal, setDupModal] = useState({ open: false, code: '' });
  const [notFoundModal, setNotFoundModal] = useState({ open: false, code: '' });
  const [isPdfDownloading, setIsPdfDownloading] = useState(false);
  const [pdfDownloadConfirmation, setPdfDownloadConfirmation] = useState(false);
  const [confirmationModal, setConfirmationModal] = useState({ isOpen: false, action: '', emptyFields: [] });
  const [validationErrorModal, setValidationErrorModal] = useState({ isOpen: false, errors: [], type: 'error' });

  useEffect(() => {
    setCurrentUser(getCurrentUser());
    const handleStorageChange = (event) => {
      if (event?.key && event.key !== 'user') return;
      setCurrentUser(getCurrentUser());
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const userRole = useMemo(() => getUserRole(currentUser, initialData), [currentUser, initialData]);
  const userRoleLower = userRole.toLowerCase();
  
  const isCurrentUserChecker = useMemo(() => isChecker(currentUser, initialData), [currentUser, initialData]);
  const isAccount = useMemo(() => isAccountUser(currentUser, initialData), [currentUser, initialData]);
  const isBM = useMemo(() => isBranchManager(currentUser, initialData), [currentUser, initialData]);
  const isOperationManager = useMemo(() => isOpManager(currentUser, initialData), [currentUser, initialData]);

  const isCheckerRole = useMemo(() => {
    return userRoleLower === 'branch_lp' || userRoleLower === 'checker' || 
           userRoleLower === 'c' || userRoleLower === 'cs' || userRoleLower.includes('checker');
  }, [userRoleLower]);

  const isApproverRole = useMemo(() => {
    return userRoleLower === 'bm' || userRoleLower === 'abm' || userRoleLower === 'approver' ||
           userRoleLower.includes('branch manager') || userRoleLower.includes('approver');
  }, [userRoleLower]);

  const isRegularUser = useMemo(() => {
    const roleId = Number(currentUser?.role_id || initialData?.current_user?.role_id || 0);
    return userRoleLower === 'user' || roleId === 1;
  }, [userRoleLower, currentUser, initialData]);

  const isUserRole = useMemo(() => {
    const roleId = Number(currentUser?.role_id || 0);
    return userRoleLower === 'user' || roleId === 1;
  }, [userRoleLower, currentUser]);

  const isDocumentOwner = useMemo(() => {
    const currentUserId = currentUser?.id || currentUser?.admin_id || currentUser?.userId;
    const formOwnerId = formData?.user_id || formData?.created_by || 
                       formData?.general_form?.user_id || formData?.general_form?.created_by ||
                       initialData?.user_id || initialData?.created_by ||
                       initialData?.general_form?.user_id || initialData?.general_form?.created_by;
    
    if (currentUserId && formOwnerId) {
      return String(currentUserId) === String(formOwnerId);
    }
    return false;
  }, [currentUser, formData, initialData]);

  const resolvedStatus = useMemo(() => {
    return formData.status || formData.general_form?.status || initialData?.status || initialData?.general_form?.status || 'Ongoing';
  }, [formData.status, formData.general_form?.status, initialData?.status, initialData?.general_form?.status]);

  const resolvedStatusLower = resolvedStatus.toString().toLowerCase().trim();

  const totalAmount = useMemo(() => getTotalAmount(formData, initialData), [formData, initialData]);

  const isDocumentOwnerViewingOngoingBack = useMemo(() => {
    return isDocumentOwner && mode === 'view' && resolvedStatusLower === 'ongoing';
  }, [isDocumentOwner, mode, resolvedStatusLower]);

  const isCheckerWhoApproved = useMemo(() => {
    if (!isCurrentUserChecker) return false;
    const approvals = formData?.approvals || [];
    const currentUserId = currentUser?.id || currentUser?.admin_id || currentUser?.userId;
    
    return approvals.some(approval => {
      const label = (approval.label || '').toLowerCase();
      const isCheckerApproval = label.includes('check');
      const userIdMatches = currentUserId && (
        String(approval.actual_user_id) === String(currentUserId) ||
        String(approval.admin_id) === String(currentUserId)
      );
      return isCheckerApproval && userIdMatches && approval.acted;
    });
  }, [isCurrentUserChecker, formData?.approvals, currentUser]);

  const hideUiForCheckerInView = useMemo(() => {
    return isCurrentUserChecker && resolvedStatusLower === 'checked';
  }, [isCurrentUserChecker, resolvedStatusLower]);

  const isInvestigationFilled = useMemo(() => {
    const investigation = formData.investigation || initialData?.investigation || initialData?.general_form?.investigation;
    if (!investigation) return false;
    const { acc_company, acc_user, acc_income } = investigation;
    return (acc_company !== null && acc_company !== undefined && acc_company !== '') &&
           (acc_user !== null && acc_user !== undefined && acc_user !== '') &&
           (acc_income !== null && acc_income !== undefined && acc_income !== '');
  }, [formData.investigation, initialData]);

  const handleBack = useCallback(() => navigate(-1), [navigate]);
  
  const handleOpenModal = useCallback(() => setIsModalOpen(true), []);
  const handleCloseModal = useCallback(() => setIsModalOpen(false), []);
  
  const handleOpenAddProductModal = useCallback(() => setIsAddProductModalOpen(true), []);
  const handleCloseAddProductModal = useCallback(() => setIsAddProductModalOpen(false), []);

  const handleAddItem = useCallback((newItem) => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, newItem]
    }));
  }, []);

  const handleItemsChange = useCallback((newItems) => {
    setFormData(prev => ({ ...prev, items: newItems }));
  }, []);

  const handleItemFieldChange = useCallback((itemId, field, value) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map(item => {
        const matchId = item.id ?? item.specific_form_id;
        if (matchId === itemId) {
          return { ...item, [field]: value };
        }
        return item;
      })
    }));
  }, []);

  const handleRemoveItem = useCallback((itemId) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter(item => {
        const matchId = item.id ?? item.specific_form_id;
        return matchId !== itemId;
      })
    }));
  }, []);

  const handleSearchProduct = useCallback(async (productCode, caseType, onSuccess) => {
    if (!productCode) return;
    
    setIsSearching(true);
    try {
      const { apiRequest } = await import('../../utils/api');
      const response = await apiRequest(`/api/products/search?code=${encodeURIComponent(productCode)}`);
      
      if (response.ok) {
        const data = await response.json();
        if (data && data.length > 0) {
          const product = data[0];
          
          const existingItem = formData.items.find(item => item.code === product.product_code);
          if (existingItem) {
            setDupModal({ open: true, code: product.product_code });
            return;
          }
          
          const newItem = {
            id: Date.now(),
            code: product.product_code,
            name: product.product_name,
            category: product.category_name || '',
            unit: product.unit || '',
            system_qty: Number(product.system_qty || 0),
            request_qty: 0,
            final_qty: 0,
            actual_qty: 0,
            price: Number(product.price || 0),
            amount: 0,
            total: 0,
            remark: '',
            img: [],
            images: [],
          };
          
          handleAddItem(newItem);
          onSuccess?.();
        } else {
          setNotFoundModal({ open: true, code: productCode });
        }
      }
    } catch (err) {
      setNotFoundModal({ open: true, code: productCode });
    } finally {
      setIsSearching(false);
    }
  }, [formData.items, handleAddItem]);

  const handleDownloadPdf = useCallback(() => {
    setPdfDownloadConfirmation(true);
  }, []);

  const confirmDownloadPdf = useCallback(async () => {
    setPdfDownloadConfirmation(false);
    setIsPdfDownloading(true);
    
    try {
      const { apiRequest } = await import('../../utils/api');
      const formId = initialData?.generalFormId || initialData?.general_form?.id;
      
      if (!formId) {
        setErrorModalMessage(t('messages.noFormId', { defaultValue: 'Form ID not found' }));
        setIsErrorModalOpen(true);
        return;
      }
      
      const response = await apiRequest(`/api/general-forms/${formId}/pdf`, {
        responseType: 'blob'
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `damage-form-${formId}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (err) {
      setErrorModalMessage(t('messages.pdfDownloadFailed', { defaultValue: 'Failed to download PDF' }));
      setIsErrorModalOpen(true);
    } finally {
      setIsPdfDownloading(false);
    }
  }, [initialData, t]);

  const cancelDownloadPdf = useCallback(() => {
    setPdfDownloadConfirmation(false);
  }, []);

  const handleSubmitClick = useCallback((action) => {
    setConfirmationModal({ isOpen: true, action, emptyFields: [] });
  }, []);

  const handleConfirmSubmit = useCallback(async () => {
    const action = confirmationModal.action;
    setConfirmationModal({ isOpen: false, action: '', emptyFields: [] });
    
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    currentSubmittingActionRef.current = action;
    setIsSubmitting(true);
    
    try {
      const { apiRequest } = await import('../../utils/api');
      const formId = initialData?.generalFormId || initialData?.general_form?.id;
      
      let endpoint, method, body;
      
      if (mode === 'add' && action === 'Submit') {
        endpoint = '/api/general-forms';
        method = 'POST';
        body = {
          form_type: 'big_damage_issue',
          items: formData.items,
          reason: formData.reason,
          attachments: formData.attachments,
          caseType: formData.caseType,
        };
      } else {
        endpoint = `/api/general-forms/${formId}/action`;
        method = 'POST';
        body = {
          action,
          items: formData.items,
          reason: formData.reason,
          attachments: formData.attachments,
        };
      }
      
      const response = await apiRequest(endpoint, {
        method,
        body: JSON.stringify(body),
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.ok) {
        const data = await response.json();
        setSuccessModalMessage(data.message || t('messages.actionSuccess', { defaultValue: 'Action completed successfully' }));
        setSuccessModalAction(action);
        setIsSuccessModalOpen(true);
        
        if (mode === 'add') {
          setTimeout(() => navigate('/damage-issues'), 2000);
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        setErrorModalMessage(errorData.message || t('messages.actionFailed', { defaultValue: 'Action failed' }));
        setIsErrorModalOpen(true);
      }
    } catch (err) {
      setErrorModalMessage(err.message || t('messages.unexpectedError', { defaultValue: 'An unexpected error occurred' }));
      setIsErrorModalOpen(true);
    } finally {
      isSubmittingRef.current = false;
      currentSubmittingActionRef.current = null;
      setIsSubmitting(false);
    }
  }, [confirmationModal.action, mode, formData, initialData, navigate, t]);

  const handleCancelSubmit = useCallback(() => {
    setConfirmationModal({ isOpen: false, action: '', emptyFields: [] });
  }, []);

  const showApproveButton = useCallback(() => {
    if (mode === 'add') return false;
    if (resolvedStatusLower === 'completed' || resolvedStatusLower === 'cancelled' || resolvedStatusLower === 'cancel') return false;
    
    if (isCheckerRole && resolvedStatusLower === 'ongoing') return true;
    if (isApproverRole && resolvedStatusLower === 'checked') return true;
    if (isOperationManager && resolvedStatusLower === 'bm approved' && requiresOpManagerApproval(totalAmount)) return true;
    if (isAccount && (resolvedStatusLower === 'bm approved' || resolvedStatusLower === 'opapproved' || resolvedStatusLower === 'op approved' || resolvedStatusLower === 'ac_acknowledged')) return true;
    
    return false;
  }, [mode, resolvedStatusLower, isCheckerRole, isApproverRole, isOperationManager, isAccount, totalAmount]);

  const resolveApproveAction = useCallback(() => {
    if (isCheckerRole && resolvedStatusLower === 'ongoing') return 'BMApprovedMem';
    if (isApproverRole && resolvedStatusLower === 'checked') return 'BMApproved';
    if (isOperationManager && resolvedStatusLower === 'bm approved' && requiresOpManagerApproval(totalAmount)) return 'OPApproved';
    if (isAccount && resolvedStatusLower === 'bm approved' && !requiresOpManagerApproval(totalAmount)) return 'Ac_Acknowledged';
    if (isAccount && (resolvedStatusLower === 'opapproved' || resolvedStatusLower === 'op approved')) return 'Ac_Acknowledged';
    if (isAccount && resolvedStatusLower === 'ac_acknowledged') return 'Completed';
    
    return null;
  }, [isCheckerRole, isApproverRole, isOperationManager, isAccount, resolvedStatusLower, totalAmount]);

  const shouldShowBackToPrevious = useMemo(() => {
    if (mode === 'add') return false;
    if (resolvedStatusLower === 'completed' || resolvedStatusLower === 'cancelled' || resolvedStatusLower === 'ongoing') return false;
    if (isDocumentOwnerViewingOngoingBack) return false;
    
    if (isApproverRole && resolvedStatusLower === 'checked') return true;
    if (isOperationManager && resolvedStatusLower === 'bm approved') return true;
    if (isAccount && (resolvedStatusLower === 'opapproved' || resolvedStatusLower === 'op approved' || resolvedStatusLower === 'ac_acknowledged')) return true;
    
    return false;
  }, [mode, resolvedStatusLower, isDocumentOwnerViewingOngoingBack, isApproverRole, isOperationManager, isAccount]);

  const shouldShowCancel = useMemo(() => {
    if (mode === 'add') return false;
    if (resolvedStatusLower === 'completed' || resolvedStatusLower === 'cancelled') return false;
    if (isDocumentOwnerViewingOngoingBack) return false;
    
    if (isDocumentOwner && resolvedStatusLower === 'ongoing') return true;
    if (isCheckerRole && resolvedStatusLower === 'ongoing') return true;
    
    return false;
  }, [mode, resolvedStatusLower, isDocumentOwnerViewingOngoingBack, isDocumentOwner, isCheckerRole]);

  const getButtonColorClass = useCallback((action) => {
    const actionLower = (action || '').toLowerCase();
    if (actionLower.includes('cancel')) return 'bg-[#dc3545] border-[#dc3545]';
    if (actionLower.includes('back')) return 'bg-[#ffc107] border-[#ffc107]';
    return 'bg-[#198754] border-[#198754]';
  }, []);

  const prettyApprove = useCallback((action) => {
    const map = {
      'BMApprovedMem': t('buttons.check', { defaultValue: 'Check' }),
      'BMApproved': t('buttons.approve', { defaultValue: 'Approve' }),
      'OPApproved': t('buttons.opApprove', { defaultValue: 'OP Approve' }),
      'Ac_Acknowledged': t('buttons.acknowledge', { defaultValue: 'Acknowledge' }),
      'Completed': t('buttons.issue', { defaultValue: 'Issue' }),
      'SupervisorIssued': t('buttons.issue', { defaultValue: 'Issue' }),
    };
    return map[action] || action;
  }, [t]);

  const getLoadingMessage = useCallback(() => {
    const action = currentSubmittingActionRef.current;
    if (!action) return t('messages.processing', { defaultValue: 'Processing...' });
    
    const actionStr = action.toLowerCase();
    if (actionStr.includes('back')) return t('messages.goingBack', { defaultValue: 'Going back...' });
    if (actionStr.includes('cancel')) return t('messages.cancelling', { defaultValue: 'Cancelling...' });
    if (actionStr.includes('check') || actionStr === 'bmapprovedmem') return t('messages.checking', { defaultValue: 'Checking...' });
    if (actionStr.includes('issue') || actionStr === 'completed' || actionStr === 'supervisorissued') return t('messages.issuing', { defaultValue: 'Issuing...' });
    if (actionStr.includes('acknowledge') || actionStr === 'ac_acknowledged' || actionStr === 'opapproved') return t('messages.opApproving', { defaultValue: 'OP Approving...' });
    if (actionStr.includes('approve') || actionStr === 'bmapproved') return t('messages.approving', { defaultValue: 'Approving...' });
    if (actionStr.includes('submit')) return t('messages.submitting', { defaultValue: 'Submitting...' });
    
    return t('messages.processing', { defaultValue: 'Processing...' });
  }, [t]);

  const remarkTypeLabel = useMemo(() => {
    if (!formData.iss_remark || !formData.issue_remarks?.length) return '';
    
    const matchedRemark = formData.issue_remarks.find(
      option => option.value === formData.iss_remark || 
      String(option.value) === String(formData.iss_remark) ||
      option.id === formData.iss_remark ||
      String(option.id) === String(formData.iss_remark)
    );
    
    if (matchedRemark) {
      return matchedRemark.label || matchedRemark.name || matchedRemark.remark_name || '';
    }
    
    const nameMatch = formData.issue_remarks.find(
      option => option.label === formData.iss_remark ||
      option.name === formData.iss_remark ||
      option.remark_name === formData.iss_remark
    );
    
    if (nameMatch) {
      return nameMatch.label || nameMatch.name || nameMatch.remark_name || '';
    }
    
    if (formData.iss_remark && formData.iss_remark !== 'ISS_DOCUMENT' && !formData.iss_remark.match(/^\d+$/)) {
      return formData.iss_remark;
    }
    
    return '';
  }, [formData.iss_remark, formData.issue_remarks]);

  const issNumbers = useMemo(() => {
    const rawIssEntries = formData.iss_numbers || [];
    const issFilesFromGeneralForm = Array.isArray(formData.general_form_files)
      ? formData.general_form_files.filter(file => file.file === 'ISS_DOCUMENT')
      : [];
    const issFilesFromFiles = Array.isArray(formData.files)
      ? formData.files.filter(file => file.file === 'ISS_DOCUMENT')
      : [];
    
    const allIssSources = [...rawIssEntries, ...issFilesFromGeneralForm, ...issFilesFromFiles];
    
    return allIssSources
      .map((entry) => {
        if (!entry) return null;
        if (typeof entry === 'string') return entry.trim();
        if (typeof entry === 'object') {
          const value = entry.name || entry.file || entry.document_no || entry.doc_no || '';
          return typeof value === 'string' && value !== 'ISS_DOCUMENT' ? value.trim() : null;
        }
        return null;
      })
      .filter(Boolean)
      .filter((value, index, self) => self.indexOf(value) === index);
  }, [formData.iss_numbers, formData.general_form_files, formData.files]);

  const shouldShowIssInfo = remarkTypeLabel || issNumbers.length > 0;
  const isCompletedStatus = resolvedStatusLower === 'completed';
  const showIssProcessingMessage = isCompletedStatus && !shouldShowIssInfo;

  return (
    <div className="p-2 sm:p-6 md:p-8 bg-white shadow-lg min-h-screen space-y-4 sm:space-y-6 font-sans w-full">
      {isSubmitting && <Pro1LoadingAnimation message={getLoadingMessage()} />}
      
      {error && (
        <div className="alert alert-danger" role="alert">{error}</div>
      )}
      
      {successMessage && (
        <div className="alert alert-success" role="alert">{successMessage}</div>
      )}
      
      <DamageFormHeader
        formData={formData}
        setFormData={setFormData}
        onAddItem={handleAddItem}
        onOpenInvestigationForm={handleOpenModal}
        mode={mode}
        hasInvestigation={hasInvestigation}
        remarkTypeLabel={remarkTypeLabel}
        isCompleted={resolvedStatusLower === 'completed'}
        userRoleOverride={userRole}
        statusOverride={formData.status}
        onDownloadPdf={handleDownloadPdf}
        isPdfDownloading={isPdfDownloading}
        issueRemarks={formData.issue_remarks || []}
        btpRemark={formData.general_form?.remark || initialData?.general_form?.remark || ''}
      />

      <InvestigationFormModal 
        isOpen={isModalOpen} 
        onClose={handleCloseModal}
        formData={formData}
        userRole={userRole}
        initialData={initialData}
        onSave={(savedData) => {
          if (savedData?.investigation) {
            setFormData(prev => ({
              ...prev,
              investigation: savedData.investigation,
              general_form: {
                ...prev.general_form,
                investigation: savedData.investigation,
              },
            }));
            setHasInvestigation(true);
          }
        }}
      />

      {mode === "add" && (
        <DamageAddProduct 
          branchName={formData.branch} 
          onSearch={handleSearchProduct}
          isSearching={isSearching}
          caseType={formData.caseType}
          onCaseTypeChange={(newCaseType) => setFormData(prev => ({ ...prev, caseType: newCaseType }))}
        />
      )}

      {isAddProductModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 modal-backdrop" onClick={handleCloseAddProductModal} />
          <div className="relative bg-white rounded-lg shadow-xl w-11/12 max-w-4xl max-h-[90vh] overflow-y-auto modal-expandable">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
              <h3 className="text-lg font-semibold text-gray-800">{t('modal.addProduct', { defaultValue: 'Add Product' })}</h3>
              <button onClick={handleCloseAddProductModal} className="text-gray-400 hover:text-gray-600 transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6">
              <DamageAddProduct 
                branchName={formData.branch} 
                onSearch={(productCode, caseType) => handleSearchProduct(productCode, caseType, handleCloseAddProductModal)}
                isSearching={isSearching}
                caseType={formData.caseType}
                onCaseTypeChange={(newCaseType) => setFormData(prev => ({ ...prev, caseType: newCaseType }))}
                isReadOnly={true}
              />
            </div>
          </div>
        </div>
      )}

      {dupModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDupModal({ open: false, code: '' })} />
          <div className="relative bg-white rounded-lg shadow-xl w-11/12 max-w-sm p-5">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">{t('modal.duplicateProduct', { defaultValue: 'Duplicate Product' })}</h3>
            <p className="text-sm text-gray-600 mb-4">
              {t('modal.duplicateProductMessage', { defaultValue: 'The product code' })} <span className="font-mono font-semibold">{dupModal.code}</span> {t('modal.alreadyAdded', { defaultValue: 'is already added.' })}
            </p>
            <div className="flex justify-end">
              <button onClick={() => setDupModal({ open: false, code: '' })} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm">
                {t('buttons.ok', { defaultValue: 'OK' })}
              </button>
            </div>
          </div>
        </div>
      )}

      {notFoundModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setNotFoundModal({ open: false, code: '' })} />
          <div className="relative bg-white rounded-lg shadow-xl w-11/12 max-w-sm p-5">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">{t('modal.productNotFound', { defaultValue: 'Product Not Found' })}</h3>
            <p className="text-sm text-gray-600 mb-4">
              {t('modal.productNotFoundMessage', { defaultValue: "We couldn't find any data for product code" })} <span className="font-mono font-semibold">{notFoundModal.code}</span>.
            </p>
            <div className="flex justify-end">
              <button onClick={() => setNotFoundModal({ open: false, code: '' })} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm">
                {t('buttons.ok', { defaultValue: 'OK' })}
              </button>
            </div>
          </div>
        </div>
      )}

      <DamageItemTable
        items={formData.items || []}
        mode={mode}
        status={resolvedStatus}
        onItemsChange={handleItemsChange}
        onItemChange={handleItemFieldChange}
        generalFormId={initialData?.generalFormId}
        onRemoveItem={handleRemoveItem}
        total={totalAmount}
        userRole={userRole}
        isAccount={isAccount}
        isSupervisor={userRole === 'supervisor'}
        itemErrors={formData.itemErrors || {}}
        isCompleted={resolvedStatusLower === 'completed' || resolvedStatusLower === 'issued' || resolvedStatusLower === 'supervisorissued'}
        accountCodes={formData.account_codes || []}
        issueRemarks={formData.issue_remarks || []}
        issRemark={formData.iss_remark ?? ''}
        systemQtyUpdated={Boolean(formData.systemQtyUpdated)}
        approvals={formData.approvals || []}
        totalAmount={totalAmount}
        gRemark={formData.g_remark || initialData?.g_remark || initialData?.general_form?.g_remark || 'big_damage'}
        currentUser={currentUser}
        onOpenAddProductModal={handleOpenAddProductModal}
        onSuccessModal={(message, action = 'submit') => {
          setSuccessModalMessage(message);
          setSuccessModalAction(action);
          setIsSuccessModalOpen(true);
        }}
        onSystemQtyStatusChange={async (updated) => {
          if (!updated) return;
          setFormData((prev) => ({ ...prev, systemQtyUpdated: true }));
          setSuccessModalMessage(t('messages.systemQtyUpdated', { defaultValue: 'System quantities updated successfully' }));
          setSuccessModalAction('submit');
          setIsSuccessModalOpen(true);
        }}
        onAccountSettingsChange={(settings) => setFormData((prev) => ({ ...prev, ...settings }))}
        onItemAccountCodeChange={(itemId, accCode) => {
          setFormData(prev => ({
            ...prev,
            items: prev.items.map(item => {
              const matchId = item.id ?? item.specific_form_id;
              if (matchId === itemId) {
                return { ...item, acc_code1: accCode, acc_code: accCode };
              }
              return item;
            })
          }));
        }}
        supportingAttachments={formData.attachments || []}
      />

      {showIssProcessingMessage && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 sm:p-5 space-y-3 shadow-lg">
          <h4 className="text-sm sm:text-base font-semibold text-orange-800 flex items-center gap-2 mb-3">
            <Hash size={18} className="text-orange-600" />
            {t('iss.processingStatus', { defaultValue: 'Processing Status' })}
          </h4>
          <div className="text-sm text-orange-700">
            <p className="font-medium">{t('messages.formStillProcessing', { defaultValue: "Form is still processing, wait until ISS number and ISS remark type appear, and don't forget to refresh." })}</p>
          </div>
        </div>
      )}

      {shouldShowIssInfo && (
        <div className="bg-white rounded-xl space-y-3">
          <h4 className="text-xs sm:text-sm font-semibold text-gray-800 flex items-center gap-2 mb-3">
            <Hash size={18} className="text-gray-600" />
            {t('iss.title', { defaultValue: 'ISS Information' })}
          </h4>
          <div className="flex flex-row flex-wrap gap-3">
            {remarkTypeLabel && (
              <div className="inline-flex items-center gap-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5">
                <span className="font-semibold text-amber-800">{t('iss.remarkType', { defaultValue: 'ISS Remark Type' })}:</span>
                <span>{remarkTypeLabel}</span>
              </div>
            )}
            {issNumbers.length > 0 && (
              <div className="inline-flex flex-col sm:flex-row sm:items-center gap-2 text-sm text-blue-700 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2.5">
                <span className="font-semibold text-blue-800 whitespace-nowrap">
                  {issNumbers.length > 1 ? t('iss.numbers', { defaultValue: 'ISS Numbers' }) : t('iss.number', { defaultValue: 'ISS Number' })}:
                </span>
                <span className="flex flex-wrap gap-1.5">
                  {issNumbers.map((issNum, idx) => (
                    <span key={idx} className="font-mono text-blue-900 bg-blue-100 px-2 py-0.5 rounded">
                      {issNum}
                    </span>
                  ))}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      <SupportingInfo
        status={resolvedStatus}
        reason={formData.reason}
        onReasonChange={val => setFormData(prev => ({ ...prev, reason: val }))}
        showRemark={mode !== 'add' && !hideUiForCheckerInView && !isDocumentOwnerViewingOngoingBack}
        showAttachments={!hideUiForCheckerInView && !isDocumentOwnerViewingOngoingBack}
        isRequired={mode !== 'add'}
        attachments={formData.attachments || []}
        onAttachmentsChange={(newAttachments) => setFormData(prev => ({ ...prev, attachments: newAttachments }))}
        readOnly={hideUiForCheckerInView || isDocumentOwnerViewingOngoingBack}
        currentUserRole={userRole}
        isCurrentUserChecker={isCurrentUserChecker}
        isRegularUser={isRegularUser}
        isCheckerWhoApproved={isCheckerWhoApproved}
        systemQtyUpdated={Boolean(formData.systemQtyUpdated)}
        totalAmount={totalAmount}
      />

      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-start gap-3 mt-6 sm:mt-8">
        {mode !== 'add' && (
          <div className="hidden md:flex items-center order-2 md:order-1">
            <AnimatedBackButton status={formData.status} />
          </div>
        )}
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-start gap-2.5 w-full md:w-auto order-1 md:order-2">
          {mode === 'add' ? (
            <>
              <button 
                onClick={() => handleSubmitClick('Submit')}
                disabled={isSubmitting}
                className="btn-with-icon inline-flex flex-1 sm:flex-none items-center justify-center gap-2 px-6 py-3 sm:py-2.5 font-semibold text-white transition-all duration-200 rounded shadow-md bg-[#198754] border-[#198754] hover:bg-[#157347] hover:border-[#157347] hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ fontSize: '0.9375rem' }}
              >
                <span className="btn-text">{t('buttons.submit', { defaultValue: 'Submit' })}</span>
                <Send className="btn-icon w-4 h-4 absolute" />
              </button>
              <button 
                onClick={handleBack}
                className="btn-with-icon inline-flex flex-1 sm:flex-none items-center justify-center gap-2 px-5 py-3 sm:py-2.5 rounded-lg font-semibold text-gray-900 bg-white hover:bg-gray-50 border-2 border-gray-300 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 shadow-sm hover:shadow-md"
                style={{ fontSize: '0.9375rem' }}
              >
                <span className="btn-text">{t('buttons.cancel', { defaultValue: 'Cancel' })}</span>
                <XCircle className="btn-icon w-4 h-4 absolute" />
              </button>
            </>
          ) : (
            <>
              {isDocumentOwner && resolvedStatusLower !== 'completed' && resolvedStatusLower !== 'cancelled' && (
                <button 
                  onClick={() => handleSubmitClick('Edit')}
                  className="btn-with-icon btn-edit inline-flex flex-1 sm:flex-none items-center justify-center gap-2 px-5 py-3 sm:py-2.5 rounded-lg font-semibold text-white transition-all duration-200 shadow-sm hover:shadow-md" 
                  style={{ fontSize: '0.9375rem' }}
                >
                  <span className="btn-text">{t('buttons.edit', { defaultValue: 'Edit' })}</span>
                  <Edit3 className="btn-icon w-4 h-4 absolute" />   
                </button>
              )}
              
              {showApproveButton() && !isSubmitting && (
                <button 
                  onClick={() => handleSubmitClick(resolveApproveAction())}
                  disabled={isSubmitting}
                  className={`inline-flex flex-1 sm:flex-none items-center justify-center px-4 py-2.5 rounded font-bold text-white ${getButtonColorClass(resolveApproveAction())} hover:bg-[#157347] hover:border-[#157347] hover:shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed me-1`}
                  style={{ fontSize: '15px' }}
                >
                  <span>{prettyApprove(resolveApproveAction()) || t('buttons.proceed', { defaultValue: 'Proceed' })}</span>
                </button>
              )}
              
              {shouldShowBackToPrevious && (
                <button 
                  onClick={() => handleSubmitClick('BackToPrevious')}
                  className="inline-flex flex-1 sm:flex-none items-center justify-center px-4 py-2.5 rounded font-bold text-white bg-[#ffc107] border-[#ffc107] hover:bg-[#e0a800] hover:border-[#e0a800] hover:shadow-md transition-all duration-200 me-1"
                  style={{ fontSize: '15px' }}
                >
                  {t('buttons.backToPrevious', { defaultValue: 'Back To Previous' })}
                </button>
              )}
              
              {shouldShowCancel && (
                <button 
                  onClick={() => handleSubmitClick('Cancel')}
                  className="inline-flex flex-1 sm:flex-none items-center justify-center px-4 py-2.5 rounded font-bold text-white border-[#dc3545] bg-[#dc3545] me-1" 
                  style={{ fontSize: '15px' }}
                >
                  {t('buttons.cancel', { defaultValue: 'Cancel' })}
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {mode !== 'add' && <ApprovalSection approvals={formData.approvals} status={formData.status} formData={formData} totalAmount={totalAmount} />}

      <ActionConfirmationModal
        isOpen={confirmationModal.isOpen}
        action={confirmationModal.action}
        emptyFields={confirmationModal.emptyFields || []}
        onConfirm={handleConfirmSubmit}
        onCancel={handleCancelSubmit}
      />

      <ActionConfirmationModal
        isOpen={pdfDownloadConfirmation}
        action="DownloadPDF"
        emptyFields={[]}
        onConfirm={confirmDownloadPdf}
        onCancel={cancelDownloadPdf}
      />

      <ValidationErrorModal
        isOpen={validationErrorModal.isOpen}
        errors={validationErrorModal.errors}
        type={validationErrorModal.type || 'error'}
        onClose={() => setValidationErrorModal({ isOpen: false, errors: [], type: 'error' })}
      />

      <SuccessModal
        isOpen={isSuccessModalOpen}
        onClose={() => setIsSuccessModalOpen(false)}
        message={successModalMessage}
        action={successModalAction}
      />

      <ErrorModal
        isOpen={isErrorModalOpen}
        onClose={() => setIsErrorModalOpen(false)}
        message={errorModalMessage}
        autoClose={false}
      />
    </div>
  );
}

