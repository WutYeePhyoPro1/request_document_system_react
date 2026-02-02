import React from 'react';
import { useTranslation } from 'react-i18next';
import { CheckCircleIcon, ClockIcon } from '@heroicons/react/24/solid';

const ApprovalStep = ({ label, name, date, acted, isLast }) => {
  const { t } = useTranslation();

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    try {
      return new Date(dateStr).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="flex items-start gap-3">
      <div className="flex flex-col items-center">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
          acted ? 'bg-green-100' : 'bg-gray-100'
        }`}>
          {acted ? (
            <CheckCircleIcon className="w-5 h-5 text-green-600" />
          ) : (
            <ClockIcon className="w-5 h-5 text-gray-400" />
          )}
        </div>
        {!isLast && (
          <div className={`w-0.5 h-8 ${acted ? 'bg-green-300' : 'bg-gray-200'}`} />
        )}
      </div>

      <div className="flex-1 pb-4">
        <p className={`text-sm font-medium ${acted ? 'text-gray-900' : 'text-gray-500'}`}>
          {label}
        </p>
        {acted && name && (
          <p className="text-sm text-gray-600">{name}</p>
        )}
        {acted && date && (
          <p className="text-xs text-gray-400">{formatDate(date)}</p>
        )}
        {!acted && (
          <p className="text-xs text-gray-400 italic">
            {t('damageForm.pending', { defaultValue: 'Pending' })}
          </p>
        )}
      </div>
    </div>
  );
};

const ApprovalFlow = ({ approvals = [] }) => {
  const { t } = useTranslation();

  if (!approvals || approvals.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <h3 className="text-sm font-semibold text-[#012970] mb-4">
        {t('damageForm.approvalFlow', { defaultValue: 'Approval Flow' })}
      </h3>

      <div className="space-y-0">
        {approvals.map((approval, index) => (
          <ApprovalStep
            key={`${approval.label}-${index}`}
            label={approval.label}
            name={approval.name || approval.actual_user_name}
            date={approval.date || approval.acted_at || approval.updated_at}
            acted={approval.acted}
            isLast={index === approvals.length - 1}
          />
        ))}
      </div>
    </div>
  );
};

export default ApprovalFlow;

