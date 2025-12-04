import React from 'react';
import { AlertCircle, X, CheckCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import './ButtonHoverEffects.css';

/**
 * Action Confirmation Modal
 * 
 * Shows a confirmation dialog before submitting form actions (Submit, Check, Approve, Acknowledge, Issue)
 * 
 * USAGE:
 * <ActionConfirmationModal
 *   isOpen={isOpen}
 *   action="Submit" // or "Checked", "BMApproved", "Ac_Acknowledged", "Completed", etc.
 *   onConfirm={handleConfirm}
 *   onCancel={handleCancel}
 * />
 */

export default function ActionConfirmationModal({
  isOpen = false,
  action = '',
  emptyFields = [],
  onConfirm = () => {},
  onCancel = () => {}
}) {
  const { t } = useTranslation();
  if (!isOpen) return null;

  // Normalize action string (similar to DamageFormLayout)
  const normalize = (str) => {
    if (!str || typeof str !== 'string') return '';
    return str.trim().replace(/\s+/g, '');
  };

  // Get button color classes matching DamageFormLayout logic
  const getButtonColorClasses = (action) => {
    const a = normalize(action);
    if (!a) return {
      bg: 'bg-orange-600',
      hover: 'hover:bg-orange-700',
      focus: 'focus:ring-orange-500'
    };

    switch (a) {
      case 'Checked':
        return {
          bg: 'bg-yellow-500',
          hover: 'hover:bg-yellow-600',
          focus: 'focus:ring-yellow-500',
          customClass: null
        };
      case 'BMApproved':
        return {
          bg: 'bg-blue-600',
          hover: 'hover:bg-blue-700',
          focus: 'focus:ring-blue-500',
          customClass: null
        };
      case 'OPApproved':
      case 'OPApprovedMem':
        return {
          bg: '',
          hover: '',
          focus: 'focus:ring-purple-500',
          customClass: 'op-approved-btn-custom'
        };
      case 'Ac_Acknowledged':
      case 'Acknowledged':
        return {
          bg: '',
          hover: '',
          focus: 'focus:ring-teal-500',
          customClass: 'acknowledge-btn-custom'
        };
      case 'Completed':
      case 'Issue':
      case 'Issued':
      case 'SupervisorIssued':
        return {
          bg: 'bg-green-600',
          hover: 'hover:bg-green-700',
          focus: 'focus:ring-green-500',
          customClass: null
        };
      case 'Rejected':
        return {
          bg: 'bg-red-600',
          hover: 'hover:bg-red-700',
          focus: 'focus:ring-red-500',
          customClass: null
        };
      case 'Cancel':
      case 'Cancelled':
        return {
          bg: 'bg-red-600',
          hover: 'hover:bg-red-700',
          focus: 'focus:ring-red-500',
          customClass: null
        };
      case 'BackToPrevious':
        return {
          bg: 'bg-yellow-600',
          hover: 'hover:bg-yellow-700',
          focus: 'focus:ring-yellow-500',
          customClass: null
        };
      case 'Cancel':
        return {
          bg: 'bg-red-600',
          hover: 'hover:bg-red-700',
          focus: 'focus:ring-red-500',
          customClass: null
        };
      default:
        // Default orange for Submit (matches Ongoing status)
        return {
          bg: 'bg-orange-600',
          hover: 'hover:bg-orange-700',
          focus: 'focus:ring-orange-500',
          customClass: null
        };
    }
  };

  // Map action to user-friendly label
  const getActionLabel = (action) => {
    const actionMap = {
      'Submit': t('confirmation.actions.submitForm'),
      'Checked': t('confirmation.actions.checkForm'),
      'BMApproved': t('confirmation.actions.approveBM'),
      'BM Approved': t('confirmation.actions.approveBM'),
      'Ac_Acknowledged': t('confirmation.actions.acknowledge'),
      'Acknowledged': t('confirmation.actions.acknowledge'),
      'OPApproved': t('confirmation.actions.approveOperationManager'),
      'Completed': t('confirmation.actions.issue'),
      'Issued': t('confirmation.actions.issue'),
      'Rejected': t('confirmation.actions.rejectForm'),
      'Edit': t('confirmation.actions.editForm'),
      'BackToPrevious': t('confirmation.actions.backToPrevious'),
<<<<<<< HEAD
      'Cancel': t('confirmation.actions.cancelForm', { defaultValue: 'Cancel Form' }),
      'Cancelled': t('confirmation.actions.cancelForm', { defaultValue: 'Cancel Form' })
=======
      'Cancel': t('confirmation.actions.cancelForm') || 'Cancel Form'
>>>>>>> 76fac46 (before fix testing error)
    };
    return actionMap[action] || action || t('confirmation.actions.performAction');
  };

  const actionLabel = getActionLabel(action);
  const buttonColors = getButtonColorClasses(action);
<<<<<<< HEAD
  const isDestructive = ['Rejected', 'BackToPrevious', 'Cancel', 'Cancelled'].includes(action);
=======
  const isDestructive = ['Rejected', 'BackToPrevious', 'Cancel'].includes(action);
>>>>>>> 76fac46 (before fix testing error)
  
  // Get header background color based on action
  const getHeaderColorClasses = (action) => {
    const a = normalize(action);
    if (!a) return { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-600' };

    switch (a) {
      case 'Checked':
        return { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-600' };
      case 'BMApproved':
        return { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-600' };
      case 'OPApproved':
        return { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-600' };
      case 'Ac_Acknowledged':
      case 'Acknowledged':
        return { bg: 'bg-teal-50', border: 'border-teal-200', text: 'text-teal-600' };
      case 'Completed':
      case 'Issue':
      case 'Issued':
        return { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-600' };
      case 'Rejected':
        return { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-600' };
      case 'Cancel':
      case 'Cancelled':
        return { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-600' };
      case 'BackToPrevious':
        return { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-600' };
      case 'Cancel':
        return { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-600' };
      default:
        return { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-600' };
    }
  };
  
  const headerColors = getHeaderColorClasses(action);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop - Transparent with backdrop blur */}
      <div 
        className="fixed inset-0 bg-transparent backdrop-blur-sm transition-opacity"
        onClick={onCancel}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className={`flex items-center justify-between px-6 py-4 border-b ${headerColors.bg} ${headerColors.border}`}>
            <div className="flex items-center gap-3">
              <AlertCircle className={`w-6 h-6 ${headerColors.text}`} />
              <h3 className={`text-lg font-semibold ${headerColors.text.replace('-600', '-900')}`}>
                {t('common.confirm')} {actionLabel}
              </h3>
            </div>
            <button
              onClick={onCancel}
              className={`rounded-md p-1 transition-colors ${headerColors.text} hover:opacity-70`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            {/* Confirmation message */}
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <p className="text-sm text-gray-700">
                {t('confirmation.areYouSureAction', { action: actionLabel.toLowerCase() })}
              </p>
              {action === 'Submit' && (
                <p className="text-xs text-gray-600 mt-2">
                  {t('confirmation.submitDescription')}
                </p>
              )}
              {action === 'Rejected' && (
                <p className="text-xs text-red-600 mt-2">
                  {t('confirmation.rejectDescription')}
                </p>
              )}
              {(action === 'Cancel' || action === 'Cancelled') && (
                <p className="text-xs text-red-600 mt-2">
                  {t('confirmation.cancelDescription')}
                </p>
              )}
              {action === 'BackToPrevious' && (
                <p className="text-xs text-yellow-600 mt-2">
                  {t('confirmation.backToPreviousDescription')}
                </p>
              )}
              {action === 'Cancel' && (
                <p className="text-xs text-red-600 mt-2">
                  {t('confirmation.cancelDescription') || 'This action will cancel the form. You won\'t be able to revert this!'}
                </p>
              )}
            </div>

            {/* Empty Fields Warning */}
            {emptyFields.length > 0 && (
              <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-yellow-800 mb-2">
                      {t('messages.emptyFieldsWarning')}
                    </p>
                    <ul className="list-disc list-inside space-y-1">
                      {emptyFields.map((field, index) => (
                        <li key={index} className="text-xs text-yellow-700">
                          {field}
                        </li>
                      ))}
                    </ul>
                    <p className="text-xs text-yellow-600 mt-2">
                      {t('messages.submittingWithWarnings')}
                    </p>
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t bg-gray-50">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
            >
              {t('common.cancel')}
            </button>
            <button
              onClick={onConfirm}
              className={`px-4 py-2 text-sm font-medium text-white rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors ${
                buttonColors.customClass 
                  ? buttonColors.customClass 
                  : `${buttonColors.bg} ${buttonColors.hover}`
              } ${buttonColors.focus}`}
            >
              <span className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                {t('common.confirm')} {actionLabel}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
