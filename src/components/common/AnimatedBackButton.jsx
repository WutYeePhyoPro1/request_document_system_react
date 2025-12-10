import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import './AnimatedBackButton.css';

const getStatusColorStyles = (status) => {
  if (!status) {
    return {
      backgroundColor: '#ffffff',
      color: '#374151',
      borderColor: '#d1d5db'
    };
  }

  const normalizedStatus = (status || '').toString().trim();

  switch (normalizedStatus) {
    case 'Ongoing':
      return {
        backgroundColor: '#fbb193',
        color: '#e1341e',
        borderColor: '#e1341e'
      };
    case 'Checked':
      return {
        backgroundColor: '#fedec3',
        color: '#fb923c',
        borderColor: '#fb923c'
      };
    case 'BM Approved':
    case 'BMApproved':
      return {
        backgroundColor: '#ffeaab',
        color: '#e6ac00',
        borderColor: '#e6ac00'
      };
    case 'OPApproved':
    case 'OP Approved':
    case 'Approved':
      return {
        backgroundColor: '#e9f9cf',
        color: '#a3e635',
        borderColor: '#a3e635'
      };
    case 'Ac_Acknowledged':
    case 'Acknowledged':
      return {
        backgroundColor: '#aff1d7',
        color: '#20be7f',
        borderColor: '#20be7f'
      };
    case 'Completed':
    case 'Issued':
    case 'SupervisorIssued':
      return {
        backgroundColor: '#adebbb',
        color: '#28a745',
        borderColor: '#28a745'
      };
    case 'Cancel':
    case 'Cancelled':
      return {
        backgroundColor: '#fda19d',
        color: '#f91206',
        borderColor: '#f91206'
      };
    default:
      return {
        backgroundColor: '#fef3c7',
        color: '#d97706',
        borderColor: '#d97706'
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
  const colorStyles = getStatusColorStyles(status);

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
      className={`animated-back-button border ${className}`}
      style={{
        backgroundColor: colorStyles.backgroundColor,
        color: colorStyles.color,
        borderColor: colorStyles.borderColor
      }}
      onMouseEnter={(e) => {
        // Darken on hover
        const rgb = colorStyles.backgroundColor.match(/\d+/g);
        if (rgb && rgb.length === 3) {
          const r = Math.max(0, parseInt(rgb[0]) - 20);
          const g = Math.max(0, parseInt(rgb[1]) - 20);
          const b = Math.max(0, parseInt(rgb[2]) - 20);
          e.currentTarget.style.backgroundColor = `rgb(${r}, ${g}, ${b})`;
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = colorStyles.backgroundColor;
      }}
      aria-label={label}
    >
      <ArrowLeft className="animated-back-icon" />
      <span className="animated-back-text">{label}</span>
    </button>
  );
};

export default AnimatedBackButton;
