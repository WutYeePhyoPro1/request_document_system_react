import React from 'react';
import { STATUS_COLORS } from '../utils/constants';

const StatusBadge = ({ status }) => {
  const displayStatus = status === 'Ac_Acknowledge' || status === 'Ac_Acknowledged' || status === 'Acknowledged' 
    ? 'OPApproved' 
    : status;
  
  const colors = STATUS_COLORS[status] || { bg: '#f3f4f6', text: '#374151' };
  
  return (
    <span
      className="inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full"
      style={{ backgroundColor: colors.bg, color: colors.text }}
    >
      {displayStatus || '-'}
    </span>
  );
};

export default StatusBadge;

