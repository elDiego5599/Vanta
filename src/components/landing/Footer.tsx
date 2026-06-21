import { memo } from 'react';
import { VantaLogo } from './Icons';

function FooterBase() {
  return (
    <footer className="border-t border-[var(--border-subtle)] relative z-10 bg-[var(--card-bg)]">
      <div className="max-w-[1200px] xl:max-w-[1300px] mx-auto px-6 lg:px-12 py-24">
        <div className="flex items-center gap-3 mb-16 chrome-text">
          <VantaLogo className="w-6 h-6 text-[var(--text-main)]" />
          <div className="font-extrabold text-xl tracking-[0.2em] uppercase text-[var(--text-main)]">VANTA</div>
        </div>
        <div className="border-t border-[var(--border-subtle)] pt-10 flex justify-between items-center flex-wrap gap-4">
          <span className="text-xs text-[var(--text-muted)] font-mono uppercase tracking-widest">© 2026 Vanta Systems.</span>
          <span className="text-xs text-[var(--text-muted)] font-mono uppercase tracking-widest">Hecho con discreción.</span>
        </div>
      </div>
    </footer>
  );
}

export const Footer = memo(FooterBase);
