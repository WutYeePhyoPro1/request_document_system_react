import React from 'react';
import { X, AlertCircle } from 'lucide-react';

/**
 * ErrorModal component for displaying error messages
 * @param {object} props - Component props
 * @param {boolean} props.isOpen - Whether the modal is open
 * @param {string} props.message - Error message to display
 * @param {function} props.onClose - Callback when modal is closed
 * @returns {JSX.Element|null} ErrorModal component
 */
const ErrorModal = ({ isOpen, message, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full animate-fadeIn">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-2 text-red-600">
            <AlertCircle size={24} />
            <h3 className="text-lg font-semibold">Error</h3>
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
          <p className="text-gray-700">{message || 'An error occurred. Please try again.'}</p>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 p-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ErrorModal;

