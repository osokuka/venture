/**
 * VentureUP Link SVG Icon Component
 * Represents the "UP Link" concept with an upward arrow/connection symbol
 */

import React from 'react';

interface VentureUPLinkIconProps {
  className?: string;
  size?: number;
}

export function VentureUPLinkIcon({ className = '', size = 24 }: VentureUPLinkIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Upward arrow representing "UP" */}
      <path
        d="M12 3L8 7H10V13H14V7H16L12 3Z"
        fill="currentColor"
      />
      
      {/* Link/connection symbol at bottom - interlocking links */}
      <path
        d="M7 17C7 18.1046 7.89543 19 9 19C10.1046 19 11 18.1046 11 17C11 15.8954 10.1046 15 9 15C7.89543 15 7 15.8954 7 17Z"
        fill="currentColor"
        opacity="0.85"
      />
      <path
        d="M13 17C13 18.1046 13.8954 19 15 19C16.1046 19 17 18.1046 17 17C17 15.8954 16.1046 15 15 15C13.8954 15 13 15.8954 13 17Z"
        fill="currentColor"
        opacity="0.85"
      />
      {/* Connection between links */}
      <path
        d="M9 17H15"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.6"
      />
    </svg>
  );
}
