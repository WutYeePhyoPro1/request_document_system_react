import React from 'react';
import { useTranslation } from 'react-i18next';
import { QuestionMarkCircleIcon } from '@heroicons/react/24/solid';

const ConfirmModal = ({ 
  isOpen, 
  title, 
  message, 
  confirmLabel, 
  cancelLabel, 
  onConfirm, 
  onCancel,
  isLoading,
  loadingText,
  variant = 'primary'
}) => {
  const { t } = useTranslation();

  if (!isOpen) return null;

  const variantStyles = {
    primary: {
      icon: 'bg-blue-100',
      iconColor: 'text-blue-600',
      header: 'bg-blue-50',
      headerText: 'text-blue-800',
      confirmBtn: 'bg-blue-600 hover:bg-blue-700',
    },
    danger: {
      icon: 'bg-red-100',
      iconColor: 'text-red-600',
      header: 'bg-red-50',
      headerText: 'text-red-800',
      confirmBtn: 'bg-red-600 hover:bg-red-700',
    },
    warning: {
      icon: 'bg-yellow-100',
      iconColor: 'text-yellow-600',
      header: 'bg-yellow-50',
      headerText: 'text-yellow-800',
      confirmBtn: 'bg-yellow-600 hover:bg-yellow-700',
    },
  };

  const styles = variantStyles[variant] || variantStyles.primary;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 overflow-hidden animate-scale-in">
        <div className={`${styles.header} p-6 flex flex-col items-center`}>
          <div className={`w-16 h-16 ${styles.icon} rounded-full flex items-center justify-center mb-4`}>
            <QuestionMarkCircleIcon className={`w-10 h-10 ${styles.iconColor}`} />
          </div>
          <h3 className={`text-xl font-bold ${styles.headerText} text-center`}>
            {title || t('modal.confirm', { defaultValue: 'Confirm' })}
          </h3>
        </div>

        <div className="p-6">
          <p className="text-gray-600 text-center">{message}</p>
        </div>

        <div className="px-6 pb-6 flex gap-3">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1 py-3 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50"
          >
            {cancelLabel || t('modal.cancel', { defaultValue: 'Cancel' })}
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`flex-1 py-3 ${styles.confirmBtn} text-white font-semibold rounded-lg transition-colors disabled:opacity-50`}
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                {loadingText}
              </span>
            ) : (
              confirmLabel || t('modal.confirm', { defaultValue: 'Confirm' })
            )}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes scale-in {
          from { transform: scale(0.9); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .animate-scale-in { animation: scale-in 0.2s ease-out; }
      `}</style>
    </div>
  );
};

export default ConfirmModal;

