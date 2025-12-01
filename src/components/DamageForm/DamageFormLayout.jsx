// DamageFormLayout.jsx
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
import { Save, CheckCircle, XCircle, Edit3, CornerUpLeft, Send, Check, FileText, Hash } from "lucide-react";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './ButtonHoverEffects.css';
import './BoxesLoader.css';

const extractImageArray = (item = {}) => {
  if (!item || typeof item !== 'object') return [];

  const candidates = [
    item.img,
    item.images,
    item.damage_images,
    item.damageImages,
    item.photos,
    item.attachments,
    item.image,
    item.media,
    item.originalItem,
    item.originalItem?.img,
    item.originalItem?.images,
    item.originalItem?.damage_images,
    item.originalItem?.photos,
    item.originalItem?.attachments,
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate) && candidate.length > 0) {
      return candidate;
    }
  }

  return [];
};

const resolveInitialAttachments = (source = {}, fallback = []) => {
  const safeSource = source && typeof source === 'object' ? source : {};

  const coerceArray = (candidate) => {
    if (!candidate) return [];
    if (Array.isArray(candidate)) return candidate;
    if (candidate?.data && Array.isArray(candidate.data)) return candidate.data;
    return [];
  };

  const generalForm = safeSource.general_form || safeSource.generalForm || null;
  const meta = safeSource.meta || {};

  const possibleLists = [
    coerceArray(safeSource.attachments),
    coerceArray(safeSource.operation_files || safeSource.operationFiles),
    coerceArray(safeSource.files),
    coerceArray(safeSource.document_uploads || safeSource.documentUploads),
    coerceArray(safeSource.supporting_files || safeSource.supportingFiles),
    coerceArray(generalForm?.attachments),
    coerceArray(generalForm?.files),
    coerceArray(generalForm?.document_uploads || generalForm?.documentUploads),
    coerceArray(generalForm?.operation_files || generalForm?.operationFiles),
    coerceArray(safeSource.general_form_files || safeSource.generalFormFiles),
    coerceArray(safeSource.document_uploads || safeSource.documentUploads),
    coerceArray(meta?.attachments),
  ];

  const combined = possibleLists.flat().filter(Boolean);

  if (!combined.length) {
    return Array.isArray(fallback) ? [...fallback] : [];
  }

  const seen = new Set();
  const normalized = [];

  combined.forEach((attachment) => {
    if (!attachment) return;

    const entry = typeof attachment === 'object' ? { ...attachment } : { name: String(attachment) };
    if (!entry || typeof entry !== 'object') return;

    const fallbackName = entry.name
      || entry.original_name
      || entry.originalName
      || entry.file_name
      || entry.fileName
      || entry.file
      || entry.path
      || entry.downloadUrl
      || entry.url
      || '';

    const id = entry.id
      || entry.uuid
      || entry.key
      || entry.document_id
      || `${fallbackName}-${entry.size || ''}`;

    if (seen.has(id)) return;
    seen.add(id);

    entry.id = id;

    const resolvePublicUrl = (value) => {
      if (typeof value !== 'string' || !value.trim()) return '';
      const trimmed = value.trim();
      if (/^(https?:)?\/\//i.test(trimmed) || trimmed.startsWith('data:')) {
        return trimmed;
      }
      return `/api/public-files/${trimmed.replace(/^\/+/, '')}`;
    };

    if (!entry.previewUrl) {
      entry.previewUrl = resolvePublicUrl(entry.url)
        || resolvePublicUrl(entry.downloadUrl)
        || resolvePublicUrl(entry.path)
        || resolvePublicUrl(entry.file)
        || entry.previewUrl;
    }

    if (!entry.downloadUrl) {
      entry.downloadUrl = resolvePublicUrl(entry.file)
        || resolvePublicUrl(entry.path)
        || resolvePublicUrl(entry.url)
        || entry.previewUrl
        || entry.downloadUrl;
    }

    if (!entry.name) {
      const derived = fallbackName ? fallbackName.split('/').pop() : '';
      entry.name = derived || `attachment-${normalized.length + 1}`;
    }

    normalized.push(entry);
  });

  if (!normalized.length && Array.isArray(fallback)) {
    return [...fallback];
  }

  return normalized;
};

export default function DamageFormLayout({ mode = "add", initialData = null }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get user info from local storage
  const getCurrentUser = () => {
    try {
      const userData = localStorage.getItem('user');
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      return null;
    }
  };

  const resolveSubmitterName = (data) => {
    if (!data || typeof data !== 'object') return '';

    const generalForm = data.general_form || {};

    const candidates = [
      data.requester_name,
      data.originator_name,
      data.created_by_name,
      data.user_name,
      data.user?.name,
      data.requester?.name,
      data.meta?.requester_name,
      data.meta?.user?.name,
      generalForm.requester_name,
      generalForm.originator_name,
      generalForm.created_by_name,
      generalForm.request_user_name,
      generalForm.requester?.name,
      generalForm.user?.name,
      generalForm.originators?.name,
    ];

    const resolved = candidates.find((value) => typeof value === 'string' && value.trim());
    return resolved ? resolved.trim() : '';
  };

  const ensurePreparedApproval = (approvalsList, fallbackName, metadata) => {
    if (!Array.isArray(approvalsList)) return approvalsList;

    const createdAt = metadata?.created_at || metadata?.general_form?.created_at || metadata?.general_form?.datetime || '';
    let preparedFound = false;

    const updated = approvalsList.map((approval) => {
      if (!approval) return approval;

      const label = (approval.label || approval.role || '').toLowerCase();
      if (!label.includes('prepared')) {
        return approval;
      }

      preparedFound = true;
      const nameCandidates = [
        approval.name,
        approval.actual_user_name,
        approval.actual_user_full_name,
        approval.user?.name,
        approval.raw?.name,
        fallbackName,
      ].filter((value) => typeof value === 'string' && value.trim());
      const name = nameCandidates.length ? nameCandidates[0].trim() : '';

      return {
        ...approval,
        name,
        actual_user_name: name || approval.actual_user_name,
        acted: approval.acted ?? Boolean(name),
        date: approval.date || createdAt || approval.acted_at || approval.updated_at || '',
      };
    });

    if (!preparedFound && fallbackName) {
      return [
        {
          label: 'Prepared by',
          name: fallbackName,
          acted: true,
          date: createdAt || new Date().toISOString(),
        },
        ...updated,
      ];
    }

    return updated;
  };

  const [formData, setFormData] = useState(() => {
    const user = getCurrentUser();
    const initialRequester = resolveSubmitterName(initialData);
    
    // Check if iss_remark is in files
    const files = initialData?.files || initialData?.general_form?.files || [];
    const issFile = files.find(file => file.type === 'iss_remark' || file.category === 'iss');
    
    // Also check for nested files
    const nestedFiles = initialData?.general_form?.files || [];
    const nestedIssFile = nestedFiles.find(file => 
      file.type === 'iss_remark' || 
      file.category === 'iss' ||
      file.file_type === 'iss_remark' ||
      file.name?.includes('ISS') ||
      file.description?.includes('ISS')
    );
    
    // Check if iss_remark might be stored as a string in a different field
    const possibleIssFields = [
      'iss_number',
      'iss_no',
      'iss_code',
      'document_number',
      'doc_no'
    ];
    
    let issNumber = null;
    possibleIssFields.forEach(field => {
      if (initialData?.[field]) {
        issNumber = initialData[field];
      }
      if (initialData?.general_form?.[field]) {
        issNumber = initialData.general_form[field];
      }
    });
    
    return {
      branch: "",
      caseType: "Other income sell",
      datetime: new Date().toISOString().slice(0, 16),
      items: [],
      reason: "",
      g_remark: "",
      requester_name: initialRequester || user?.name || "",
      attachments: resolveInitialAttachments(initialData),
      issue_remarks: initialData?.issue_remarks || [],
      iss_remark: (() => {
        // First check direct iss_remark field
        if (initialData?.iss_remark) return initialData.iss_remark;
        if (initialData?.general_form?.iss_remark) return initialData.general_form.iss_remark;
        
        // Check general_form_files - the reason field contains the remark ID
        const allFiles = [
          ...(Array.isArray(initialData?.general_form_files) ? initialData.general_form_files : []),
          ...(Array.isArray(initialData?.files) ? initialData.files : []),
          ...(Array.isArray(initialData?.general_form?.files) ? initialData.general_form.files : [])
        ];
        
        // Find ISS_DOCUMENT files - prefer the one with ISS number (from issue stage) over the one from acknowledge stage
        const issFiles = allFiles.filter(f => f.file === 'ISS_DOCUMENT' || f.file_type === 'ISS_DOCUMENT');
        
        // Prefer the one with an ISS number (name field not empty) - this is from the issue stage
        // If multiple have names, get the most recent one (highest ID or latest created_at)
        let issFile = issFiles.find(f => f.name && f.name.trim() !== '' && f.name !== 'ISS_DOCUMENT');
        
        // If no file with ISS number found, get the most recent one (sorted by ID descending or created_at)
        if (!issFile && issFiles.length > 0) {
          issFiles.sort((a, b) => {
            // Sort by ID descending (most recent first)
            if (a.id && b.id) return b.id - a.id;
            // Or by created_at if available
            if (a.created_at && b.created_at) {
              return new Date(b.created_at) - new Date(a.created_at);
            }
            return 0;
          });
          issFile = issFiles[0];
        }
        
        if (issFile && issFile.reason) {
          // reason field contains the remark ID
          return issFile.reason;
        }
        
        // Fallback to other sources
        return issFile?.value ?? 
          issFile?.name ?? 
          issFile?.description ??
          issFile?.file ??
          nestedIssFile?.value ??
          nestedIssFile?.name ??
          nestedIssFile?.description ??
          nestedIssFile?.file ??
          issNumber ??
          null;
      })(),
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
  
  const [currentUser, setCurrentUser] = useState(() => getCurrentUser());
  
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Track if form has been initialized to prevent overwriting user input
  const formInitializedRef = useRef(false);
  // Track if approvals have been fetched to prevent duplicate fetches
  const approvalsFetchRef = useRef(false);
  // Track if branch has been bootstrapped to prevent infinite loop
  const branchBootstrappedRef = useRef(false);

  useEffect(() => {
    setCurrentUser(getCurrentUser());

    const handleStorageChange = (event) => {
      if (event?.key && event.key !== 'user') return;
      setCurrentUser(getCurrentUser());
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const normalizeRole = (value) => {
    const raw = (value || '').toString().toLowerCase().trim();
    if (!raw) return '';


    // IMPORTANT: Check for operation manager patterns FIRST (before BM)
    // This ensures "assistant operation manager" is detected as op_manager, not bm
    if (/assistant.*operation.*manager|assistant.*op.*manager|assistant\s*op\s*manager/i.test(value)) {
      return 'op_manager';
    }
    if (/operation.*manager|op.*manager|operation_manager|op_manager|^op$|^a2$/i.test(raw)) {
      return 'op_manager';
    }

    if (/branch\s*lp|loss\s*prevention|checker|branch_checker|lp/i.test(value)) return 'branch_lp';
    // Check for BM/ABM but exclude operation manager patterns
    if (/bm|branch manager|abm/.test(raw) && !/operation|assistant.*op|op.*manager/.test(raw)) return 'bm';
    if (/account|ac_?acknowledged/.test(raw)) return 'account';
    if (/supervisor|cs/.test(raw)) return 'supervisor';
    
    return raw;
  };

  const extractRoleValue = (user) => {
    if (!user || typeof user !== 'object') return '';


    // First check user_type - A2 maps to operation manager
    // Check in multiple locations: direct field, nested role object, etc.
    const userTypeCandidates = [
      user?.user_type,
      user?.userType,
      user?.role?.user_type,
      user?.role?.userType,
      user?.role_type?.user_type,
      user?.roleType?.user_type,
    ].filter(Boolean);
    
    for (const candidate of userTypeCandidates) {
      const upperCandidate = candidate.toString().toUpperCase().trim();
      if (upperCandidate === 'A2' || upperCandidate === 'OP') {
        return 'op_manager';
      }
    }

    // Check position/designation field FIRST - "assistant operation manager" should map to op_manager
    // This must be checked before role_name to avoid false matches
    const position = user?.position || user?.designation || '';
    if (position) {
      const positionLower = position.toString().toLowerCase().trim();
      if (positionLower.includes('assistant') && positionLower.includes('operation') && positionLower.includes('manager')) {
        return 'op_manager';
      }
      if (positionLower.includes('operation') && positionLower.includes('manager')) {
        return 'op_manager';
      }
    }

    const roleKeys = [
      'user_type', // Check user_type first (A2 = operation manager, OP = operation manager)
      'userType',
      'position', // Check position early - "assistant operation manager" is here
      'designation',
      'role',
      'role_name',
      'roleName',
      'user_role',
      'userRole',
      'role_type',
      'roleType',
      'type',
      'roles',
      'user_roles',
    ];

    const nestedKeys = [
      'user_type', // Check user_type in nested objects too
      'userType',
      'name',
      'role',
      'role_name',
      'roleName',
      'type',
      'code',
      'title',
    ];

    const extractFromValue = (value) => {
      if (typeof value === 'string') {
        // If value is user_type (A2 or OP), normalize to op_manager
        const upperValue = value.toUpperCase().trim();
        if (upperValue === 'A2' || upperValue === 'OP') {
          return 'op_manager';
        }
        return value.trim();
      }
      if (Array.isArray(value)) {
        for (const entry of value) {
          const nested = extractFromValue(entry);
          if (nested) return nested;
        }
      }
      if (typeof value === 'object' && value) {
        for (const key of nestedKeys) {
          const nested = value[key];
          if (typeof nested === 'string' && nested.trim()) {
            // If key is user_type or userType, check if value is A2 or OP
            if ((key === 'user_type' || key === 'userType') && (nested.toUpperCase().trim() === 'A2' || nested.toUpperCase().trim() === 'OP')) {
              return 'op_manager';
            }
            return nested.trim();
          }
        }
      }
      return '';
    };

    for (const key of roleKeys) {
      const value = user[key];
      if (value !== undefined && value !== null) {
      }
      const extracted = extractFromValue(value);
      if (extracted) {
        
        // CRITICAL: If extracted value is user_type A2 or OP, return op_manager immediately
        const extractedUpper = extracted.toString().toUpperCase().trim();
        if (extractedUpper === 'A2' || extractedUpper === 'OP') {
          return 'op_manager';
        }
        
        // If extracted value is "assistant operation manager" or similar, normalize it
        const extractedLower = extracted.toString().toLowerCase().trim();
        if (extractedLower.includes('assistant') && extractedLower.includes('operation') && extractedLower.includes('manager')) {
          return 'op_manager';
        }
        if (extractedLower.includes('operation') && extractedLower.includes('manager')) {
          return 'op_manager';
        }
        
        // If extracted value is "approver" and user_type is A2, return op_manager
        // (Don't return 'bm' if user_type is A2)
        if (extractedLower === 'approver' || extractedLower === 'bm' || extractedLower === 'branch manager') {
          // Double-check user_type before returning 'bm'
          const checkUserType = (user?.user_type || user?.userType || user?.role?.user_type || user?.role?.userType || '').toString().toUpperCase().trim();
          if (checkUserType === 'A2' || checkUserType === 'OP') {
            return 'op_manager';
          }
        }
        
        return extracted;
      }
    }

    const roleIdCandidates = [
      user?.role_id,
      user?.roleId,
      user?.role?.id,
      user?.role?.role_id,
    ].filter((value) => typeof value === 'number' || (typeof value === 'string' && value.trim()));

    if (roleIdCandidates.length) {
      const roleIdMap = new Map([
        [2, 'branch_lp'],
        [3, 'bm'],
        [4, 'op_manager'],
        [5, 'op_manager'],
        [7, 'account'], // Branch Account
        [8, 'account'], // Also account
        [10, 'supervisor'], // Supervisor
      ]);

      for (const candidate of roleIdCandidates) {
        const numeric = typeof candidate === 'string' ? Number(candidate) : candidate;
        if (!Number.isNaN(numeric) && roleIdMap.has(numeric)) {
          return roleIdMap.get(numeric);
        }
      }
    }

    return '';
  };

  const getRole = () => {
    try {
      const storedUser = JSON.parse(localStorage.getItem('user'));
      if (!storedUser) return '';

      return normalizeRole(extractRoleValue(storedUser));
    } catch { 
      return ''; 
    }
  };

  const getUserRole = () => {
    // COMPREHENSIVE user_type check from ALL possible sources
    const getAllUserTypes = () => {
      const sources = [];
      
      // Check currentUser (from localStorage)
      if (currentUser) {
        sources.push(
          currentUser?.user_type,
          currentUser?.userType,
          currentUser?.role?.user_type,
          currentUser?.role?.userType,
          currentUser?.role_type?.user_type,
          currentUser?.roleType?.user_type,
        );
      }
      
      // Check initialData
      if (initialData) {
        sources.push(
          initialData?.current_user?.user_type,
          initialData?.currentUser?.user_type,
          initialData?.current_user?.userType,
          initialData?.currentUser?.userType,
          initialData?.current_user?.role?.user_type,
          initialData?.currentUser?.role?.user_type,
          initialData?.user?.user_type,
          initialData?.user?.userType,
          initialData?.user_type,
          initialData?.userType,
        );
      }
      
      // Check localStorage directly
      try {
        const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
        if (storedUser) {
          sources.push(
            storedUser?.user_type,
            storedUser?.userType,
            storedUser?.role?.user_type,
            storedUser?.role?.userType,
          );
        }
      } catch (e) {}
      
      return sources.filter(Boolean);
    };
    
    const allUserTypes = getAllUserTypes();
    
    // Check if ANY source has A2 or OP
    for (const userType of allUserTypes) {
      const upperType = userType.toString().toUpperCase().trim();
      if (upperType === 'A2' || upperType === 'OP') {
        return 'op_manager';
      }
    }

    const backendSources = [
      initialData?.current_user,
      initialData?.currentUser,
      initialData?.user,
      initialData?.meta?.current_user,
      initialData?.meta?.user,
    ].filter(Boolean);

    let backendRole = '';
    for (const source of backendSources) {
      backendRole = extractRoleValue(source);
      if (backendRole) {
        break;
      }
    }

    if (!backendRole) {
      const scalarCandidates = [
        initialData?.current_user_role,
        initialData?.currentUserRole,
        initialData?.role,
        initialData?.user_role,
        initialData?.userRole,
        initialData?.current_role,
        initialData?.user_type, // Also check user_type from initialData
      ].filter((item) => typeof item === 'string' && item.trim().length);
      backendRole = scalarCandidates.length ? scalarCandidates[0] : '';
      if (backendRole) {
      }
    }

    const extractedFromCurrentUser = extractRoleValue(currentUser);
    if (extractedFromCurrentUser) {
    }
    
    const role = extractedFromCurrentUser || backendRole || getRole();
    
    // BEFORE normalization, check if user_type is A2 or OP from ALL sources - if so, return op_manager immediately
    const preNormalizeUserTypes = [
      currentUser?.user_type,
      currentUser?.userType,
      currentUser?.role?.user_type,
      currentUser?.role?.userType,
      initialData?.current_user?.user_type,
      initialData?.currentUser?.user_type,
      initialData?.current_user?.role?.user_type,
      initialData?.currentUser?.role?.user_type,
      initialData?.user?.user_type,
      initialData?.user?.userType,
      initialData?.user_type,
    ].filter(Boolean);
    
    
    for (const userType of preNormalizeUserTypes) {
      const upperUserType = userType.toString().toUpperCase().trim();
      if (upperUserType === 'A2' || upperUserType === 'OP') {
        return 'op_manager';
      }
    }
    
    const normalized = normalizeRole(role);
    
    // If normalized is still 'bm' but user_type is A2 or position contains 'operation manager', force override
    if (normalized === 'bm') {
      const allPositionFields = [
        currentUser?.position,
        currentUser?.designation,
        initialData?.current_user?.position,
        initialData?.currentUser?.position,
      ].filter(Boolean);
      
      for (const posField of allPositionFields) {
        const posLower = posField.toString().toLowerCase().trim();
        if (posLower.includes('assistant') && posLower.includes('operation') && posLower.includes('manager')) {
          return 'op_manager';
        }
        if (posLower.includes('operation') && posLower.includes('manager')) {
          return 'op_manager';
        }
      }
    }

    // FINAL check: if user_type is A2 or OP from ANY source, force op_manager
    const finalUserTypes = [
      currentUser?.user_type,
      currentUser?.userType,
      currentUser?.role?.user_type,
      currentUser?.role?.userType,
      initialData?.current_user?.user_type,
      initialData?.currentUser?.user_type,
      initialData?.current_user?.role?.user_type,
      initialData?.currentUser?.role?.user_type,
      initialData?.user?.user_type,
      initialData?.user?.userType,
      initialData?.user_type,
    ].filter(Boolean);
    
    
    for (const userType of finalUserTypes) {
      const upperUserType = userType.toString().toUpperCase().trim();
      if ((upperUserType === 'A2' || upperUserType === 'OP') && normalized !== 'op_manager') {
        return 'op_manager';
      }
    }

    // Check position field - "assistant operation manager" should map to op_manager
    const position = currentUser?.position || currentUser?.designation || 
                    initialData?.current_user?.position || 
                    initialData?.currentUser?.position || '';
    if (position) {
      const positionLower = position.toString().toLowerCase().trim();
      if (positionLower.includes('assistant') && positionLower.includes('operation') && positionLower.includes('manager')) {
        return 'op_manager';
      }
      if (positionLower.includes('operation') && positionLower.includes('manager')) {
        return 'op_manager';
      }
    }

    return normalized;
  };
  
  const userRole = useMemo(() => {
    const role = getUserRole();
    return role;
  }, [currentUser]);

  // Check if user is operation manager based on approvals (matching Laravel Op_Manager logic)
  // Laravel Op_Manager($data) checks:
  // - ApprovalProcessUser where user_type='OP', general_form_id=$data->id, admin_id=getAuthUser()->id
  // - AND status in ['BM Approved', 'Approved', 'HR Checked']
  // - AND user exists
  const isOpManagerByApproval = useMemo(() => {
    const currentUserId = currentUser?.id || currentUser?.admin_id || currentUser?.userId;
    if (!currentUserId) {
      return false;
    }
    
    // Get general_form_id from multiple sources
    const generalFormId = formData?.general_form_id || formData?.generalFormId || formData?.id || initialData?.id || initialData?.generalFormId || initialData?.general_form_id;
    if (!generalFormId) {
      return false;
    }
    
    const approvals = Array.isArray(formData?.approvals) ? formData.approvals : [];
    
    // Check if user has approval entry with user_type: 'OP' or 'A2'
    // Match Laravel exactly: user_type='OP', admin_id=current_user_id, status in ['BM Approved', 'Approved', 'HR Checked']
    // Also check 'A2' since some approvals might use 'A2' instead of 'OP'
    // IMPORTANT: The approval entry might have status='Pending' when form is 'BM Approved'
    // Laravel checks admin_id, not actual_user_id (actual_user_id is null until approval is done)
    const opApproval = approvals.find(approval => {
      // Check admin_id (Laravel checks this) - this is set when approval entry is created
      const adminId = approval?.admin_id || approval?.raw?.admin_id;
      // actual_user_id might be null until approval is done
      const actualUserId = approval?.actual_user_id || approval?.raw?.actual_user_id;
      const userId = approval?.user?.id || approval?.user_id || approval?.user?.admin_id;
      // Check all possible user ID fields
      const allUserIds = [adminId, actualUserId, userId].filter(id => id !== undefined && id !== null);
      
      const userType = (approval?.user_type || approval?.raw?.user_type || '').toString().toUpperCase();
      const approvalStatus = (approval?.status || approval?.raw?.status || '').toString().trim();
      
      // Laravel checks user_type='OP', but also check 'A2' for compatibility
      const userTypeMatches = userType === 'OP' || userType === 'A2';
      
      // Check if admin_id matches current user (Laravel checks admin_id=getAuthUser()->id)
      // admin_id is the key field - it's set when the approval entry is assigned to the user
      // NOTE: The API response doesn't include admin_id, so we need to check differently
      const userIdMatches = adminId && (String(adminId) === String(currentUserId) || Number(adminId) === Number(currentUserId));
      
      // Also check other user ID fields as fallback
      const otherUserIdMatches = allUserIds.some(id => 
        String(id) === String(currentUserId) || Number(id) === Number(currentUserId)
      );
      
      const formStatus = (formData?.status || '').toString().trim();
      const formStatusMatches = formStatus === 'BM Approved' || formStatus === 'BMApproved';
      
      // Get total amount for fallback check
      const totalAmount = Number(
        formData?.general_form?.total_amount
        ?? formData?.total_amount
        ?? formData?.general_form?.totalAmount
        ?? formData?.totalAmount
        ?? 0
      );
      const requiresOpManagerApproval = totalAmount > 500000;
      
      // Laravel checks status in ['BM Approved', 'Approved', 'HR Checked']
      // But when form is 'BM Approved', the OP approval entry might still be 'Pending' until approval
      // So if form status is 'BM Approved' and amount > 500000, allow it even if approval status is 'Pending'
      const statusMatches = ['BM Approved', 'BMApproved', 'Approved', 'HR Checked'].includes(approvalStatus);
      
      // CRITICAL: Since API doesn't return admin_id in the response, we need a different approach
      // Laravel's Op_Manager() checks admin_id, but since we don't have it in the API response,
      // we need to check if there's an OP approval entry when form is 'BM Approved' with amount > 500000
      // The backend will verify admin_id match when submitting the approval (like Laravel does)
      
      // If form is 'BM Approved', amount > 500000, and there's an OP approval entry,
      // allow the operation manager to see the button (backend will verify admin_id on submit)
      // This matches Laravel blade behavior - it shows the button if Op_Manager() returns true
      // Since API doesn't return admin_id, we check if OP approval entry exists and let backend verify
      const hasOPApprovalEntry = userTypeMatches;
      
      // Check if admin_id matches if it's available (might be in raw object or other sources)
      // Note: API response doesn't include admin_id, so this will often be false, but check anyway
      const adminIdMatches = adminId ? (String(adminId) === String(currentUserId) || Number(adminId) === Number(currentUserId)) : false;
      
      // Fallback: If form is 'BM Approved' and amount > 500000, and we have OP/A2 approval entry,
      // allow it (backend will verify admin_id when approval is submitted)
      // This handles the case where admin_id is not in API response
      // Since Laravel blade works, the approval entry must exist with matching admin_id in database
      // We'll show the button and let backend verify on submit
      const fallbackMatch = formStatusMatches && requiresOpManagerApproval && hasOPApprovalEntry;
      
      // Match if: 
      // 1. (user_type matches AND admin_id matches AND status matches Laravel's check), OR
      // 2. (fallback: form is BM Approved, amount > 500000, and OP approval entry exists)
      // The second case handles when API doesn't return admin_id - backend will verify on submit
      const matches = (userTypeMatches && adminIdMatches && statusMatches) || fallbackMatch;
      
      if (userTypeMatches) {
        // Found OP/A2 approval entry
      }
      
      return matches;
    });
    
    const result = Boolean(opApproval && currentUser);
    return result;
  }, [currentUser, formData.approvals, formData.status, formData.general_form_id, formData.generalFormId, formData.id, initialData?.id, initialData?.generalFormId, initialData?.general_form_id]);

  // User is op_manager if role name matches OR if they have OP approval entry
  const isOpManager = userRole === 'op_manager' || isOpManagerByApproval;
  

  // Check if user is account role based on approvals (matching Laravel Ac_Manager logic)
  // Laravel Ac_Manager() checks: ApprovalProcessUser where user_type='AC', admin_id=current_user_id, status='OPApproved'
  const isAccountByApproval = useMemo(() => {
    const currentUserId = currentUser?.id || currentUser?.admin_id || currentUser?.userId;
    if (!currentUserId) return false;
    
    const approvals = Array.isArray(formData?.approvals) ? formData.approvals : [];
    if (!approvals.length) return false;
    
    // Check if user has approval entry with user_type: 'AC' (Account)
    const accountApproval = approvals.find(approval => {
      const adminId = approval?.admin_id || approval?.raw?.admin_id;
      const actualUserId = approval?.actual_user_id || approval?.raw?.actual_user_id;
      const userId = approval?.user?.id || approval?.user_id || approval?.user?.admin_id;
      const allUserIds = [adminId, actualUserId, userId].filter(id => id !== undefined && id !== null);
      
      const userType = approval?.user_type || approval?.raw?.user_type || '';
      const approvalStatus = approval?.status || approval?.raw?.status || '';
      const label = (approval?.label || approval?.role || '').toString().toLowerCase();
      
      const userTypeMatches = (userType === 'AC' || userType === 'ACK');
      const labelMatches = label.includes('account') || label.includes('acknowledge');
      
      let userIdMatches = false;
      if (allUserIds.length > 0) {
        userIdMatches = allUserIds.some(id => 
          String(id) === String(currentUserId) || Number(id) === Number(currentUserId)
        );
      } else if (labelMatches && userTypeMatches) {
        const currentStatus = (formData.status || '').trim();
        userIdMatches = ['OPApproved', 'OP Approved', 'BM Approved', 'BMApproved', 'Completed'].includes(currentStatus);
      }
      
      // Laravel Ac_Manager checks status === 'OPApproved'
      const statusMatches = ['OPApproved', 'OP Approved', 'BM Approved', 'BMApproved', 'Pending'].includes(approvalStatus);
      const formStatus = (formData.status || '').trim();
      const formStatusAllows = ['OPApproved', 'OP Approved', 'BM Approved', 'BMApproved', 'Completed'].includes(formStatus);
      
      return (userTypeMatches || labelMatches) && userIdMatches && (statusMatches || formStatusAllows);
    });
    
    return Boolean(accountApproval);
  }, [currentUser, formData.approvals, formData.status]);

  // User is account if role name matches OR if they have AC approval entry
  const isAccount = userRole === 'account' || isAccountByApproval;

  const isDocumentOwner = currentUser?.id === initialData?.userId;
  
  // Fix incorrect "Checked by" name if current user is supervisor and their name is in Checked by
  useEffect(() => {
    const currentUser = getCurrentUser();
    const userRole = getUserRole();
    
    if (userRole === 'supervisor' && formData.approvals) {
      const checkedByApproval = formData.approvals.find(a => 
        a.label?.toLowerCase().includes('checked by') && 
        a.name === currentUser?.name
      );
      
      if (checkedByApproval) {
        setFormData(prev => ({
          ...prev,
          approvals: prev.approvals.map(approval => 
            approval.label?.toLowerCase().includes('checked by')
              ? { ...approval, name: '', status: 'Pending', acted: false }
              : approval
          )
        }));
      }
    }
  }, [formData.status]); // Run when status changes

  // Memoize derived values to prevent unnecessary re-renders
  const isApprover = true;
  
  const resolveBackendStatus = (action) => {
    switch ((action || '').trim()) {
      case 'BMApproved':
        return 'BM Approved';
      case 'Proceed':
        return 'Completed';
      case 'OPApproved':
        return 'Completed';
      case 'Ac_Acknowledged':
        // Operation Manager acknowledges - form status should be Ac_Acknowledged
        // Account users will then see it and can issue it (which changes to Completed)
        return 'Ac_Acknowledged';
      case 'BMApprovedMem':
        return 'Checked';
      case 'Completed':
        return 'Completed';
      case 'SupervisorIssued':
        return 'Completed'; // Supervisor step removed - map to Completed
      default:
        return action;
    }
  };
  
  const acknowledgeAliases = new Set([
    'acknowledge',
    'account',
    'ack',
    'acknowledged',
    'acknowledgement',
    'branch_account',
    'branchaccount',
    'supervisor',
  ]);

  const isAcknowledgeUser = acknowledgeAliases.has(userRole);

  if (process.env.NODE_ENV !== 'production') {
    // eslint-disable-next-line no-console
  }
  
  // Check if investigation form is filled (required for BM approval at Checked status)
  const isInvestigationFilled = useMemo(() => {
    const investigation = formData?.investigation || 
                         formData?.investigate || 
                         formData?.general_form?.investigation || 
                         formData?.general_form?.investigate || 
                         null;
    
    if (!investigation) {
      return false;
    }
    
    // Check if BM reason is filled (required for BM role)
    const hasBmReason = Boolean(investigation.bm_reason && investigation.bm_reason.trim());
    
    // Check if BM/Operation percentages are filled and total 100%
    const bmCompany = parseFloat(investigation.bm_company || investigation.companyPct || 0);
    const bmUser = parseFloat(investigation.bm_user || investigation.userPct || 0);
    const bmIncome = parseFloat(investigation.bm_income || investigation.incomePct || 0);
    const bmTotal = bmCompany + bmUser + bmIncome;
    const hasValidPercentages = Math.abs(bmTotal - 100) < 0.01 && bmTotal > 0;
    
    // Investigation is filled if it has BM reason and valid percentages
    return hasBmReason && hasValidPercentages;
  }, [formData?.investigation, formData?.investigate, formData?.general_form?.investigation, formData?.general_form?.investigate]);
  
  const showInvestigationButton = () => {
    const statusRaw =
      formData.status ??
      formData.general_form?.status ??
      formData.big_damage_issue?.status ??
      'Ongoing';
    const status = (statusRaw || '').toString().trim();
    
    // Show investigation button when status is Completed, Issued, or SupervisorIssued
    if (status === 'Completed' || status === 'Issued' || status === 'SupervisorIssued') {
      return true;
    }
    
    // Supervisor can view investigation form at Ac_Acknowledged stage
    if (userRole === 'supervisor' && (status === 'Ac_Acknowledged' || status === 'Acknowledged' || status === 'Approved')) {
      return true;
    }
    
    const isBM = ['bm', 'abm'].includes(userRole);

    // Always show button for BM/ABM in Checked status or beyond
    if (
      isBM &&
      ['Checked', 'BM Approved', 'BMApproved', 'OPApproved', 'OP Approved', 'Ac_Acknowledged', 'Acknowledged'].includes(status)
    ) {
      return true;
    }

    // Account users can view investigation at Ac_Acknowledged, OPApproved, or BM Approved stages
    if (userRole === 'account' && (status === 'Ac_Acknowledged' || status === 'Acknowledged' || status === 'OPApproved' || status === 'OP Approved' || status === 'BM Approved' || status === 'BMApproved')) {
      return true;
    }

    // For other roles, check if there's investigation data
    const hasInvestigation = Boolean(
      formData.investigation ||
      formData.investigate ||
      formData.general_form?.investigation ||
      formData.general_form?.investigate ||
      formData.big_damage_issue?.investigation ||
      formData.big_damage_issue?.investigate
    );
    
    if (hasInvestigation) {
      return true;
    }

    return false;
  };

  // Fetch approvals separately if not included in initialData (for existing forms after reload)
  useEffect(() => {
    const fetchApprovals = async () => {
      // Only fetch if we have a general_form_id and we haven't fetched yet
      const generalFormId = initialData?.generalFormId || 
                           initialData?.general_form_id || 
                           initialData?.id ||
                           initialData?.general_form?.id;
      
      if (!generalFormId || approvalsFetchRef.current || mode === 'add' || !formInitializedRef.current) return;
      
      // Check if we already have approvals with comments
      const currentApprovals = formData.approvals || [];
      const hasCApprovalWithComment = currentApprovals.some(a => 
        a?.user_type === 'C' && a?.comment && a.comment.trim() !== ''
      );
      
      // Check if we have OP approval entry (for operation manager detection)
      const currentUserId = currentUser?.id || currentUser?.admin_id || currentUser?.userId;
      const hasOPApproval = currentUserId && currentApprovals.some(a => {
        const adminId = a?.admin_id || a?.raw?.admin_id;
        const userType = (a?.user_type || a?.raw?.user_type || '').toString().toUpperCase();
        return (userType === 'OP' || userType === 'A2') && 
               adminId && 
               (String(adminId) === String(currentUserId) || Number(adminId) === Number(currentUserId));
      });
      
      // Fetch if we don't have a 'C' approval with comment OR if we don't have OP approval (for operation manager)
      if (!hasCApprovalWithComment || !hasOPApproval) {
        try {
          const token = localStorage.getItem('token');
          if (!token) return;
          
          approvalsFetchRef.current = true; // Prevent duplicate fetches
          
          const response = await fetch(`/api/general-forms/${generalFormId}/approvals`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Accept': 'application/json',
            },
          });
          
          if (response.ok) {
            const data = await response.json();
            const apiApprovals = Array.isArray(data.data) ? data.data : (Array.isArray(data) ? data : []);
            
            // Update approvals with API data if we got results
            if (apiApprovals.length > 0) {
              setFormData(prev => ({
                ...prev,
                approvals: apiApprovals, // Use API approvals (they have the latest data including comments)
              }));
            } else {
            }
          }
        } catch (error) {
          // Silently handle error - approvals will use defaults
          approvalsFetchRef.current = false; // Reset on error so we can retry
        }
      }
    };
    
    // Only fetch after form is initialized (wait a bit to ensure initialization is complete)
    const timer = setTimeout(() => {
      if (formInitializedRef.current) {
        fetchApprovals();
      }
    }, 100);
    
    return () => clearTimeout(timer);
  }, [initialData?.generalFormId || initialData?.general_form_id || initialData?.id, mode]);

  useEffect(() => {
    // Only initialize form data once when initialData is first loaded
    // This prevents overwriting user input when initialData changes due to SWR revalidation
    if (initialData && typeof initialData === 'object' && !formInitializedRef.current) {
      // Check if investigation data exists in any of the possible locations
      const investigationData = 
        initialData.investigation ||
        initialData.investigate ||
        initialData.general_form?.investigation ||
        initialData.general_form?.investigate ||
        initialData.big_damage_issue?.investigation ||
        initialData.big_damage_issue?.investigate;
      
      const hasInvestigationData = Boolean(investigationData);
      
      setHasInvestigation(hasInvestigationData);
      
      // Merge investigation data into formData if it exists
      const mergedData = { ...initialData };
      if (investigationData) {
        mergedData.investigation = investigationData;
      }
      
      setFormData(prev => {
        const resolvedRequester = resolveSubmitterName(mergedData) || prev.requester_name || '';
        // Get approvals from multiple possible sources
        const sourceApprovals = Array.isArray(mergedData.approvals) && mergedData.approvals.length > 0
          ? mergedData.approvals
          : Array.isArray(mergedData.general_form?.approvals) && mergedData.general_form.approvals.length > 0
            ? mergedData.general_form.approvals
            : prev.approvals;
        const approvalsWithPrepared = ensurePreparedApproval(sourceApprovals, resolvedRequester, mergedData.general_form || mergedData);
        
        // Ensure Operation Manager approval is preserved for completed/issued/acknowledged forms
        const currentStatus = (mergedData?.status || mergedData?.general_form?.status || '').trim();
        const isCompletedOrIssued = ['Completed', 'Issued', 'SupervisorIssued', 'OPApproved', 'OP Approved', 'Ac_Acknowledged', 'Acknowledged'].includes(currentStatus);
        const totalAmount = Number(
          mergedData?.general_form?.total_amount
          ?? mergedData?.total_amount
          ?? mergedData?.general_form?.totalAmount
          ?? mergedData?.totalAmount
          ?? 0
        );
        const requiresOpManagerApproval = totalAmount > 500000;
        
        let finalApprovals = approvalsWithPrepared;
        
        // If form requires OP Manager approval and is in a relevant status, ensure the approval exists and has name
        if (isCompletedOrIssued && requiresOpManagerApproval) {
          // Find existing OP Manager approval
          const opManagerApprovalIndex = finalApprovals.findIndex(a => {
            const userType = (a?.user_type || a?.raw?.user_type || "").toLowerCase();
            return userType === "op" || userType === "a2";
          });
          
          // Get Operation Manager name from formData
          const opManagerName = mergedData?.op_manager_name ||
                               mergedData?.general_form?.op_manager_name ||
                               mergedData?.op_manager_user?.name ||
                               mergedData?.general_form?.op_manager_user?.name ||
                               mergedData?.operation_manager_name ||
                               mergedData?.general_form?.operation_manager_name;
          
          if (opManagerApprovalIndex >= 0) {
            // Approval exists - ensure it has the name populated
            const existingApproval = finalApprovals[opManagerApprovalIndex];
            const hasName = existingApproval?.actual_user_name || 
                           existingApproval?.name || 
                           existingApproval?.raw?.actual_user_name ||
                           existingApproval?.acknowledges?.name ||
                           existingApproval?.raw?.acknowledges?.name;
            
            // If approval exists but doesn't have name, populate it from formData
            if (!hasName && opManagerName) {
              finalApprovals[opManagerApprovalIndex] = {
                ...existingApproval,
                actual_user_name: opManagerName,
                name: opManagerName,
                // Preserve raw data if it exists
                raw: existingApproval?.raw ? {
                  ...existingApproval.raw,
                  actual_user_name: opManagerName,
                  name: opManagerName,
                } : { actual_user_name: opManagerName, name: opManagerName },
              };
            }
          } else {
            // Approval doesn't exist - try to find it from source or create virtual one
            if (opManagerName) {
              // Find the OP Manager approval from the original approvals array
              const opApprovalFromSource = sourceApprovals.find(a => {
                const userType = (a?.user_type || a?.raw?.user_type || "").toLowerCase();
                return userType === "op" || userType === "a2";
              });
              
              // If found in source, use it and ensure name is populated
              if (opApprovalFromSource) {
                const hasName = opApprovalFromSource?.actual_user_name || 
                               opApprovalFromSource?.name || 
                               opApprovalFromSource?.raw?.actual_user_name;
                
                if (hasName) {
                  finalApprovals = [...finalApprovals, opApprovalFromSource];
                } else {
                  // Populate name from formData
                  finalApprovals = [...finalApprovals, {
                    ...opApprovalFromSource,
                    actual_user_name: opManagerName,
                    name: opManagerName,
                    raw: opApprovalFromSource?.raw ? {
                      ...opApprovalFromSource.raw,
                      actual_user_name: opManagerName,
                      name: opManagerName,
                    } : { actual_user_name: opManagerName, name: opManagerName },
                  }];
                }
              } else {
                // Create a virtual approval entry for display
                finalApprovals = [...finalApprovals, {
                  label: 'Operation Mgr Approved by',
                  role: 'Operation Manager',
                  user_type: 'OP',
                  actual_user_name: opManagerName,
                  name: opManagerName,
                  acted: true,
                  status: 'Approved',
                  date: mergedData?.general_form?.updated_at || mergedData?.updated_at || new Date().toISOString(),
                }];
              }
            }
          }
        }
        
        const issueRemarks = Array.isArray(mergedData.issue_remarks)
          ? mergedData.issue_remarks
          : Array.isArray(mergedData.general_form?.issue_remarks)
            ? mergedData.general_form.issue_remarks
            : prev.issue_remarks || [];

        // Ensure items have account codes preserved
        const loadedItems = Array.isArray(mergedData.items) ? mergedData.items : prev.items;
        const itemsWithAccountCodes = loadedItems.map(item => {
          // Preserve account codes from multiple possible sources
          const accCode1 = item?.acc_code1 ?? item?.acc_code ?? null;
          const accCode = item?.acc_code ?? item?.acc_code1 ?? null;
          
          return {
            ...item,
            acc_code1: accCode1,
            acc_code: accCode,
          };
        });
      
        
        return {
          ...prev,
          ...mergedData,
          branch: mergedData?.branch || mergedData?.branch_name || prev.branch,
          items: itemsWithAccountCodes,
          attachments: resolveInitialAttachments(mergedData, prev.attachments),
          issue_remarks: issueRemarks,
          iss_remark: mergedData?.iss_remark ?? 
            mergedData?.general_form?.iss_remark ?? 
            // Check general_form_files for ISS remark - remark ID is stored in reason field
            (() => {
              const allFiles = [
                ...(Array.isArray(mergedData?.general_form_files) ? mergedData.general_form_files : []),
                ...(Array.isArray(mergedData?.files) ? mergedData.files : []),
                ...(Array.isArray(mergedData?.general_form?.files) ? mergedData.general_form.files : [])
              ];
              
              // Find ISS_DOCUMENT files - prefer the one with ISS number (from issue stage) over the one from acknowledge stage
              const issFiles = allFiles.filter(f => f.file === 'ISS_DOCUMENT' || f.file_type === 'ISS_DOCUMENT');
              
              // Prefer the one with an ISS number (name field not empty) - this is from the issue stage
              // If multiple have names, get the most recent one (highest ID or latest created_at)
              let issFile = issFiles.find(f => f.name && f.name.trim() !== '' && f.name !== 'ISS_DOCUMENT');
              
              // If no file with ISS number found, get the most recent one (sorted by ID descending or created_at)
              if (!issFile && issFiles.length > 0) {
                issFiles.sort((a, b) => {
                  // Sort by ID descending (most recent first)
                  if (a.id && b.id) return b.id - a.id;
                  // Or by created_at if available
                  if (a.created_at && b.created_at) {
                    return new Date(b.created_at) - new Date(a.created_at);
                  }
                  return 0;
                });
                issFile = issFiles[0];
              }

              if (issFile && issFile.reason) {
                // reason field contains the remark ID
                return String(issFile.reason);
              }
              return null;
            })() ??
            prev.iss_remark ?? null,
          iss_numbers: Array.isArray(mergedData?.iss_numbers)
            ? [...mergedData.iss_numbers]
            : Array.isArray(mergedData?.general_form?.iss_numbers)
              ? [...mergedData.general_form.iss_numbers]
              : prev.iss_numbers || [],
          systemQtyUpdated: Boolean(
            mergedData?.systemQtyUpdated
            || mergedData?.acc_status
            || mergedData?.general_form?.systemQtyUpdated
            || mergedData?.general_form?.acc_status
            || prev.systemQtyUpdated
          ),
          requester_name: resolvedRequester,
          approvals: finalApprovals,
        };
      });
      
      // Mark form as initialized to prevent future overwrites
      formInitializedRef.current = true;
    }
  }, [initialData]);

  useEffect(() => {
    const bootstrapBranch = async () => {
      // Prevent multiple runs - only bootstrap once per mode change
      if (branchBootstrappedRef.current || (formData.branch || '').trim()) {
        return;
      }
      
      branchBootstrappedRef.current = true; // Mark as bootstrapped
      
      try {
        let storedUser = JSON.parse(localStorage.getItem('user'));
        const token = localStorage.getItem('token');
        let branchId = storedUser?.from_branch_id;
        
        // If branch ID is missing, try to refresh user info from API
        if (!branchId && token) {
          try {
            const meResponse = await fetch('/api/me', {
              headers: {
                Authorization: `Bearer ${token}`,
                Accept: 'application/json',
              },
            });
            if (meResponse.ok) {
              const meData = await meResponse.json();
              if (meData?.user?.from_branch_id) {
                // Update localStorage with refreshed user info
                storedUser = { ...storedUser, ...meData.user };
                localStorage.setItem('user', JSON.stringify(storedUser));
                branchId = meData.user.from_branch_id;
              }
            }
          } catch (e) {
            // Silently fail, continue with fallback
          }
        }
        
        if (!branchId) {
          const fallback = storedUser?.branch_name || storedUser?.from_branch_name;
          if (fallback) {
            setFormData(prev => ({ ...prev, branch: fallback }));
          }
          return;
        }
        const res = await fetch('/api/branches', {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
          },
        });
        if (!res.ok) {
          const fallback = storedUser?.branch_name || storedUser?.from_branch_name;
          if (fallback) {
            setFormData(prev => ({ ...prev, branch: fallback }));
          }
          return;
        }
        const json = await res.json();
        const list = Array.isArray(json) ? json : (Array.isArray(json?.data) ? json.data : (Array.isArray(json?.data?.data) ? json.data.data : []));
        const found = list.find(b => String(b.id) === String(branchId));
        if (found?.branch_name) {
          setFormData(prev => ({ ...prev, branch: found.branch_name }));
        } else {
          const fallback = storedUser?.branch_name || storedUser?.from_branch_name;
          if (fallback) {
            setFormData(prev => ({ ...prev, branch: fallback }));
          }
        }
      } catch (_) {
        try {
          const storedUser = JSON.parse(localStorage.getItem('user'));
          const fallback = storedUser?.branch_name || storedUser?.from_branch_name;
          if (fallback) {
            setFormData(prev => ({ ...prev, branch: fallback }));
          }
        } catch {}
      }
    };
    bootstrapBranch();
    
    // Reset bootstrap flag when mode changes
    return () => {
      if (mode === 'add') {
        branchBootstrappedRef.current = false;
      }
    };
  }, [mode]); // Removed formData.branch from dependencies to prevent infinite loop
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAddProductModalOpen, setIsAddProductModalOpen] = useState(false);
  const [dupModal, setDupModal] = useState({ open: false, code: '' });
  const [notFoundModal, setNotFoundModal] = useState({ open: false, code: '' });
  const [isSearching, setIsSearching] = useState(false);
  const [confirmationModal, setConfirmationModal] = useState({ 
    isOpen: false, 
    action: null,
    emptyFields: []
  });

  const handleOpenModal = () => setIsModalOpen(true);
  const handleCloseModal = () => setIsModalOpen(false);
  const handleOpenAddProductModal = () => setIsAddProductModalOpen(true);
  const handleCloseAddProductModal = () => setIsAddProductModalOpen(false);

  const handleAddItem = item => {
    console.log('Adding item to form:', item);
    setFormData(prev => {
      const newItems = [...prev.items, item];
      console.log('Total items after add:', newItems.length);
      return { ...prev, items: newItems };
    });
  };

  const handleRemoveItem = useCallback(id => {
    setFormData(prev => ({ ...prev, items: prev.items.filter(i => i.id !== id) }));
  }, []);

  const handleItemsChange = useCallback((updatedItems) => {
    // Remove duplicates by ID before updating
    const itemsById = new Map();
    updatedItems.forEach(item => {
      const id = item.id || item.specific_form_id;
      if (id) {
        const idStr = String(id);
        // Always use the latest item if duplicate ID exists
        itemsById.set(idStr, item);
      }
    });
    const uniqueItems = Array.from(itemsById.values());
    
    setFormData(prev => ({
      ...prev,
      items: uniqueItems.map(item => ({
        ...item,
        // Preserve category field explicitly
        category: item.category || prev.items.find(i => (i.id === item.id || i.code === item.code))?.category || '',
        category_id: item.category_id || prev.items.find(i => (i.id === item.id || i.code === item.code))?.category_id || null,
        amount: Number(item.amount ?? item.total ?? 0),
        total: Number(item.total ?? item.amount ?? 0)
      }))
    }));
  }, []);

  const handleItemFieldChange = useCallback((index, field, value) => {
    setFormData(prev => {
      if (!Array.isArray(prev.items) || !prev.items[index]) {
        return prev;
      }

      const nextItems = [...prev.items];
      const numericFields = new Set([
        'request_qty',
        'actual_qty',
        'final_qty',
        'price',
        'amount',
        'total',
        'system_qty'
      ]);

      const nextValue = numericFields.has(field)
        ? Number(value ?? 0)
        : value;

      // Preserve category when updating other fields
      const currentItem = nextItems[index];
      nextItems[index] = {
        ...currentItem,
        [field]: nextValue,
        // Ensure category is preserved
        category: currentItem.category || prev.items[index]?.category || '',
        category_id: currentItem.category_id || prev.items[index]?.category_id || null,
      };

      return {
        ...prev,
        items: nextItems
      };
    });
  }, []);

  const handleSearchProduct = async (productCode, caseType = 'Other income sell', onSuccess) => {
    if (!productCode?.trim()) {
      return;
    }

    const code = productCode.trim();

    // Check if product already exists in the form
    const productExists = formData.items.some(item => 
      item.code?.toLowerCase() === code.toLowerCase()
    );

    if (productExists) {
      setDupModal({ open: true, code });
      return;
    }

    setIsSearching(true);

    try {
      const storedUser = JSON.parse(localStorage.getItem("user"));
      const token = localStorage.getItem("token");
      const branchId = storedUser?.from_branch_id;

      if (!token) {
        alert('Please login again. Missing authentication token.');
        return;
      }

      if (!branchId) {
        alert('Missing branch information. Please re-login.');
        return;
      }

      const response = await fetch(
        `/api/big-damage-issues/search_product/${encodeURIComponent(code)}/${branchId}`,
        {
          headers: { 
            'Authorization': `Bearer ${token}`, 
            'Accept': 'application/json',
            'X-Requested-With': 'XMLHttpRequest'
          },
          credentials: 'include',
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        
        if (response.status === 404) {
          setNotFoundModal({ open: true, code });
          return;
        }
        
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      const responseData = await response.json().catch(() => {
        throw new Error('Invalid server response');
      });

      if (!responseData || !Array.isArray(responseData) || responseData.length === 0) {
        setNotFoundModal({ open: true, code });
        return;
      }

      const [info, sysQty = 0] = responseData;
      const price = Number(info?.price) || 0;

      // Get category from multiple possible sources (matching how items are loaded from backend)
      const category = info?.category || 
                       info?.categories?.name || 
                       info?.product_category_name || 
                       info?.Category_Name ||
                       '';

      const newItem = {
        id: Math.floor(Date.now() + Math.random() * 1000), // Ensure integer ID
        category: category,
        category_id: info?.category_id || info?.maincatid || null,
        product_code: info.product_code || code,
        code: info.product_code || code,
        product_name: info.product_name || "",
        name: info.product_name || "",
        unit: info.unit || "",
        system_qty: Number(sysQty) || 0,
        request_qty: 1, // Initialize with 1 instead of 0
        actual_qty: 1, // Initialize with 1 instead of 0
        final_qty: 1, // Initialize with 1 instead of 0
        price,
        amount: price * 1, // Calculate initial amount
        remark: "",
        img: [],
      };

      // Add the new item to the form
      setFormData(prev => {
        const updatedItems = [...prev.items, newItem];
        return {
          ...prev,
          items: updatedItems
        };
      });

      // Call success callback if provided (to close modal, etc.)
      if (onSuccess) {
        setTimeout(() => {
          onSuccess();
        }, 500);
      }

    } catch (_error) {
      setNotFoundModal({ open: true, code });
    } finally {
      setIsSearching(false);
    }
};

  // Calculate totalAmount from items, but also check general_form.total_amount as fallback
  const totalAmount = formData.items.length > 0 
    ? formData.items.reduce((acc, i) => acc + (i.amount || 0), 0)
    : Number(
        formData?.general_form?.total_amount
        ?? formData?.total_amount
        ?? formData?.general_form?.totalAmount
        ?? formData?.totalAmount
        ?? initialData?.general_form?.total_amount
        ?? initialData?.total_amount
        ?? 0
      );
  const apiActions = initialData?.actions || {};
  const statusText = (formData.status || '').trim();
  const normalize = s => (s || '').toString();
  
  const prettyApprove = (appr) => {
    const a = normalize(appr);
    if (!a) return '';

    switch (a) {
      case 'BMApprovedMem':
        return 'Check';
      case 'BMApproved':
        return 'Approve';
      case 'OPApproved':
        return 'Acknowledge';
      case 'Ac_Acknowledged':
        return 'Acknowledge';
      case 'SupervisorIssued':
        return 'Issue';
      case 'Completed':
        return 'Issue';
      default:
        return a;
    }
  };

  // Get button color classes based on action type - matching status colors
  const getButtonColorClass = (action) => {
    const a = normalize(action);
    if (!a) return 'bg-orange-600 hover:bg-orange-700 border-orange-700';

    switch (a) {
      case 'BMApprovedMem':
      case 'Checked':
        // Yellow for Check action (matches Checked status)
        return 'bg-yellow-500 hover:bg-yellow-600 border-yellow-600';
      case 'BMApproved':
        // Blue for BM Approve action (matches BM Approved status)
        return 'bg-blue-600 hover:bg-blue-700 border-blue-700';
      case 'OPApproved':
        // Custom OKLCH color for OP Approve action (matches OP Approved status)
        return 'op-approved-btn-custom';
      case 'Ac_Acknowledged':
        // Custom OKLCH color for Acknowledge action (matches Acknowledged status)
        return 'acknowledge-btn-custom';
      case 'Completed':
      case 'Issue':
      case 'SupervisorIssued':
        // Green for Issue action (matches Completed status)
        return 'bg-green-600 hover:bg-green-700 border-green-700';
      default:
        // Default orange for Submit (matches Ongoing status)
        return 'bg-orange-600 hover:bg-orange-700 border-orange-700';
    }
  };

  const deriveActions = () => {
    const act = { ...apiActions };
    
    if (!normalize(act.approve)) {
      const role = getUserRole();
      const currentStatus = formData.status || 'Ongoing';
      
      // Get total amount to check if Operation Manager approval is required
      const totalAmount = Number(
        formData?.general_form?.total_amount
        ?? formData?.total_amount
        ?? formData?.general_form?.totalAmount
        ?? formData?.totalAmount
        ?? 0
      );
      const requiresOpManagerApproval = totalAmount > 500000;

      if (role === 'branch_lp' && currentStatus === 'Ongoing') {
        act.approve = 'BMApprovedMem';
      } else if ((role === 'bm' || role === 'abm' || role === 'bm_abm') && (currentStatus === 'Ongoing' || currentStatus === 'Checked')) {
        act.approve = 'BMApproved';
      } else if ((isOpManager || role === 'op_manager') && (currentStatus === 'BM Approved' || currentStatus === 'BMApproved' || currentStatus === 'Checked')) {
        // Operation Manager should only approve if amount > 500000
        // After Operation Manager acknowledges, form goes directly to Completed (no supervisor step)
        if (requiresOpManagerApproval) {
          act.approve = 'Ac_Acknowledged'; // Changed from OPApproved to Ac_Acknowledged
        }
      } else if (role === 'account') {
        // Account can only issue after proper approval stage:
        // - If amount > 500000: Must wait for Ac_Acknowledged (Operation Manager acknowledgment)
        // - If amount <= 500000: Can issue at BM Approved (no Operation Manager stage)
        if (requiresOpManagerApproval) {
          // Amount exceeds 500000 - must wait for Operation Manager acknowledgment
          if (currentStatus === 'Ac_Acknowledged' || currentStatus === 'Acknowledged' || currentStatus === 'OPApproved' || currentStatus === 'OP Approved') {
            act.approve = 'Completed'; // Changed from Ac_Acknowledged to Completed (shows as "Issue")
          }
        } else {
          // Amount <= 500000 - can issue at BM Approved
          if (currentStatus === 'BM Approved' || currentStatus === 'BMApproved') {
            act.approve = 'Completed'; // Changed from Ac_Acknowledged to Completed (shows as "Issue")
          }
        }
      // Removed supervisor step - after Ac_Acknowledged, form goes directly to Completed
      // Supervisor step is no longer needed for big damage issue forms
      } else if (currentStatus === 'Ongoing' || currentStatus === '') {
        act.approve = 'BMApproved';
      }
    }
    
    return act;
  };

  const actions = deriveActions();

  // Handle back button click - preserve pagination and filters
  const handleBack = () => {
    // First, try to get the return URL from sessionStorage (most reliable)
    const storedReturnUrl = sessionStorage.getItem('bigDamageIssueReturnUrl');
    
    if (storedReturnUrl) {
      // Clear the stored URL after using it
      sessionStorage.removeItem('bigDamageIssueReturnUrl');
      
      // Extract pathname and search from the stored URL
      const urlParts = storedReturnUrl.split('?');
      const pathname = urlParts[0] || '/big-damage-issue';
      const search = urlParts[1] ? `?${urlParts[1]}` : '';
      
      // Navigate with search params - React Router will handle this properly
      navigate(pathname + search, { replace: false });
      return;
    }
    
    // Fallback: Check location state for return URL
    const returnUrl = location.state?.returnUrl;
    if (returnUrl) {
      const urlParts = returnUrl.split('?');
      const pathname = urlParts[0] || '/big-damage-issue';
      const search = urlParts[1] ? `?${urlParts[1]}` : '';
      navigate(pathname + search, { replace: false });
      return;
    }
    
    // Fallback: Check location state for return page
    const returnPage = location.state?.returnPage;
    if (returnPage && returnPage > 1) {
      navigate(`/big-damage-issue?page=${returnPage}`, { replace: false });
      return;
    }
    
    // Final fallback: Navigate to default list page
    navigate('/big-damage-issue', { replace: false });
  };

  // Handle download PDF
  const handleDownloadPdf = async () => {
    try {
      // Get the general_form_id from initialData
      const generalFormId = initialData?.id || initialData?.generalFormId || formData?.generalFormId;
      
      if (!generalFormId) {
        toast.error(t('messages.pdfFormIdNotFound'));
        return;
      }

      // Get the token for authentication
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error(t('messages.authRequired'));
        return;
      }

      // Import API config to get base URL
      const config = await import('../../api/config');
      const { API_BASE_URL } = config;
      
      // Construct the PDF URL - using the API route for print
      // The route is /api/big-damage-issues/{general_form_id}/print
      const pdfUrl = `${API_BASE_URL}/big-damage-issues/${generalFormId}/print`;
      
      // Show loading toast
      const loadingToast = toast.loading(t('messages.pdfGenerating'));
      
      console.log('[PDF Download] Starting PDF download', { pdfUrl, generalFormId });
      
      let timeoutId = null;
      try {
        // Create an AbortController for timeout
        const controller = new AbortController();
        timeoutId = setTimeout(() => {
          console.error('[PDF Download] Request timeout after 60 seconds');
          controller.abort();
        }, 60000); // 60 second timeout
        
        console.log('[PDF Download] Fetching PDF...');
        // Fetch PDF with Bearer token authentication (API route)
        const response = await fetch(pdfUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/pdf',
          },
          credentials: 'include',
          signal: controller.signal,
        });
        
        if (timeoutId) clearTimeout(timeoutId);

        console.log('[PDF Download] Response received', { 
          status: response.status, 
          statusText: response.statusText,
          contentType: response.headers.get('content-type'),
          ok: response.ok 
        });

        // Check content type first
        const contentType = response.headers.get('content-type') || '';
        
        if (!response.ok) {
          // Clone response to read error without consuming body
          const clonedResponse = response.clone();
          let errorMessage = t('messages.errors.pdfInvalidResponse');
          try {
            const errorData = await clonedResponse.json();
            if (errorData.message || errorData.error) {
              errorMessage = errorData.message || errorData.error;
            } else if (response.status === 401) {
              errorMessage = t('messages.errors.pdfAuthFailed');
            } else if (response.status === 404) {
              errorMessage = t('messages.errors.notFound');
            } else if (response.status === 500) {
              errorMessage = t('messages.errors.serverError');
            }
          } catch (e) {
            // Response is not JSON, use default message based on status
            if (response.status === 401) {
              errorMessage = t('messages.errors.pdfAuthFailed');
            } else if (response.status === 404) {
              errorMessage = t('messages.errors.notFound');
            } else if (response.status === 500) {
              errorMessage = t('messages.errors.serverError');
            }
          }
          throw new Error(errorMessage);
        }

        // Check if response is HTML (likely a redirect to login page)
        if (contentType && contentType.includes('text/html')) {
          const clonedResponse = response.clone();
          const htmlText = await clonedResponse.text();
          if (htmlText.includes('login') || htmlText.includes('Login')) {
            throw new Error(t('messages.errors.pdfAuthFailed'));
          }
          throw new Error(t('messages.errors.pdfInvalidResponse'));
        }
        
        // Get the PDF blob
        console.log('[PDF Download] Converting response to blob...');
        const blob = await response.blob();
        
        console.log('[PDF Download] Blob created', { 
          type: blob.type, 
          size: blob.size 
        });
        
        // Verify it's actually a PDF (check blob type and size)
        if (blob.size === 0) {
          console.error('[PDF Download] Blob is empty');
          throw new Error(t('messages.errors.pdfInvalidResponse'));
        }
        
        if (!blob.type.includes('pdf') && blob.size > 0) {
          // Might be an error response or HTML - read as text to check
          const blobText = await blob.text();
          if (blobText.includes('login') || blobText.includes('Login')) {
            throw new Error(t('messages.errors.pdfAuthFailed'));
          }
          // Try to parse as JSON error
          try {
            const errorJson = JSON.parse(blobText);
            throw new Error(errorJson.message || errorJson.error || t('messages.errors.pdfInvalidResponse'));
          } catch (e) {
            throw new Error(t('messages.errors.pdfInvalidResponse'));
          }
        }
        
        // Create a blob URL and download
        console.log('[PDF Download] Creating download link...');
        const blobUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = `damage-form-${generalFormId}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Clean up the blob URL
        window.URL.revokeObjectURL(blobUrl);
        
        console.log('[PDF Download] PDF download completed successfully');
        toast.dismiss(loadingToast);
        toast.success(t('messages.pdfGenerated'));
      } catch (fetchError) {
        if (timeoutId) clearTimeout(timeoutId);
        toast.dismiss(loadingToast);
        // Handle abort/timeout
        if (fetchError.name === 'AbortError') {
          throw new Error(t('messages.errors.timeout'));
        }
        throw fetchError;
      }
    } catch (error) {
      // Ensure loading toast is dismissed
      toast.dismiss(loadingToast);
      const errorMessage = error.message || t('messages.pdfGenerateFailed');
      toast.error(errorMessage);
      console.error('PDF download error:', error);
    }
  };

  // Show confirmation modal before submitting
  const handleSubmitClick = (action) => {
    // Check if investigation is required for approval at Checked status
    const status = (formData.status || '').toString().trim();
    const normalizedStatus = status.replace(/\s+/g, ' ');
    const role = getUserRole();
    const isCheckedStatus = normalizedStatus === 'Checked';
    const isApprovalAction = action === 'BMApproved' || action === 'BMApprovedMem' || action === 'BM Approved';
    const isBMOrABM = role === 'bm' || role === 'abm';
    
    // If status is Checked and user is BM/ABM trying to approve, check if investigation is filled
    if (isCheckedStatus && isApprovalAction && isBMOrABM && !isInvestigationFilled) {
      toast.error(t('messages.investigationRequired'));
      return;
    }
    
    // Check for empty fields before showing confirmation modal
    const emptyFields = [];
    
    if (!formData.branch || formData.branch.trim() === '') {
      emptyFields.push('Branch');
    }
    
    if (!formData.datetime || formData.datetime.trim() === '') {
      emptyFields.push('Date/Time');
    }
    
    if (!formData.requester_name || formData.requester_name.trim() === '') {
      emptyFields.push('Requester Name');
    }
    
    // Check product items for missing images and remarks
    const items = Array.isArray(formData.items) ? formData.items : [];
    let itemsWithoutImagesCount = 0;
    let itemsWithoutRemarksCount = 0;
    const itemsWithoutImages = [];
    const itemsWithoutRemarks = [];
    
    items.forEach((item, index) => {
      const productCode = (item?.product_code || item?.code || '').toString().trim();
      if (!productCode) return; // Skip items without product code
      
      // Check if item has images
      const itemImages = extractImageArray(item);
      if (itemImages.length === 0) {
        itemsWithoutImagesCount++;
        itemsWithoutImages.push(`Product ${index + 1} (${productCode})`);
      }
      
      // Check if item has remark
      const remark = (item?.remark || '').toString().trim();
      if (!remark) {
        itemsWithoutRemarksCount++;
        itemsWithoutRemarks.push(`Product ${index + 1} (${productCode})`);
      }
    });
    
    if (itemsWithoutImagesCount > 0) {
      if (itemsWithoutImagesCount === 1) {
        emptyFields.push(`Product Image: ${itemsWithoutImages[0]}`);
      } else {
        emptyFields.push(`Product Images: ${itemsWithoutImagesCount} products missing images`);
      }
    }
    
    if (itemsWithoutRemarksCount > 0) {
      if (itemsWithoutRemarksCount === 1) {
        emptyFields.push(`Product Remark: ${itemsWithoutRemarks[0]}`);
      } else {
        emptyFields.push(`Product Remarks: ${itemsWithoutRemarksCount} products missing remarks`);
      }
    }
    
    // Check supporting info attachments
    const attachments = Array.isArray(formData.attachments) ? formData.attachments : [];
    if (attachments.length === 0) {
      emptyFields.push('Supporting Info Attachments');
    }
    
    setConfirmationModal({ isOpen: true, action, emptyFields });
  };

  // Handle confirmation - proceed with actual submission
  const handleConfirmSubmit = async () => {
    const actionToSubmit = confirmationModal.action;
    setConfirmationModal({ isOpen: false, action: null, emptyFields: [] });
    if (actionToSubmit) {
      await handleSubmit(actionToSubmit);
    }
  };

  // Handle cancellation - close modal without submitting
  const handleCancelSubmit = () => {
    setConfirmationModal({ isOpen: false, action: null, emptyFields: [] });
  };

  //Handle form submission (actual submission logic)
  const handleSubmit = async (action) => {
   
    try {
      setError('');
      setSuccessMessage('');
      setIsSubmitting(true);
      
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error(t('messages.errors.authTokenNotFound'));
      }

      const generalFormId = initialData?.id || initialData?.generalFormId || formData?.generalFormId || null;
      const isExistingForm = Boolean(generalFormId);

      const urlParams = new URLSearchParams(window.location.search);
      const formId = urlParams.get('form_id') || 1;
      const layoutId = urlParams.get('layout_id') || 1;

      const items = Array.isArray(formData.items) ? formData.items : [];
      if (!items.length) {
        toast.error(t('messages.addProductRequired'));
        setIsSubmitting(false);
        return;
      }

      const hasValidProduct = items.some((item) => (item?.code || item?.product_code || '').toString().trim());
      if (!hasValidProduct) {
        toast.error(t('messages.productCodeRequired'));
        setIsSubmitting(false);
        return;
      }

      // Helper function to safely convert to number, handling strings, null, undefined
      const safeNumber = (value) => {
        if (value === null || value === undefined || value === '') return 0;
        // Handle string values like "2" or "2.5"
        if (typeof value === 'string') {
          const trimmed = value.trim();
          if (trimmed === '') return 0;
          const num = Number(trimmed);
          return Number.isFinite(num) && num >= 0 ? num : 0;
        }
        const num = Number(value);
        return Number.isFinite(num) && num >= 0 ? num : 0;
      };

      // Helper function to find quantity from multiple possible fields
      const findQuantity = (item) => {
        // Try all possible quantity fields in priority order
        // Check both direct access and string conversions
        const fields = [
          item?.request_qty,
          item?.actual_qty,
          item?.final_qty,
          item?.product_type,
          item?.qty,
          item?.quantity
        ];
        
        for (const field of fields) {
          // Check if field exists and is not empty/null/undefined
          // Also check for string "0" which should be treated as 0
          if (field !== null && field !== undefined && field !== '' && String(field).trim() !== '0') {
            const qty = safeNumber(field);
            // Return first valid quantity > 0 found
            if (qty > 0) return qty;
          }
        }
        
        // Fallback: if item has amount and price, calculate quantity
        const price = safeNumber(item?.price);
        const amount = safeNumber(item?.amount);
        if (amount > 0 && price > 0) {
          const calculatedQty = amount / price;
          if (calculatedQty > 0 && Number.isFinite(calculatedQty)) {
            return calculatedQty;
          }
        }
        
        return 0;
      };

      // Filter out items with 0 quantity or no product code before processing
      // This prevents errors for old forms where items might have 0 quantity
      const validItems = items.filter((item) => {
        const productCode = (item?.product_code || item?.code || '').toString().trim();
        if (!productCode) return false; // Skip items without product code
        
        // Find quantity using improved detection (checks multiple fields and calculates from amount/price)
        const qty = findQuantity(item);
        
        // Item is valid if it has quantity > 0
        return qty > 0;
      });

      console.log('Form submission - Total items:', items.length);
      console.log('Form submission - Valid items:', validItems.length);
      console.log('Form submission - Items data:', items);
      console.log('Form submission - Valid items data:', validItems);

      // Critical validation - items are still required (blocking error)
      if (validItems.length === 0) {
        toast.error(t('messages.addProductRequired'));
        setIsSubmitting(false);
        return;
      }
      
      // Note: Reason/Remark/Comment can be null in create stage
      // Note: File attachments are optional in submit step
      // Note: Empty fields are already shown in confirmation modal, no need to show again here

      const normalizedItems = validItems.map((item, index) => {
        const productCode = (item?.product_code || item?.code || '').toString().trim();
        
        // Try multiple fields to find quantity (for old forms compatibility)
        // Priority: request_qty > actual_qty > final_qty > product_type
        const rawQty = item?.request_qty ?? item?.actual_qty ?? item?.final_qty ?? item?.product_type ?? 0;
        const requestQty = safeNumber(rawQty);
        
        // Ensure requestQty is at least 1 for valid items (since we filtered for qty > 0)
        const finalRequestQty = requestQty > 0 ? requestQty : 1;
        
        const systemQty = safeNumber(item?.system_qty);
        const priceValue = Number(item?.price);
        const price = Number.isFinite(priceValue) ? priceValue : 0;
        const computedAmount = price * finalRequestQty;
        const parsedAmount = Number(item?.amount);
        const amount = Number.isFinite(parsedAmount) && parsedAmount > 0 ? parsedAmount : computedAmount;
        const remark = item?.remark ?? '';
        const productName = item?.product_name || item?.name || '';
        const unit = item?.unit || '';

        // Resolve actual and final quantities, checking multiple fields for old form compatibility
        const rawActual = item?.actual_qty ?? item?.request_qty ?? 0;
        const rawFinal = item?.final_qty ?? item?.product_type ?? item?.request_qty ?? 0;
        const resolvedActual = safeNumber(rawActual) > 0 ? safeNumber(rawActual) : finalRequestQty;
        const resolvedFinal = safeNumber(rawFinal) > 0 ? safeNumber(rawFinal) : finalRequestQty;
        const accountCode = item?.acc_code1 ?? item?.acc_code ?? '';
        const rawSpecificId = item?.specific_form_id ?? item?.id ?? item?.specific_id ?? '';
        
        // Ensure specific_form_id is always an integer (database expects bigint)
        // Convert to integer: if it's a number (including decimal), use Math.floor
        // If it's a string that represents a number, parse and floor it
        let specificId = '';
        if (rawSpecificId !== '' && rawSpecificId !== null && rawSpecificId !== undefined) {
          const parsed = typeof rawSpecificId === 'number' 
            ? rawSpecificId 
            : (typeof rawSpecificId === 'string' && rawSpecificId.trim() !== '' 
                ? parseFloat(rawSpecificId) 
                : null);
          
          if (parsed !== null && !isNaN(parsed)) {
            specificId = Math.floor(parsed).toString();
          }
        }
        
        // Get product_category_id from multiple possible sources
        const categoryId = item?.product_category_id || 
                          item?.category_id || 
                          item?.maincatid || 
                          null;
        const normalizedCategoryId = (categoryId === '' || categoryId === 'undefined' || categoryId === null || isNaN(categoryId))
          ? null
          : Number(categoryId);

        return {
          product_code: productCode,
          product_name: productName,
          unit,
          request_qty: finalRequestQty,
          actual_qty: resolvedActual,
          final_qty: resolvedFinal,
          price,
          amount,
          system_qty: systemQty,
          remark,
          acc_code1: accountCode,
          specific_form_id: specificId,
          product_type: item?.product_type ?? resolvedFinal,
          product_category_id: normalizedCategoryId,
        };
      });

      // Arrays will be declared later before use

      // Import with debug logging
      const config = await import('../../api/config');
      const { apiFetch } = config;
      
      // Set the correct endpoint based on the mode
      const formIdNum = parseInt(formId, 10) || 1;
      const layoutIdNum = parseInt(layoutId, 10) || 1;
      const endpoint = isExistingForm
        ? `/big-damage-issues/${generalFormId}`
        : `/big-damage-issues/${formIdNum}/${layoutIdNum}`;

      const method = isExistingForm ? 'POST' : 'POST';

      const formDataToSend = new FormData();
      
      const excludedFormKeys = new Set([
        'items',
        'approvals',
        'account_codes',
        'issue_remarks',
        'attachments',
        'general_form',
        'general_form_files',
        'files',
        'actions',
        'big_damage_issue',
        'meta',
      ]);

      Object.entries(formData).forEach(([key, value]) => {
        if (excludedFormKeys.has(key)) return;

        if (value instanceof Date) {
          // Convert to Y-m-d H:i:s format for Laravel
          const year = value.getFullYear();
          const month = String(value.getMonth() + 1).padStart(2, '0');
          const day = String(value.getDate()).padStart(2, '0');
          const hours = String(value.getHours()).padStart(2, '0');
          const minutes = String(value.getMinutes()).padStart(2, '0');
          const seconds = String(value.getSeconds()).padStart(2, '0');
          formDataToSend.append(key, `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`);
          return;
        }

        if (value instanceof File) {
          formDataToSend.append(key, value);
          return;
        }

        if (Array.isArray(value)) {
          const hasComplexEntries = value.some((entry) => entry && typeof entry === 'object' && !(entry instanceof File));
          if (hasComplexEntries) {
            return;
          }

          value.forEach((entry) => {
            if (entry !== undefined && entry !== null && entry !== '') {
              formDataToSend.append(`${key}[]`, entry);
            }
          });
          return;
        }

        if (value !== null && typeof value === 'object') {
          return;
        }

        if (value !== null && value !== undefined) {
          // Special handling for datetime field - convert to Laravel format
          if (key === 'datetime' && typeof value === 'string') {
            // Handle various datetime formats
            let datetimeValue = value;
            
            // Remove any ISO timezone suffixes (.000000Z, :00, etc.)
            datetimeValue = datetimeValue.replace(/\.\d+Z.*$/, '');
            datetimeValue = datetimeValue.replace(/Z.*$/, '');
            
            // Convert from 2025-11-24T04:02 to 2025-11-24 04:02:00
            if (datetimeValue.includes('T')) {
              datetimeValue = datetimeValue.replace('T', ' ');
            }
            
            // Add seconds if not present
            if (datetimeValue.length === 16) { // YYYY-MM-DD HH:MM format
              datetimeValue += ':00';
            }
            
            formDataToSend.append(key, datetimeValue);
          } else {
            formDataToSend.append(key, value);
          }
        }
      });

      // Get user_id from multiple sources
      const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
      const userId = formData.user_id
        ?? initialData?.user_id
        ?? initialData?.user?.id
        ?? initialData?.user?.user_id
        ?? storedUser?.id
        ?? storedUser?.admin_id
        ?? storedUser?.user_id
        ?? null;

      if (userId) {
        formDataToSend.append('user_id', userId);
      }
      
      // Add branch_id if not already present
      const branchId = formData.branch_id 
        ?? initialData?.branch_id
        ?? storedUser?.from_branch_id
        ?? storedUser?.branch_id
        ?? null;
        
      if (branchId) {
        formDataToSend.append('branch_id', branchId);
      }
      
      // Add form_id and layout_id for new forms
      if (!isExistingForm) {
        const formIdNum = parseInt(formId, 10) || 1;
        const layoutIdNum = parseInt(layoutId, 10) || 1;
        formDataToSend.append('form_id', formIdNum);
        formDataToSend.append('layout_id', layoutIdNum);
      }

      if (isExistingForm) {
        formDataToSend.append('_method', 'PATCH');
      }

      // Always include asset_type for both new and existing forms
      formDataToSend.append('asset_type', 'Damage');
      
      // Send items in nested format that Laravel expects: items[0][product_code], items[1][product_code], etc.
      // Laravel Repository expects: $request['items'] as an array
      normalizedItems.forEach((item, index) => {
        Object.entries(item).forEach(([key, value]) => {
          // Special handling for numeric fields - include 0 values
          const isNumericField = ['request_qty', 'actual_qty', 'final_qty', 'system_qty', 'price', 'amount', 'product_type'].includes(key);
          
          if (value !== undefined && value !== null) {
            // For numeric fields, include 0 values
            // Ensure specific_form_id is sent as integer string
            if (key === 'specific_form_id' && value !== '') {
              const intValue = Math.floor(Number(value));
              formDataToSend.append(`items[${index}][${key}]`, intValue.toString());
            } else if (isNumericField || value !== '') {
              formDataToSend.append(`items[${index}][${key}]`, value);
            }
          }
        });
      });

      // NOTE: Laravel backend needs BOTH formats for updates
      // - Nested format items[0][key] for creating items
      // - Array format field[] for updating items (edit_product method)
      
      // These arrays are required by the edit_product method in Repository
      const appendArrayField = (key, values) => {
        values.forEach((value, index) => {
          const valueToSend = (value !== undefined && value !== null) ? value : '';
          // Ensure specific_form_id is sent as integer string
          if (key === 'specific_form_id' && valueToSend !== '') {
            const intValue = Math.floor(Number(valueToSend));
            formDataToSend.append(`${key}[]`, intValue.toString());
          } else {
            formDataToSend.append(`${key}[]`, valueToSend);
          }
        });
      };
      
      // Map arrays from normalized items
      const productCodes = normalizedItems.map((item) => item.product_code);
      const productNames = normalizedItems.map((item) => item.product_name ?? '');
      const units = normalizedItems.map((item) => item.unit ?? '');
      const systemQtys = normalizedItems.map((item) => item.system_qty ?? 0);
      const requestQtys = normalizedItems.map((item) => item.request_qty ?? 0);
      const actualQtys = normalizedItems.map((item) => item.actual_qty ?? 0);
      const finalQtys = normalizedItems.map((item) => item.final_qty ?? 0);
      const prices = normalizedItems.map((item) => item.price ?? 0);
      const amounts = normalizedItems.map((item) => item.amount ?? 0);
      const remarks = normalizedItems.map((item) => item.remark ?? '');
      const productTypes = normalizedItems.map((item) => item.product_type ?? 'Damage');
      const productCategoryIds = normalizedItems.map((item) => item.product_category_id ?? null);
      const specificFormIds = normalizedItems.map((item, index) => {
        const fallback = items[index]?.specific_form_id ?? items[index]?.id ?? '';
        return item.specific_form_id ?? fallback;
      });
      const accountCodeLines = normalizedItems.map((item) => item.acc_code1 ?? '');
      
      // Append all arrays
      appendArrayField('product_code', productCodes);
      appendArrayField('product_name', productNames);
      appendArrayField('unit', units);
      appendArrayField('system_qty', systemQtys);
      appendArrayField('request_qty', requestQtys);
      appendArrayField('actual_qty', actualQtys);
      appendArrayField('final_qty', finalQtys);
      appendArrayField('price', prices);
      appendArrayField('amount', amounts);
      appendArrayField('total', amounts);
      appendArrayField('remark', remarks);
      appendArrayField('product_type', productTypes);
      appendArrayField('product_category_id', productCategoryIds);
      appendArrayField('specific_form_id', specificFormIds);
      appendArrayField('acc_code1', accountCodeLines);

      const commentValue = [formData.comment, formData.reason, formData.remark]
        .map((value) => (typeof value === 'string' ? value.trim() : ''))
        .find((value) => value.length > 0) || '';

      if (commentValue.length) {
        formDataToSend.append('comment', commentValue);
      }
      
      // Reason and g_remark can be empty in create stage - send empty string or null
      // Don't force N/A as default
      
      
      // Send the selected issue remark - always send it if it exists
      // The backend needs this to save the ISS remark type
      if (formData.iss_remark !== null && formData.iss_remark !== undefined && formData.iss_remark !== '') {
        formDataToSend.append('iss_remark', formData.iss_remark);
      }
      
      // Account codes are already included in items[i][acc_code1] above
      // No need to send separate acc_code1[] array
      
      // When status is 'Completed', send approval fields for "Issued by" (ACK user_type)
      // The backend expects these fields to update the approval record
      // Note: actual_user_id is also appended later, but we need to ensure all fields are sent
      if (action === 'Completed' || action === 'completed') {
        // Use the same user resolution logic as below to ensure consistency
        const user = currentUser || getCurrentUser() || {};
        
        // Prioritize full_name over name to get the correct logged-in user name
        const approverName = [
          user?.full_name,      // Most accurate - full name
          user?.fullName,       // Alternative full name field
          user?.name,           // Fallback to name
          user?.username,       // Username as last resort
          user?.user_name,
        ].find((value) => typeof value === 'string' && value.trim()) || '';
        
        const approverFullName = user?.full_name || user?.fullName || approverName || '';
        const approverBranch = user?.branch_short_name || user?.branch_name || user?.branch || '';
        
        // actual_user_id will be appended later, but we need these specific fields for ACK approval
        if (approverName) {
          formDataToSend.append('actual_user_name', approverName.trim());
        }
        if (approverFullName) {
          formDataToSend.append('actual_user_full_name', approverFullName.trim());
        }
        if (approverBranch) {
          formDataToSend.append('actual_user_branch', approverBranch.trim());
        }
      }
      
      const enhanceApprovalsWithAction = (approvalsList, triggeredAction) => {
        if (!triggeredAction) return approvalsList;

        const actionKey = triggeredAction.toLowerCase();
        
        const actionableKeys = ['bmapproved', 'bm approved', 'bmapprovedmem', 'checked', 'opapproved', 'proceed', 'ac_acknowledged', 'completed'];
        if (!actionableKeys.includes(actionKey)) {
          return approvalsList;
        }

        const userInfo = currentUser || getCurrentUser();
        const userName = userInfo?.full_name || userInfo?.fullName || userInfo?.name || '';
        const userFullName = userInfo?.full_name || userInfo?.fullName || '';
        const userBranch = userInfo?.branch_short_name || userInfo?.branch_name || userInfo?.branch || '';
        const nowIso = new Date().toISOString();

        let workingList = Array.isArray(approvalsList)
          ? approvalsList.map((approval) => ({ ...approval }))
          : [];

        const decorate = (approval, defaults) => {
          const label = approval.label || defaults.label;
          const role = approval.role || defaults.role;
          const userType = approval.user_type || defaults.user_type;
          const rawBase = { ...(approval.raw || {}) };

          const raw = {
            ...rawBase,
            status: defaults.status,
          };

          if (commentValue) raw.comment = commentValue;
          if (userName) raw.actual_user_name = userName;
          if (userBranch) raw.actual_user_branch = userBranch;
          raw.acted_at = nowIso;
          if (defaults.user_type) raw.user_type = defaults.user_type;

          return {
            ...approval,
            label,
            role,
            user_type: userType,
            status: defaults.status,
            acted: true,
            comment: commentValue || approval.comment || '',
            name: userName || approval.name || '',
            date: nowIso,
            acted_at: nowIso,
            actual_user_id: userInfo?.id ?? approval.actual_user_id ?? null,
            actual_user_name: userName || approval.actual_user_name || '',
            actual_user_full_name: userFullName || approval.actual_user_full_name || '',
            actual_user_branch: userBranch || approval.actual_user_branch || '',
            raw,
          };
        };

        const updateOrInsert = (defaults) => {
          let updated = false;
          workingList = workingList.map((approval) => {
            if (defaults.match(approval)) {
              updated = true;
              return decorate(approval, defaults);
            }
            return approval;
          });

          if (!updated) {
            workingList.push(
              decorate(
                {
                  label: defaults.label,
                  role: defaults.role,
                  user_type: defaults.user_type,
                },
                defaults
              )
            );
          }
        };

        if (['bmapproved', 'bm approved'].includes(actionKey)) {
          updateOrInsert({
            match: (approval) => {
              const label = (approval?.label || '').toLowerCase();
              const userType = (approval?.user_type || '').toLowerCase();
              return label.includes('bm approved') || userType === 'a1';
            },
            label: 'BM Approved by',
            role: 'BM/ABM',
            user_type: 'A1',
            status: 'BM Approved',
          });
        }

        if (['bmapprovedmem', 'checked'].includes(actionKey)) {
          updateOrInsert({
            match: (approval) => {
              const label = (approval?.label || '').toLowerCase();
              const userType = (approval?.user_type || '').toLowerCase();
              return label.includes('checked by') || userType === 'c' || userType === 'cs';
            },
            label: 'Checked by',
            role: 'Branch LP',
            user_type: 'C',
            status: 'Checked',
          });
        }

        if (['opapproved', 'proceed'].includes(actionKey)) {
          updateOrInsert({
            match: (approval) => {
              const label = (approval?.label || '').toLowerCase();
              const userType = (approval?.user_type || '').toLowerCase();
              return label.includes('operation') || userType === 'op';
            },
            label: 'Operation Mgr Approved by',
            role: 'Operation Manager',
            user_type: 'OP',
            status: 'OPApproved',
          });
        }

        if (['ac_acknowledged'].includes(actionKey)) {
          // Operation Manager acknowledgment - update OP approval
          const currentUserRole = getUserRole();
          const isOperationManager = currentUserRole === 'op_manager';
          
          if (isOperationManager) {
            updateOrInsert({
              match: (approval) => {
                const label = (approval?.label || '').toLowerCase();
                const userType = (approval?.user_type || '').toLowerCase();
                // Match user_type: 'OP' or 'A2' (Operation Manager) or label that indicates operation manager
                return (userType === 'op' || userType === 'a2') || label.includes('operation') || label.includes('op');
              },
              label: 'Acknowledged by',
              role: 'Operation Manager',
              user_type: 'OP',
              status: 'Ac_Acknowledged',
            });
          }
        }

        if (['completed'].includes(actionKey)) {
          // Check if this is Account issuing the form
          const currentUserRole = getUserRole();
          const isAccountUser = currentUserRole === 'account';
          
          if (isAccountUser) {
            // Account issues the form - update AC approval with "Issued by" label
            updateOrInsert({
              match: (approval) => {
                const label = (approval?.label || '').toLowerCase();
                const userType = (approval?.user_type || '').toLowerCase();
                // Match user_type: 'AC' (Account) or label that indicates account
                return userType === 'ac' || label.includes('account') || label.includes('acknowledge') || label.includes('issued');
              },
              label: 'Issued by',
              role: 'Branch Account',
              user_type: 'AC',
              status: 'Completed',
            });
          } else {
            // For non-account users (like supervisor), handle Completed status
            // Clear the "Checked by" name if it incorrectly has the supervisor's name
            updateOrInsert({
              match: (approval) => {
                const label = (approval?.label || '').toLowerCase();
                return label.includes('checked by');
              },
              label: 'Checked by',
              role: 'Checker',
              user_type: 'C',
              status: 'Pending',
              name: '', // Clear the name
              acted: false,
            });
            
            updateOrInsert({
              match: (approval) => {
                const label = (approval?.label || '').toLowerCase();
                return label.includes('issued by');
              },
              label: 'Issued by',
              role: 'Supervisor',
              user_type: 'ACK',
              status: 'Completed',
              // Ensure the name is set from current user
              name: userName || userInfo?.name || '',
            });
          }
        }

        return workingList;
      };
      if (formData.approvals && Array.isArray(formData.approvals)) {
        formDataToSend.append('approvals', JSON.stringify(formData.approvals));
      }

      const totalAmount = normalizedItems.reduce((acc, item) => {
        const parsed = Number(item.amount);
        return acc + (Number.isFinite(parsed) ? parsed : 0);
      }, 0);
      formDataToSend.append('total_amount', totalAmount);
      
      // Send supporting info attachments (files uploaded in SupportingInfo component)
      if (formData.attachments && Array.isArray(formData.attachments)) {
        const filesToSend = formData.attachments.filter(attachment => attachment?.fileObject instanceof File);
        if (filesToSend.length > 0) {
          console.log(`[Form Submission] Sending ${filesToSend.length} attachment(s) with key 'file1[]'`);
          filesToSend.forEach((attachment) => {
            formDataToSend.append('file1[]', attachment.fileObject);
          });
        }
      }

      const itemIds = [];
      let imageUploadCount = 0;
      
      normalizedItems.forEach((item, index) => {
        const sourceItem = items[index] || item;
        
        // Check for various possible ID fields
        const itemId = item?.id || item?.specific_form_id;
        const productCode = (() => {
          const candidates = [
            sourceItem?.product_code,
            item?.product_code,
            sourceItem?.code,
            item?.code,
          ];
          const found = candidates.find((value) => typeof value === 'string' && value.trim());
          return found ? found.trim() : '';
        })();

        if (itemId) {
          itemIds.push(itemId);
        } else if (productCode) {
          itemIds.push(productCode);
        }

        const uploadKey = productCode || itemId;

        if (uploadKey) {

          // Check if item has uploaded images with fileObject
          const imageCandidates = {
            img: sourceItem?.img ?? item?.img,
            images: sourceItem?.images ?? item?.images,
            photos: sourceItem?.photos ?? item?.photos,
            attachments: sourceItem?.attachments ?? item?.attachments,
            damage_images: sourceItem?.damage_images ?? item?.damage_images,
            originalItem: sourceItem?.originalItem ?? item?.originalItem,
          };
          
          const itemImages = extractImageArray(imageCandidates);
          
          itemImages.forEach((image, imgIndex) => {
            if (image?.fileObject instanceof File) {
              imageUploadCount++;
              formDataToSend.append(`${uploadKey}[${imgIndex}]`, image.fileObject);
            }
          });
        }
      });
      
      
      if (itemIds.length > 0) {
        formDataToSend.append('img_product', JSON.stringify(itemIds));
      }

      if (action) {
        const backendStatus = resolveBackendStatus(action);
        if (backendStatus) {
          formDataToSend.append('status', backendStatus);
        }

        const user = currentUser || getCurrentUser() || {};
        
        const resolvedUserId = user?.id
          ?? user?.user_id
          ?? user?.admin_id
          ?? user?.userId
          ?? user?.adminId
          ?? null;
        if (resolvedUserId !== null && resolvedUserId !== undefined && resolvedUserId !== '') {
          formDataToSend.append('actual_user_id', resolvedUserId);
        }

        // Prioritize full_name over name to get the correct user name
        const resolvedUserName = [
          user?.full_name,      // Most accurate - full name
          user?.fullName,       // Alternative full name field
          user?.name,           // Fallback to name
          user?.username,       // Username as last resort
          user?.user_name,
          user?.display_name,
          user?.displayName,
        ].find((value) => typeof value === 'string' && value.trim());
        
        if (resolvedUserName) {
          formDataToSend.append('actual_user_name', resolvedUserName.trim());
        }

        const resolvedFullName = [
          user?.full_name,
          user?.fullName,
          user?.name,
          user?.username,
          user?.user_name,
          user?.display_name,
          user?.displayName,
          resolvedUserName,
        ].find((value) => typeof value === 'string' && value.trim());
        if (resolvedFullName) {
          formDataToSend.append('actual_user_full_name', resolvedFullName.trim());
        }

        const userBranch = [
          user?.branch_short_name,
          user?.branchShortName,
          user?.branch_name,
          user?.branchName,
          user?.branch,
        ].find((value) => typeof value === 'string' && value.trim());
        if (userBranch) {
          formDataToSend.append('actual_user_branch', userBranch.trim());
        }

        const resolvedBranchId = user?.branch_id
          ?? user?.branchId
          ?? user?.from_branch_id
          ?? user?.fromBranchId;
        if (resolvedBranchId !== null && resolvedBranchId !== undefined && resolvedBranchId !== '') {
          formDataToSend.append('actual_user_branch_id', resolvedBranchId);
        }

      }
      
      // Ensure actual_user_branch is always sent (might be required by backend)
      if (!formDataToSend.has('actual_user_branch')) {
        const user = currentUser || getCurrentUser() || JSON.parse(localStorage.getItem('user') || '{}');
        const userBranch = user?.branch_short_name || user?.branch_name || user?.branch || 'N/A';
        formDataToSend.append('actual_user_branch', userBranch);
      }
      
      if (isExistingForm) formDataToSend.append('general_form_id', generalFormId);

      try {
        // Make the API call with detailed logging
        const response = await apiFetch(endpoint, {
          method: method,
          body: formDataToSend,
        }).catch(async (error) => {
          // If we get a response with an error status, log available error data
          if (error.response) {
            let errorData = error.data;

            if (!errorData && error.response && !error.response.bodyUsed) {
              try {
                errorData = await error.response.json();
              } catch (jsonError) {
                try {
                  errorData = await error.response.text();
                } catch (textError) {
                  errorData = null;
                }
              }
            }


            const formattedError = new Error(`HTTP error! status: ${(error.status || error.response.status)} - ${error.response.statusText}`);
            formattedError.status = error.status || error.response.status;
            formattedError.data = errorData;
            formattedError.response = error.response;
            throw formattedError;
          }
          throw error;
        });

        if (!response) {
          throw new Error(t('messages.errors.noResponse'));
        }

        // Handle successful response
        if (response && typeof response === 'object') {
          const nextStatus = response.status
            || response?.general_form?.status
            || response?.general_form?.form_status
            || formData.status;

          const normalizedNextStatus = (nextStatus || '').replace(/\s+/g, '').toLowerCase();

          // For actions that update approvals (like Completed/Issued), use backend response if available
          // Otherwise, use enhanced local approvals as fallback
          let finalApprovals;
          if (response.approvals && Array.isArray(response.approvals) && response.approvals.length > 0) {
            // Backend returned fresh approvals - use them (they have the latest data from database)
            // Ensure it's a plain array (Laravel collections might not be properly converted)
            finalApprovals = Array.isArray(response.approvals) ? [...response.approvals] : Object.values(response.approvals || {});
            
            // For "Checked" action, check if we sent a comment but backend response doesn't include 'C' approval with comment
            // This can happen with new forms where the 'C' approval might not be in the response yet
            if (action === 'Checked' || action === 'checked') {
              const commentValue = [formData.comment, formData.reason, formData.remark]
                .map((value) => (typeof value === 'string' ? value.trim() : ''))
                .find((value) => value.length > 0) || '';
              
              const cApproval = finalApprovals.find(a => a.user_type === 'C');
              const csApproval = finalApprovals.find(a => a.user_type === 'CS');
              
              // If we have a comment but no 'C' approval with comment, add/merge it
              if (commentValue && (!cApproval || !cApproval.comment)) {
                const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
                const userName = storedUser?.name || formData.requester_name || '';
                const userId = storedUser?.id || storedUser?.admin_id || formData.user_id || null;
                const branchId = storedUser?.branch_id || storedUser?.from_branch_id || formData.branch_id || null;
                
                // Get branch name
                const branchName = formData.branch_name || storedUser?.branch_name || storedUser?.from_branch_name || '';
                
                // Create or update 'C' approval with comment
                if (cApproval) {
                  // Update existing 'C' approval with comment
                  const cIndex = finalApprovals.findIndex(a => a.user_type === 'C');
                  finalApprovals[cIndex] = {
                    ...cApproval,
                    comment: commentValue,
                    actual_user_id: cApproval.actual_user_id || userId,
                    actual_user_name: cApproval.actual_user_name || userName,
                    actual_user_full_name: cApproval.actual_user_full_name || userName,
                    actual_user_branch: cApproval.actual_user_branch || branchName,
                    acted: true,
                    status: 'Checked',
                  };
                } else {
                  // Add new 'C' approval with comment (backend might not have returned it yet)
                  finalApprovals.push({
                    user_type: 'C',
                    label: 'Checked by',
                    role: 'Branch LP',
                    comment: commentValue,
                    actual_user_id: userId,
                    actual_user_name: userName,
                    actual_user_full_name: userName,
                    actual_user_branch: branchName,
                    acted: true,
                    status: 'Checked',
                    date: new Date().toISOString(),
                    acted_at: new Date().toISOString(),
                    name: userName,
                  });
                }
              }
            }
          } else {
            // Fallback to enhanced local approvals if backend didn't return them
            const baseApprovals = formData.approvals || [];
            finalApprovals = enhanceApprovalsWithAction(baseApprovals, action) || baseApprovals;
          }

          // Extract ISS remark from response if available, otherwise preserve current value
          const responseIssRemark = response?.iss_remark ?? 
                                   response?.general_form?.iss_remark ??
                                   (() => {
                                     // Check general_form_files in response for ISS remark
                                     const allFiles = [
                                       ...(Array.isArray(response?.general_form_files) ? response.general_form_files : []),
                                       ...(Array.isArray(response?.files) ? response.files : []),
                                       ...(Array.isArray(response?.general_form?.files) ? response.general_form.files : [])
                                     ];
                                     
                                     // Find ISS_DOCUMENT files - prefer the one with ISS number (from issue stage)
                                     const issFiles = allFiles.filter(f => f.file === 'ISS_DOCUMENT' || f.file_type === 'ISS_DOCUMENT');
                                     
                                     // Prefer the one with an ISS number (name field not empty) - this is from the issue stage
                                     let issFile = issFiles.find(f => f.name && f.name.trim() !== '' && f.name !== 'ISS_DOCUMENT');
                                     
                                     // If no file with ISS number found, get the most recent one
                                     if (!issFile && issFiles.length > 0) {
                                       issFiles.sort((a, b) => {
                                         if (a.id && b.id) return b.id - a.id;
                                         if (a.created_at && b.created_at) {
                                           return new Date(b.created_at) - new Date(a.created_at);
                                         }
                                         return 0;
                                       });
                                       issFile = issFiles[0];
                                     }
                                     
                                     return issFile?.reason ? String(issFile.reason) : null;
                                   })();

          // Use response items if available (they may have updated account codes), otherwise keep current items
          const responseItems = Array.isArray(response?.items) ? response.items : 
                               Array.isArray(response?.general_form?.items) ? response.general_form.items :
                               null;
          
          // Resolve attachments from response - these are the files that were uploaded and saved by the backend
          const responseAttachments = resolveInitialAttachments(response, []);
          console.log('[Form Submission] Attachments in response:', responseAttachments.length, responseAttachments);
          
          // Preserve general_form_id from response if available
          const responseGeneralFormId = response?.general_form_id 
            ?? response?.generalFormId 
            ?? response?.general_form?.id
            ?? response?.id
            ?? response?.data?.general_form_id
            ?? response?.data?.generalFormId
            ?? response?.data?.general_form?.id;
          
          console.log('[Form Submission] General Form ID:', responseGeneralFormId);
          console.log('[Form Submission] Response structure:', {
            hasAttachments: !!response?.attachments,
            hasOperationFiles: !!response?.operation_files,
            hasGeneralFormFiles: !!response?.general_form?.files,
            hasGeneralFormFiles2: !!response?.general_form_files,
          });
          
          // If no attachments in response but we have a general_form_id, fetch them from the backend
          // This is needed because files are stored separately and may not be in the submission response
          let finalAttachments = responseAttachments;
          if (responseAttachments.length === 0 && responseGeneralFormId) {
            console.log('[Form Submission] No attachments in response, fetching from get-image endpoint...');
            try {
              const token = localStorage.getItem("token");
              if (token) {
                const filesResponse = await apiFetch('/api/big-damage-issues/get-image', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                  },
                  body: JSON.stringify({
                    type: 'all', // 'all' for operation/owner uploads
                    id: responseGeneralFormId
                  })
                });
                
                console.log('[Form Submission] Files response from get-image:', filesResponse);
                const operationFilesData = filesResponse?.img || [];
                if (Array.isArray(operationFilesData) && operationFilesData.length > 0) {
                  console.log(`[Form Submission] Found ${operationFilesData.length} file(s) from get-image endpoint`);
                  finalAttachments = operationFilesData.map(file => ({
                    id: file.id || `doc_${file.file}`,
                    name: file.name || file.file,
                    file: file.file,
                    downloadUrl: `/api/public-files/${encodeURIComponent(file.file)}`,
                    previewUrl: `/api/public-files/${encodeURIComponent(file.file)}`,
                    size: file.size || null,
                    acc_type: file.acc_type || null,
                    isRemote: true, // Mark as remote file
                  }));
                } else {
                  console.log('[Form Submission] No files found in get-image response');
                }
              }
            } catch (error) {
              // Log error for debugging
              console.error('[Form Submission] Failed to fetch operation files after submission:', error);
            }
          }
          
          console.log('[Form Submission] Final attachments to save:', finalAttachments.length, finalAttachments);
          
          setFormData((prev) => {
            // Merge attachments: use fetched attachments if available, otherwise keep existing
            const mergedAttachments = finalAttachments.length > 0 
              ? finalAttachments 
              : prev.attachments;
            
            const updated = {
              ...prev,
              status: nextStatus,
              // Preserve general_form_id - critical for investigation modal
              general_form_id: responseGeneralFormId ?? prev.general_form_id ?? prev.generalFormId,
              generalFormId: responseGeneralFormId ?? prev.generalFormId ?? prev.general_form_id,
              approvals: finalApprovals, // Use backend approvals when available
              iss_remark: responseIssRemark ?? formData.iss_remark ?? prev.iss_remark, // Use response value if available, otherwise keep current
              items: responseItems ?? formData.items, // Use response items if available (they contain updated account codes)
              // Update attachments - use fetched files from backend
              attachments: mergedAttachments,
              response: {
                ...response,
                approvals: finalApprovals
              },
            };
            return updated;
          });

        }

        setSuccessMessage(t('messages.formSubmitted'));
        
        // Show success toast
        toast.success(t('messages.formSubmitted'), {
          position: 'top-right',
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
        
        // If this was a save as draft, update the URL with the new form ID
        if (response && response.id && !isEditMode) {
          window.history.replaceState({}, '', `?form_id=${response.id}`);
        }

        // Redirect to issue list page after a short delay to show the success message
        setTimeout(() => {
          // Always redirect to Big Damage Issue list page after successful form submission
          // Get the return URL from sessionStorage if available (to preserve filters/pagination)
          const storedReturnUrl = sessionStorage.getItem('bigDamageIssueReturnUrl');
          
          if (storedReturnUrl) {
            // Clear the stored URL after using it
            sessionStorage.removeItem('bigDamageIssueReturnUrl');
            
            // Extract pathname and search from the stored URL
            const urlParts = storedReturnUrl.split('?');
            const pathname = urlParts[0] || '/big-damage-issue';
            const search = urlParts[1] ? `?${urlParts[1]}` : '';
            
            // Navigate with search params to preserve filters/pagination
            navigate(pathname + search, { replace: true });
          } else {
            // Fallback: Navigate to default Big Damage Issue list page
            navigate('/big-damage-issue', { replace: true });
          }
        }, 1500);

        return response;
      } catch (apiError) {
        let errorMessage = t('messages.errors.formSubmitFailed');
        
        if (apiError.status === 404) {
          errorMessage = t('messages.errors.notFound');
        } else if (apiError.status === 401) {
          errorMessage = t('messages.errors.sessionExpired');
          // Redirect to login
          window.location.href = '/login';
          return; // Stop further execution
        } else if (apiError.status === 403) {
          errorMessage = t('messages.errors.forbidden');
        } else if (apiError.status === 422) {
          // Validation error - show the exact error message from server
          errorMessage = apiError.message || t('messages.errors.validationError');
        } else if (apiError.status === 500) {
          errorMessage = t('messages.errors.serverError');
        } else if (apiError.status === 503) {
          errorMessage = t('messages.errors.serverUnavailable');
        } else if (apiError.name === 'TypeError' && apiError.message.includes('fetch')) {
          errorMessage = t('messages.errors.networkError');
        } else if (apiError.data && apiError.data.message) {
          errorMessage = apiError.data.message;
        } else if (apiError.message) {
          // Check if it's a known error message, otherwise use the message as-is
          if (apiError.message.includes('token') || apiError.message.includes('authentication')) {
            errorMessage = t('messages.errors.authTokenNotFound');
          } else if (apiError.message.includes('timeout')) {
            errorMessage = t('messages.errors.timeout');
          } else if (apiError.message.includes('network') || apiError.message.includes('Failed to fetch')) {
            errorMessage = t('messages.errors.networkError');
          } else {
            errorMessage = apiError.message;
          }
        } else {
          errorMessage = t('messages.errors.unknownError');
        }
        
        setError(errorMessage);
        setSuccessMessage('');
        
        // Show error toast
        toast.error(errorMessage, {
          position: 'top-right',
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
        
        throw apiError; // Re-throw to be caught by the outer catch
      }
    } catch (error) {
      let errorMessage = t('messages.errors.unknownError');
      
      // Handle specific error types
      if (error.message) {
        if (error.message.includes('token') || error.message.includes('authentication')) {
          errorMessage = t('messages.errors.authTokenNotFound');
        } else if (error.message.includes('network') || error.message.includes('Failed to fetch')) {
          errorMessage = t('messages.errors.networkError');
        } else if (error.message.includes('timeout')) {
          errorMessage = t('messages.errors.timeout');
        } else if (error.message.includes('Invalid') || error.message.includes('invalid')) {
          errorMessage = t('messages.errors.invalidResponse');
        } else {
          // Use the error message if it's already user-friendly, otherwise use generic message
          errorMessage = error.message || errorMessage;
        }
      }
      
      setError(errorMessage);
      setSuccessMessage('');
      
      // Show error toast
      toast.error(errorMessage, {
        position: 'top-right',
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
      
      throw error;
    } finally {
      setIsSubmitting(false);
    }

  };

  // Determine which buttons to show based on user role and form status
  const showApproveButton = () => {
    if (!formData.status) {
      console.log('[showApproveButton] No status - returning false');
      return false;
    }

    const role = userRole?.toLowerCase?.() || '';
    // Normalize status by trimming and removing extra spaces
    const status = (formData.status || '').toString().trim();
    const normalizedStatus = status.replace(/\s+/g, ' '); // Normalize multiple spaces to single space
    
    // Get total amount to check if Operation Manager approval is required
    const totalAmount = Number(
      formData?.general_form?.total_amount
      ?? formData?.total_amount
      ?? formData?.general_form?.totalAmount
      ?? formData?.totalAmount
      ?? 0
    );
    const requiresOpManagerApproval = totalAmount > 500000;
    
    console.log('[showApproveButton] Starting:', {
      role,
      status,
      normalizedStatus,
      totalAmount,
      requiresOpManagerApproval,
      isAccount
    });
    
    // EARLY RETURN: For account users with forms > 500000, check Operation Manager approval first
    // This is a critical check - account users should NEVER see approve button if OP Manager hasn't approved
    if ((isAccount || role === 'account') && requiresOpManagerApproval) {
      const approvals = Array.isArray(formData?.approvals) ? formData.approvals : [];
      const opManagerApproval = approvals.find(approval => {
        const userType = (approval?.user_type || approval?.raw?.user_type || '').toLowerCase();
        return userType === 'op' || userType === 'a2';
      });
      
      // Check if Operation Manager approval is pending
      const opApprovalStatus = opManagerApproval?.status || opManagerApproval?.raw?.status || '';
      const hasActualUser = opManagerApproval?.actual_user_id || 
                           opManagerApproval?.raw?.actual_user_id ||
                           opManagerApproval?.actual_user_name ||
                           opManagerApproval?.raw?.actual_user_name ||
                           opManagerApproval?.acted;
      const isOpApprovalPending = opApprovalStatus.toLowerCase() === 'pending' || !hasActualUser;
      
      // Check if status indicates Operation Manager has approved/acknowledged
      const isOPApproved = normalizedStatus === 'OPApproved' || 
                          normalizedStatus === 'OP Approved' ||
                          normalizedStatus.toLowerCase() === 'opapproved' ||
                          normalizedStatus.toLowerCase() === 'op approved';
      const isAcknowledged = normalizedStatus === 'Ac_Acknowledged' || 
                            normalizedStatus === 'Acknowledged';
      const opManagerHasApprovedOrAcknowledged = isOPApproved || isAcknowledged;
      
      // CRITICAL: If Operation Manager approval is pending OR status doesn't indicate OP has approved/acknowledged, hide button
      // This ensures account users can NEVER approve before Operation Manager
      // If status is Ac_Acknowledged, it means OP has already acknowledged, so allow button
      if (isOpApprovalPending && !isAcknowledged) {
        return false; // Force return false - do not proceed to other checks
      }
      
      // If status is Ac_Acknowledged, allow button to show (OP has acknowledged)
      if (isAcknowledged) {
        console.log('[showApproveButton] Status is Ac_Acknowledged - allowing button to show');
        // Status indicates acknowledgment - allow button to show
        // Continue to normal flow below
      } else if (!opManagerHasApprovedOrAcknowledged) {
        console.log('[showApproveButton] Status does not indicate OP approval - returning false');
        return false; // Status doesn't indicate OP approval/acknowledgment
      }
      
      // If we reach here, Operation Manager has approved and status is OPApproved
      // Continue to normal flow below
    }

    let result = false;

    if ((role === 'bm' || role === 'abm') && (status === 'Ongoing' || status === 'Checked')) {
      result = true;
    } else if (['branch_lp', 'checker', 'cs', 'loss prevention'].includes(role) && status === 'Ongoing') {
      result = true;
    } else if ((isOpManager || role === 'op_manager') && (normalizedStatus === 'BM Approved' || normalizedStatus === 'BMApproved' || normalizedStatus === 'Checked')) {
      // Operation Manager should see approve button when:
      // 1. Form status is "BM Approved" or "Checked"
      // 2. AND amount > 500000 (Operation Manager approval is required)
      // This allows OP Manager to approve forms that exceed 500000
      if (requiresOpManagerApproval) {
        result = true; // Show approve button for OP Manager when amount > 500000 and status is BM Approved/Checked
      } else {
      }
    } else if ((role === 'bm' || role === 'abm') && (normalizedStatus === 'BM Approved' || normalizedStatus === 'BMApproved')) {
      // BM/ABM can also see approve button at BM Approved status (for re-approval or other actions)
      result = true;
    } else if (isAccount || role === 'account') {
      // Account can only acknowledge after proper approval stage:
      // - If amount > 500000: Must wait for OPApproved (Operation Manager approval)
      // - If amount <= 500000: Can acknowledge at BM Approved (no Operation Manager stage)
      
      // Check if Operation Manager has actually approved by checking approvals array
      const approvals = Array.isArray(formData?.approvals) ? formData.approvals : [];
      const opManagerApproval = approvals.find(approval => {
        const userType = (approval?.user_type || approval?.raw?.user_type || '').toLowerCase();
        return userType === 'op' || userType === 'a2';
      });
      
      // Check if status indicates BM Approved (case-insensitive, handles variations)
      const isBMApproved = normalizedStatus.toLowerCase() === 'bm approved' || 
                          normalizedStatus === 'BMApproved' ||
                          normalizedStatus.toLowerCase() === 'bmapproved';
      
      // Check if status indicates OP Approved (case-insensitive, handles variations)
      const isOPApproved = normalizedStatus === 'OPApproved' || 
                          normalizedStatus === 'OP Approved' ||
                          normalizedStatus.toLowerCase() === 'opapproved' ||
                          normalizedStatus.toLowerCase() === 'op approved';
      
      // Check if status indicates Ac_Acknowledged (Operation Manager has acknowledged)
      const isAcknowledged = normalizedStatus === 'Ac_Acknowledged' || 
                            normalizedStatus === 'Acknowledged';
      
      // Define variables in broader scope for logging
      let opApprovalStatus = '';
      let isOpApprovalPending = false;
      let opManagerHasApproved = false;
      
      if (requiresOpManagerApproval) {
        // Amount exceeds 500000 - must wait for Operation Manager approval
        // Check if Operation Manager approval exists and is still pending
        opApprovalStatus = opManagerApproval?.status || opManagerApproval?.raw?.status || '';
        isOpApprovalPending = opApprovalStatus.toLowerCase() === 'pending' || 
                                   (!opManagerApproval?.actual_user_id && 
                                    !opManagerApproval?.raw?.actual_user_id &&
                                    !opManagerApproval?.actual_user_name &&
                                    !opManagerApproval?.raw?.actual_user_name &&
                                    !opManagerApproval?.acted);
        
        // Operation Manager has approved if:
        // 1. Status is OPApproved/OP Approved, OR
        // 2. Status is Ac_Acknowledged/Acknowledged (OP has acknowledged), OR
        // 3. There's an OP approval entry with actual_user_id or actual_user_name (has been acted upon)
        opManagerHasApproved = isOPApproved || isAcknowledged ||
          (opManagerApproval && !isOpApprovalPending && (
            opManagerApproval.actual_user_id || 
            opManagerApproval.raw?.actual_user_id ||
            opManagerApproval.actual_user_name ||
            opManagerApproval.raw?.actual_user_name ||
            opManagerApproval.acted ||
            (opManagerApproval.status && opManagerApproval.status !== 'Pending' && opManagerApproval.status !== 'pending')
          ));
        
        // Only show button if Operation Manager has actually approved/acknowledged
        // If status is Ac_Acknowledged, allow button to show
        if (isAcknowledged) {
          result = true; // Status indicates acknowledgment - show button
        } else if (isBMApproved || isOpApprovalPending) {
          result = false; // Explicitly false - must wait for OP approval
        } else {
          result = opManagerHasApproved;
        }
      } else {
        // Amount <= 500000 - can acknowledge at BM Approved (no Operation Manager stage needed)
        result = isBMApproved;
      }
      
      // Debug logging for account button visibility
      console.log('[showApproveButton] Account user final result:', {
        result,
        isBMApproved,
        isOPApproved,
        isAcknowledged,
        isOpApprovalPending,
        opManagerHasApproved,
        requiresOpManagerApproval,
        normalizedStatus
      });
    }
    // Supervisor should NOT see approve button - they have a separate Issue button
    console.log('[showApproveButton] Final result:', result);
    return result;
  };

  const showRejectButton = () => {
    if (!formData.status) return false;
    
    const role = userRole;
    const status = formData.status;
    
    if ((role === 'bm' || role === 'abm') && (status === 'Ongoing' || status === 'Checked')) {
      return true;
    }
    
    if (role === 'op_manager' && status === 'BM Approved') {
      return true;
    }
    
    return false;
  };

const resolveApproveAction = () => {
  const role = getUserRole();
  const status = (formData.status || '').toString().trim();
  const normalizedStatus = status.replace(/\s+/g, ' '); // Normalize multiple spaces to single space
  
  // Get total amount to check if Operation Manager approval is required
  const totalAmount = Number(
    formData?.general_form?.total_amount
    ?? formData?.total_amount
    ?? formData?.general_form?.totalAmount
    ?? formData?.totalAmount
    ?? 0
  );
  const requiresOpManagerApproval = totalAmount > 500000;
  
  console.log('[resolveApproveAction] Starting:', {
    role,
    status,
    normalizedStatus,
    totalAmount,
    requiresOpManagerApproval,
    isAccount,
    actionsApprove: actions?.approve
  });
  
  // Resolve approve action
  if (role === 'branch_lp' && normalizedStatus === 'Ongoing') {
    return 'BMApprovedMem';
  }

  // Only use actions.approve if it's valid for the current user and status
  if (actions?.approve) {
    const actionRole = getUserRole();
    const actionStatus = (formData.status || '').toString().trim();
    const normalizedActionStatus = actionStatus.replace(/\s+/g, ' ');
    
    // Validate that the action from backend is appropriate for current user/status
    // For account users, only allow Completed (shows as "Issue") after proper approval stage
    if (isAccount || actionRole === 'account') {
      if (requiresOpManagerApproval) {
        // Amount > 500000 - must check if Operation Manager has acknowledged
        // Check approvals array to see if Operation Manager has acknowledged
        const approvals = Array.isArray(formData?.approvals) ? formData.approvals : [];
        const opManagerApproval = approvals.find(approval => {
          const userType = (approval?.user_type || approval?.raw?.user_type || '').toLowerCase();
          return userType === 'op' || userType === 'a2';
        });
        
        // Check if status indicates Ac_Acknowledged (Operation Manager has acknowledged)
        const isAcknowledged = normalizedActionStatus === 'Ac_Acknowledged' || 
                            normalizedActionStatus === 'Acknowledged' ||
                            normalizedActionStatus === 'OPApproved' ||
                            normalizedActionStatus === 'OP Approved';
        
        // If status is Ac_Acknowledged or Acknowledged, allow Issue button regardless of approval entry
        // The status itself indicates that Operation Manager has acknowledged
        if (isAcknowledged) {
          // Status indicates acknowledgment - allow Issue button
          return 'Completed'; // Return Completed to show Issue button
        }
        
        // If status is not Ac_Acknowledged, check approval entry
        // Check if Operation Manager approval exists and is still pending
        const opApprovalStatus = opManagerApproval?.status || opManagerApproval?.raw?.status || '';
        const isOpApprovalPending = opApprovalStatus.toLowerCase() === 'pending' || 
                                   (!opManagerApproval?.actual_user_id && 
                                    !opManagerApproval?.raw?.actual_user_id &&
                                    !opManagerApproval?.actual_user_name &&
                                    !opManagerApproval?.raw?.actual_user_name &&
                                    !opManagerApproval?.acted);
        
        // Check if Operation Manager has actually acknowledged via approval entry
        const opManagerHasAcknowledged = opManagerApproval && !isOpApprovalPending && (
          opManagerApproval.actual_user_id || 
          opManagerApproval.raw?.actual_user_id ||
          opManagerApproval.actual_user_name ||
          opManagerApproval.raw?.actual_user_name ||
          opManagerApproval.acted ||
          (opManagerApproval.status && opManagerApproval.status !== 'Pending' && opManagerApproval.status !== 'pending')
        );
        
        // If status is Ac_Acknowledged, return Completed directly (don't wait for backend action)
        // This ensures Issue button shows even if backend doesn't return the correct action
        if (isAcknowledged) {
          console.log('[resolveApproveAction] Status is Ac_Acknowledged - returning Completed');
          return 'Completed'; // Return Completed to show Issue button
        }
        
        // Only allow Completed (Issue) if Operation Manager has acknowledged via approval entry
        if (opManagerHasAcknowledged && 
            (actions.approve === 'Completed' || actions.approve === 'completed')) {
          return actions.approve;
        }
        // Don't use backend action if Operation Manager hasn't acknowledged or is still pending
        return null;
      } else {
        // Amount <= 500000 - allow Completed (Issue) at BM Approved
        const isBMApproved = normalizedActionStatus.toLowerCase() === 'bm approved' || 
                            normalizedActionStatus === 'BMApproved' ||
                            normalizedActionStatus.toLowerCase() === 'bmapproved';
        if (isBMApproved && 
            (actions.approve === 'Completed' || actions.approve === 'completed')) {
          return actions.approve;
        }
      }
    }
    
    // For non-account users, validate the action from backend
    if (!isAccount && actionRole !== 'account') {
      // If backend returns OPApproved for op_manager, validate it's appropriate
      if ((isOpManager || actionRole === 'op_manager') && 
          (actions.approve === 'OPApproved' || actions.approve === 'opapproved' || actions.approve === 'Proceed')) {
        // Validate that status and amount are correct for OP Manager approval
        const normalizedActionStatus = (status || '').toString().trim().replace(/\s+/g, ' ');
        const isBMApprovedOrChecked = normalizedActionStatus === 'BM Approved' || 
                                      normalizedActionStatus === 'BMApproved' ||
                                      normalizedActionStatus === 'Checked';
        if (isBMApprovedOrChecked && requiresOpManagerApproval) {
          return 'OPApproved';
        }
      }
      // For other actions or users, use backend action directly
      return actions.approve;
    }
  }

  if ((role === 'bm' || role === 'abm' || role === 'bm_abm') && (normalizedStatus === 'Ongoing' || normalizedStatus === 'Checked')) {
    return 'BMApproved';
  }

  // Check if user is op_manager (by role OR by approval user_type)
  // Operation Manager should only approve if amount > 500000
  const isOpManagerCheck = isOpManager || role === 'op_manager';
  const statusMatches = normalizedStatus === 'BM Approved' || normalizedStatus === 'BMApproved' || normalizedStatus === 'Checked';
  
  if (isOpManagerCheck && statusMatches) {
    if (requiresOpManagerApproval) {
      return 'OPApproved';
    } else {
    }
  }

  // Check if user is account (by role OR by approval user_type)
  // Account can only acknowledge after proper approval stage:
  // - If amount > 500000: Must wait for OPApproved (Operation Manager approval)
  // - If amount <= 500000: Can acknowledge at BM Approved (no Operation Manager stage)
  if (isAccount || role === 'account') {
    // Normalize status
    const normalizedStatus = (status || '').toString().trim().replace(/\s+/g, ' ');
    const isBMApproved = normalizedStatus.toLowerCase() === 'bm approved' || 
                        normalizedStatus === 'BMApproved' ||
                        normalizedStatus.toLowerCase() === 'bmapproved';
    const isOPApproved = normalizedStatus === 'OPApproved' || 
                        normalizedStatus === 'OP Approved' ||
                        normalizedStatus.toLowerCase() === 'opapproved' ||
                        normalizedStatus.toLowerCase() === 'op approved';
    
    if (requiresOpManagerApproval) {
      // Amount exceeds 500000 - must check if Operation Manager has actually approved
      // Check approvals array to see if Operation Manager has approved
      const approvals = Array.isArray(formData?.approvals) ? formData.approvals : [];
      const opManagerApproval = approvals.find(approval => {
        const userType = (approval?.user_type || approval?.raw?.user_type || '').toLowerCase();
        return userType === 'op' || userType === 'a2';
      });
      
      // Check if Operation Manager approval exists and is still pending
      const opApprovalStatus = opManagerApproval?.status || opManagerApproval?.raw?.status || '';
      const isOpApprovalPending = opApprovalStatus.toLowerCase() === 'pending' || 
                                 (!opManagerApproval?.actual_user_id && 
                                  !opManagerApproval?.raw?.actual_user_id &&
                                  !opManagerApproval?.actual_user_name &&
                                  !opManagerApproval?.raw?.actual_user_name &&
                                  !opManagerApproval?.acted);
      
      // Check if Operation Manager has actually approved
      const opManagerHasApproved = isOPApproved ||
        (opManagerApproval && !isOpApprovalPending && (
          opManagerApproval.actual_user_id || 
          opManagerApproval.raw?.actual_user_id ||
          opManagerApproval.actual_user_name ||
          opManagerApproval.raw?.actual_user_name ||
          opManagerApproval.acted ||
          (opManagerApproval.status && opManagerApproval.status !== 'Pending' && opManagerApproval.status !== 'pending')
        ));
      
      // Only return action if Operation Manager has acknowledged
      // Do NOT return action if Operation Manager approval is still pending
      // Check if status indicates Operation Manager has acknowledged
      const isAcknowledged = normalizedStatus === 'Ac_Acknowledged' || 
                            normalizedStatus === 'Acknowledged' ||
                            normalizedStatus === 'OPApproved' ||
                            normalizedStatus === 'OP Approved';
      const opManagerHasAcknowledged = isAcknowledged || (opManagerHasApproved && !isOpApprovalPending);
      
      console.log('[resolveApproveAction] Account user fallback check:', {
        isAcknowledged,
        opManagerHasApproved,
        isOpApprovalPending,
        opManagerHasAcknowledged,
        normalizedStatus
      });
      
      if (opManagerHasAcknowledged) {
        console.log('[resolveApproveAction] Returning Completed from fallback logic');
        return 'Completed'; // Changed from Ac_Acknowledged to Completed (shows as "Issue")
      }
      // Return null if Operation Manager hasn't acknowledged or is still pending
      console.log('[resolveApproveAction] Returning null - OP Manager has not acknowledged');
      return null;
    } else {
      // Amount <= 500000 - can issue at BM Approved
      if (isBMApproved) {
        return 'Completed'; // Changed from Ac_Acknowledged to Completed (shows as "Issue")
      }
    }
    // Return null for account if conditions don't match
    return null;
  }

  // Supervisor step removed - Operation Manager now acknowledges and form goes directly to Completed
  // Removed supervisor logic

  if (status === 'Ongoing' || status === '') {
    return 'BMApproved';
  }

  return null;
};

  // Rocket Loader component
  const BoxesLoader = () => (
    <div className="loading-overlay">
      <div className="loader">
        <span>
          <span></span>
          <span></span>
          <span></span>
          <span></span>
        </span>
        <div className="base">
          <span></span>
          <div className="face"></div>
        </div>
      </div>
      <div className="longfazers">
        <span></span>
        <span></span>
        <span></span>
        <span></span>
      </div>
      <div className="loading-text">Loading</div>
    </div>
  );

  return (
    <div className="mx-auto p-4 sm:p-4 bg-gray-50 min-h-screen space-y-4 sm:space-y-4 font-sans">
      <ToastContainer position="top-right" autoClose={5000} />
      
      {isSubmitting && <BoxesLoader />}
      
      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}
      
      {successMessage && (
        <div className="alert alert-success" role="alert">
          {successMessage}
        </div>
      )}
      
      {(() => {
        // Resolve remark type label from iss_remark value and issue_remarks options
        let remarkTypeLabel = '';
        if (formData.iss_remark && formData.issue_remarks && formData.issue_remarks.length > 0) {
          // Try to find the remark by value (ID)
          const matchedRemark = formData.issue_remarks.find(
            option => option.value === formData.iss_remark || 
            String(option.value) === String(formData.iss_remark) ||
            option.id === formData.iss_remark ||
            String(option.id) === String(formData.iss_remark)
          );
          
          if (matchedRemark) {
            remarkTypeLabel = matchedRemark.label || matchedRemark.name || matchedRemark.remark_name || '';
          } else {
            // If not found by ID, check if iss_remark is already a name/label
            const nameMatch = formData.issue_remarks.find(
              option => option.label === formData.iss_remark ||
              option.name === formData.iss_remark ||
              option.remark_name === formData.iss_remark ||
              String(option.label).toLowerCase() === String(formData.iss_remark).toLowerCase()
            );
            if (nameMatch) {
              remarkTypeLabel = nameMatch.label || nameMatch.name || nameMatch.remark_name || '';
            } else if (formData.iss_remark && formData.iss_remark !== 'ISS_DOCUMENT' && !formData.iss_remark.match(/^\d+$/)) {
              // If it's not a number and not ISS_DOCUMENT, it might already be the label
              remarkTypeLabel = formData.iss_remark;
            }
          }
        }
        
        return (
          <DamageFormHeader
            formData={formData}
            setFormData={setFormData}
            onAddItem={handleAddItem}
            onOpenInvestigationForm={handleOpenModal}
            mode={mode}
            hasInvestigation={hasInvestigation}
            remarkTypeLabel={remarkTypeLabel}
            isCompleted={formData.status === 'Completed'}
            userRoleOverride={userRole}
            statusOverride={formData.status}
            onDownloadPdf={handleDownloadPdf}
          />
        );
      })()}

      <InvestigationFormModal 
        isOpen={isModalOpen} 
        onClose={handleCloseModal}
        formData={formData}
        userRole={userRole}
        initialData={initialData}
        onSave={(savedData) => {
          // Update formData with saved investigation data
          if (savedData && savedData.investigation) {
            const investigationData = savedData.investigation;
            setFormData(prev => ({
              ...prev,
              investigation: investigationData,
              general_form: {
                ...prev.general_form,
                investigation: investigationData,
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
        />
      )}

      {/* Add Product Modal for Ongoing stage */}
      {isAddProductModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div 
            className="absolute inset-0 bg-black/50 modal-backdrop" 
            onClick={handleCloseAddProductModal}
          />
          <div className="relative bg-white rounded-lg shadow-xl w-11/12 max-w-4xl max-h-[90vh] overflow-y-auto modal-expandable">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
              <h3 className="text-lg font-semibold text-gray-800">Add Product</h3>
              <button
                onClick={handleCloseAddProductModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6">
              <DamageAddProduct 
                branchName={formData.branch} 
                onSearch={(productCode, caseType) => {
                  handleSearchProduct(productCode, caseType, () => {
                    // Close modal after successful product addition
                    handleCloseAddProductModal();
                  });
                }}
                isSearching={isSearching}
              />
            </div>
          </div>
        </div>
      )}

      {dupModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDupModal({ open: false, code: '' })} />
          <div className="relative bg-white rounded-lg shadow-xl w-11/12 max-w-sm p-5">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Duplicate Product</h3>
            <p className="text-sm text-gray-600 mb-4">The product code <span className="font-mono font-semibold">{dupModal.code}</span> is already added.</p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setDupModal({ open: false, code: '' })}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm"
              >
                OK
              </button> 
            </div>
          </div>
        </div>
      )}

      {notFoundModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setNotFoundModal({ open: false, code: '' })} />
          <div className="relative bg-white rounded-lg shadow-xl w-11/12 max-w-sm p-5">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Product Not Found</h3>
            <p className="text-sm text-gray-600 mb-4">We couldn't find any data for product code <span className="font-mono font-semibold">{notFoundModal.code}</span>.</p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setNotFoundModal({ open: false, code: '' })}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      <DamageItemTable
        items={formData.items || []}
        mode={mode}
        status={(formData.status || formData.general_form?.status || initialData?.status || initialData?.general_form?.status || 'Ongoing').toString().trim()}
        onItemsChange={handleItemsChange}
        onItemChange={handleItemFieldChange}
        generalFormId={initialData?.generalFormId}
        onRemoveItem={handleRemoveItem}
        total={totalAmount}
        userRole={userRole}
        isAccount={isAccount}
        isSupervisor={userRole === 'supervisor'}
        itemErrors={formData.itemErrors || {}}
        isCompleted={formData.status === 'Completed' || formData.status === 'Issued' || formData.status === 'SupervisorIssued'}
        accountCodes={formData.account_codes || []}
        issueRemarks={formData.issue_remarks || []}
        issRemark={formData.iss_remark ?? ''}
        systemQtyUpdated={Boolean(formData.systemQtyUpdated)}
        approvals={formData.approvals || []}
        totalAmount={totalAmount}
        gRemark={formData.g_remark || initialData?.g_remark || initialData?.general_form?.g_remark || 'big_damage'}
        currentUser={currentUser}
        onOpenAddProductModal={handleOpenAddProductModal}
        onSystemQtyStatusChange={async (updated) => {
          if (!updated) return;
          setFormData((prev) => ({
            ...prev,
            systemQtyUpdated: true,
          }));
          
          // Refetch form data to get updated system_qty values after account updates
          // This ensures supervisor sees the updated system_qty values at Ac_Acknowledged stage
          if (initialData?.generalFormId) {
            try {
              const { apiRequest } = await import('../../utils/api');
              // Use the correct endpoint that returns all items for the form
              // Add cache-busting timestamp to ensure we get fresh data
              const timestamp = new Date().getTime();
              const response = await apiRequest(`/api/general-forms/${initialData.generalFormId}/big-damage-issues?per_page=100&_t=${timestamp}`);
              
              if (response.ok) {
                const updatedData = await response.json();
                
                // The API returns paginated data with items in data array
                let updatedItems = [];
                
                if (Array.isArray(updatedData?.data)) {
                  updatedItems = updatedData.data;
                } else if (Array.isArray(updatedData)) {
                  updatedItems = updatedData;
                } else if (updatedData?.big_damage_issue) {
                  updatedItems = Array.isArray(updatedData.big_damage_issue) 
                    ? updatedData.big_damage_issue 
                    : [updatedData.big_damage_issue];
                }
                
                if (updatedItems.length > 0) {
                  // First, filter out soft-deleted items (where deleted_at is not null)
                  const activeItems = updatedItems.filter(item => {
                    const isDeleted = item.deleted_at !== null && item.deleted_at !== undefined;
                    return !isDeleted;
                  });
                  
                  // Remove duplicates by ID (not product_code, since same product can appear multiple times)
                  // Keep only unique items by their ID - use more aggressive deduplication
                  const itemsById = new Map();
                  const seenIds = new Set();
                  
                  activeItems.forEach(item => {
                    const itemId = item.id || item.specific_form_id;
                    if (itemId) {
                      const idStr = String(itemId);
                      // If we've already seen this ID, skip it (prevent duplicates)
                      if (seenIds.has(idStr)) {
                        return; // Skip duplicate
                      }
                      seenIds.add(idStr);
                      itemsById.set(idStr, item);
                    }
                  });
                  
                  // Sort by ID to ensure consistent order
                  const uniqueItems = Array.from(itemsById.values()).sort((a, b) => {
                    const idA = a.id || a.specific_form_id || 0;
                    const idB = b.id || b.specific_form_id || 0;
                    return idA - idB;
                  });
                  
                  // Transform items to match expected format
                  const transformedItems = uniqueItems.map(item => {
                    const rawSystemQty = item.system_qty;
                    const transformedSystemQty = Number(rawSystemQty ?? 0);
                    
                    // Get category from multiple possible sources
                    const categoryName = item.categories?.name || 
                                       item.product_category_name || 
                                       item.category ||
                                       item.Category_Name ||
                                       '';
                    
                    // Get category_id from multiple possible sources
                    const categoryId = item.product_category_id || 
                                     item.category_id || 
                                     item.maincatid || 
                                     null;

                    // Preserve account codes from multiple possible sources
                    const accCode1 = item.acc_code1 ?? item.acc_code ?? null;
                    const accCode = item.acc_code ?? item.acc_code1 ?? null;

                    return {
                      id: item.id,
                      specific_form_id: item.id,
                      category: categoryName,
                      category_id: categoryId,
                      product_category_id: categoryId, // Also include as product_category_id for consistency
                      code: item.product_code || '',
                      name: item.product_name || '',
                      unit: item.unit || '',
                      system_qty: transformedSystemQty, // This should now have the updated value
                      request_qty: Number(item.request_qty ?? 0),
                      final_qty: Number(item.final_qty ?? 0),
                      actual_qty: Number(item.product_type ?? item.actual_qty ?? item.final_qty ?? 0),
                      price: Number(item.price ?? 0),
                      amount: Number(item.total ?? item.amount ?? 0),
                      total: Number(item.total ?? item.amount ?? 0),
                      remark: item.remark || '',
                      acc_code: accCode,
                      acc_code1: accCode1,
                      img: item.img || item.images || [],
                      images: item.images || item.img || [],
                    };
                  });
                  
                  // Replace items completely (don't append) - only update via setFormData
                  // Don't call handleItemsChange as it will cause duplicate updates
                  // Also ensure we're not duplicating by checking existing items
                  setFormData((prev) => {
                    // Remove duplicates by ID before setting - use a more robust deduplication
                    const itemsById = new Map();
                    
                    // First pass: collect all items by ID
                    transformedItems.forEach(item => {
                      const id = item.id || item.specific_form_id;
                      if (id) {
                        const idStr = String(id);
                        // If we already have this ID, compare and keep the one with more recent data
                        const existing = itemsById.get(idStr);
                        if (!existing) {
                          itemsById.set(idStr, item);
                        } else {
                          // Keep the one with higher ID or more complete data
                          const existingId = existing.id || existing.specific_form_id || 0;
                          const currentId = item.id || item.specific_form_id || 0;
                          if (currentId > existingId) {
                            itemsById.set(idStr, item);
                          }
                        }
                      }
                    });
                    
                    // Convert to array and sort by ID for consistency
                    const uniqueItems = Array.from(itemsById.values()).sort((a, b) => {
                      const idA = a.id || a.specific_form_id || 0;
                      const idB = b.id || b.specific_form_id || 0;
                      return idA - idB;
                    });
                    
                    // Log for debugging (can be removed later)
                    if (uniqueItems.length !== transformedItems.length) {
                      console.warn('Deduplication removed duplicates:', {
                        original: transformedItems.length,
                        unique: uniqueItems.length,
                        duplicates: transformedItems.length - uniqueItems.length
                      });
                    }
                    
                    return {
                      ...prev,
                      items: uniqueItems,
                    };
                  });
                }
              }
            } catch (error) {
              // Silently handle error
            }
          }
        }}
        onAccountSettingsChange={(settings) => {
          setFormData((prev) => ({
            ...prev,
            ...settings,
          }));
        }}
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

      {mode === 'add' && (
        <div className="flex justify-end mt-2">
        </div>
      )}

      {/* ISS Remark Type and ISS Number Display */}
      {(() => {
        // Resolve remark type label from iss_remark value and issue_remarks options
        let remarkTypeLabel = '';
        if (formData.iss_remark && formData.issue_remarks && formData.issue_remarks.length > 0) {
          // Try to find the remark by value (ID)
          const matchedRemark = formData.issue_remarks.find(
            option => option.value === formData.iss_remark || 
            String(option.value) === String(formData.iss_remark) ||
            option.id === formData.iss_remark ||
            String(option.id) === String(formData.iss_remark)
          );
          
          if (matchedRemark) {
            remarkTypeLabel = matchedRemark.label || matchedRemark.name || matchedRemark.remark_name || '';
          } else {
            // If not found by ID, check if iss_remark is already a name/label
            const nameMatch = formData.issue_remarks.find(
              option => option.label === formData.iss_remark ||
              option.name === formData.iss_remark ||
              option.remark_name === formData.iss_remark ||
              String(option.label).toLowerCase() === String(formData.iss_remark).toLowerCase()
            );
            if (nameMatch) {
              remarkTypeLabel = nameMatch.label || nameMatch.name || nameMatch.remark_name || '';
            } else if (formData.iss_remark && formData.iss_remark !== 'ISS_DOCUMENT' && !formData.iss_remark.match(/^\d+$/)) {
              // If it's not a number and not ISS_DOCUMENT, it might already be the label
              remarkTypeLabel = formData.iss_remark;
            }
          }
        }

        // Extract ISS numbers from multiple possible sources
        const rawIssEntries = formData.iss_numbers || formData.issNumbers || [];
        
        // Also check general_form_files for ISS_DOCUMENT files
        const issFilesFromGeneralForm = Array.isArray(formData.general_form_files)
          ? formData.general_form_files.filter(file => file.file === 'ISS_DOCUMENT' || file.file_type === 'ISS_DOCUMENT')
          : [];
        
        const issFilesFromFiles = Array.isArray(formData.files)
          ? formData.files.filter(file => file.file === 'ISS_DOCUMENT' || file.file_type === 'ISS_DOCUMENT')
          : [];
        
        // Combine all sources
        const allIssSources = [
          ...rawIssEntries,
          ...issFilesFromGeneralForm,
          ...issFilesFromFiles
        ];
        
        const issNumbers = allIssSources
          .map((entry) => {
            if (!entry) return null;
            // If it's already a string (from backend resolveIssNumbers), use it directly
            if (typeof entry === 'string') return entry.trim();
            // If it's an object, extract the name field
            if (typeof entry === 'object') {
              const value = entry.name || entry.file || entry.document_no || entry.doc_no || '';
              return typeof value === 'string' && value !== 'ISS_DOCUMENT' ? value.trim() : null;
            }
            return null;
          })
          .filter(Boolean)
          // Remove duplicates
          .filter((value, index, self) => self.indexOf(value) === index);

        // Only show if we have at least one of them
        if (remarkTypeLabel || issNumbers.length > 0) {
          return (
            <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-4 space-y-3">
              <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-3">
                <Hash size={16} />
                ISS Information
              </h4>
              <div className="flex flex-col sm:flex-row gap-3">
                {remarkTypeLabel && (
                  <div className="flex-1 inline-flex items-center gap-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
                    <span className="font-semibold text-amber-800">ISS Remark Type:</span>
                    <span>{remarkTypeLabel}</span>
                  </div>
                )}
                {issNumbers.length > 0 && (
                  <div className="flex-1 inline-flex items-center gap-2 text-sm text-blue-700 bg-blue-50 border border-blue-200 rounded-md px-3 py-2">
                    <span className="font-semibold text-blue-800">ISS Number{issNumbers.length > 1 ? 's' : ''}:</span>
                    <span className="flex flex-wrap gap-1">
                      {issNumbers.map((issNum, idx) => (
                        <span key={idx} className="font-mono text-blue-900">
                          {issNum}
                          {idx < issNumbers.length - 1 && ','}
                        </span>
                      ))}
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        }
        return null;
      })()}

      <SupportingInfo
        status={formData.status}
        reason={formData.reason}
        onReasonChange={val => setFormData(prev => ({ ...prev, reason: val }))}
        showRemark={mode !== 'add'}
        showAttachments={true}
        isRequired={mode !== 'add'}
        attachments={formData.attachments || []}
        onAttachmentsChange={(newAttachments) => setFormData(prev => ({ ...prev, attachments: newAttachments }))}
      />

      <div className="flex flex-wrap items-center justify-end gap-2 mt-4">
        {mode === 'add' ? (
          <div className="flex flex-wrap items-center justify-end gap-2">
            <button 
              onClick={handleBack}
              className="btn-with-icon inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md font-medium text-gray-900 bg-white hover:bg-gray-50 border border-black transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 overflow-hidden"
              style={{ fontSize: '0.75rem', minWidth: '90px' }}
            >
              <span className="btn-text">Cancel</span>
              <XCircle className="btn-icon w-4 h-4 absolute" />
            </button>
            <button 
              onClick={() => handleSubmitClick('Submit')}
              className="btn-with-icon inline-flex items-center justify-center gap-1 px-6 py-2.5 text-xs font-medium text-white transition-all duration-300 rounded-md shadow-sm bg-orange-600 hover:bg-orange-700 border-orange-700"
              style={{ minWidth: '110px' }}
            >
              <span className="btn-text">Submit</span>
              <Send className="btn-icon w-4 h-4 absolute" />
            </button>
          </div>
        ) : (
          <div className="flex flex-wrap items-center justify-end gap-2">
            {isDocumentOwner && formData.status !== 'Completed' && formData.status !== 'Cancelled' && (
              <button 
                onClick={() => handleSubmitClick('Edit')}
                className="btn-with-icon btn-edit inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md font-medium text-white transition-all duration-300 border" 
                style={{ fontSize: '0.75rem', minWidth: '80px' }}
              >
                <span className="btn-text">Edit</span>
                <Edit3 className="btn-icon w-4 h-4 absolute" />   
              </button>
            )}
            
            {/* Reject Button - Visible based on role and status */}
            {showRejectButton() && (
              <button 
                onClick={() => handleSubmitClick('Rejected')}
                className="btn-with-icon btn-reject inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md font-medium text-white transition-all duration-300 border" 
                style={{ fontSize: '0.75rem', minWidth: '90px' }}
              >
                <span className="btn-text">Reject</span>
                <XCircle className="btn-icon w-4 h-4 absolute" />
              </button>
            )}
            
            {/* Approve Button - Visible based on role and status */}
        
            {showApproveButton() && (() => {
              console.log('[DamageFormLayout] showApproveButton returned true, resolving action...');
              const action = resolveApproveAction();
              console.log('[DamageFormLayout] Button render check:', {
                showApproveButton: showApproveButton(),
                action,
                willRender: !!action,
                status: formData.status,
                role: getUserRole(),
                isAccount
              });
              // Don't render button if action is null or undefined
              if (!action) {
                console.log('[DamageFormLayout] Not rendering button - action is null/undefined');
                return null;
              }
              console.log('[DamageFormLayout] Rendering button with action:', action);
              const buttonClass = getButtonColorClass(action);
              return (
                <button 
                  onClick={() => handleSubmitClick(action)}
                  className={`btn-with-icon inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-md font-medium text-white transition-all duration-300 border ${buttonClass}`}
                  style={{ fontSize: '0.75rem', minWidth: '120px' }}
                >
                  <span className="btn-text">
                    {prettyApprove(action) || 'Proceed'}
                  </span>
                  <CheckCircle className="btn-icon w-4 h-4 absolute" />
                </button>
              );
            })()}
            
            {/* Supervisor step removed - Operation Manager now acknowledges and form goes directly to Completed */}
            {/* Removed supervisor Issue button */}
            
            {/* Back to Previous Button - For certain roles to return the form to previous state */}
            {actions.backToPrevious && (
              <button 
                onClick={() => handleSubmitClick('BackToPrevious')}
                className="group inline-flex items-center gap-2 px-4 py-2 rounded-md font-medium text-yellow-600 hover:text-yellow-800 transition-colors hover:bg-yellow-50 border border-yellow-200" 
                style={{ fontSize: '0.75rem' }}
              >
                <CornerUpLeft className="w-4 h-4 transition-transform duration-300 group-hover:rotate-[360deg]" />
                <span className="transition-transform duration-200 group-hover:scale-[1.1]">Back To Previous</span>
              </button>
            )}
          </div>
        )}
      </div>
      {mode !== 'add' && <ApprovalSection approvals={formData.approvals} status={formData.status} formData={formData} />}

      {/* Action Confirmation Modal */}
      <ActionConfirmationModal
        isOpen={confirmationModal.isOpen}
        action={confirmationModal.action}
        emptyFields={confirmationModal.emptyFields || []}
        onConfirm={handleConfirmSubmit}
        onCancel={handleCancelSubmit}
      />
    </div>
  );
}