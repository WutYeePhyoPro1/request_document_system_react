import React from 'react';
import { useTranslation } from 'react-i18next';

const StatusBadge = ({ status }) => {
  const getStatusColor = (s) => {
    const statusLower = (s || '').toLowerCase();
    const colors = {
      ongoing: { bg: '#fbb193', text: '#e1341e' },
      checked: { bg: '#fedec3', text: '#fb923c' },
      'bm approved': { bg: '#ffeaab', text: '#e6ac00' },
      bmapproved: { bg: '#ffeaab', text: '#e6ac00' },
      opapproved: { bg: '#e9f9cf', text: '#a3e635' },
      'op approved': { bg: '#e9f9cf', text: '#a3e635' },
      ac_acknowledged: { bg: '#aff1d7', text: '#20be7f' },
      acknowledged: { bg: '#aff1d7', text: '#20be7f' },
      completed: { bg: '#adebbb', text: '#28a745' },
      issued: { bg: '#adebbb', text: '#28a745' },
      supervisorissued: { bg: '#adebbb', text: '#28a745' },
      cancel: { bg: '#fda19d', text: '#f91206' },
      cancelled: { bg: '#fda19d', text: '#f91206' },
    };
    return colors[statusLower] || { bg: '#e5e7eb', text: '#6b7280' };
  };

  const colors = getStatusColor(status);

  return (
    <span
      className="px-3 py-1 text-xs font-semibold rounded-full"
      style={{ backgroundColor: colors.bg, color: colors.text }}
    >
      {status || 'Unknown'}
    </span>
  );
};

const FormHeader = ({ 
  formDocNo, 
  status, 
  datetime, 
  branchName, 
  requesterName,
  mode 
}) => {
  const { t } = useTranslation();
  const isViewMode = mode === 'view' || mode === 'edit';

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 mb-6 border border-blue-100">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold text-[#012970]">
            {t('damageForm.title', { defaultValue: 'Big Damage Issue Form' })}
          </h1>
          {isViewMode && status && <StatusBadge status={status} />}
        </div>

        {isViewMode && formDocNo && (
          <div className="text-sm text-gray-600">
            <span className="font-medium">{t('damageForm.docNo', { defaultValue: 'Doc No' })}:</span>{' '}
            <span className="font-bold text-[#012970]">{formDocNo}</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 text-sm">
        {datetime && (
          <div>
            <span className="text-gray-500">{t('damageForm.date', { defaultValue: 'Date' })}:</span>{' '}
            <span className="font-medium text-gray-700">
              {new Date(datetime).toLocaleDateString('en-GB', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>
        )}

        {branchName && (
          <div>
            <span className="text-gray-500">{t('damageForm.branch', { defaultValue: 'Branch' })}:</span>{' '}
            <span className="font-medium text-gray-700">{branchName}</span>
          </div>
        )}

        {requesterName && (
          <div>
            <span className="text-gray-500">{t('damageForm.requester', { defaultValue: 'Requester' })}:</span>{' '}
            <span className="font-medium text-gray-700">{requesterName}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default FormHeader;

