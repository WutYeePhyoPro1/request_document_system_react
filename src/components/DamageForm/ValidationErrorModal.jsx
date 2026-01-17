import React from 'react';
import { X, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

/**
 * ValidationErrorModal component for displaying validation error messages in a list format
 * @param {object} props - Component props
 * @param {boolean} props.isOpen - Whether the modal is open
 * @param {string[]} props.errors - Array of error messages to display
 * @param {function} props.onClose - Callback when modal is closed
 * @returns {JSX.Element|null} ValidationErrorModal component
 */
const ValidationErrorModal = ({ isOpen, errors = [], onClose }) => {
  const { t } = useTranslation();
  
  if (!isOpen || !errors || errors.length === 0) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-lg bg-black/30"
      onClick={onClose}
    >
      <div 
        className="relative bg-white rounded-xl shadow-2xl max-w-lg w-full animate-fadeIn"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3 text-red-600">
            <AlertCircle size={28} className="flex-shrink-0" />
            <h3 className="text-xl font-bold">{t('messages.errors.validation.title', { defaultValue: 'Validation Error' })}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            aria-label="Close"
          >
            <X size={24} className="text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-gray-700 mb-4 font-medium">
            {t('messages.errors.validation.pleaseFillRequired', { defaultValue: 'Please fill in all required fields:' })}
          </p>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {errors.map((error, index) => (
              <div 
                key={index}
                className="flex items-start gap-3 p-3 bg-red-50 rounded-lg border border-red-200"
              >
                <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-red-600 text-white rounded-full text-sm font-bold">
                  {index + 1}
                </span>
                <span className="text-gray-800 flex-1 leading-relaxed">
                  {error}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium text-base shadow-sm hover:shadow-md"
          >
            {t('common.close', { defaultValue: 'Close' })}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ValidationErrorModal;

