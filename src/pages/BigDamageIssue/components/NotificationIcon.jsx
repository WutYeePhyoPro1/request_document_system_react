import React from 'react';

const NotificationIcon = ({ className = "h-4 w-4" }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="speechBubbleGradient" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#ef4444" stopOpacity="1" />
        <stop offset="100%" stopColor="#dc2626" stopOpacity="1" />
      </linearGradient>
    </defs>
    <path
      d="M18 4H6C4.89543 4 4 4.89543 4 6V14C4 15.1046 4.89543 16 6 16H8L12 20L16 16H18C19.1046 16 20 15.1046 20 14V6C20 4.89543 19.1046 4 18 4Z"
      fill="url(#speechBubbleGradient)"
      stroke="#b91c1c"
      strokeWidth="0.5"
    />
    <circle cx="9" cy="9" r="1.5" fill="#ffffff" />
    <circle cx="15" cy="9" r="1.5" fill="#ffffff" />
  </svg>
);

export default NotificationIcon;

