import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import LandingLiquidGlass from './components/LandingLiquidGlass'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <LandingLiquidGlass />
  </StrictMode>,
)
