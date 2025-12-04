import React, { useState } from "react";
import { FileText, Download } from "lucide-react";
import BigDamageIsuueLogo from '../../assets/images/big-dmg-issue-logo.png';
import ConfirmationModal from './ConfirmationModal';
import { useEffect } from 'react';
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
  onDownloadPdf = null
}) {
  const { t } = useTranslation();
  // Set the branch from user's session on component mount
  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('user') || '{}');

    // If we already have a branch set, don't change it
    if (formData.branch || formData.branch_name) return;

    // If we have a branch ID, use it to set the branch
    if (storedUser?.from_branch_id) {
      setFormData(prev => ({
        ...prev,
        branch: storedUser.from_branch_id, // Use numeric ID for database operations
        branch_name: storedUser.from_branch_name || 'Lanthit' // Keep name for display
      }));
    }
  }, [formData.branch, formData.branch_name, setFormData]);
  // Removed branch change handlers as branch is now read-only

  const userRole = normalizeRole(userRoleOverride) || getRole();
  const statusRaw =
    statusOverride ||
    formData.status ||
    formData.general_form?.status ||
    formData.big_damage_issue?.status ||
    'Ongoing';
  const status = (statusRaw || '').toString().trim();
  const branchDisplay = resolveBranchDisplay({
    branchId: formData.branch,
    branchName: formData.branch_name,
    fallback: 'Loading branch...'
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
    const isBM = userRole === 'bm' || userRole === 'abm';
    const isSupervisor = userRole === 'supervisor';
    const hasInvestigationData = Boolean(
      hasInvestigation ||
      formData?.investigation ||
      formData?.investigate ||
      formData?.general_form?.investigation ||
      formData?.general_form?.investigate ||
      formData?.big_damage_issue?.investigation ||
      formData?.big_damage_issue?.investigate
    );

    // Always show for BM/ABM in Checked status or beyond
    if (isBM && ['Checked', 'BM Approved', 'BMApproved', 'OPApproved', 'Completed'].includes(status)) {
      return true;
    }
    
    // Supervisor can view investigation form at Ac_Acknowledged stage
    if (isSupervisor && (status === 'Ac_Acknowledged' || status === 'Acknowledged' || status === 'Approved' || status === 'Completed')) {
      return true;
    }
    
    // For completed forms, show button if investigation exists (read-only view)
    if (status === 'Completed' && hasInvestigationData) {
      return true;
    }
    
    // For other roles with investigation data
    if (hasInvestigationData) {
      const allowedRoles = ['op_manager', 'account'];
      if (allowedRoles.includes(userRole)) {
        const allowedStatuses = userRole === 'op_manager' 
          ? ['BM Approved', 'BMApproved', 'OPApproved', 'Ac_Acknowledged', 'Acknowledged', 'Completed']
          : ['OPApproved', 'BM Approved', 'BMApproved', 'Ac_Acknowledged', 'Acknowledged', 'Completed'];
          
        const canView = allowedStatuses.includes(status);
        return canView;
      }
    }
    
    // Account users should be able to view investigation at Ac_Acknowledged stage even without investigation data
    // (They might need to view it before acknowledging)
    if (userRole === 'account' && (status === 'Ac_Acknowledged' || status === 'Acknowledged' || status === 'OPApproved' || status === 'OP Approved')) {
      return true;
    }
    
    return false;
  };

  const formattedDateTime = formatHeaderDateTime(formData.datetime);
  const headerDateTimeLabel = `${formattedDateTime.dateLabel}  ${formattedDateTime.timeLabel}`.trim();

  const buttonContent = (
    <>
      <FileText className="w-4 h-4" />
      <span>Investigation Form</span>
    </>
  );

  return (
    
    <div className="relative"> 
         {formData.status && (
  <span
    className={`text-sm px-2.5 py-0.5 border font-semibold text-center rounded block w-full sm:hidden sm:w-auto sm:rounded-full ${
      (() => {
        switch (formData.status) {
          case 'Ongoing':
            return 'bg-orange-100 text-orange-700 border-orange-300';
          case 'Checked':
            return 'bg-yellow-100 text-yellow-700 border-yellow-300';
          case 'BM Approved':
            return 'bg-blue-600 text-white border-blue-700';
          case 'OPApproved':
            return 'op-approved-status-badge';
          case 'Ac_Acknowledged':
          case 'Acknowledged':
            return 'acknowledge-status-badge';
          case 'Approved':
            return 'bg-green-100 text-green-700 border-green-300';
          case 'Completed':
            return 'bg-emerald-100 text-emerald-700 border-emerald-300';
          case 'Cancel':
          case 'Cancelled':
            return 'bg-red-100 text-red-700 border-red-300';
          default:
            return 'bg-yellow-100 text-yellow-700 border-yellow-300';
        }
      })()
    }`}
  >
    {formData.status}
  </span>
)}

      <div className=" space-y-4 mb-0 pb-0">
        <div className="flex justify-between items-center">
          <span className="text-gray-400 text-sm hidden sm:inline-block">
            Dashboard / Big Damage Issue Form
          </span>
        </div>
        <div className="bg-white border border-gray-200 shadow-sm rounded-2xl p-4 flex items-start justify-between mt-2 relative overflow-hidden">
          {(() => {
            const status = formData.status;
            if (!status) return null;

            // Determine shadow colors based on status
            let gradientFrom, gradientVia, blurColor;
            
            switch (status) {
              case 'Ongoing':
                gradientFrom = 'from-orange-300/60';
                gradientVia = 'via-orange-200/40';
                blurColor = 'bg-orange-300/50';
                break;
              case 'Checked':
                gradientFrom = 'from-yellow-300/60';
                gradientVia = 'via-yellow-200/40';
                blurColor = 'bg-yellow-300/50';
                break;
              case 'BM Approved':
                gradientFrom = 'from-blue-300/60';
                gradientVia = 'via-blue-200/40';
                blurColor = 'bg-blue-300/50';
                break;
              case 'Completed':
                gradientFrom = 'from-green-300/60';
                gradientVia = 'via-green-200/40';
                blurColor = 'bg-green-300/50';
                break;
              case 'OPApproved':
                // OP Approved badge color (blue/purple) - using indigo for shadow
                gradientFrom = 'from-indigo-300/60';
                gradientVia = 'via-indigo-200/40';
                blurColor = 'bg-indigo-300/50';
                break;
              case 'Ac_Acknowledged':
              case 'Acknowledged':
                // Acknowledge badge color (#aff1d7 - light mint green, text #20be7f)
                // Using custom colors that match the badge better
                return (
                  <>
                    <div className="absolute top-0 left-0 right-0 h-20 bg-gradient-to-b from-[#aff1d7]/60 via-[#aff1d7]/40 to-transparent pointer-events-none blur-sm"></div>
                    <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-full h-24 bg-[#aff1d7]/50 blur-2xl pointer-events-none" style={{ transform: 'translateX(-50%) translateY(-10px)' }}></div>
                  </>
                );
              default:
                return null;
            }

            return (
              <>
                <div className={`absolute top-0 left-0 right-0 h-20 bg-gradient-to-b ${gradientFrom} ${gradientVia} to-transparent pointer-events-none blur-sm`}></div>
                <div className={`absolute top-0 left-1/2 transform -translate-x-1/2 w-full h-24 ${blurColor} blur-2xl pointer-events-none`} style={{ transform: 'translateX(-50%) translateY(-10px)' }}></div>
              </>
            );
          })()}
          <div className="min-w-0 relative z-10">
       <div className="flex items-center gap-2 mb-1">
          <img
                src={BigDamageIsuueLogo}
                alt="Big Damage Issue Logo"
                className="h-7 w-7 sm:h-8 sm:w-8 hidden sm:inline-block"
              />
              <div className="flex flex-col">
                <h2 className="text-lg font-semibold text-gray-900">
<<<<<<< HEAD
                  {t('damageFormHeader.bigDamageIssueForm', { defaultValue: 'Big Damage Form' })}
=======
                  {t('damageFormHeader.bigDamageIssueForm')}
>>>>>>> 76fac46 (before fix testing error)
                  {docNumber && (
                    <span className="text-gray-500 text-[0.8rem] sm:text-sm md:ml-2 md:inline-block">
                      ({docNumber})
                    </span>
                  )}
                </h2>
              </div>
            </div>

<<<<<<< HEAD
            <p className="text-sm text-gray-500 mt-0.5">{t('damageFormHeader.otherIncomeSell', { defaultValue: 'Other Income Sell' })}</p>
=======
            <p className="text-sm text-gray-500 mt-0.5">{t('damageFormHeader.otherIncomeSell')}</p>
>>>>>>> 76fac46 (before fix testing error)
          </div>
          <div className="flex flex-col items-end gap-3 ml-3 relative z-10">
            {formData.status && (
              <span className={`text-sm px-2.5 py-0.5 rounded-full border font-semibold hidden sm:inline-block ${(() => {
                switch (formData.status) {
                  case 'Ongoing':
                    return 'bg-orange-100 text-orange-700 border-orange-300';
                  case 'Checked':
                    return 'bg-yellow-100 text-yellow-700 border-yellow-300';
                  case 'BM Approved':
                    return 'bg-blue-600 text-white border-blue-700';

                  case 'OPApproved':
                    return 'op-approved-status-badge';
                  case 'Ac_Acknowledged':
                  case 'Acknowledged':
                    return 'acknowledge-status-badge';
                  case 'Approved':
                    return 'bg-green-100 text-green-700 border-green-300';
                  case 'Completed':
                    return 'bg-emerald-100 text-emerald-700 border-emerald-300';
                  case 'Cancel':
                  case 'Cancelled':
                    return 'bg-red-100 text-red-700 border-red-300';
                  default:
                    return 'bg-yellow-100 text-yellow-700 border-yellow-300';
                }
              })()}`}>
                {formData.status}
              </span>
          )}
            <span className="text-sm text-gray-700 bg-gray-50 border border-gray-100 px-2 py-0.5 rounded-md">
              {branchDisplay}
            </span>
          </div>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between mt-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-800 border border-gray-400 px-3 py-1 rounded-md bg-white/40 whitespace-nowrap">
              {headerDateTimeLabel}
            </span>
          </div>
          
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

      {/* Desktop Download PDF Button - Circular, positioned absolutely bottom-right - Only show when form is completed/issued/acknowledged */}
      {onDownloadPdf && (status === 'Completed' || status === 'Issued' || status === 'Ac_Acknowledged' || status === 'Acknowledged' || status === 'OPApproved' || status === 'OP Approved' || status === 'SupervisorIssued') && (
        <button
          onClick={onDownloadPdf}
          className="hidden md:flex fixed bottom-12 right-6 z-50 items-center justify-center w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg transition-all duration-300 hover:shadow-xl"
        >
          <Download className="w-6 h-6" />
        </button>
      )}

      {/* Mobile Download PDF Button - Circular, positioned above investigation button - Only show when form is completed/issued/acknowledged */}
      {onDownloadPdf && (status === 'Completed' || status === 'Issued' || status === 'Ac_Acknowledged' || status === 'Acknowledged' || status === 'OPApproved' || status === 'OP Approved' || status === 'SupervisorIssued') && (
        <button
          onClick={onDownloadPdf}
          className="md:hidden fixed bottom-24 right-6 z-50 flex items-center justify-center w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg transition-all duration-300 hover:shadow-xl"
        >
          <Download className="w-6 h-6" />
        </button>
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
            <span className="text-[0.55rem] font-medium leading-none mt-0.5">Investigation</span>
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