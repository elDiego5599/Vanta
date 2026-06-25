import { useEffect, useState, type ReactNode } from 'react'
import { ThemeContext, type Theme } from './use-theme'

function getStoredTheme(): Theme {
  try {
    const stored = localStorage.getItem('vanta-theme')
    if (stored === 'dark' || stored === 'light' || stored === 'system') return stored
  } catch { void 0 }
  return 'system'
}

function applyTheme(theme: Theme) {
  const root = document.documentElement
  if (theme === 'light') {
    root.classList.add('light-mode')
  } else if (theme === 'dark') {
    root.classList.remove('light-mode')
  } else {
    if (window.matchMedia('(prefers-color-scheme: light)').matches) {
      root.classList.add('light-mode')
    } else {
      root.classList.remove('light-mode')
    }
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(getStoredTheme)

  const setTheme = (next: Theme) => {
    setThemeState(next)
    try { localStorage.setItem('vanta-theme', next) } catch { void 0 }
  }

  useEffect(() => {
    applyTheme(theme)
    if (theme === 'system') {
      const mq = window.matchMedia('(prefers-color-scheme: light)')
      const handler = () => applyTheme('system')
      mq.addEventListener('change', handler)
      return () => mq.removeEventListener('change', handler)
    }
  }, [theme])

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}
