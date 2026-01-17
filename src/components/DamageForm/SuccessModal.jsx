import React, { useEffect } from 'react';
import { CheckCircle } from 'lucide-react';

const SuccessModal = ({ isOpen, onClose, message, action }) => {
  useEffect(() => {
    if (isOpen) {
      // Auto-close after 1 second
      const timer = setTimeout(() => {
        onClose();
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Get icon animation and color based on action
  const getActionStyle = () => {
    switch (action) {
      case 'submit':
      case 'Submit':
        return { color: 'text-blue-500', bg: 'bg-blue-50', border: 'border-blue-200' };
      case 'check':
      case 'Check':
      case 'CheckMem':
        return { color: 'text-green-500', bg: 'bg-green-50', border: 'border-green-200' };
      case 'approve':
      case 'Approve':
      case 'BMApproved':
      case 'BMApprovedMem':
        return { color: 'text-purple-500', bg: 'bg-purple-50', border: 'border-purple-200' };
      case 'acknowledge':
      case 'Acknowledge':
      case 'AcAcknowledge':
        return { color: 'text-indigo-500', bg: 'bg-indigo-50', border: 'border-indigo-200' };
      case 'issue':
      case 'Issue':
      case 'SupervisorIssue':
        return { color: 'text-emerald-500', bg: 'bg-emerald-50', border: 'border-emerald-200' };
      case 'BackToPrevious':
      case 'backtoprevious':
        return { color: 'text-orange-500', bg: 'bg-orange-50', border: 'border-orange-200' };
      case 'Cancel':
      case 'cancel':
        return { color: 'text-red-500', bg: 'bg-red-50', border: 'border-red-200' };
      default:
        return { color: 'text-green-500', bg: 'bg-green-50', border: 'border-green-200' };
    }
  };

  const style = getActionStyle();

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fadeIn">
      <div 
        className={`relative flex flex-col items-center justify-center ${style.bg} ${style.border} border-2 rounded-2xl shadow-2xl p-8 max-w-md w-full transform transition-all duration-300 animate-scaleIn`}
        style={{
          animation: 'scaleIn 0.3s ease-out'
        }}
      >
        {/* Success Icon with pulse animation */}
        <div className={`relative flex items-center justify-center w-20 h-20 ${style.color} mb-4`}>
          <div className={`absolute inset-0 ${style.bg} rounded-full animate-ping opacity-75`}></div>
          <CheckCircle 
            size={80} 
            className={`relative ${style.color} drop-shadow-lg`} 
            strokeWidth={2}
          />
        </div>

        {/* Success Message */}
        <h3 className="text-xl font-bold text-gray-800 text-center mb-2">
          Success!
        </h3>
        <p className="text-gray-600 text-center font-medium">
          {message}
        </p>

        {/* Progress bar */}
        <div className="w-full mt-6 h-1 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className={`h-full ${style.color.replace('text-', 'bg-')} animate-progressBar`}
            style={{
              animation: 'progressBar 1s linear forwards'
            }}
          ></div>
        </div>
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

        .animate-progressBar {
          animation: progressBar 1s linear forwards;
        }
      `}</style>
    </div>
  );
};

export default SuccessModal;
