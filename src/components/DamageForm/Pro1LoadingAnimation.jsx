import React from 'react';
import './Pro1LoadingAnimation.css';

const Pro1LoadingAnimation = ({ message = 'Processing...' }) => {
  return (
    <div className="pro1-loading-overlay">
      <div className="pro1-loading-container">
        {/* Pro1 Global Logo */}
        <div className="pro1-logo-container">
          <img 
            src="/PRO1logo.png" 
            alt="Pro1 Global Logo" 
            className="pro1-logo"
            onError={(e) => {
              // Fallback if logo not found
              e.target.style.display = 'none';
            }}
          />
        </div>

        {/* Rocket Ship Animation */}
        <div className="rocket-container">
          <div className="loader">
            <span>
              <span></span>
              <span></span>
              <span></span>
              <span></span>
            </span>
            <div className="base">
              <span></span>
              <div className="face"></div>
            </div>
          </div>
          <div className="longfazers">
            <span></span>
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>

        {/* Loading Text */}
        <div className="pro1-loading-text">{message}</div>
      </div>
    </div>
  );
};

export default Pro1LoadingAnimation;

