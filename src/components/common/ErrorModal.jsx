import React from 'react';
import { X, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

/**
 * ErrorModal component for displaying error messages
 * @param {object} props - Component props
 * @param {boolean} props.isOpen - Whether the modal is open
 * @param {string} props.message - Error message to display
 * @param {function} props.onClose - Callback when modal is closed
 * @returns {JSX.Element|null} ErrorModal component
 */
const ErrorModal = ({ isOpen, message, onClose }) => {
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
          <div className="flex items-center gap-2 text-red-600">
            <AlertCircle size={24} />
            <h3 className="text-lg font-semibold">{t('common.error', { defaultValue: 'Error' })}</h3>
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
          {(() => {
            const errorMessage = message || 'An error occurred. Please try again.';
            // Split message by newlines
            const lines = errorMessage.split('\n').filter(line => line.trim().length > 0);
            
            if (lines.length === 1) {
              // Single line message
              return <p className="text-gray-700 leading-relaxed whitespace-pre-line">{errorMessage}</p>;
            }
            
            // Multiple lines - display each on a separate line with numbering
            return (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {lines.map((line, index) => (
                  <div 
                    key={index}
                    className="flex items-start gap-3 p-3 bg-red-50 rounded-lg border border-red-200"
                  >
                    <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-red-600 text-white rounded-full text-sm font-bold">
                      {index + 1}
                    </span>
                    <span className="text-gray-800 flex-1 leading-relaxed">
                      {line.trim()}
                    </span>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 p-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
          >
            {t('common.close', { defaultValue: 'Close' })}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ErrorModal;

