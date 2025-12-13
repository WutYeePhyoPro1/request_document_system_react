import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import '../DamageForm/ButtonHoverEffects.css';

const getStatusColorStyles = (status) => {
  // Back button always uses dark blue color regardless of status
  return {
    backgroundColor: '#1e40af', // dark blue-800
    color: '#ffffff',
    borderColor: '#1e3a8a' // dark blue-900
  };
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
      className={`btn-with-icon inline-flex items-center justify-center gap-2 px-6 py-3 sm:py-2.5 rounded-lg font-semibold text-white transition-all duration-200 shadow-md hover:shadow-lg border ${className}`}
      style={{
        backgroundColor: colorStyles.backgroundColor,
        color: colorStyles.color,
        borderColor: colorStyles.borderColor,
        fontSize: '0.875rem'
      }}
      aria-label={label}
    >
      <span className="btn-text">{label}</span>
      <ArrowLeft className="btn-icon w-4 h-4 absolute" />
    </button>
  );
};

export default AnimatedBackButton;
