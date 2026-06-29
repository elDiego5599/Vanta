import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import LandingLiquidGlass from './components/LandingLiquidGlass'
import DownloadPage from './components/landing/DownloadPage'
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
          <HashRouter>
            <Routes>
              <Route path="/" element={<LandingLiquidGlass />} />
              <Route path="/download" element={<DownloadPage />} />
            </Routes>
          </HashRouter>
        </ErrorBoundary>
      </ThemeProvider>
    </StrictMode>,
  )
}
