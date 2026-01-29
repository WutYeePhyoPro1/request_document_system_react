import React from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

/**
 * WarningModal component for displaying warning messages
 * @param {object} props - Component props
 * @param {boolean} props.isOpen - Whether the modal is open
 * @param {string} props.message - Warning message to display
 * @param {function} props.onClose - Callback when modal is closed
 * @returns {JSX.Element|null} WarningModal component
 */
const WarningModal = ({ isOpen, message, onClose }) => {
  const { t } = useTranslation();
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-lg bg-black/10"
      onClick={onClose}
    >
      <div
        className="relative bg-white rounded-xl shadow-2xl max-w-md w-full animate-fadeIn"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-2 text-amber-600">
            <AlertTriangle size={24} />
            <h3 className="text-lg font-semibold">{t('common.warning', { defaultValue: 'Warning' })}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-100 transition-colors"
            aria-label="Close"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-gray-700 leading-relaxed whitespace-pre-line">{message}</p>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 p-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors font-medium"
          >
            {t('common.ok', { defaultValue: 'OK' })}
          </button>
        </div>
      </div>
    </div>
  );
};

export default WarningModal;
