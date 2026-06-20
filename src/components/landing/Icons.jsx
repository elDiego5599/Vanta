import { memo } from 'react';

const IcoBase = memo(({ children, w = 24, h = 24, c = 'currentColor' }) => (
  <svg width={w} height={h} viewBox="0 0 24 24" fill="none" stroke={c}
    strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    {children}
  </svg>
));

export const Ico = {
  shield: (c) => <IcoBase c={c}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></IcoBase>,
  brain: (c) => (
    <IcoBase c={c}>
      <path d="M12 2a5 5 0 0 1 4.5 2.8A4 4 0 0 1 20 8a4 4 0 0 1-1.8 3.3A4.5 4.5 0 0 1 17 14a4 4 0 0 1-3 3.9V22h-4v-4.1A4 4 0 0 1 7 14a4.5 4.5 0 0 1-1.2-2.7A4 4 0 0 1 4 8a4 4 0 0 1 3.5-3.2A5 5 0 0 1 12 2z" />
      <path d="M12 2v8" />
    </IcoBase>
  ),
  link: (c) => (
    <IcoBase c={c}>
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </IcoBase>
  ),
  lock: (c) => (
    <IcoBase c={c}>
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </IcoBase>
  ),
  upload: (c) => (
    <IcoBase c={c} w={32} h={32}>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </IcoBase>
  ),
  sun: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5" />
      <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
    </svg>
  ),
  moon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  ),
  system: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
      <line x1="8" y1="21" x2="16" y2="21" />
      <line x1="12" y1="17" x2="12" y2="21" />
    </svg>
  ),
};