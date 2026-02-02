import React from 'react';
import { useTranslation } from 'react-i18next';
import { CheckCircleIcon, XMarkIcon } from '@heroicons/react/24/solid';

const SuccessModal = ({ isOpen, message, action, onClose }) => {
  const { t } = useTranslation();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 overflow-hidden animate-scale-in">
        <div className="bg-green-50 p-6 flex flex-col items-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircleIcon className="w-10 h-10 text-green-600" />
          </div>
          <h3 className="text-xl font-bold text-green-800 text-center">
            {t('modal.success', { defaultValue: 'Success!' })}
          </h3>
        </div>

        <div className="p-6">
          <p className="text-gray-600 text-center">{message}</p>
          
          {action && (
            <p className="text-sm text-gray-500 text-center mt-2">
              {t('modal.action', { defaultValue: 'Action' })}: {action}
            </p>
          )}
        </div>

        <div className="px-6 pb-6">
          <button
            onClick={onClose}
            className="w-full py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors"
          >
            {t('modal.close', { defaultValue: 'Close' })}
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

export default SuccessModal;

