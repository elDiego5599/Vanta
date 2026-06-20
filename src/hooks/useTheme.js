import { useEffect } from 'react';

export function useTheme(theme) {
  useEffect(() => {
    const root = document.documentElement;
    const apply = () => {
      if (theme === 'light') root.classList.add('light-mode');
      else if (theme === 'dark') root.classList.remove('light-mode');
      else {
        if (window.matchMedia('(prefers-color-scheme: light)').matches) root.classList.add('light-mode');
        else root.classList.remove('light-mode');
      }
    };
    apply();
    if (theme === 'system') {
      const mq = window.matchMedia('(prefers-color-scheme: light)');
      mq.addEventListener('change', apply);
      return () => mq.removeEventListener('change', apply);
    }
  }, [theme]);
}