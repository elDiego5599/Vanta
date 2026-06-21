import { memo } from 'react';

function CSSGridBase() {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none" style={{
      backgroundImage: `linear-gradient(to right, var(--grid-line) 1px, transparent 1px), linear-gradient(to bottom, var(--grid-line) 1px, transparent 1px)`,
      backgroundSize: '64px 64px',
    }} />
  );
}

export const CSSGrid = memo(CSSGridBase);
