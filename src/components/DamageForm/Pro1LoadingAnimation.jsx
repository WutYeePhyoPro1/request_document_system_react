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

        {/* Flying Man Animation */}
        <div className="flying-man-container">
          <div className="flying-man">
            <div className="man-body"></div>
            <div className="man-head"></div>
            <div className="man-arms">
              <div className="arm arm-left"></div>
              <div className="arm arm-right"></div>
            </div>
            <div className="man-legs">
              <div className="leg leg-left"></div>
              <div className="leg leg-right"></div>
            </div>
            <div className="man-document"></div>
          </div>
        </div>

        {/* Form/Document Sending Animation */}
        <div className="document-trail">
          <div className="document document-1"></div>
          <div className="document document-2"></div>
          <div className="document document-3"></div>
        </div>

        {/* Loading Text */}
        <div className="pro1-loading-text">{message}</div>
      </div>
    </div>
  );
};

export default Pro1LoadingAnimation;

