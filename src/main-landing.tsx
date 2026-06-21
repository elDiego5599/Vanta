import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import LandingLiquidGlass from './components/LandingLiquidGlass'
import ErrorBoundary from './components/landing/ErrorBoundary'
import { ThemeProvider } from './lib/theme'
import { runAxe } from './lib/axe'

setTimeout(() => runAxe(), 1000)

const root = document.getElementById('root')
if (root) {
  createRoot(root).render(
    <StrictMode>
      <ThemeProvider>
        <ErrorBoundary>
          <LandingLiquidGlass />
        </ErrorBoundary>
      </ThemeProvider>
    </StrictMode>,
  )
}
