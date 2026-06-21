import { memo } from 'react';
import { cn } from '../../lib/utils';
import { VantaLogo } from './Icons';
import { MagneticButton, ThemeToggle } from './Primitives';
import { useTheme } from '../../lib/use-theme';

interface HeaderProps {
  scrolled: boolean;
}

function HeaderBase({ scrolled }: HeaderProps) {
  const { theme, setTheme } = useTheme();

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 lg:px-12 h-20 backdrop-blur-[24px] transition-all duration-500 border-b',
        scrolled ? 'border-[var(--border-subtle)] bg-[var(--page-bg)]/80' : 'border-transparent bg-transparent',
      )}
    >
      <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[9999] focus:px-4 focus:py-2 focus:bg-[var(--btn-bg)] focus:text-[var(--btn-text)] focus:rounded-lg focus:text-sm focus:font-bold focus:outline-none">
        Saltar al contenido
      </a>
      <a href="/" className="flex items-center gap-3 select-none chrome-text outline-none focus-visible:ring-2 focus-visible:ring-white/50 rounded-md">
        <VantaLogo className="w-7 h-7 text-[var(--text-main)]" />
        <span className="font-extrabold text-xl tracking-[0.2em] uppercase mt-0.5">Vanta</span>
      </a>
      <nav className="hidden md:flex gap-6 lg:gap-10 items-center">
        {[
          { href: '#caracteristicas', label: 'Características' },
          { href: '#docs', label: 'Docs' },
          { href: '#privacidad', label: 'Privacidad' },
        ].map((link) => (
          <a key={link.href} href={link.href} className="px-3 py-2 text-[var(--text-muted)] text-[11px] tracking-[0.1em] uppercase font-semibold transition-colors hover:text-[var(--text-main)] font-mono outline-none focus-visible:text-white">
            {link.label}
          </a>
        ))}
        <div className="w-[1px] h-4 bg-[var(--border-strong)] ml-2" />
        <ThemeToggle theme={theme} setTheme={setTheme} />
        <MagneticButton>
          <button className="text-[11px] font-bold tracking-widest uppercase text-[var(--btn-text)] border border-transparent rounded-full px-6 py-2.5 bg-[var(--btn-bg)] transition-colors hover:bg-[var(--btn-hover)] shadow-lg outline-none focus-visible:ring-2 focus-visible:ring-white">
            Descargar
          </button>
        </MagneticButton>
      </nav>
    </header>
  );
}

export const Header = memo(HeaderBase);
