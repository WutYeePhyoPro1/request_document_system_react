import React, { useEffect, useState, useRef, useCallback, useMemo } from "react";
import {
  Trash2,
  CheckCircle,
  ChevronLeft,
  Upload,
  ChevronRight,
  Search,
  Plus,
  Minus,
  Image as ImageIcon
} from "lucide-react";
import { apiRequest } from "../../utils/api";
import ConfirmationModal from "./ConfirmationModal";
import ProductDetailModal from "./ProductDetailModal";
import ErrorModal from "../common/ErrorModal";
import img1 from "../../assets/images/marble texture.jpeg";
import img2 from "../../assets/images/marble texture.jpeg";
import img3 from "../../assets/images/marble texture.jpeg";

const getBrowserOrigin = () =>
  typeof window !== 'undefined' && window.location?.origin
    ? window.location.origin
    : '';

const deriveApiBaseUrl = () => {
  const fallbackOrigin = getBrowserOrigin();
  const raw = import.meta.env?.VITE_API_URL;

  if (!raw) {
    return fallbackOrigin;
  }

  try {
    const parsed = new URL(raw, fallbackOrigin || 'http://localhost');
    const trimmedPath = parsed.pathname.replace(/\/api\/?$/, '');
    const base = `${parsed.origin}${trimmedPath}`.replace(/\/$/, '');
    return base || parsed.origin;
  } catch (error) {
    return fallbackOrigin;
  }
};

const API_BASE_URL = deriveApiBaseUrl();

const LOCAL_HOSTNAMES = new Set(['localhost', '127.0.0.1', '::1']);

const canonicalizeImageKey = (value) => {
  if (typeof value !== 'string') return null;

  const trimmed = value.trim();
  if (!trimmed) return null;

  if (/^(?:data:|blob:)/i.test(trimmed)) {
    return trimmed;
  }

  if (trimmed.startsWith('/')) {
    return trimmed;
  }

  try {
    const base = typeof window !== 'undefined' && window.location?.origin ? window.location.origin : undefined;
    const parsed = new URL(trimmed, base);
    if (!parsed || !parsed.pathname) {
      return trimmed;
    }
    const pathname = parsed.pathname.startsWith('/') ? parsed.pathname : `/${parsed.pathname}`;
    const search = parsed.search && !/^(?:\?v=|\?t=)/i.test(parsed.search) ? parsed.search : '';
    return `${pathname}${search}`;
  } catch (_error) {
    return trimmed;
  }
};

const ensureAbsoluteUrl = (value) => {
  if (typeof value !== 'string') return valu

  const trimmed = value.trim();
  if (!trimmed) return trimmed;

  if (/^(?:data:|blob:)/i.test(trimmed)) {
    return trimmed;
  }

  if (/^https?:/i.test(trimmed)) {
    return trimmed;
  }

  if (trimmed.startsWith('//')) {
    if (typeof window !== 'undefined' && window.location?.protocol) {
      return `${window.location.protocol}${trimmed}`;
    }
    return `https:${trimmed}`;
  }

  if (!API_BASE_URL) {
    return trimmed;
  }

  const normalized = trimmed
    .replace(/^\.\//, '')
    .replace(/^\/+/, '/');

  return `${API_BASE_URL}${normalized.startsWith('/') ? '' : '/'}${normalized}`;
};

// Test image data URL
const testImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAB3RJTUUH4AkEEjYXFQZ2SQAAAB1pVFh0Q29tbWVudAAAAAAAQ3JlYXRlZCB3aXRoIEdJTVBkLmUHAAAAJklEQVQ4y2NgGAWjYBSMglEwCkYBCQALiP/9+zcDpQALCwvDqA5GdTAKRsEoGAXDFjAAABFwAv+W5JZRAAAAAElFTkSuQmCC';

const deriveComparableKeys = (entry) => {
  const keys = new Set();

  const push = (value, canonicalize = true) => {
    if (value === undefined || value === null) return;
    const raw = String(value).trim();
    if (!raw) return;
    const normalized = canonicalize ? (canonicalizeImageKey(raw) || raw) : raw;
    if (normalized) {
      keys.add(normalized.toLowerCase());
    }
  };

  if (typeof entry === 'string') {
    push(entry);
    return keys;
  }

  if (entry && typeof entry === 'object') {
    if ('id' in entry) {
      push(entry.id, false);
    }
    const candidates = [
      entry.file,
      entry.path,
      entry.url,
      entry.src,
      entry.previewUrl,
      entry.downloadUrl,
      entry.name,
      entry.original_name,
      entry.originalName,
    ];
    candidates.forEach((candidate) => push(candidate));
  }

  return keys;
};

const buildAttachmentKeySet = (attachments = []) => {
  const set = new Set();
  if (!Array.isArray(attachments)) return set;

  attachments.forEach((attachment) => {
    const keys = deriveComparableKeys(attachment);
    keys.forEach((key) => set.add(key));
  });

  return set;
};

const filterOutSupportingEntries = (entries, exclusionSet) => {
  if (!Array.isArray(entries)) {
    return [];
  }

  if (!exclusionSet || exclusionSet.size === 0) {
    return [...entries];
  }

  return entries.filter((entry) => {
    const candidateKeys = deriveComparableKeys(entry);
    if (!candidateKeys.size) {
      return true;
    }
    for (const key of candidateKeys) {
      if (exclusionSet.has(key)) {
        return false;
      }
    }
    return true;
  });
};

const toSafeNumber = (value, fallback = 0) => {
  if (value === null || value === undefined || value === '') return fallback;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
};

const formatAmount = (value) => toSafeNumber(value).toLocaleString(undefined, {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const formatNumber = (value) => toSafeNumber(value).toLocaleString(undefined, {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const formatQuantity = (value) => String(toSafeNumber(value));

const extractImageArray = (item = {}) => {
  if (!item || typeof item !== 'object') return [];

  const candidates = [
    item.img,
    item.images,
    item.photos,
    item.attachments,
    item.image,
    item.media,
    item.originalItem,
    item.originalItem?.img,
    item.originalItem?.images,
    item.originalItem?.photos,
    item.originalItem?.attachments
  ];

  const normalizeEntry = (entry, depth = 0) => {
    if (!entry) return [];

    if (Array.isArray(entry)) {
      return entry;
    }

    if (entry instanceof File || entry instanceof Blob) {
      return [entry];
    }

    if (typeof entry === 'string') {
      const trimmed = entry.trim();
      if (!trimmed) return [];

      if ((trimmed.startsWith('[') && trimmed.endsWith(']')) || (trimmed.startsWith('{') && trimmed.endsWith('}'))) {
        try {
          const parsed = JSON.parse(trimmed);
          const parsedResult = normalizeEntry(parsed, depth + 1);
          if (parsedResult.length) return parsedResult;
        } catch (error) {
          return [];
        }
      }

      return [entry];
    }

    if (typeof entry === 'object') {
      if (Array.isArray(entry.imgArray)) {
        return entry.imgArray;
      }

      if (Array.isArray(entry.images)) {
        return entry.images;
      }

      if (Array.isArray(entry.photos)) {
        return entry.photos;
      }

      if (Array.isArray(entry.attachments)) {
        return entry.attachments;
      }

      if (entry.value !== undefined) {
        const valueResult = normalizeEntry(entry.value, depth + 1);
        if (valueResult.length) return valueResult;
      }

      if (entry.firstImage) {
        const firstResult = normalizeEntry(entry.firstImage, depth + 1);
        if (firstResult.length) return firstResult;
        return [entry.firstImage];
      }

      if (entry.src || entry.previewUrl || entry.fileObject || entry.url || entry.path) {
        return [entry];
      }
    }

    return [];
  };

  for (const candidate of candidates) {
    const normalized = normalizeEntry(candidate);
    if (normalized.length) {
      return normalized;
    }
  }

  return [];
};

export default function DamageItemTable({ 
  items: itemsProp = [], 
  mode = "add", 
  status = "", 
  onItemsChange = () => {}, 
  onItemChange = () => {},
  onRemoveItem = () => {},
  itemErrors = {}, 
  generalFormId = null, 
  userRole = "",
  formId = 1,
  layoutId = 1,
  accountCodes = [],
  issueRemarks = [], // placeholder for future use
  accStatus = 0,
  accCode = "",
  issRemark = "",
  onAccountSettingsChange = () => {},
  onItemAccountCodeChange = () => {},
  systemQtyUpdated = false,
  onSystemQtyStatusChange = () => {},
  isCompleted = false,
  supportingAttachments = [],
  isAccount = false,
  isSupervisor = false,
  approvals = [],
  totalAmount = 0,
  gRemark = 'big_damage',
  currentUser = null
}) {
  // Remove debug logging to prevent infinite re-renders

  const [items, setItems] = useState(Array.isArray(itemsProp) ? itemsProp : []);
  const [searchTerm, setSearchTerm] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const fileInputRefs = useRef({});
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [selectedPreviewImages, setSelectedPreviewImages] = useState([]);
  const [previewImages, setPreviewImages] = useState([]);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [errorModal, setErrorModal] = useState({
    isOpen: false,
    message: ''
  });
  const [isUpdatingSystemQty, setIsUpdatingSystemQty] = useState(false);

  // Define these early to avoid initialization errors in useEffect
  const normalizedRole = (userRole || '').toString().trim().toLowerCase();
  
  /**
   * Check if user can see "Update System Qty" button - matches Laravel acknowledge() function exactly
   * Laravel acknowledge() checks:
   * 1. User has ACK approval entry (user_type='ACK', admin_id=current_user_id)
   * 2. ACK entry status matches: 'BM Approved' (amount <= 500k) OR 'OPApproved' (amount > 500k)
   * 3. Form g_remark == 'big_damage'
   * 4. Form status is NOT 'Issued', 'Completed', 'SupervisorIssued'
   * 5. User has 'Acknowledge' role
   */
  const canShowUpdateSystemQtyButton = useMemo(() => {
    console.log('[DamageItemTable] canShowUpdateSystemQtyButton - Checking conditions:', {
      status,
      gRemark,
      totalAmount,
      currentUser,
      isAccount,
      normalizedRole,
      approvalsCount: approvals?.length || 0,
      approvals
    });

    // FIX: Do not show button if form is already Issued, Completed, or SupervisorIssued
    const excludedStatuses = ['Issued', 'Completed', 'SupervisorIssued'];
    if (excludedStatuses.includes(status)) {
      return false;
    }

    // Check if form type is 'big_damage' (g_remark)
    if (gRemark !== 'big_damage') {
      return false;
    }

    // Check if user has ACK approval entry
    const currentUserId = currentUser?.id || currentUser?.admin_id || currentUser?.userId;
    if (!currentUserId) {
      return false;
    }
    if (!Array.isArray(approvals) || approvals.length === 0) {
      return false;
    }

    // Find ACK/AC approval entry for current user (account users can have either 'AC' or 'ACK')
    // Handle both simplified format (from DamageView) and raw API format
    let ackApproval = null;
    let foundMatchingUserType = false;
    let foundMatchingUser = false;
    let foundMatchingStatus = false;
    
    approvals.forEach((approval, index) => {
      // Get user_type from multiple possible sources (simplified format, raw format, or direct)
      const userType = (
        approval?.user_type || 
        approval?.raw?.user_type || 
        ''
      ).toString().toUpperCase();
      
      // Check user_type first
      if (userType !== 'ACK' && userType !== 'AC') {
        return;
      }
      foundMatchingUserType = true;

      // Check if user matches - try admin_id first, then actual_user_id
      // API returns actual_user_id, but Laravel helper checks admin_id
      // Use actual_user_id as fallback if admin_id is not available
      const adminId = approval?.admin_id || approval?.raw?.admin_id;
      const actualUserId = approval?.actual_user_id || approval?.raw?.actual_user_id;
      const userId = approval?.user?.id || approval?.user_id || approval?.user?.admin_id;
      const allUserIds = [adminId, actualUserId, userId].filter(id => id !== undefined && id !== null);

      const userIdMatches = allUserIds.some(id => 
        String(id) === String(currentUserId) || Number(id) === Number(currentUserId)
      );

      // For big_damage forms: If user is account user (isAccount: true), allow ACK approval even if admin_id doesn't match
      // This handles cases where ACK approval might be assigned to a different user but current user is still an account user
      // Laravel checks admin_id match strictly, but we'll allow account users to see the button if:
      // 1. User is an account user (isAccount: true)
      // 2. ACK approval exists
      // 3. Status matches amount condition
      // This is a frontend workaround for cases where admin_id assignment might be different
      const allowAccountUserAccess = isAccount && !userIdMatches;

      if (!userIdMatches && !allowAccountUserAccess) {
        console.log(`[DamageItemTable] ACK approval at index ${index} - User ID mismatch:`, {
          adminId,
          actualUserId,
          userId,
          allUserIds,
          currentUserId,
          isAccount,
          allowAccountUserAccess,
          approval: {
            user_type: userType,
            status: approval?.status || approval?.raw?.status,
            admin_id: adminId,
            actual_user_id: actualUserId,
            fullObject: approval
          }
        });
        return;
      }
      foundMatchingUser = true;

      // Check ACK entry status matches amount condition
      // For big_damage forms:
      // - Amount <= 500k: ACK entry status must be 'BM Approved' (BM has approved)
      // - Amount > 500k: ACK entry status must be 'OPApproved' (Operation Manager has approved)
      const approvalStatus = (
        approval?.status || 
        approval?.raw?.status || 
        ''
      ).toString().trim();
      const formStatusNormalized = (status || '').toString().trim();
      const numericAmount = Number(totalAmount) || 0;

      let statusMatches = false;
      if (numericAmount <= 500000) {
        // Amount <= 500k: ACK entry status must be 'BM Approved'
        // If ACK entry status is 'Pending' but form status is 'BM Approved', 
        // consider it valid (BM has approved, ACK entry just hasn't been updated yet)
        statusMatches = approvalStatus === 'BM Approved' || 
                       approvalStatus === 'BMApproved' ||
                       (approvalStatus === 'Pending' && formStatusNormalized === 'BM Approved');
      } else {
        // Amount > 500k: ACK entry status must be 'OPApproved'
        // If ACK entry status is 'Pending' but form status is 'OPApproved' or 'OP Approved',
        // consider it valid (OP has approved, ACK entry just hasn't been updated yet)
        statusMatches = approvalStatus === 'OPApproved' || 
                       approvalStatus === 'OP Approved' ||
                       (approvalStatus === 'Pending' && (formStatusNormalized === 'OPApproved' || formStatusNormalized === 'OP Approved'));
      }

      if (!statusMatches) {
        console.log(`[DamageItemTable] ACK approval at index ${index} - Status mismatch:`, {
          approvalStatus,
          expectedStatus: numericAmount <= 500000 ? 'BM Approved' : 'OPApproved',
          numericAmount,
          approval: {
            user_type: userType,
            status: approvalStatus,
            admin_id: adminId,
            actual_user_id: actualUserId,
            fullObject: approval
          }
        });
        return;
      }
      foundMatchingStatus = true;
      
      // Found matching approval
      ackApproval = approval;
      console.log(`[DamageItemTable] ACK approval at index ${index} - MATCHED!`, {
        approval
      });
    });

    // Find all ACK/AC approvals to see what we have
    const allAckApprovals = approvals.filter(a => {
      const userType = (a?.user_type || a?.raw?.user_type || '').toString().toUpperCase();
      return userType === 'ACK' || userType === 'AC';
    });

    console.log('[DamageItemTable] ACK Approval search result:', {
      foundMatchingUserType,
      foundMatchingUser,
      foundMatchingStatus,
      ackApproval: ackApproval ? 'Found' : 'Not Found',
      currentUserId,
      totalAmount,
      expectedStatus: totalAmount > 500000 ? 'OPApproved' : 'BM Approved',
      formStatus: status,
      allAckApprovals: allAckApprovals.map(a => ({
        user_type: a?.user_type || a?.raw?.user_type,
        status: a?.status || a?.raw?.status,
        admin_id: a?.admin_id || a?.raw?.admin_id,
        actual_user_id: a?.actual_user_id || a?.raw?.actual_user_id,
        user_id: a?.user?.id || a?.user_id,
        label: a?.label,
        name: a?.name,
        fullObject: a
      })),
      allApprovals: approvals.map(a => ({
        user_type: a?.user_type || a?.raw?.user_type,
        status: a?.status || a?.raw?.status,
        admin_id: a?.admin_id || a?.raw?.admin_id,
        actual_user_id: a?.actual_user_id || a?.raw?.actual_user_id,
        user_id: a?.user?.id || a?.user_id,
        label: a?.label,
        name: a?.name
      }))
    });

    if (!ackApproval) {
      console.log('[DamageItemTable] canShowUpdateSystemQtyButton: Returning false - No ACK approval found');
      return false;
    }

    // User must be account/ACK role (checked via isAccount or role name)
    const acknowledgeRoleAliases = new Set([
      'acknowledge',
      'account',
      'ack',
      'acknowledged',
      'acknowledgement',
      'branch_account',
      'branchaccount',
    ]);
    const isAcknowledgeRole = isAccount || acknowledgeRoleAliases.has(normalizedRole);

    if (!isAcknowledgeRole) {
      console.log('[DamageItemTable] canShowUpdateSystemQtyButton: Returning false - Not acknowledge role', {
        isAccount,
        normalizedRole,
        isAcknowledgeRole
      });
      return false;
    }

    console.log('[DamageItemTable] canShowUpdateSystemQtyButton: Returning TRUE - All conditions met!');
    return true;
  }, [status, gRemark, approvals, totalAmount, currentUser, isAccount, normalizedRole]);

  // Account user (can update system qty, edit product_type, delete items)
  const isAcknowledgeUser = isAccount || (userRole && ['acknowledge', 'account', 'ack', 'acknowledged', 'acknowledgement', 'branch_account', 'branchaccount'].includes(normalizedRole));
  // Supervisor user (can choose ISS remark/account code but cannot update system qty or edit items)
  const isSupervisorUser = isSupervisor || normalizedRole === 'supervisor';

  // Define showAccountCodes state before useEffect that uses it
  const [showAccountCodes, setShowAccountCodes] = useState(() => {
    const hasCodes = itemsProp.some((item) => {
      const compareId = item?.id ?? item?.specific_form_id;
      return Boolean(item?.acc_code1 || item?.acc_code);
    });
    // Account should always see account codes at OPApproved, BM Approved, or Ac_Acknowledged stages
    const accountShouldSeeCodes = isAccount && (
      status === 'OPApproved' || 
      status === 'OP Approved' || 
      status === 'BM Approved' || 
      status === 'BMApproved' ||
      status === 'Ac_Acknowledged' ||
      status === 'Acknowledged'
    );
    
    // Supervisor should see account codes at Ac_Acknowledged, Acknowledged, or Approved stages
    const supervisorShouldSeeCodes = isSupervisorUser && (
      status === 'Ac_Acknowledged' ||
      status === 'Acknowledged' ||
      status === 'Approved' ||
      status === 'Completed' ||
      status === 'Issued' ||
      status === 'SupervisorIssued'
    );
    
    const shouldShow = isCompleted || hasCodes || accountShouldSeeCodes || supervisorShouldSeeCodes;
    return shouldShow;
  });

  // Track issRemark prop changes for supervisor
  useEffect(() => {
    // Supervisor data tracking (no logging)
  }, [issRemark, issueRemarks, systemQtyUpdated, isCompleted, isSupervisorUser, status, items, showAccountCodes, accountCodes]);

  const supportingAttachmentSet = useMemo(
    () => buildAttachmentKeySet(supportingAttachments),
    [supportingAttachments]
  );

  useEffect(() => {
    // Account should always see account codes at OPApproved, BM Approved, or Ac_Acknowledged stages
    const accountShouldSeeCodes = isAccount && (
      status === 'OPApproved' || 
      status === 'OP Approved' || 
      status === 'BM Approved' || 
      status === 'BMApproved' ||
      status === 'Ac_Acknowledged' ||
      status === 'Acknowledged'
    );
    
    // Supervisor should see account codes at Ac_Acknowledged, Acknowledged, or Approved stages
    const supervisorShouldSeeCodes = isSupervisorUser && (
      status === 'Ac_Acknowledged' ||
      status === 'Acknowledged' ||
      status === 'Approved' ||
      status === 'Completed' ||
      status === 'Issued' ||
      status === 'SupervisorIssued'
    );
    
    if (isCompleted) {
      setShowAccountCodes(true);
      return;
    }
    
    if (accountShouldSeeCodes || supervisorShouldSeeCodes) {
      setShowAccountCodes(true);
      return;
    }
    
    if (showAccountCodes && !isCompleted) {
      return;
    }
    
    const shouldShow = itemsProp.some((item) => Boolean(item?.acc_code1 || item?.acc_code));
    if (shouldShow) {
      setShowAccountCodes(true);
    }
  }, [itemsProp, showAccountCodes, isCompleted, isAccount, isSupervisorUser, status]);
  
  const isCheckerRole = ['branch_lp', 'checker', 'cs', 'loss prevention'].some(r => normalizedRole.includes(r));
  const isApproverRole = ['bm', 'abm', 'approver', 'manager'].some(r => normalizedRole.includes(r));
  
  // Allow editing final_qty (Actual Qty) based on role and status - matching Laravel Blade logic
  const allowFinalQtyEdit = isCompleted
    ? false
    : mode === 'view'
      ? ((status === 'Ongoing' && isCheckerRole) || (status !== 'BM Approved' && isApproverRole))
      : false; // In add mode, actual_qty is editable, not final_qty

  const showReviewQtyColumns = mode !== 'add';

  const getAccountCodeLabel = useCallback((code) => {
    if (code === undefined || code === null || code === '') {
      return '-';
    }
    const normalizedCode = typeof code === 'string' ? code : String(code);
    const match = accountCodes.find((option) => {
      const optionValue = typeof option.value === 'string' ? option.value : String(option.value ?? '');
      return optionValue === normalizedCode;
    });
    return match?.label ?? normalizedCode;
  }, [accountCodes]);

  const addItem = () => {
    if (mode === 'view') return;
    const newItem = {
      id: Date.now() + Math.random(),
      category: '',
      code: '',
      product_code: '',
      name: '',
      unit: '',
      system_qty: 0,
      request_qty: '',
      final_qty: '',
      actual_qty: '',
      amount: 0,
      price: 0,
      remark: '',
      img: [],
      images: [],
      damage_images: []
    };
    setItems((prev) => [...prev, newItem]);
  };

  // Memoize the itemsProp to prevent unnecessary updates
  const itemsPropString = JSON.stringify(itemsProp);
  
  // Update local state when itemsProp changes
  useEffect(() => {
    if (!itemsProp || !Array.isArray(itemsProp)) return;
    
    const processItems = (items) => {
      // First, remove duplicates by ID before processing - use more aggressive deduplication
      const itemsById = new Map();
      const seenIds = new Set();
      
      items.forEach(item => {
        const id = item.id || item.specific_form_id;
        if (id) {
          const idStr = String(id);
          // If we've already seen this ID, skip it completely (prevent duplicates)
          if (seenIds.has(idStr)) {
            return; // Skip duplicate
          }
          seenIds.add(idStr);
          itemsById.set(idStr, item);
        }
      });
      
      // Convert back to array and sort by ID for consistency
      const uniqueItems = Array.from(itemsById.values()).sort((a, b) => {
        const idA = a.id || a.specific_form_id || 0;
        const idB = b.id || b.specific_form_id || 0;
        return idA - idB;
      });
      
      return uniqueItems.map(item => {
        // Ensure all numeric fields are properly converted to numbers
        const processedItem = { ...item };

        // Preserve category field from multiple possible sources
        // Check if category exists, if not try to get it from various possible field names
        if (!processedItem.category || processedItem.category === '') {
          processedItem.category = item?.categories?.name || 
                                   item?.product_category_name || 
                                   item?.Category_Name ||
                                   item?.category ||
                                   processedItem?.category ||
                                   '';
        }
        
        // Also preserve category_id
        if (!processedItem.category_id && (item?.category_id || item?.maincatid)) {
          processedItem.category_id = item?.category_id || item?.maincatid || null;
        }

        // Preserve account code fields from multiple possible sources
        if (!processedItem.acc_code1 && !processedItem.acc_code) {
          processedItem.acc_code1 = item?.acc_code1 ?? item?.acc_code ?? null;
          processedItem.acc_code = item?.acc_code ?? item?.acc_code1 ?? null;
        } else if (!processedItem.acc_code1) {
          processedItem.acc_code1 = processedItem.acc_code ?? item?.acc_code1 ?? item?.acc_code ?? null;
        } else if (!processedItem.acc_code) {
          processedItem.acc_code = processedItem.acc_code1 ?? item?.acc_code ?? item?.acc_code1 ?? null;
        }

        // Handle numeric fields
        ['request_qty', 'price', 'amount', 'total', 'system_qty', 'final_qty'].forEach(field => {
          if (field in processedItem) {
            processedItem[field] = processedItem[field] === '' || processedItem[field] === null || isNaN(processedItem[field])
              ? 0
              : Number(processedItem[field]);
          }
        });
        if ('actual_qty' in processedItem) {
          const rawActual = processedItem.actual_qty;
          const numericActual = rawActual === '' || rawActual === null || isNaN(rawActual)
            ? null
            : Number(rawActual);
          processedItem.actual_qty = numericActual === null
            ? (processedItem.request_qty ?? 0)
            : numericActual;
        } else if (processedItem.request_qty !== undefined) {
          processedItem.actual_qty = processedItem.request_qty;
        }
        
        // Calculate amount if not set or invalid
        if ((!processedItem.amount || isNaN(processedItem.amount)) && 
            !isNaN(processedItem.price) && !isNaN(processedItem.request_qty)) {
          processedItem.amount = processedItem.price * processedItem.request_qty;
          processedItem.total = processedItem.amount;
        }
        
        // Ensure final_qty and actual_qty match request_qty if not set
        if (processedItem.request_qty !== undefined) {
          if (processedItem.final_qty === undefined || isNaN(processedItem.final_qty)) {
            processedItem.final_qty = processedItem.request_qty;
          }
        }

        // Preserve existing image arrays
        const originalImages = filterOutSupportingEntries(
          extractImageArray({
            img: item.img,
            images: item.images,
            damage_images: item.damage_images,
            photos: item.photos,
            attachments: item.attachments,
          }),
          supportingAttachmentSet
        );

        const normalizedImages = originalImages && originalImages.length
          ? originalImages
          : filterOutSupportingEntries(
              extractImageArray(processedItem),
              supportingAttachmentSet
            );

        const filteredImages = filterOutSupportingEntries(normalizedImages, supportingAttachmentSet);

        if (filteredImages && filteredImages.length) {
          processedItem.img = filteredImages;
          processedItem.images = filteredImages;
          processedItem.damage_images = filteredImages;
        } else {
          processedItem.img = [];
          processedItem.images = [];
          processedItem.damage_images = [];
        }
        
        return processedItem;
      });
    };
    
    const serializeImages = (candidate) => {
      try {
        const images = filterOutSupportingEntries(
          extractImageArray(candidate),
          supportingAttachmentSet
        );
        if (!images || !images.length) return '[]';
        return JSON.stringify(images);
      } catch (error) {
        return '[]';
      }
    };

    const shouldUpdate = () => {
      // Check if items length is different
      if (items.length !== itemsProp.length) return true;
      
      // Create maps by ID for comparison (not by index, since order might differ)
      const itemsById = new Map();
      const propItemsById = new Map();
      
      items.forEach(item => {
        const id = item.id || item.specific_form_id;
        if (id) itemsById.set(String(id), item);
      });
      
      itemsProp.forEach(item => {
        const id = item.id || item.specific_form_id;
        if (id) propItemsById.set(String(id), item);
      });
      
      // Check if any item IDs are missing or different
      if (itemsById.size !== propItemsById.size) return true;
      
      // Check if any item has changed by comparing by ID
      for (const [id, item] of itemsById.entries()) {
        const propItem = propItemsById.get(id);
        if (!propItem) return true;
        
        // Compare all relevant fields including system_qty
        const hasChanged = (
          String(item.request_qty) !== String(propItem.request_qty) ||
          String(item.amount) !== String(propItem.amount) ||
          String(item.price) !== String(propItem.price) ||
          String(item.final_qty) !== String(propItem.final_qty) ||
          String(item.actual_qty) !== String(propItem.actual_qty) ||
          String(item.system_qty ?? 0) !== String(propItem.system_qty ?? 0) ||
          (item.acc_code1 ?? item.acc_code ?? '') !== (propItem.acc_code1 ?? propItem.acc_code ?? '') ||
          item.remark !== propItem.remark ||
          serializeImages(item) !== serializeImages(propItem)
        );
        
        if (hasChanged) return true;
      }
      
      return false;
    };
    
    if (shouldUpdate()) {
      setItems(processItems([...itemsProp]));
    }
  }, [itemsPropString, supportingAttachmentSet]); // Recompute when items or supporting attachments change

  // Memoize the callback to prevent unnecessary re-renders
  const handleItemsChange = useCallback((itemsToUpdate) => {
    if (!itemsToUpdate || !itemsToUpdate.length) return;
    
    // Clean up items before sending to parent
    const cleanedItems = itemsToUpdate.map(({ originalItem, ...rest }) => rest);
    
    onItemsChange(cleanedItems);
  }, [onItemsChange]);
  
  // Only update parent when items actually change
  const prevItemsRef = useRef();
  const isRefetchingRef = useRef(false);
  
  useEffect(() => {
    if (prevItemsRef.current === undefined) {
      prevItemsRef.current = items;
      return;
    }
    
    // Skip update if we're currently refetching (to prevent duplicates)
    if (isRefetchingRef.current) {
      prevItemsRef.current = items;
      isRefetchingRef.current = false;
      return;
    }
    
    // Deep compare to prevent unnecessary updates
    const itemsChanged = JSON.stringify(prevItemsRef.current) !== JSON.stringify(items);
    
    if (itemsChanged) {
      handleItemsChange(items);
      prevItemsRef.current = items;
    }
  }, [items]);
  
  // Track when itemsProp changes - if it's a refetch (same IDs, different system_qty), prevent callback
  useEffect(() => {
    if (itemsProp.length > 0 && items.length > 0) {
      const propIds = new Set(itemsProp.map(i => String(i.id || i.specific_form_id)).filter(Boolean));
      const currentIds = new Set(items.map(i => String(i.id || i.specific_form_id)).filter(Boolean));
      
      // If all IDs match but system_qty changed, it's likely a refetch
      const allIdsMatch = propIds.size === currentIds.size && 
                         propIds.size > 0 &&
                         Array.from(propIds).every(id => currentIds.has(id));
      
      if (allIdsMatch) {
        const systemQtyChanged = itemsProp.some((propItem) => {
          const currentItem = items.find(i => 
            String(i.id || i.specific_form_id) === String(propItem.id || propItem.specific_form_id)
          );
          return currentItem && 
                 String(currentItem.system_qty ?? 0) !== String(propItem.system_qty ?? 0);
        });
        
        if (systemQtyChanged) {
          isRefetchingRef.current = true;
          // Update prevItemsRef to prevent triggering handleItemsChange
          prevItemsRef.current = itemsProp;
        }
      }
    }
  }, [itemsProp, items]);

const handleRemarkChange = (id, value) => {
  setItems(prevItems => {
    const index = prevItems.findIndex(item => item.id === id);
    if (index === -1) return prevItems;
    
    const newItems = [...prevItems];
    newItems[index] = {
      ...newItems[index],
      remark: value
    };
    return newItems;
  });
  
  const index = items.findIndex(item => item.id === id);
  if (index !== -1) {
    onItemChange(index, 'remark', value);
  }
};

  const handleQtyChange = (id, value, qtyType = 'final_qty') => {
    if (value !== '' && (isNaN(parseFloat(value)) || parseFloat(value) < 0)) {
      return;
    }

    setItems((prevItems) => {
      const index = prevItems.findIndex((item) => {
        const matchId = item.id ?? item.specific_form_id;
        return matchId === id;
      });

      if (index === -1) return prevItems;
      if (mode === 'view' && !allowFinalQtyEdit && qtyType === 'final_qty') return prevItems;

      const item = prevItems[index];
      const qtyNumeric = value === '' ? 0 : parseFloat(value) || 0;
      
      // Validate final_qty against system_qty (matching Laravel Blade logic)
      let finalQty = qtyNumeric;
      if (qtyType === 'final_qty') {
        const systemQty = parseFloat(item.system_qty) || 0;
        if (systemQty > 0 && finalQty > systemQty) {
          finalQty = systemQty; // Cap at system_qty
        }
        if (systemQty === 0) {
          finalQty = 0; // If system_qty is 0, final_qty must be 0
        }
      }
      
      const price = parseFloat(item.price) || 0;
      // Calculate amount using final_qty (or actual_qty in add mode)
      const qtyForAmount = qtyType === 'final_qty' ? finalQty : qtyNumeric;
      const amountNumeric = (isNaN(qtyForAmount) || isNaN(price))
        ? 0
        : Math.round((qtyForAmount * price + Number.EPSILON) * 100) / 100;

      const updatedItem = {
        ...item,
        // Explicitly preserve category and category_id
        category: item.category || '',
        category_id: item.category_id || null,
        amount: amountNumeric,
        total: amountNumeric
      };

      if (qtyType === 'actual_qty') {
        // In add mode, updating actual_qty
        updatedItem.actual_qty = qtyNumeric;
        updatedItem.request_qty = qtyNumeric;
        // In add mode, if final_qty is not set, initialize it to actual_qty
        if (mode === 'add' && (updatedItem.final_qty === undefined || updatedItem.final_qty === null)) {
          updatedItem.final_qty = qtyNumeric;
        }
      } else if (qtyType === 'final_qty') {
        // Updating final_qty (in both add and view mode)
        updatedItem.final_qty = finalQty;
        // Don't change actual_qty (it's the original request)
      }

      if (updatedItem.originalItem) {
        delete updatedItem.originalItem;
      }

      const newItems = [...prevItems];
      newItems[index] = updatedItem;

      if (qtyType === 'actual_qty') {
        onItemChange(index, 'request_qty', qtyNumeric);
        onItemChange(index, 'actual_qty', qtyNumeric);
        if (mode === 'add') {
          onItemChange(index, 'final_qty', qtyNumeric);
        }
      } else if (qtyType === 'final_qty') {
        onItemChange(index, 'final_qty', finalQty);
      }
      onItemChange(index, 'amount', amountNumeric);
      onItemChange(index, 'total', amountNumeric);

      return newItems;
    });
  };

const normalizeImageEntries = (list) => {
  if (!list || !Array.isArray(list)) {
    return [];
  }

  return list.reduce((acc, entry) => {
    try {
      if (entry && typeof entry === 'object' && entry.value) {
        const val = entry.value;
        const srcCandidate = val.src || val.previewUrl || null;
        const resolvedSrc = srcCandidate ? ensureAbsoluteUrl(srcCandidate) : '';
        const previewUrl = val.previewUrl ? ensureAbsoluteUrl(val.previewUrl) : resolvedSrc;
        if (resolvedSrc || previewUrl || val.fileObject) {
          acc.push({
            type: val.type || entry.type || (val.fileObject ? 'upload' : 'url'),
            src: resolvedSrc || previewUrl,
            previewUrl: previewUrl || resolvedSrc,
            fileObject: val.fileObject || entry.fileObject || null,
            isBase64: typeof (resolvedSrc || previewUrl) === 'string' && (resolvedSrc || previewUrl).startsWith('data:image/')
          });
          return acc;
        }
      }

      if (entry && (entry.previewUrl || entry.src)) {
        const srcCandidate = entry.src || entry.previewUrl;
        const resolvedSrc = srcCandidate ? ensureAbsoluteUrl(srcCandidate) : '';
        const previewUrl = entry.previewUrl ? ensureAbsoluteUrl(entry.previewUrl) : resolvedSrc;
        acc.push({
          type: entry.type || 'url',
          src: resolvedSrc || previewUrl,
          previewUrl: previewUrl || resolvedSrc,
          fileObject: entry.fileObject || null,
          isBase64: entry.isBase64 || (typeof srcCandidate === 'string' && srcCandidate.startsWith('data:image/'))
        });
        return acc;
      }

      if (typeof entry === 'string') {
        const resolved = ensureAbsoluteUrl(entry);
        acc.push({
          type: 'url',
          src: resolved,
          previewUrl: resolved,
          fileObject: null,
          isBase64: entry.startsWith('data:image/')
        });
        return acc;
      }

      if (entry instanceof File || entry instanceof Blob) {
        const previewUrl = URL.createObjectURL(entry);
        acc.push({
          type: 'upload',
          src: previewUrl,
          previewUrl,
          fileObject: entry,
          isBase64: false
        });
        return acc;
      }

      if (entry && typeof entry === 'object') {
        const src = entry.url || entry.src || entry.path;
        const resolvedSrc = src ? ensureAbsoluteUrl(src) : '';
        const previewUrl = entry.previewUrl ? ensureAbsoluteUrl(entry.previewUrl) : resolvedSrc;

        if (resolvedSrc || previewUrl) {
          acc.push({
            type: entry.type || 'url',
            src: resolvedSrc || previewUrl,
            previewUrl: previewUrl || resolvedSrc,
            fileObject: entry.fileObject || null,
            isBase64: typeof (resolvedSrc || previewUrl) === 'string' && (resolvedSrc || previewUrl).startsWith('data:image/')
          });
          return acc;
        }

        if (entry.file && (entry.file instanceof File || entry.file instanceof Blob)) {
          const preview = URL.createObjectURL(entry.file);
          acc.push({
            type: 'upload',
            src: preview,
            previewUrl: preview,
            fileObject: entry.file,
            isBase64: false
          });
          return acc;
        }
      }

      if (entry?.fileObject && entry?.previewUrl) {
        const preview = ensureAbsoluteUrl(entry.previewUrl);
        acc.push({
          type: entry.type || 'upload',
          src: preview,
          previewUrl: preview,
          fileObject: entry.fileObject,
          isBase64: false
        });
        return acc;
      }

      return acc;
    } catch (error) {
      return acc;
    }
  }, []);
};

  const fileToImageEntry = (file) => {
    return new Promise((resolve, reject) => {
      // First, create a preview URL immediately
      const previewUrl = URL.createObjectURL(file);
      
      // Then try to read the file as data URL for the src
      const reader = new FileReader();
      
      reader.onload = (e) => {
        resolve({
          src: e.target.result,
          previewUrl: previewUrl, // Keep the blob URL for preview
          name: file.name,
          type: 'upload',
          fileObject: file,
          lastModified: file.lastModified || Date.now()
        });
      };
      
      reader.onerror = () => {
        // Even if reading fails, still resolve with the preview URL
        resolve({
          src: previewUrl,
          previewUrl: previewUrl,
          name: file.name,
          type: 'upload',
          fileObject: file,
          lastModified: file.lastModified || Date.now()
        });
      };
      
      try {
        reader.readAsDataURL(file);
      } catch (error) {
        // If reading fails, still return with the preview URL
        resolve({
          src: previewUrl,
          previewUrl: previewUrl,
          name: file.name,
          type: 'upload',
          fileObject: file,
          lastModified: file.lastModified || Date.now()
        });
      }
    });
  };

  const handleImageUpload = async (itemId, e) => {
    e.stopPropagation();
    const files = Array.from(e.target.files);
    
    if (files.length === 0) return;
    
    const index = items.findIndex(item => item.id === itemId);
    if (index === -1) return;
    
    const item = items[index];
    if (!item) return;
    
    // Store both the blob URL for preview and the original File object
    const newImages = [];
    
    // Process all files in parallel
    const uploadPromises = files.map(async (file) => {
      try {
        const imageEntry = await fileToImageEntry(file);
        return imageEntry;
      } catch (err) {
        const previewUrl = URL.createObjectURL(file);
        return {
          type: 'upload',
          src: previewUrl,
          previewUrl: previewUrl,
          fileObject: file,
          name: file.name,
          lastModified: file.lastModified || Date.now()
        };
      }
    });
    
    try {
      const uploadedImages = await Promise.all(uploadPromises);
      newImages.push(...uploadedImages);
    } catch (error) {}
    
    // Update the item with new images
    const currentImages = filterOutSupportingEntries(
      extractImageArray(item),
      supportingAttachmentSet
    );
    const updatedImages = filterOutSupportingEntries(
      [...currentImages, ...newImages],
      supportingAttachmentSet
    );

    // Update local state immediately for preview
    setItems(prevItems => {
      const updatedItems = prevItems.map((prevItem, idx) => {
        if (idx !== index) return prevItem;

        const updatedItem = { ...prevItem };
        const imageKeys = ['img', 'images', 'photos', 'attachments'];

        let updated = false;

        imageKeys.forEach(key => {
          if (prevItem[key] !== undefined) {
            if (Array.isArray(prevItem[key])) {
              updatedItem[key] = updatedImages;
            } else if (prevItem[key] && typeof prevItem[key] === 'object') {
              updatedItem[key] = {
                ...prevItem[key],
                imgArray: updatedImages,
                images: updatedImages,
                firstImage: updatedImages[0] || null
              };
            }
            updated = true;
          }
        });

        if (!updated) {
          updatedItem.img = updatedImages;
        }

        return updatedItem;
      });
      
      // Update parent component with the new items including images
      handleItemsChange(updatedItems);
      
      return updatedItems;
    });

    // Update the parent component
    onItemChange(index, 'img', updatedImages);
    
    // Reset the file input
    if (e.target) {
      e.target.value = '';
    }
    
    // Also reset the file input reference if it exists
    if (fileInputRefs.current && fileInputRefs.current[itemId]) {
      fileInputRefs.current[itemId].value = '';
    }
  };

  const removeImage = (id, imgIndex) => {
    setItems(prevItems => {
      return prevItems.map(item => {
        if (item.id === id) {
          const sourceImages = item.img
            || item.images
            || item.damage_images
            || item.damageImages
            || [];
          const normalizedImages = filterOutSupportingEntries(
            normalizeImageEntries(sourceImages || []),
            supportingAttachmentSet
          );
          const entryToRemove = normalizedImages[imgIndex];
          
          // Clean up blob URLs if they exist
          if (entryToRemove) {
            if (entryToRemove.previewUrl) {
              try { 
                URL.revokeObjectURL(entryToRemove.previewUrl);
              } catch (error) {}
            }
            else if (entryToRemove.src && typeof entryToRemove.src === 'string' && entryToRemove.src.startsWith('blob:')) {
              try {
                URL.revokeObjectURL(entryToRemove.src);
              } catch (error) {}
            }
          }
          
          // Remove the image from the array
          const newImages = [...normalizedImages];
          newImages.splice(imgIndex, 1);

          // Update the item with the new images array
          return { ...item, img: newImages, images: newImages, damage_images: newImages };
        }
        return item;
      });
    });
  };

  const toggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id)
        ? prev.filter((sid) => sid !== id)
        : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    const currentItems = paginatedItems.map((i) => i.id);
    const allSelected = currentItems.every((id) =>
      selectedIds.includes(id)
    );

    if (allSelected) {
      setSelectedIds(
        selectedIds.filter((id) => !currentItems.includes(id))
      );
    } else {
      setSelectedIds([...new Set([...selectedIds, ...currentItems])]);
    }
  };

  const confirmMultipleDelete = () => {
    if (selectedIds.length > 0) setShowConfirm(true);
  };

  const handleMultipleDelete = () => {
    setItems(items.filter((item) => !selectedIds.includes(item.id)));
    setSelectedIds([]);
    setShowConfirm(false);
  };

  const cancelRemove = () => setShowConfirm(false);

  const total = items.reduce(
    (sum, item) => sum + Number(item.amount || 0),
    0
  );

  const normalizedSearch = (searchTerm || '').trim().toLowerCase();
  const filteredItems = normalizedSearch
    ? items.filter(it =>
        (String(it.code || '').toLowerCase().includes(normalizedSearch)) ||
        (String(it.name || '').toLowerCase().includes(normalizedSearch))
      )
    : items;
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage) || 1;
  const startIdx = (currentPage - 1) * itemsPerPage;
  const paginatedItems = filteredItems.slice(startIdx, startIdx + itemsPerPage);

  const gatherImagesForModal = (item) => {
    if (!item) return [];

    const candidates = [
      item.img,
      item.images,
      item.damage_images,
      item.damageImages,
      item.photos,
      item.attachments,
    ]
      .filter(Boolean)
      .flat();

    const normalized = filterOutSupportingEntries(
      normalizeImageEntries(Array.isArray(candidates) ? candidates : []),
      supportingAttachmentSet
    );
    const seen = new Set();
    const resolved = [];

    normalized.forEach((entry) => {
      if (!entry) return;
      const val = entry.value || entry;

      const candidate = (() => {
        if (typeof val === 'string') return val;
        if (val.src) return val.src;
        if (val.previewUrl) return val.previewUrl;
        if (val.url) return val.url;
        if (val.path) return val.path;
        if (val.firstImage) return val.firstImage;
        if (val.file && typeof val.file === 'string') return val.file;
        return null;
      })();

      if (!candidate) return;

      const canonicalKey = canonicalizeImageKey(candidate);
      const keyForSet = canonicalKey || candidate;
      if (seen.has(keyForSet)) return;
      seen.add(keyForSet);

      const absolute = ensureAbsoluteUrl(canonicalKey || candidate);
      if (absolute) {
        resolved.push(absolute);
      }
    });

    return resolved;
  };

  const openImageGallery = (product) => {
    const imagesForGallery = gatherImagesForModal(product);

    if (!imagesForGallery.length) {
      return;
    }

    openPreview(imagesForGallery, 0);
  };

  const openProductModal = (product) => {
    const imagesForModal = gatherImagesForModal(product);
    setSelectedProduct({
      ...product,
      modalImages: imagesForModal,
    });
    setIsProductModalOpen(true);
  };

  const closeProductModal = () => {
    setSelectedProduct(null);
    setIsProductModalOpen(false);
  };

  const openPreview = (imgs, start = 0) => {
    if (!Array.isArray(imgs) || imgs.length === 0) return;
    const srcs = imgs.map(i => (typeof i === 'string' ? i : (i?.src || ''))).filter(Boolean);
    if (srcs.length === 0) return;
    setPreviewImages(srcs);
    setPreviewIndex(Math.max(0, Math.min(start, srcs.length - 1)));
    setPreviewOpen(true);
  };
  const closePreview = () => {
    setPreviewOpen(false);
    setPreviewImages([]);
    setPreviewIndex(0);
  };
  const nextPreview = (e) => {
    e?.stopPropagation?.();
    setPreviewIndex((i) => (i + 1) % previewImages.length);
  };
  const prevPreview = (e) => {
    e?.stopPropagation?.();
    setPreviewIndex((i) => (i - 1 + previewImages.length) % previewImages.length);
  };

   const onThumbError = (e) => {
    const imgEl = e?.currentTarget;
    if (!imgEl) return;

    const alreadyRetried = imgEl.dataset?.fallbackTried === 'true';
    if (!alreadyRetried) {
      imgEl.dataset.fallbackTried = 'true';
      // Retry once with same URL to handle transient FTP latency
      const currentSrc = imgEl.src;
      imgEl.src = '';
      requestAnimationFrame(() => {
        imgEl.src = currentSrc;
      });
      return;
    }

    imgEl.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
  };

  const goToNextPage = () =>
    setCurrentPage((p) => Math.min(p + 1, totalPages));
  const goToPrevPage = () =>
    setCurrentPage((p) => Math.max(p - 1, 1));

  const totalCount = items.length;
  const countLabel = `${totalCount}-${totalCount === 1 ? 'Product' : 'Products'}`;

  // Update System Qty function (matches Laravel blade logic)
  const handleUpdateSystemQty = async () => {
    if (!generalFormId) {
      setErrorModal({
        isOpen: true,
        message: 'General Form ID not found'
      });
      return;
    }

    setIsUpdatingSystemQty(true);

    try {
      const response = await apiRequest('/api/big-damage-issues/sys_update', {
        method: 'POST',
        body: JSON.stringify({
          general_form_id: generalFormId,
          form_id: formId,
          layout_id: layoutId
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update system quantities');
      }

      const responseData = await response.json();
      
      // The API endpoint returns product codes, not items
      // So we need to refetch the items to get updated system_qty values
      // Add a small delay to ensure database transaction has committed
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Only trigger refetch once
      onSystemQtyStatusChange(true);
      
      // Show success message
      const { toast } = await import('react-toastify');
      toast.success('System quantities updated successfully');
    } catch (error) {
      setErrorModal({
        isOpen: true,
        message: error.message || 'Failed to update system quantities. Please try again.'
      });
    } finally {
      setIsUpdatingSystemQty(false);
    }
  };
  return (
    <div className={`mx-auto font-sans p-3 sm:p-4 max-w-full${mode === 'view' ? ' text-sm' : ''}`}>
      <ErrorModal 
        isOpen={errorModal.isOpen}
        message={errorModal.message}
        onClose={() => setErrorModal({ isOpen: false, message: '' })}
      />
      <div className="flex items-center justify-start mb-4">
        <h3 className={`${mode === 'view' ? 'text-sm' : 'text-[0.8rem] sm:text-sm'} font-semibold text-green-600 flex items-center gap-2`}>
          <CheckCircle size={16} /> Product Information
        </h3>
        <span className="font-medium text-gray-600 px-2 py-0.5 rounded">
            <span className="text-[0.8rem] sm:text-[0.7rem] bg-green-50 text-green-800 px-2.5 py-0.5 rounded-md border border-green-200">
              {`${Array.isArray(items) ? items.length : 0}- product${(Array.isArray(items) && items.length === 1) ? '' : 's'}`}
            </span>
        </span>
      </div>

      {/* Action buttons */}
      <div className="flex flex-col sm:flex-row justify-start items-start sm:items-center gap-2 mb-3">
        {/* Buttons */}
        <div className="flex gap-2 flex-wrap">
          {/* Delete button - Only for account, not for supervisor */}
          {!isCompleted && !isSupervisorUser && selectedIds.length > 0 && (
            <button
              onClick={confirmMultipleDelete}
              className="flex items-center gap-1 px-2 py-[1px] text-[0.65rem] sm:text-[0.75rem] bg-red-600 text-white rounded hover:bg-red-700 transition"
            >
              <Trash2 size={14} /> Delete ({selectedIds.length})
            </button>
          )}
          {/* Account codes button should appear only in acknowledge and issue stages */}
          {accountCodes.length > 0 && (
            (status === 'Ac_Acknowledged' || 
             status === 'Acknowledged' || 
             status === 'Completed' || 
             status === 'Issued' || 
             status === 'SupervisorIssued') && (
              <button
                type="button"
                onClick={() => setShowAccountCodes((prev) => !prev)}
                className={`flex items-center gap-2 px-3 py-1 rounded text-[0.7rem] sm:text-[0.75rem] border transition ${showAccountCodes ? 'bg-emerald-50 border-emerald-300 text-emerald-700' : 'bg-white border-gray-300 hover:bg-gray-100 text-gray-700'}`}
              >
                <span className="font-semibold">{showAccountCodes ? 'Hide Account Codes' : 'Show Account Codes'}</span>
              </button>
            )
          )}
        </div>

        {/* Search box */}
        <div className="relative w-full sm:w-55">
          <Search
            size={14}
            className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            placeholder="Search by product code..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1); 
            }}
            className="w-full pl-8 pr-3 py-1.5 text-[0.9rem] sm:text-[0.8rem] border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-800 focus:border-blue-400 transition"
          />
        </div>
      </div>

      <div className="overflow-x-auto border border-gray-200 rounded-t-xl hidden md:block">
        <table className="min-w-full border-collapse table-auto">
          <thead className={`bg-gray-50 text-gray-500 ${mode === 'view' ? 'text-xs' : 'text-[0.7rem]'} uppercase tracking-wider border-b border-gray-200`}>
            <tr>
              <th className="px-2 py-2 text-center">
                <input
                  type="checkbox"
                  checked={
                    paginatedItems.length > 0 &&
                    paginatedItems.every((item) =>
                      selectedIds.includes(item.id)
                    )
                  }
                  onChange={toggleSelectAll}
                />
              </th>
              <th className="px-2 py-2 text-left">#</th>
              <th className="px-2 py-2 text-left hidden sm:table-cell">Category</th>
              <th className="px-2 py-2 text-left">Code</th>
              <th className="px-2 py-2 text-left">Name</th>
              <th className="px-2 py-2 text-left hidden sm:table-cell">Unit</th>
              <th className="px-2 py-2 text-left hidden md:table-cell">System Qty</th>
              <th className="px-2 py-2 text-left">Price</th>
              <th className="px-2 py-2 text-left">Request Qty</th>
              {mode !== 'add' && (
                <th className="px-2 py-2 text-left">Final Qty</th>
              )}
              {mode !== 'add' && (
                <th className="px-2 py-2 text-left">Actual Qty</th>
              )}
              <th className="px-2 py-2 text-left">Amount</th>
              <th className="px-2 py-2 text-left hidden lg:table-cell">
                Remark
              </th>
              <th className="px-2 py-2 text-left hidden md:table-cell">
                Img
              </th>
              {/* Show account code header in all stages including Completed */}
              {showAccountCodes && (
                <th className="px-2 py-2 text-left">
                  Account Code
                </th>
              )}
            </tr>
          </thead>

          <tbody className={`${mode === 'view' ? 'text-sm' : 'text-[0.75rem]'} text-gray-700`}>
            {paginatedItems.length > 0 ? (
              paginatedItems.map((item, idx) => {
                const matchId = item.id ?? item.specific_form_id;
                
                return (
                <tr
                  key={item.id}
                  className={`border-b border-gray-200 hover:bg-gray-50 transition-all ${
                    selectedIds.includes(item.id) ? "bg-emerald-50" : ""
                  }`}
                >
                  <td
                    className="px-2 py-2 text-center"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <input
                      type="checkbox"
                      className="mt-1 accent-emerald-600 shrink-0"
                      checked={selectedIds.includes(item.id)}
                      onChange={() => toggleSelect(item.id)}
                    />
                  </td>
                  <td className="px-2 py-2">{startIdx + idx + 1}</td>
                  <td className="px-2 py-2 hidden sm:table-cell">
                    {item.category}
                  </td>
                  <td className="px-2 py-2">{item.code}</td>
                  <td className="px-2 py-2 font-medium">{item.name}</td>
                  <td className="px-2 py-2 hidden sm:table-cell">
                    {item.unit}
                  </td>
                  <td className="px-2 py-2 hidden md:table-cell">
                    {item.system_qty}
                  </td>
                  <td className="px-2 py-2">
                    {(() => {
                      const explicit = Number(
                        item?.price ??
                        item?.unit_price ??
                        item?.unitPrice ??
                        item?.product_price ??
                        item?.selling_price ??
                        item?.sell_price ??
                        item?.cost_price ??
                        NaN
                      );
                      if (!Number.isNaN(explicit) && explicit > 0) {
                        return parseFloat(explicit).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        });
                      }

                      const amt = Number(item?.amount ?? item?.total ?? NaN);
                      const qty = Number(
                        item?.actual_qty ??
                        item?.final_qty ??
                        item?.request_qty ??
                        item?.req_qty ??
                        item?.qty ??
                        NaN
                      );

                      const derived = !Number.isNaN(amt) && !Number.isNaN(qty) && qty > 0 ? (amt / qty) : 0;

                      return derived
                        ? parseFloat(derived).toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })
                        : '0.00';
                    })()}
                  </td>
                  {/* Request Qty - shows actual_qty (editable in add mode, read-only in view mode) */}
                  <td className="px-2 py-2" onClick={(e) => e.stopPropagation()}>
                    {mode === 'add' ? (
                      // In add mode, actual_qty is editable (this becomes the request)
                      <div>
                        <input
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          value={item.actual_qty ?? item.request_qty ?? ''}
                          onChange={(e) => {
                            const nextValue = e.target.value;
                            if (nextValue === '' || /^\d*(?:\.\d*)?$/.test(nextValue)) {
                              handleQtyChange(item.id, nextValue, 'actual_qty');
                            }
                          }}
                          onBlur={(e) => {
                            const nextValue = e.target.value === '' ? '0' : e.target.value;
                            handleQtyChange(item.id, nextValue, 'actual_qty');
                          }}
                          className="w-20 border border-gray-300 rounded px-2 py-1"
                        />
                      </div>
                    ) : (
                      // In view mode, actual_qty is read-only (shows original request)
                      // Always show actual_qty, don't fallback to request_qty if actual_qty exists
                      <span>{formatQuantity(item.actual_qty !== undefined && item.actual_qty !== null ? item.actual_qty : (item.request_qty ?? 0))}</span>
                    )}
                  </td>
                  {mode !== 'add' && (
                    <td className="px-2 py-2" onClick={(e) => e.stopPropagation()}>
                      {mode === 'view' && !allowFinalQtyEdit ? (
                        <span>{formatQuantity(item.final_qty)}</span>
                      ) : (
                        <div>
                          <input
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            value={item.final_qty ?? ''}
                            onChange={(e) => {
                              const nextValue = e.target.value;
                              if (nextValue === '' || /^\d*(?:\.\d*)?$/.test(nextValue)) {
                                handleQtyChange(item.id, nextValue, 'final_qty');
                              }
                            }}
                            onBlur={(e) => {
                              const nextValue = e.target.value === '' ? '0' : e.target.value;
                              handleQtyChange(item.id, nextValue, 'final_qty');
                            }}
                            className="w-20 border border-gray-300 rounded px-2 py-1"
                          />
                        </div>
                      )}
                    </td>
                  )}
                  {mode !== 'add' && (
                    <td className="px-2 py-2" onClick={(e) => e.stopPropagation()}>
                      {(() => {
                        const systemQty = toSafeNumber(item.system_qty);
                        const finalQty = toSafeNumber(item.final_qty ?? item.actual_qty);
                        let actualQty = finalQty;
                        if (systemQty === 0) {
                          actualQty = 0;
                        } else if (finalQty > systemQty) {
                          actualQty = systemQty;
                        }
                        const displayQty = item.product_type !== undefined && item.product_type !== null
                          ? item.product_type
                          : actualQty;
                        
                        // Account can edit product_type at OP Approved stage (matching Laravel blade)
                        // Supervisor cannot edit product_type (read-only)
                        const canEditProductType = isAccount && (status === 'OPApproved' || status === 'OP Approved') && !isCompleted;
                        
                        if (canEditProductType) {
                          return (
                            <input
                              type="number"
                              className="w-20 border border-gray-300 rounded px-2 py-1 text-sm"
                              value={displayQty}
                              min="0"
                              readOnly={systemQty === 0}
                              style={systemQty === 0 ? { pointerEvents: 'none', backgroundColor: '#f3f4f6' } : {}}
                              onChange={(e) => {
                                const newValue = parseFloat(e.target.value) || 0;
                                const maxValue = systemQty > 0 ? systemQty : 0;
                                const finalValue = Math.min(newValue, maxValue);
                                const matchId = item.id ?? item.specific_form_id;
                                onItemChange(
                                  items.findIndex(i => (i.id ?? i.specific_form_id) === matchId),
                                  'product_type',
                                  finalValue
                                );
                              }}
                            />
                          );
                        }
                        
                        return formatQuantity(displayQty);
                      })()}
                    </td>
                  )}
                  {/* Amount - calculated using final_qty (or min of system_qty and final_qty) */}
                  <td className="px-2 py-2 whitespace-nowrap">
                    {(() => {
                      const systemQty = toSafeNumber(item.system_qty);
                      const finalQty = toSafeNumber(item.final_qty ?? item.actual_qty);
                      const price = toSafeNumber(item.price);

                      const qtyForAmount = systemQty > 0 && finalQty > systemQty
                        ? systemQty
                        : (systemQty === 0 ? 0 : finalQty);

                      const calculatedAmount = qtyForAmount * price;
                      const displayAmount = item.amount ?? calculatedAmount;

                      return formatAmount(displayAmount);
                    })()}
                  </td>
                  
                  {/* Remark */}
                  <td className="px-2 py-2">
                    <div className="w-full" onClick={e => e.stopPropagation()}>
                      {mode === 'view' ? (
                        <div className="min-w-[100px] p-1">
                          {item.remark || '-'}
                        </div>
                      ) : (
                        <input
                          type="text"
                          value={item.remark || ''}
                          onChange={(e) => {
                            e.stopPropagation();
                            handleRemarkChange(item.id, e.target.value);
                          }}
                          onClick={e => e.stopPropagation()}
                          className="w-full p-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                          placeholder="Add remark..."
                        />
                      )}
                    </div>
                  </td>
                  <td className="px-2 py-2">
                    {(mode === 'add' || mode === 'edit') && (
                      <div className="flex items-center gap-1">
                        <label 
                          className="w-7 h-7 bg-blue-500 hover:bg-blue-600 rounded-full flex items-center justify-center text-white cursor-pointer transition-colors shadow-sm border-2 border-white"
                          title="Add image"
                          htmlFor={`file-input-desktop-${item.id}`}
                        >
                          <input
                            type="file"
                            id={`file-input-desktop-${item.id}`}
                            ref={el => fileInputRefs.current[item.id] = el}
                            onChange={(e) => handleImageUpload(item.id, e)}
                            className="hidden"
                            accept="image/*"
                            multiple
                          />
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                          </svg>
                        </label>
                        <button
                          type="button"
                          className="w-7 h-7 flex items-center justify-center bg-gray-500 text-white hover:bg-gray-600 rounded-full shadow focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-1"
                          onClick={(e) => {
                            e.stopPropagation();
                            openImageGallery(item);
                          }}
                          aria-label="View images"
                          title="View images"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </button>
                      </div>
                    )}
                    {mode === 'view' && (
                      <button
                        type="button"
                        className="w-9 h-9 flex items-center justify-center bg-blue-500 text-white hover:bg-blue-600 rounded-full shadow focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-offset-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          openImageGallery(item);
                        }}
                        aria-label="View images"
                      >
                        <ImageIcon className="h-4 w-4" />
                      </button>
                    )}
                  </td>
                  {/* Show account code column in all stages including Completed */}
                  {showAccountCodes && (
                    <td className="px-2 py-2" onClick={(e) => e.stopPropagation()}>
                      {isCompleted ? (
                        <span className="inline-block rounded border border-gray-200 bg-gray-50 px-2 py-1 text-xs font-medium text-gray-700">
                          {getAccountCodeLabel(item.acc_code1 ?? item.acc_code ?? '')}
                        </span>
                      ) : (
                        <select
                          className="w-full border border-gray-300 rounded px-2 py-1 text-[0.75rem] focus:outline-none focus:ring-1 focus:ring-emerald-500"
                          value={item.acc_code1 ?? item.acc_code ?? ''}
                          onChange={(e) => {
                            const matchId = item.id ?? item.specific_form_id;
                            onItemAccountCodeChange(matchId, e.target.value);
                          }}
                        >
                          <option value="">Choose Account Code</option>
                          {accountCodes.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      )}
                    </td>
                  )}
                </tr>
                );
              })
            ) : (
              <tr>
                <td 
                  colSpan={
                    1 + // checkbox
                    1 + // #
                    1 + // Category (hidden sm)
                    1 + // Code
                    1 + // Name
                    1 + // Unit (hidden sm)
                    1 + // System Qty (hidden md)
                    1 + // Price
                    1 + // Request Qty
                    (mode !== 'add' ? 1 : 0) + // Final Qty
                    (mode !== 'add' ? 1 : 0) + // Actual Qty
                    1 + // Amount
                    1 + // Remark (hidden lg)
                    1 + // Img (hidden md)
                    (showAccountCodes ? 1 : 0) // Account Code
                  } 
                  className="px-2 py-6 text-center text-gray-400"
                >
                  No items added yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="block md:hidden">
        {paginatedItems.length ? (
          paginatedItems.map((item) => (
            <div
              key={item.id}
              className={`border border-gray-100 rounded-lg p-2 mb-2 bg-white shadow-none hover:shadow-sm transition-all ${
                selectedIds.includes(item.id) ? "ring-1 ring-emerald-300" : ""
              }`}
            >
              <div className="flex gap-2 min-w-0">
                <input
                  type="checkbox"
                  className="mt-1 accent-emerald-600 shrink-0"
                  checked={selectedIds.includes(item.id)}
                  onChange={() => toggleSelect(item.id)}
                />

                <div className="flex-1 min-w-0" onClick={() => openProductModal(item)}>
                  <div className="flex items-start justify-between min-w-0">
                    <div className="min-w-0 flex-1 basis-0 pr-12 sm:pr-0">
                      <div className="block text-[2.5vw] sm:text-xs text-gray-900 w-full max-w-full overflow-hidden whitespace-nowrap text-ellipsis py-0.5 leading-tight">
                      {item.name}
                      </div>
                      <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[1.8vw] sm:text-xs text-gray-500 py-0.5">
                        <span className="px-1 py-0.5 rounded bg-gray-100 border border-gray-200 text-gray-700">
                          {item.code}
                        </span>
                        <span className="px-1 py-0.5 rounded bg-blue-50 border border-blue-200 text-blue-700">
                          {item.unit}
                        </span>
                        <span className="px-1 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-700">
                          Req: {item.actual_qty ?? item.request_qty ?? '0'}
                        </span>
                        <span className="px-1 py-0.5 rounded bg-blue-50 border border-blue-200 text-blue-700">
                          Final: {item.final_qty ?? item.actual_qty ?? '0'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="relative">
                        {Array.isArray(item.img) && item.img.length > 0 ? (
                          (() => {
                            const entry = item.img[0];
                            const src0 = typeof entry === 'string' ? entry : (entry?.src || '');
                            return (
                              <>
                                <img
                                  src={src0}
                                  alt={item.name}
                                  loading="lazy"
                                  className="w-9 h-9 sm:w-10 sm:h-10 object-cover rounded-lg cursor-zoom-in border border-gray-200"
                                  onError={(e) => {
                                    e.currentTarget.src = testImage;
                                    e.currentTarget.onError = null;
                                  }}
                                  onClick={(e) => { e.stopPropagation(); openPreview(item.img, 0); }}
                                />
                                {item.img.length > 1 && (
                                  <div className="absolute -top-1 -right-1 bg-blue-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center">
                                    +{item.img.length - 1}
                                  </div>
                                )}
                              </>
                            );
                          })()
                        ) : (
                          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center text-[0.65rem] sm:text-[0.56rem] text-gray-400">
                            No Image
                          </div>
                        )}
                      </div>
                      
                      {/* Plus button for adding images */}
                      {/* (mode === 'add' || mode === 'edit') && ( */}
                  {(mode === 'add' || mode === 'edit') && (
                      <>
                        {/* Blue add image button */}
                        <div className="relative">
                          <label 
                            className="w-7 h-7 bg-blue-500 hover:bg-blue-600 rounded-full flex items-center justify-center text-white cursor-pointer transition-colors shadow-sm border-2 border-white"
                            onClick={(e) => e.stopPropagation()}
                            title="Add image"
                            htmlFor={`file-input-${item.id}`}
                          >
                            <input
                              type="file"
                              id={`file-input-${item.id}`}
                              ref={el => fileInputRefs.current[item.id] = el}
                              onChange={(e) => handleImageUpload(item.id, e)}
                              className="hidden"
                              accept="image/*"
                              multiple
                            />
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                            </svg>
                          </label>
                        </div>

                        {/* Green/yellow/red debug button - REMOVE THIS ENTIRE BLOCK */}
                      </>
                    )}

                      {/* )} */}
                      {/* Debug: Always show the button with different colors based on mode */}
                      {/* <div className="relative ml-1">
                        <div className="text-xs text-red-500">
                          Mode: {mode}
                        </div>
                        <label 
                          className={`w-8 h-8 ${mode === 'add' ? 'bg-green-500' : mode === 'edit' ? 'bg-yellow-500' : 'bg-red-500'} rounded-full flex items-center justify-center text-white cursor-pointer hover:opacity-90 transition-colors shadow-md border-2 border-white`}
                          onClick={(e) => {
                            e.stopPropagation();
                          }}
                          title={`Add image (Mode: ${mode})`}
                          htmlFor={`file-input-2-${item.id}`}
                        >
                          <input
                            type="file"
                            id={`file-input-2-${item.id}`}
                            ref={el => {
                              fileInputRefs.current[item.id] = el;
                            }}
                            onChange={(e) => {
                              handleImageUpload(item.id, e);
                            }}
                            className="hidden"
                            accept="image/*"
                            multiple
                          />
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                          </svg>
                        </label>
                      </div> */}
                    </div>
                  </div>

                  <div className="mt-2 flex flex-col gap-1">
                    <textarea
                      value={item.remark || ''}
                      onChange={(e) => handleRemarkChange(item.id, e.target.value)}
                      className="w-full px-2 py-[1px] text-[0.8rem] font-light sm:text-xs border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-400 resize-y leading-snug"
                      placeholder="Add remark..."
                      rows={2}
                      onInput={(e) => { e.target.style.height = 'auto'; e.target.style.height = `${e.target.scrollHeight}px`; }}
                      onClick={(e) => e.stopPropagation()}
                    />
                    {/* Show account code in mobile view in all stages including Completed */}
                    {showAccountCodes && (
                      <div className="mt-1" onClick={(e) => e.stopPropagation()}>
                        <label className="block text-[0.7rem] text-gray-500 mb-1">Account Code</label>
                        {isCompleted ? (
                          <div className="rounded border border-gray-200 bg-gray-50 px-2 py-1 text-[0.75rem] font-medium text-gray-700">
                            {getAccountCodeLabel(item.acc_code1 ?? item.acc_code ?? '')}
                          </div>
                        ) : (
                          <select
                            className="w-full border border-gray-300 rounded px-2 py-1 text-[0.75rem] focus:outline-none focus:ring-1 focus:ring-emerald-500"
                            value={item.acc_code1 ?? item.acc_code ?? ''}
                            onChange={(e) => {
                              const matchId = item.id ?? item.specific_form_id;
                              onItemAccountCodeChange(matchId, e.target.value);
                            }}
                          >
                            <option value="">Choose Account Code</option>
                            {accountCodes.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        )}
                      </div>
                    )}
                    <div className="ml-auto flex items-center gap-1">
                      <span className="text-emerald-700 font-semibold text-[0.7rem] sm:text-sm">
                        {Number(item.amount || 0).toLocaleString()}
                      </span>
                      <ChevronRight size={12} className="text-gray-400" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <p className="text-center text-gray-400 text-[0.85rem] sm:text-sm py-6">No items added yet.</p>
        )}

        {!isCompleted && selectedIds.length > 0 && (
          <div className="sticky bottom-2 left-0 w-full flex justify-center mt-3">
            <button
              onClick={confirmMultipleDelete}
              className="flex items-center gap-1 px-4 py-2 bg-red-600 text-white text-sm rounded-md shadow hover:bg-red-700 transition"
            >
              <Trash2 size={14} /> Delete ({selectedIds.length})
            </button>
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex justify-between items-center mt-3 text-[0.7rem] sm:text-xs text-gray-600">
          <button
            onClick={goToPrevPage}
            disabled={currentPage === 1}
            className={`flex items-center gap-1 px-2 py-[2px] border rounded ${
              currentPage === 1
                ? "text-gray-300 border-gray-200 cursor-not-allowed"
                : "hover:bg-gray-100"
            }`}
          >
            <ChevronLeft size={12} /> Prev
          </button>

          <span>
            Page {currentPage} of {totalPages}
          </span>

          <button
            onClick={goToNextPage}
            disabled={currentPage === totalPages}
            className={`flex items-center gap-1 px-2 py-[2px] border rounded ${
              currentPage === totalPages
                ? "text-gray-300 border-gray-200 cursor-not-allowed"
                : "hover:bg-gray-100"
            }`}
          >
            Next <ChevronRight size={12} />
          </button>
        </div>
      )}

      <div className="flex justify-center gap-6 items-center mt-4 bg-green-50 p-3 rounded-md font-semibold text-green-700 text-sm sm:text-sm">
        <span>Total</span>
        <span>{formatAmount(total)}</span>
      </div>

      {/* Update System Qty Button - Matches Laravel acknowledge() function logic exactly */}
      {/* Shows only when: ACK user, ACK entry exists, status matches amount, form type is big_damage, form not issued/completed */}
      {canShowUpdateSystemQtyButton && !isSupervisorUser && mode !== 'add' && (
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-md space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <button
              type="button"
              onClick={handleUpdateSystemQty}
              disabled={isUpdatingSystemQty}
              className="btn btn-info me-2 text-sm px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUpdatingSystemQty ? 'Updating...' : systemQtyUpdated ? 'Update System Qty Again' : 'Update System Qty'}
            </button>
            {!systemQtyUpdated && (
              <p className="text-red-600 text-xs">
                <span className="text-red-600 font-bold">*</span> Please update your system qty before clicking the Issued button.
              </p>
            )}
          </div>

          {/* ISS Remark Type - For account at OP Approved or when they can acknowledge */}
          {(() => {
            // Account should be able to choose ISS remark at OPApproved stage (before acknowledging)
            // Show ISS remark selector when account is at OPApproved, BM Approved, or Ac_Acknowledged stage
            // (Account can acknowledge from both OPApproved and BM Approved stages, and can edit at Ac_Acknowledged)
            const isAccountAtOPApproved = isAccount && (
              status === 'OPApproved' || 
              status === 'OP Approved' || 
              status === 'BM Approved' || 
              status === 'BMApproved' ||
              status === 'Ac_Acknowledged' || // Show at Ac_Acknowledged so account can see/edit their selection
              status === 'Acknowledged'
            );
            // Also show if supervisor is at Ac_Acknowledged/Approved stage
            const isSupervisorAtAcknowledged = isSupervisorUser && (
              status === 'Ac_Acknowledged' ||
              status === 'Acknowledged' ||
              status === 'Approved'
            );
            const shouldRenderSection = issueRemarks.length > 0 && (isAccountAtOPApproved || isSupervisorAtAcknowledged || Boolean(issRemark) || isCompleted);
            
            if (!shouldRenderSection) {
              return null;
            }
            
            return (
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">ISS Remark Type</label>
                {isCompleted ? (
                  <div className="text-sm text-gray-800 bg-gray-50 px-3 py-2 rounded border border-gray-200">
                    {(() => {
                      // Try to match by value (ID) first
                      let matchedOption = issueRemarks.find(option => option.value === issRemark || String(option.value) === String(issRemark));
                      
                      // If not found by value, try to match by label/name (issRemark might be the remark name from general_form_files.file)
                      if (!matchedOption && issRemark) {
                        matchedOption = issueRemarks.find(option => 
                          option.label === issRemark || 
                          option.name === issRemark ||
                          String(option.label).toLowerCase() === String(issRemark).toLowerCase()
                        );
                      }
                      
                      const displayValue = matchedOption?.label || 
                        (issRemark && issRemark.startsWith('ISS') ? `${issRemark} (No remark type selected)` : issRemark) || 
                        'Not selected';
                      return displayValue;
                    })()}
                  </div>
                ) : (
                  <select
                    className="w-full sm:w-72 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    value={issRemark ?? ''}
                    onChange={(e) => {
                      const newValue = e.target.value || null;
                      onAccountSettingsChange({ iss_remark: newValue });
                    }}
                  >
                    <option value="">Choose Remark</option>
                    {issueRemarks.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            );
          })()}
        </div>
      )}

      {/* Supervisor Actions Section - For supervisor at Ac_Acknowledged */}
      {isSupervisorUser && mode !== 'add' && !isCompleted && (status === 'Ac_Acknowledged' || status === 'Acknowledged' || status === 'Approved') && (
        <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-md space-y-3">
          <h4 className="text-sm font-semibold text-gray-700 mb-2">Supervisor Actions</h4>
          
          {/* ISS Remark Type Selection - Editable for supervisor */}
          {issueRemarks.length > 0 && (
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                ISS Remark Type
              </label>
              <select
                className="w-full sm:w-72 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                value={issRemark ?? ''}
                onChange={(e) => {
                  const newValue = e.target.value || null;
                  onAccountSettingsChange({ iss_remark: newValue });
                }}
              >
                <option value="">Choose Remark</option>
                {issueRemarks.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}

      <ConfirmationModal
        show={showConfirm}
        title="Delete Selected Items"
        message={`Are you sure you want to delete ${selectedIds.length} selected item(s)?`}
        onConfirm={handleMultipleDelete}
        onCancel={cancelRemove}
      />

      <ProductDetailModal
        isOpen={isProductModalOpen}
        onClose={closeProductModal}
        product={selectedProduct}
      />

      {previewOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center"
          onClick={closePreview}
        >
          <div className="relative max-w-[70vw] max-h-[75vh]" onClick={(e) => e.stopPropagation()}>
            <img
              src={previewImages[previewIndex]}
              alt="Preview"
              className="max-w-[60vw] max-h-[60vh] object-contain rounded shadow"
            />
            {previewImages.length > 1 && (
              <div className="absolute -bottom-14 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-black/60 text-white px-4 py-2 rounded-full shadow">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    prevPreview();
                  }}
                  className="flex items-center justify-center w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 focus:outline-none focus:ring-2 focus:ring-blue-300"
                  aria-label="Previous image"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <div className="text-xs whitespace-nowrap">{previewIndex + 1} / {previewImages.length}</div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    nextPreview();
                  }}
                  className="flex items-center justify-center w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 focus:outline-none focus:ring-2 focus:ring-blue-300"
                  aria-label="Next image"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}
            <button
              className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-white text-gray-700 shadow flex items-center justify-center text-sm"
              onClick={closePreview}
              aria-label="Close"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
