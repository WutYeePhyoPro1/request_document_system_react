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
      className={`inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded font-bold text-white border transition-all duration-200 hover:bg-[#1e3a8a] hover:border-[#1e3a8a] hover:shadow-md ${className}`}
      style={{
        backgroundColor: colorStyles.backgroundColor,
        color: colorStyles.color,
        borderColor: colorStyles.borderColor,
        fontSize: '15px'
      }}
      aria-label={label}
    >
      <ArrowLeft className="w-4 h-4" />
      <span>{label}</span>
    </button>
  );
};

export default AnimatedBackButton;
