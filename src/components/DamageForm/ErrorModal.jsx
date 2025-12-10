import React, { useEffect } from 'react';
import { XCircle, X } from 'lucide-react';

const ErrorModal = ({ isOpen, onClose, message, autoClose = false, autoCloseDuration = 3000 }) => {
  useEffect(() => {
    if (isOpen && autoClose) {
      // Auto-close after specified duration
      const timer = setTimeout(() => {
        onClose();
      }, autoCloseDuration);

      return () => clearTimeout(timer);
    }
  }, [isOpen, onClose, autoClose, autoCloseDuration]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fadeIn">
      <div 
        className="relative flex flex-col items-center justify-center bg-red-50 border-red-200 border-2 rounded-2xl shadow-2xl p-8 max-w-md w-full transform transition-all duration-300 animate-scaleIn"
        style={{
          animation: 'scaleIn 0.3s ease-out'
        }}
      >
        {/* Close button - only show when not auto-closing */}
        {!autoClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={20} />
          </button>
        )}

        {/* Error Icon with shake animation */}
        <div className="relative flex items-center justify-center w-20 h-20 text-red-500 mb-4">
          <div className="absolute inset-0 bg-red-100 rounded-full animate-ping opacity-75"></div>
          <XCircle 
            size={80} 
            className="relative text-red-500 drop-shadow-lg animate-shake" 
            strokeWidth={2}
          />
        </div>

        {/* Error Title */}
        <h3 className="text-xl font-bold text-gray-800 text-center mb-2">
          Error!
        </h3>

        {/* Error Message */}
        <p className="text-gray-600 text-center font-medium">
          {message}
        </p>

        {/* Action button - only show when not auto-closing */}
        {!autoClose && (
          <button
            onClick={onClose}
            className="mt-6 px-6 py-2 bg-red-500 hover:bg-red-600 text-white font-medium rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg"
          >
            Close
          </button>
        )}

        {/* Progress bar for auto-close */}
        {autoClose && (
          <div className="w-full mt-6 h-1 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-red-500 animate-progressBar"
              style={{
                animation: `progressBar ${autoCloseDuration}ms linear forwards`
              }}
            ></div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes scaleIn {
          from {
            transform: scale(0.8);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }

        @keyframes shake {
          0%, 100% {
            transform: translateX(0);
          }
          10%, 30%, 50%, 70%, 90% {
            transform: translateX(-5px);
          }
          20%, 40%, 60%, 80% {
            transform: translateX(5px);
          }
        }

        @keyframes progressBar {
          from {
            width: 0%;
          }
          to {
            width: 100%;
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }

        .animate-scaleIn {
          animation: scaleIn 0.3s ease-out;
        }

        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }

        .animate-progressBar {
          animation: progressBar linear forwards;
        }
      `}</style>
    </div>
  );
};

export default ErrorModal;
