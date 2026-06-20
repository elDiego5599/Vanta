import { memo } from 'react';
import { MagneticButton } from './MagneticButton';
import { Ico } from './Icons';

export const ThemeToggle = memo(function ThemeToggle({ theme, setTheme }) {
  const toggle = () => {
    if (theme === 'dark') setTheme('light');
    else if (theme === 'light') setTheme('system');
    else setTheme('dark');
  };

  return (
    <MagneticButton>
      <button
        onClick={toggle}
        className="p-2.5 rounded-full border border-[var(--border-strong)] bg-[var(--glass-bg)] hover:bg-[var(--glass-hover)] transition-colors text-[var(--text-muted)] hover:text-[var(--text-main)]"
        data-cursor="button"
        aria-label="Cambiar Tema"
      >
        {theme === 'dark' && Ico.moon}
        {theme === 'light' && Ico.sun}
        {theme === 'system' && Ico.system}
      </button>
    </MagneticButton>
  );
});