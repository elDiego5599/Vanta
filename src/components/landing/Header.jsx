import { memo } from 'react';
import { motion } from 'framer-motion';
import { VantaLogo } from './VantaLogo';
import { MagneticButton } from './MagneticButton';
import { ThemeToggle } from './ThemeToggle';
import { NAV_LINKS } from '../../constants';

export const Header = memo(function Header({ scrolled, theme, setTheme }) {
  return (
    <motion.header
      className={`fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 lg:px-12 h-20 backdrop-blur-[24px] transition-all duration-500 border-b ${scrolled ? 'border-[var(--border-subtle)] bg-[var(--page-bg)]/80' : 'border-transparent bg-transparent'}`}
    >
      <div className="flex items-center gap-3 select-none chrome-text" data-cursor="button">
        <VantaLogo className="w-7 h-7 text-[var(--text-main)]" />
        <span className="font-extrabold text-xl tracking-[0.2em] uppercase">Vanta</span>
      </div>
      <nav className="hidden md:flex gap-6 lg:gap-10 items-center">
        {NAV_LINKS.map((link) => (
          <MagneticButton key={link.href}>
            <a href={link.href} className="px-4 py-2 text-[var(--text-muted)] text-xs tracking-[0.1em] uppercase font-semibold transition-colors hover:text-[var(--text-main)] font-mono">
              {link.label}
            </a>
          </MagneticButton>
        ))}
        <div className="w-[1px] h-4 bg-[var(--border-strong)] ml-2" />
        <ThemeToggle theme={theme} setTheme={setTheme} />
        <MagneticButton>
          <button className="text-xs font-bold tracking-widest uppercase text-[var(--btn-text)] border border-transparent rounded-full px-6 py-2.5 bg-[var(--btn-bg)] transition-colors hover:bg-[var(--btn-hover)] shadow-lg">
            Descargar
          </button>
        </MagneticButton>
      </nav>
    </motion.header>
  );
});