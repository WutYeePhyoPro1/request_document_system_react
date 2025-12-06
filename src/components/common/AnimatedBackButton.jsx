import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import './AnimatedBackButton.css';

const getStatusColorClasses = (status) => {
  if (!status) {
    return {
      bg: 'bg-white',
      text: 'text-gray-700',
      border: 'border-gray-300',
      hoverBg: 'hover:bg-gray-50',
      hoverText: 'hover:text-gray-800',
      hoverBorder: 'hover:border-gray-400'
    };
  }

  const normalizedStatus = (status || '').toString().trim();

  switch (normalizedStatus) {
    case 'Ongoing':
      return {
        bg: 'bg-orange-100',
        text: 'text-orange-700',
        border: 'border-orange-300',
        hoverBg: 'hover:bg-orange-200',
        hoverText: 'hover:text-orange-800',
        hoverBorder: 'hover:border-orange-400'
      };
    case 'Checked':
      return {
        bg: 'bg-yellow-100',
        text: 'text-yellow-700',
        border: 'border-yellow-300',
        hoverBg: 'hover:bg-yellow-200',
        hoverText: 'hover:text-yellow-800',
        hoverBorder: 'hover:border-yellow-400'
      };
    case 'BM Approved':
    case 'BMApproved':
      return {
        bg: 'bg-blue-600',
        text: 'text-white',
        border: 'border-blue-700',
        hoverBg: 'hover:bg-blue-700',
        hoverText: 'hover:text-white',
        hoverBorder: 'hover:border-blue-800'
      };
    case 'OPApproved':
    case 'OP Approved':
      return {
        bg: 'op-approved-status-badge',
        text: 'text-white',
        border: 'border-transparent',
        hoverBg: 'hover:opacity-90',
        hoverText: 'hover:text-white',
        hoverBorder: 'hover:border-transparent'
      };
    case 'Ac_Acknowledged':
    case 'Acknowledged':
      return {
        bg: 'acknowledge-status-badge',
        text: 'text-white',
        border: 'border-transparent',
        hoverBg: 'hover:opacity-90',
        hoverText: 'hover:text-white',
        hoverBorder: 'hover:border-transparent'
      };
    case 'Approved':
      return {
        bg: 'bg-green-100',
        text: 'text-green-700',
        border: 'border-green-300',
        hoverBg: 'hover:bg-green-200',
        hoverText: 'hover:text-green-800',
        hoverBorder: 'hover:border-green-400'
      };
    case 'Completed':
      return {
        bg: 'bg-emerald-100',
        text: 'text-emerald-700',
        border: 'border-emerald-300',
        hoverBg: 'hover:bg-emerald-200',
        hoverText: 'hover:text-emerald-800',
        hoverBorder: 'hover:border-emerald-400'
      };
    case 'Cancel':
    case 'Cancelled':
      return {
        bg: 'bg-red-100',
        text: 'text-red-700',
        border: 'border-red-300',
        hoverBg: 'hover:bg-red-200',
        hoverText: 'hover:text-red-800',
        hoverBorder: 'hover:border-red-400'
      };
    default:
      return {
        bg: 'bg-yellow-100',
        text: 'text-yellow-700',
        border: 'border-yellow-300',
        hoverBg: 'hover:bg-yellow-200',
        hoverText: 'hover:text-yellow-800',
        hoverBorder: 'hover:border-yellow-400'
      };
  }
};

const AnimatedBackButton = ({ 
  onClick, 
  to = '/big_damage_issue',
  className = '',
  label = 'Back',
  status = null
}) => {
  const navigate = useNavigate();
  const colorClasses = getStatusColorClasses(status);

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      navigate(to);
    }
  };

  return (
    <button
      onClick={handleClick}
      className={`animated-back-button ${colorClasses.bg} ${colorClasses.text} ${colorClasses.border} ${colorClasses.hoverBg} ${colorClasses.hoverText} ${colorClasses.hoverBorder} ${className}`}
      aria-label={label}
    >
      <ArrowLeft className="animated-back-icon" />
      <span className="animated-back-text">{label}</span>
    </button>
  );
};

export default AnimatedBackButton;
