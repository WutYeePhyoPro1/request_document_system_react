import React, { useState, useEffect } from "react";
import { FileText, Download, Copy, Loader2, ArrowDown } from "lucide-react";
import BigDamageIsuueLogo from '../../assets/images/big-dmg-issue-logo.png';
import ConfirmationModal from './ConfirmationModal';
import { resolveBranchDisplay } from "../common/branchMappings";
import { useTranslation } from 'react-i18next';
import './ButtonHoverEffects.css';

const normalizeRole = (value) => {
  const raw = (value || '').toString().toLowerCase().trim();
  if (!raw) return '';

  if (/^bm$|^branch manager$|^abm$/.test(raw)) return 'bm';
  if (/^account$|^ac_?acknowledged$/.test(raw)) return 'account';
  if (/^supervisor$|^cs$/.test(raw)) return 'supervisor';
  if (/^operation_manager$|^op_manager$|^operation$|^op$/.test(raw)) return 'op_manager';

  return raw;
};

const extractRoleValue = (user) => {
  if (!user || typeof user !== 'object') return '';

  const roleKeys = [
    'role',
    'role_name',
    'roleName',
    'user_role',
    'userRole',
    'role_type',
    'roleType',
    'type',
  ];

  for (const key of roleKeys) {
    const value = user[key];
    if (typeof value === 'string' && value.trim()) {
      return value;
    }
  }

  return '';
};

// Get user role from localStorage
const getRole = () => {
  try {
    const storedUser = JSON.parse(localStorage.getItem('user'));
    if (!storedUser) return '';

    return normalizeRole(extractRoleValue(storedUser));
  } catch (error) { 
    return ''; 
  }
};

const formatHeaderDateTime = (value) => {
  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'];

  let date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) {
    date = new Date();
  }

  const weekday = weekdays[date.getDay()] || '';
  const dayOfMonth = date.getDate();
  const monthLabel = months[date.getMonth()] || '';

  const rawHours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const period = rawHours >= 12 ? 'P.M' : 'A.M';
  const hours12 = rawHours % 12 || 12;

  return {
    dateLabel: `${weekday} | ${dayOfMonth} ${monthLabel}`.trim(),
    timeLabel: `${hours12}:${minutes} ${period}`,
  };
};

export default function DamageFormHeader({
  formData,
  setFormData,
  onOpenInvestigationForm,
  hasInvestigation = false,
  remarkTypeLabel = '',
  isCompleted = false,
  userRoleOverride = null,
  statusOverride = null,
  mode = 'view',
  onDownloadPdf = null,
  isPdfDownloading = false, // Loading state for PDF download
  issueRemarks = [], // Add issueRemarks prop for ISS remark type display
  btpRemark = '' // Back to Previous remark from general_form.remark
}) {
  const { t } = useTranslation();
  // Set the branch from user's session on component mount (only if form doesn't have branch data)
  // CRITICAL: Don't override form's branch - always use form's branch from general_form
  useEffect(() => {
    // Only set branch from user session if form doesn't have branch data from general_form
    // This should only happen when creating a new form
    const hasFormBranch = formData.general_form?.from_branch 
      || formData.general_form?.from_branch_id
      || formData.general_form?.from_branches;
    
    if (hasFormBranch) {
      // Form already has branch data, don't override it
      return;
    }
    
    const storedUser = JSON.parse(localStorage.getItem('user') || '{}');

    // If we already have a branch set, don't change it
    if (formData.branch || formData.branch_name) return;

    // If we have a branch ID, use it to set the branch (only for new forms)
    if (storedUser?.from_branch_id) {
      setFormData(prev => ({
        ...prev,
        branch: storedUser.from_branch_id, // Use numeric ID for database operations
        branch_name: storedUser.from_branch_name || 'Lanthit' // Keep name for display
      }));
    }
  }, [formData.branch, formData.branch_name, formData.general_form?.from_branch, formData.general_form?.from_branch_id, formData.general_form?.from_branches, setFormData]);
  // Removed branch change handlers as branch is now read-only
  

  const userRole = normalizeRole(userRoleOverride) || getRole();
  const statusRaw =
    statusOverride ||
    formData.status ||
    formData.general_form?.status ||
    formData.big_damage_issue?.status ||
    'Ongoing';
  const status = (statusRaw || '').toString().trim();
  const prettyStatus = (s) => {
    const v = (s || '').toString().trim();
    if (!v) return v;
    // Show OPApproved for both OPApproved and Ac_Acknowledged statuses
    if (v === 'Ac_Acknowledged' || v === 'Acknowledged' || v === 'OPApproved' || v === 'OP Approved') return 'OPApproved';
    return v;
  };
  // Use form's branch (from general_form) instead of authenticated user's branch
  const formBranchId = formData.general_form?.from_branch 
    || formData.general_form?.from_branch_id 
    || formData.branch;
  // Prioritize full branch name over short name
  const formBranchName = formData.general_form?.from_branches?.branch_name
    || formData.general_form?.from_branches?.branch_short_name
    || formData.general_form?.from_branch_name
    || formData.branch_name;
  
  const branchDisplay = resolveBranchDisplay({
    branchId: formBranchId,
    branchName: formBranchName,
    fallback: 'Loading branch...',
    t: t
  });
  const docNumber = formData.form_doc_no
    || formData.formDocNo
    || formData.form_doc
    || formData.doc_no
    || formData.document_no
    || '';
  // Extract ISS numbers from multiple possible sources
  const rawIssEntries = formData.iss_numbers
    || formData.issNumbers
    || [];
  
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
  
  const showInvestigationButton = () => {
    // Use backend flag if available (backend determines visibility based on role and status)
    if (formData?.general_form?.show_investigation_button !== undefined) {
      return Boolean(formData.general_form.show_investigation_button);
    }
    
    // Fallback to frontend logic if backend flag is not available
    const normalizedStatus = status.toLowerCase();

    // Show investigation button when status is Completed, Issued, or SupervisorIssued
    if (['completed', 'issued', 'supervisorissued'].includes(normalizedStatus)) {
      return true;
    }
    
    // Show investigation button for all users at Ac_Acknowledged stage
    if (['ac_acknowledged', 'acknowledged', 'operation manager approved'].includes(normalizedStatus)) {
      return true;
    }

    // Supervisor can view investigation form at Approved stage
    if (userRole === 'supervisor' && normalizedStatus === 'approved') {
      return true;
    }
    
    const isBM = ['bm', 'abm'].includes(userRole);
    
    // Always show button for BM/ABM in Checked status or beyond
    if (
      isBM &&
      ['checked', 'bm approved', 'bmapproved', 'opapproved', 'op approved'].includes(normalizedStatus)
    ) {
      return true;
    }
    
    // Account users can view investigation at OPApproved or BM Approved stages
    if (userRole === 'account' && ['opapproved', 'op approved', 'bm approved', 'bmapproved'].includes(normalizedStatus)) {
      return true;
    }
    
    // For other roles, check if there's investigation data
    const hasInvestigation = Boolean(
      formData.investigation ||
      formData.investigate ||
      formData.general_form?.investigation ||
      formData.general_form?.investigate
    );
    
    if (hasInvestigation) {
      return true;
    }
    
    return false;
  };

  const formattedDateTime = formatHeaderDateTime(formData.datetime);
  const headerDateTimeLabel = `${formattedDateTime.dateLabel}  ${formattedDateTime.timeLabel}`.trim();

  const buttonContent = (
    <>
      <FileText className="w-4 h-4" />
      <span>{t('buttons.investigationForm', { defaultValue: 'Investigation Form' })}</span>
    </>
  );

  const handleCopyDocumentNumber = async () => {
    if (!docNumber) return;
    
    try {
      await navigator.clipboard.writeText(docNumber);
      // Show a simple notification
      const notification = document.createElement('div');
      notification.textContent = 'Document number copied!';
      notification.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-md shadow-lg z-50 text-sm';
      document.body.appendChild(notification);
      setTimeout(() => {
        notification.remove();
      }, 2000);
    } catch (err) {
    }
  };

  return (
    
    <div className="relative"> 
         {formData.status && (
  <span
    className="text-sm px-2.5 py-0.5 border font-semibold text-center rounded block w-full sm:hidden sm:w-auto sm:rounded-full border-gray-300"
    style={(() => {
        switch (formData.status) {
          case 'Ongoing':
          return { backgroundColor: '#fbb193', color: '#e1341e' };
          case 'Checked':
          return { backgroundColor: '#fedec3', color: '#fb923c' };
          case 'BM Approved':
        case 'BMApproved':
          return { backgroundColor: '#ffeaab', color: '#e6ac00' };
          case 'OPApproved':
        case 'OP Approved':
        case 'Approved':
          case 'Ac_Acknowledged':
          case 'Acknowledged':
                      return { backgroundColor: '#e9f9cf', color: '#a3e635' };
          case 'Completed':
        case 'Issued':
        case 'SupervisorIssued':
          return { backgroundColor: '#adebbb', color: '#28a745' };
          case 'Cancel':
          case 'Cancelled':
          return { backgroundColor: '#fda19d', color: '#f91206' };
          default:
          return { backgroundColor: '#fef3c7', color: '#d97706' };
        }
    })()}
  >
    {prettyStatus(status)}
  </span>
)}

      <div className=" space-y-4 mb-0 pb-0">
 
        <div className="bg-white   rounded-2xl p-4 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-0 mt-2 relative overflow-hidden">
          {(() => {
            const status = formData.status;
            if (!status) return null;

            // Determine shadow colors based on status (matching DamageIssueList colors)
            let shadowColor;
            
            switch (status) {
              case 'Ongoing':
                shadowColor = '#fbb193'; // Ongoing color
                break;
              case 'Checked':
                shadowColor = '#fedec3'; // Checked color
                break;
              case 'BM Approved':
              case 'BMApproved':
                shadowColor = '#ffeaab'; // BM Approved color
                break;
              case 'OPApproved':
              case 'OP Approved':
              case 'Approved':
              case 'Ac_Acknowledged':
              case 'Acknowledged':
                shadowColor = '#e9f9cf'; // OPApproved color
                break;
              case 'Completed':
              case 'Issued':
              case 'SupervisorIssued':
                shadowColor = '#adebbb'; // Completed color
                break;
              case 'Cancel':
              case 'Cancelled':
                shadowColor = '#fda19d'; // Cancelled color
                break;
              default:
                return null;
            }

            // Convert hex to rgba for shadow effects
            const hexToRgba = (hex, alpha) => {
              const r = parseInt(hex.slice(1, 3), 16);
              const g = parseInt(hex.slice(3, 5), 16);
              const b = parseInt(hex.slice(5, 7), 16);
              return `rgba(${r}, ${g}, ${b}, ${alpha})`;
            };

            return (
              <>
                <div 
                  className="absolute top-0 left-0 right-0 h-20 pointer-events-none blur-sm"
                  style={{
                    background: `linear-gradient(to bottom, ${hexToRgba(shadowColor, 0.6)}, ${hexToRgba(shadowColor, 0.4)}, transparent)`
                  }}
                ></div>
                <div 
                  className="absolute top-0 left-1/2 w-full h-24 pointer-events-none blur-2xl"
                  style={{ 
                    backgroundColor: hexToRgba(shadowColor, 0.5),
                    transform: 'translateX(-50%) translateY(-10px)'
                  }}
                ></div>
              </>
            );
          })()}
          <div className="min-w-0 flex-1 relative z-10">
       <div className="flex items-start gap-2 mb-1">
          <img
                src={BigDamageIsuueLogo}
                alt="Big Damage Issue Logo"
                className="h-7 w-7 sm:h-8 sm:w-8 hidden sm:inline-block"
              />
              <div className="flex flex-col flex-1 min-w-0">
                <h2 className="text-lg font-semibold text-gray-900">
                  {t('damageFormHeader.bigDamageIssueForm', { defaultValue: 'Big Damage Form' })}
                </h2>
                {docNumber && (
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="text-gray-500 text-xs sm:text-sm flex items-center gap-1">
                      ({docNumber})
                    </span>
                    <button
                      onClick={handleCopyDocumentNumber}
                      className="inline-flex items-center justify-center p-1 rounded transition-colors duration-200 bg-transparent hover:bg-gray-100"
                      title="Copy document number"
                      aria-label="Copy document number"
                      style={{ backgroundColor: 'transparent' }}
                    >
                      <Copy className="w-3 h-3 text-gray-500 hover:text-gray-700" />
                    </button>
                  </div>
                )}
                <span className={`inline-block text-sm mt-1 font-medium px-2.5 py-0.5 rounded-md border w-fit ${
                  (formData.caseType || '').toLowerCase().includes('not sell') 
                    ? 'bg-red-50 border-red-200 text-red-700' 
                    : 'bg-green-50 border-green-200 text-green-700'
                }`}>
                  {(() => {
                    const caseType = formData.caseType || '';
                    const caseTypeLower = caseType.toLowerCase();
                    if (caseTypeLower.includes('not sell')) {
                      return t('list.notSell', { defaultValue: 'Not Sell' });
                    } else if (caseTypeLower.includes('other income sell') || caseTypeLower.includes('other income')) {
                      return t('list.otherIncomeSell', { defaultValue: 'Other Income Sell' });
                    }
                    return caseType || t('list.otherIncomeSell', { defaultValue: 'Other Income Sell' });
                  })()}
                </span>
              </div>
            </div>
          </div>
          <div className="flex flex-row sm:flex-col items-start sm:items-end justify-between sm:justify-start gap-2 sm:gap-3 sm:ml-3 relative z-10 flex-shrink-0">
            {formData.status && (
              <span 
                className="text-sm px-2.5 py-0.5 rounded-full border font-semibold hidden sm:inline-block border-gray-300"
                style={(() => {
                switch (formData.status) {
                  case 'Ongoing':
                      return { backgroundColor: '#fbb193', color: '#e1341e' };
                  case 'Checked':
                      return { backgroundColor: '#fedec3', color: '#fb923c' };
                  case 'BM Approved':
                    case 'BMApproved':
                      return { backgroundColor: '#ffeaab', color: '#e6ac00' };
                  case 'OPApproved':
                    case 'OP Approved':
                    case 'Approved':
                      return { backgroundColor: '#e9f9cf', color: '#a3e635' };
                  case 'Ac_Acknowledged':
                  case 'Acknowledged':
                      return { backgroundColor: '#aff1d7', color: '#20be7f' };
                  case 'Completed':
                    case 'Issued':
                    case 'SupervisorIssued':
                      return { backgroundColor: '#adebbb', color: '#28a745' };
                  case 'Cancel':
                  case 'Cancelled':
                      return { backgroundColor: '#fda19d', color: '#f91206' };
                  default:
                      return { backgroundColor: '#fef3c7', color: '#d97706' };
                }
                })()}
              >
                {prettyStatus(status)}
              </span>
          )}
          </div>
          {/* Branch name in top-right corner - adjusted to avoid overlap with status */}
          <div className="absolute top-4 right-4 z-10 sm:top-12 sm:right-4">
            <span className="text-sm text-gray-700 bg-gray-50 border border-gray-100 px-2 py-0.5 rounded-md whitespace-nowrap">
              {branchDisplay}
            </span>
          </div>
        </div>

        {/* Back to Previous Remark - displayed with yellow background like in Blade templates */}
        {/* Show remark when form is in Checked, Ongoing, or BM Approved status (after being sent back) */}
        {(() => {
          const currentStatus = (formData.status || '').toString().trim();
          const normalizedStatus = currentStatus.toLowerCase();
          // Show BTP remark when status is Checked, Ongoing, or BM Approved (after BTP action)
          // BM Approved is included for forms > 500k that were sent back from OPApproved to BM Approved
          const shouldShowRemark = btpRemark &&
                                  btpRemark.trim() !== '' &&
                                  (normalizedStatus === 'checked' || normalizedStatus === 'ongoing' || normalizedStatus === 'bm approved');

          return shouldShowRemark ? (
          <div className="mt-2 p-3 bg-yellow-100 border border-yellow-300 rounded-lg">
            <div className="flex items-start gap-2">
              <span className="text-yellow-800 font-semibold text-sm whitespace-nowrap">Back to Previous Remark:</span>
              <span className="text-yellow-900 text-sm">{btpRemark}</span>
            </div>
          </div>
          ) : null;
        })()}

        {/* Cancellation Remark - displayed with red background like cancelled status */}
        {/* Show remark when form is cancelled */}
        {(() => {
          const currentStatus = (formData.status || '').toString().trim();
          const normalizedStatus = currentStatus.toLowerCase();
          const isCancelled = normalizedStatus === 'cancel' || normalizedStatus === 'cancelled';

          // Get cancellation reason from multiple possible sources
          const cancelReason = formData?.reason ||
                              formData?.cancel_reason ||
                              formData?.cancellation_reason ||
                              formData?.general_form?.reason ||
                              formData?.general_form?.cancel_reason ||
                              formData?.general_form?.cancellation_reason ||
                              '';

          // Get cancelled by name from multiple possible sources, including approvals
          let cancelledByName = formData?.cancelled_by_name ||
                               formData?.cancel_by_name ||
                               formData?.cancelled_by_user?.name ||
                               formData?.cancel_by_user?.name ||
                               formData?.general_form?.cancelled_by_name ||
                               formData?.general_form?.cancel_by_name ||
                               formData?.general_form?.cancelled_by_user?.name ||
                               formData?.general_form?.cancel_by_user?.name ||
                               '';

          // If not found in direct fields, check approvals for Cancel status
          if (!cancelledByName && formData?.approvals) {
            const cancelApproval = formData.approvals.find(approval =>
              (approval?.status || '').toString().toLowerCase() === 'cancel' ||
              (approval?.raw?.status || '').toString().toLowerCase() === 'cancel'
            );
            if (cancelApproval) {
              cancelledByName = cancelApproval.actual_user_name ||
                               cancelApproval.actual_user_full_name ||
                               cancelApproval.name ||
                               cancelApproval.user?.name ||
                               '';
            }
          }

          const shouldShowCancelRemark = isCancelled && (cancelReason || cancelledByName) && (cancelReason.trim() !== '' || cancelledByName.trim() !== '');

          return shouldShowCancelRemark ? (
          <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex flex-col gap-2">
              {cancelledByName && cancelledByName.trim() !== '' && (
                <div className="flex items-start gap-2">
                  <span className="text-red-800 font-semibold text-sm whitespace-nowrap">Cancelled by:</span>
                  <span className="text-red-900 text-sm">{cancelledByName}</span>
                </div>
              )}
              {cancelReason && cancelReason.trim() !== '' && (
                <div className="flex items-start gap-2">
                  <span className="text-red-800 font-semibold text-sm whitespace-nowrap">Cancellation Remark:</span>
                  <span className="text-red-900 text-sm">{cancelReason}</span>
                </div>
              )}
            </div>
          </div>
          ) : null;
        })()}

        <div className="flex flex-col md:flex-row md:items-center justify-between mt-2">
          {/* Hide datetime in add mode */}
          {mode !== 'add' && (
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-800 border border-gray-400 px-3 py-1 rounded-md bg-white/40 whitespace-nowrap">
                {headerDateTimeLabel}
              </span>
            </div>
          )}
          
          {showInvestigationButton() && (
            <div className="hidden md:block">
              <button
                onClick={onOpenInvestigationForm}
                style={{fontSize: '0.9rem'}}
                className="flex items-center space-x-1 px-3 py-1 rounded-md bg-white text-dark shadow-lg border border-gray-400 hover:border-gray-300 hover:bg-gray-50 hover:text-gray-700"
              >
                {buttonContent}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Desktop Download PDF Button - Circular, positioned absolutely bottom-right - Only show when form is completed */}
      {onDownloadPdf && status === 'Completed' && (
        <button
          onClick={onDownloadPdf}
          disabled={isPdfDownloading}
          className={`hidden md:flex fixed bottom-12 right-6 z-50 items-center justify-center w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg transition-all duration-300 ${
            isPdfDownloading 
              ? 'opacity-90 cursor-wait bg-blue-500' 
              : 'hover:bg-blue-700 hover:shadow-xl'
          }`}
          title={isPdfDownloading ? 'Downloading PDF...' : 'Download PDF'}
        >
          {isPdfDownloading ? (
            <Loader2 className="w-6 h-6 animate-spin" />
          ) : (
          <Download className="w-6 h-6" />
          )}
        </button>
      )}

      {/* Mobile Download PDF Button - Circular posit, positioned above investigation button - Only show when form is completed */}
      {onDownloadPdf && status === 'Completed' && (
        <button
          onClick={onDownloadPdf}
          disabled={isPdfDownloading}
          className={`md:hidden fixed bottom-24 right-6 z-50 flex items-center justify-center w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg transition-all duration-300 ${
            isPdfDownloading 
              ? 'opacity-90 cursor-wait bg-blue-500' 
              : 'hover:bg-blue-700 hover:shadow-xl'
          }`}
          title={isPdfDownloading ? 'Downloading PDF...' : 'Download PDF'}
        >
          {isPdfDownloading ? (
            <Loader2 className="w-6 h-6 animate-spin" />
          ) : (
          <Download className="w-6 h-6" />
          )}
        </button>
      )}
      
      {/* Loading Overlay - Show when PDF is downloading */}
      {isPdfDownloading && (
        <div className="fixed inset-0 z-40 flex items-center justify-center pointer-events-none">
          <div className="bg-white rounded-lg shadow-xl p-6 flex flex-col items-center gap-4 border-2 border-blue-200">
            {/* Download Animation: Arrow going into file */}
            <div className="relative w-20 h-20 flex items-center justify-center">
              {/* File Icon - stays in place */}
              <FileText className="w-14 h-14 text-blue-600 absolute z-10" />
              {/* Arrow moving down into file */}
              <div className="absolute z-20" style={{ top: '-12px' }}>
                <ArrowDown 
                  className="w-7 h-7 text-blue-600"
                  style={{
                    animation: 'arrowIntoFile 1.2s ease-in-out infinite'
                  }}
                />
              </div>
            </div>
            <p className="text-gray-700 font-medium">Downloading PDF...</p>
            <style>{`
              @keyframes arrowIntoFile {
                0% {
                  transform: translateY(0) scale(1);
                  opacity: 1;
                }
                40% {
                  transform: translateY(25px) scale(0.9);
                  opacity: 0.9;
                }
                60% {
                  transform: translateY(35px) scale(0.7);
                  opacity: 0.6;
                }
                100% {
                  transform: translateY(45px) scale(0.5);
                  opacity: 0;
                }
              }
            `}</style>
          </div>
        </div>
      )}

      {showInvestigationButton() && (
        <div className="md:hidden fixed bottom-6 right-6 z-50">
          <button
            onClick={onOpenInvestigationForm}
            // Circular shape and larger size for a touch target
            className="flex flex-col items-center justify-center w-16 h-16 bg-white hover:bg-blue-500 text-blue-500 rounded-full shadow-lg transition-colors hover:text-white"
          >
            {/* Adjust content for circular view */}
            <FileText className="w-6 h-6" />
            <span className="text-[0.55rem] font-medium leading-none mt-0.5">{t('buttons.investigation', { defaultValue: 'Investigation' })}</span>
          </button>
        </div>
      )}
      <ConfirmationModal
        isOpen={false}
        onClose={() => {}}
        onConfirm={() => {}}
        title=""
        message=""
        confirmText=""
        cancelText=""
        isDanger={false}
      />
    </div>
  );
};