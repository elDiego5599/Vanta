import { memo, useId, type ReactNode } from 'react';

interface VantaLogoProps {
  className?: string;
}

function VantaLogoBase({ className = 'w-8 h-8' }: VantaLogoProps) {
  const gradientId = useId();
  return (
    <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id={gradientId} x1="-100%" y1="-100%" x2="0%" y2="0%">
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
      <polygon points="10,25 40,85 55,85 25,25" fill={`url(#${gradientId})`} opacity="0.95" />
      <polygon points="90,25 60,85 45,85 75,25" fill={`url(#${gradientId})`} opacity="0.75" />
      <polygon points="35,25 65,25 50,55" fill={`url(#${gradientId})`} opacity="0.85" />
    </svg>
  );
}

export const VantaLogo = memo(VantaLogoBase);

interface VantaMiniLogoProps {
  className?: string;
}

export const VantaMiniLogo = memo(({ className }: VantaMiniLogoProps) => {
  const gradientId = useId();
  return (
    <svg viewBox="0 0 100 100" className={className} fill="none">
      <defs>
        <linearGradient id={gradientId} x1="-100%" y1="-100%" x2="0%" y2="0%">
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
      <polygon points="10,25 40,85 55,85 25,25" fill={`url(#${gradientId})`} opacity="0.95" />
      <polygon points="90,25 60,85 45,85 75,25" fill={`url(#${gradientId})`} opacity="0.75" />
      <polygon points="35,25 65,25 50,55" fill={`url(#${gradientId})`} opacity="0.85" />
    </svg>
  );
});

interface IcoBaseProps {
  children: ReactNode;
  w?: number;
  h?: number;
  color?: string;
}

const IcoBase = memo(({ children, w = 24, h = 24, color = 'currentColor' }: IcoBaseProps) => (
  <svg aria-hidden="true" focusable="false" width={w} height={h} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    {children}
  </svg>
));
IcoBase.displayName = 'IcoBase';

interface IconProps {
  color?: string;
  w?: number;
  h?: number;
}

export const IconShield = memo(({ color, w, h }: IconProps) => <IcoBase color={color} w={w} h={h}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></IcoBase>);

export const IconBrain = memo(({ color }: IconProps) => (
  <IcoBase color={color}>
    <path d="M12 2a5 5 0 0 1 4.5 2.8A4 4 0 0 1 20 8a4 4 0 0 1-1.8 3.3A4.5 4.5 0 0 1 17 14a4 4 0 0 1-3 3.9V22h-4v-4.1A4 4 0 0 1 7 14a4.5 4.5 0 0 1-1.2-2.7A4 4 0 0 1 4 8a4 4 0 0 1 3.5-3.2A5 5 0 0 1 12 2z" />
    <path d="M12 2v8" />
  </IcoBase>
));

export const IconLink = memo(({ color }: IconProps) => (
  <IcoBase color={color}>
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
  </IcoBase>
));

export const IconLock = memo(({ color }: IconProps) => (
  <IcoBase color={color}>
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </IcoBase>
));

export const IconUpload = memo(({ color }: IconProps) => (
  <IcoBase color={color} w={32} h={32}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17 8 12 3 7 8" />
    <line x1="12" y1="3" x2="12" y2="15" />
  </IcoBase>
));

export const IconSun = memo(() => (
  <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="5" />
    <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
  </svg>
));

export const IconMoon = memo(() => (
  <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
));

export const IconSystem = memo(() => (
  <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
    <line x1="8" y1="21" x2="16" y2="21" />
    <line x1="12" y1="17" x2="12" y2="21" />
  </svg>
));

export const FolderIcon = memo(({ color = 'currentColor', w = 16, h = 16 }: { color?: string; w?: number; h?: number }) => (
  <svg width={w} height={h} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
  </svg>
));

export const TrashIcon = memo(({ w = 12, h = 12 }: { w?: number; h?: number }) => (
  <svg width={w} height={h} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
));

export const ArrowIcon = memo(({ w = 12, h = 12 }: { w?: number; h?: number }) => (
  <svg width={w} height={h} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </svg>
));

export const PlusIcon = memo(({ w = 14, h = 14 }: { w?: number; h?: number }) => (
  <svg width={w} height={h} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
));

export const UploadAppIcon = memo(({ w = 20, h = 20 }: { w?: number; h?: number }) => (
  <svg width={w} height={h} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17 8 12 3 7 8" />
    <line x1="12" y1="3" x2="12" y2="15" />
  </svg>
));

export const AudioIcon = memo(({ w = 14, h = 14 }: { w?: number; h?: number }) => (
  <svg width={w} height={h} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 18V5l12-2v13" />
    <circle cx="6" cy="18" r="3" />
    <circle cx="18" cy="16" r="3" />
  </svg>
));

export const PauseIcon = memo(({ w = 12, h = 12 }: { w?: number; h?: number }) => (
  <svg width={w} height={h} viewBox="0 0 24 24" fill="currentColor">
    <rect x="6" y="4" width="4" height="16" rx="1" />
    <rect x="14" y="4" width="4" height="16" rx="1" />
  </svg>
));

export const PlayIcon = memo(({ w = 12, h = 12 }: { w?: number; h?: number }) => (
  <svg width={w} height={h} viewBox="0 0 24 24" fill="currentColor">
    <polygon points="5,3 19,12 5,21" />
  </svg>
));

export const CheckIcon = memo(({ w = 12, h = 12 }: { w?: number; h?: number }) => (
  <svg width={w} height={h} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
));
