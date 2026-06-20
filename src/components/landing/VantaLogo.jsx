import { memo } from 'react';

export const VantaLogo = memo(function VantaLogo({ className = 'w-8 h-8' }) {
  return (
    <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="chromeGlow" x1="-100%" y1="-100%" x2="0%" y2="0%">
          <stop offset="0%" stopColor="var(--chrome-1)" />
          <stop offset="30%" stopColor="var(--chrome-2)" />
          <stop offset="50%" stopColor="var(--text-main)" />
          <stop offset="70%" stopColor="var(--chrome-2)" />
          <stop offset="100%" stopColor="var(--chrome-1)" />
          <animate attributeName="x1" values="-100%;200%;-100%" dur="6s" repeatCount="indefinite" />
          <animate attributeName="y1" values="-100%;200%;-100%" dur="6s" repeatCount="indefinite" />
          <animate attributeName="x2" values="0%;300%;0%" dur="6s" repeatCount="indefinite" />
          <animate attributeName="y2" values="0%;300%;0%" dur="6s" repeatCount="indefinite" />
        </linearGradient>
      </defs>
      <polygon points="10,25 40,85 55,85 25,25" fill="url(#chromeGlow)" opacity="0.95" />
      <polygon points="90,25 60,85 45,85 75,25" fill="url(#chromeGlow)" opacity="0.75" />
      <polygon points="35,25 65,25 50,55" fill="url(#chromeGlow)" opacity="0.85" />
    </svg>
  );
});