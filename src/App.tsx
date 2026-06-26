import { useState, useEffect, lazy, Suspense } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { TabId } from './lib/types'
import { useUIStore } from './lib/stores/uiStore'
import { useCaseStore } from './lib/stores/caseStore'
import { useEvidenceStore } from './lib/stores/evidenceStore'
import { ThemeProvider } from './lib/theme'
import { fadeIn } from './lib/motion'
import ErrorBoundary from './components/landing/ErrorBoundary'
import { MagneticButton } from './components/landing/Primitives'
import { SkeletonSection } from './components/landing/SkeletonSection'

const GLOW_COLORS: Record<TabId, string> = {
  casos: '#f59e0b',
  ingesta: '#3b82f6',
  transcripcion: '#10b981',
}

const CASE_DEPENDENT_TABS: Set<TabId> = new Set(['ingesta', 'transcripcion'])
import { CSSGrid } from './components/landing/CSSGrid'
import PasswordScreen from './components/app/PasswordScreen'

const ModuloCasos = lazy(() => import('./components/app/ModuloCasos'))
const ModuloIngesta = lazy(() => import('./components/app/ModuloIngesta'))
const ModuloTranscripcion = lazy(() => import('./components/app/ModuloTranscripcion'))
const Sidebar = lazy(() => import('./components/app/Sidebar'))

const MODULE_MAP: Record<string, React.LazyExoticComponent<React.ComponentType>> = {
  casos: ModuloCasos,
  ingesta: ModuloIngesta,
  transcripcion: ModuloTranscripcion,
}

function AppShell() {
  const [unlocked, setUnlocked] = useState(false)
  const setLockFn = useUIStore((s) => s.setLockFn)

  const activeTab = useUIStore((s) => s.activeTab)
  const setActiveTab = useUIStore((s) => s.setActiveTab)
  const sidebarOpen = useUIStore((s) => s.sidebarOpen)
  const toggleSidebar = useUIStore((s) => s.toggleSidebar)

  const activeCase = useCaseStore((s) => s.activeCase)
  const isLoading = useCaseStore((s) => s.isLoading)
  const initCases = useCaseStore((s) => s.initialize)
  const initEvidence = useEvidenceStore((s) => s.initialize)
  const clearEvidence = useEvidenceStore((s) => s.clearEvidence)

  const [initDone, setInitDone] = useState(false)

  useEffect(() => {
    setLockFn(() => setUnlocked(false))
    return () => setLockFn(null)
  }, [setLockFn])

  useEffect(() => {
    initCases().then(() => {
      const { activeCase } = useCaseStore.getState()
      if (activeCase) {
        return initEvidence(activeCase.id)
      }
    }).finally(() => setInitDone(true))
  }, [initCases, initEvidence])

  useEffect(() => {
    if (!initDone) return
    if (activeCase) {
      initEvidence(activeCase.id)
    } else {
      clearEvidence()
    }
  }, [activeCase, initDone, initEvidence, clearEvidence])

  if (isLoading || !initDone) {
    return (
      <div className="flex h-screen bg-[var(--page-bg)] items-center justify-center">
        <div className="text-xs text-[var(--text-muted)] animate-pulse">Cargando...</div>
      </div>
    )
  }

  if (!unlocked) {
    return <PasswordScreen onUnlock={() => setUnlocked(true)} />
  }

  const ActiveModule = MODULE_MAP[activeTab] ?? ModuloIngesta

  return (
    <div className="flex h-screen bg-[var(--page-bg)] items-center justify-center p-4 md:p-6 overflow-hidden relative">
      <CSSGrid />

      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-[var(--card-bg)] focus:text-[var(--text-main)] focus:border focus:border-[var(--border-strong)] focus:rounded-md focus:text-xs focus:font-semibold focus:outline-none"
      >
        Saltar al contenido
      </a>

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/30 backdrop-blur-sm md:hidden"
          onClick={() => toggleSidebar()}
          aria-hidden="true"
        />
      )}

      <div className="flex w-full h-full bg-[var(--card-bg)] rounded-[22px] overflow-hidden border border-[var(--border-subtle)] shadow-[0_8px_60px_-12px_rgba(0,0,0,0.3)] relative">
        <Suspense fallback={<div className="w-[280px] bg-[var(--card-bg)] border-r border-[var(--border-subtle)]" />}>
          <Sidebar />
        </Suspense>

        <main id="main-content" className="flex-1 flex flex-col overflow-hidden bg-[var(--page-bg)] relative" tabIndex={-1}>
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] opacity-[0.04] blur-[120px] rounded-full pointer-events-none z-0 transition-colors duration-700"
            style={{ backgroundColor: GLOW_COLORS[activeTab] }}
          />

          <div className="md:hidden absolute top-3 left-3 z-20">
            <button
              onClick={() => toggleSidebar()}
              className="w-8 h-8 flex items-center justify-center rounded-md text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--glass-hover)] transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--card-bg)]"
              aria-label="Abrir barra lateral"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
          </div>

          <div className="flex-1 overflow-hidden z-10">
            {!activeCase && CASE_DEPENDENT_TABS.has(activeTab) ? (
              <div className="h-full flex items-center justify-center">
                <div className="text-center max-w-xs">
                  <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5"
                    style={{ backgroundColor: 'var(--glass-bg)', border: '1px solid var(--border-subtle)' }}
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                    </svg>
                  </div>
                  <div className="text-xs font-medium mb-1" style={{ color: 'var(--text-main)' }}>Ningun caso seleccionado</div>
                  <div className="text-[10px] font-mono mb-6 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                    Seleccione o cree un caso para acceder a esta seccion
                  </div>
                  <MagneticButton>
                    <button
                      onClick={() => setActiveTab('casos')}
                      className="px-5 py-2 rounded-lg text-[11px] font-medium transition-all outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
                      style={{ backgroundColor: 'var(--accent)', color: '#fff' }}
                    >
                      Ir a Casos
                    </button>
                  </MagneticButton>
                </div>
              </div>
            ) : (
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  variants={fadeIn}
                  initial="hidden"
                  animate="visible"
                  className="h-full"
                >
                  <ErrorBoundary>
                    <Suspense fallback={<SkeletonSection className="h-full" />}>
                      <div role="tabpanel" id={`panel-${activeTab}`} aria-labelledby={`tab-${activeTab}`}>
                        <ActiveModule />
                      </div>
                    </Suspense>
                  </ErrorBoundary>
                </motion.div>
              </AnimatePresence>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <AppShell />
    </ThemeProvider>
  )
}
