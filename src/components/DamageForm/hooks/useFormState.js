import { useState, useRef, useCallback } from 'react';
import { 
  getCurrentUser, 
  resolveSubmitterName, 
  resolveInitialAttachments,
  convertAssetTypeToCaseType 
} from '../utils';

export const useFormState = (initialData, mode) => {
  const user = getCurrentUser();
  const initialRequester = resolveSubmitterName(initialData);
  
  const [originalAttachments, setOriginalAttachments] = useState(() => {
    const initialAttachments = resolveInitialAttachments(initialData);
    return initialAttachments.filter(att => att.downloadUrl || att.isRemote || att.id);
  });

  const resolveIssRemark = () => {
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
  };

  const [formData, setFormData] = useState(() => ({
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
    iss_numbers: Array.isArray(initialData?.iss_numbers) ? [...initialData.iss_numbers]
      : Array.isArray(initialData?.general_form?.iss_numbers) ? [...initialData.general_form.iss_numbers]
      : [],
    systemQtyUpdated: Boolean(initialData?.systemQtyUpdated || initialData?.acc_status),
    approvals: [
      { label: "Prepared by", name: initialRequester || user?.name || "", date: new Date().toISOString() },
      { label: "Checked by", name: "", date: "" },
      { label: "Approved by", name: "", date: "" },
      { label: "Issued by", name: "", date: "" },
    ],
  }));

  const [hasInvestigation, setHasInvestigation] = useState(false);
  const [currentUser, setCurrentUser] = useState(() => getCurrentUser());
  
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

  const updateFormData = useCallback((updates) => {
    setFormData(prev => ({ ...prev, ...updates }));
  }, []);

  const updateItems = useCallback((items) => {
    setFormData(prev => ({ ...prev, items }));
  }, []);

  const showSuccess = useCallback((message, action = '') => {
    setSuccessModalMessage(message);
    setSuccessModalAction(action);
    setIsSuccessModalOpen(true);
  }, []);

  const showError = useCallback((message) => {
    setErrorModalMessage(message);
    setIsErrorModalOpen(true);
  }, []);

  return {
    formData,
    setFormData,
    updateFormData,
    updateItems,
    originalAttachments,
    setOriginalAttachments,
    hasInvestigation,
    setHasInvestigation,
    currentUser,
    setCurrentUser,
    error,
    setError,
    successMessage,
    setSuccessMessage,
    isSubmitting,
    setIsSubmitting,
    isSuccessModalOpen,
    setIsSuccessModalOpen,
    successModalAction,
    successModalMessage,
    isErrorModalOpen,
    setIsErrorModalOpen,
    errorModalMessage,
    showSuccess,
    showError,
    isSubmittingRef,
    submissionIdRef,
    currentSubmittingActionRef,
    formInitializedRef,
    approvalsFetchRef,
    branchBootstrappedRef,
  };
};

