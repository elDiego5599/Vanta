import { memo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useUIStore } from '../../lib/stores/uiStore'
import { useCaseStore } from '../../lib/stores/caseStore'
import { useTheme } from '../../lib/use-theme'
import { VantaMiniLogo } from '../landing/Icons'
import type { TabId } from '../../lib/types'

// ==========================================
// 1. ICONOS LOCALES
// ==========================================
const FolderIcon = ({ w = 20, h = 20 }) => (
  <svg width={w} height={h} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
  </svg>
)

const UploadIcon = ({ w = 20, h = 20 }) => (
  <svg width={w} height={h} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17 8 12 3 7 8" />
    <line x1="12" y1="3" x2="12" y2="15" />
  </svg>
)

const TextIcon = ({ w = 20, h = 20 }) => (
  <svg width={w} height={h} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <polyline points="10 9 9 9 8 9" />
  </svg>
)

const SunIcon = ({ w = 18, h = 18 }) => (
  <svg width={w} height={h} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="5" />
    <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
  </svg>
)

const MoonIcon = ({ w = 18, h = 18 }) => (
  <svg width={w} height={h} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
)

const SystemIcon = ({ w = 18, h = 18 }) => (
  <svg width={w} height={h} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
    <line x1="8" y1="21" x2="16" y2="21" />
    <line x1="12" y1="17" x2="12" y2="21" />
  </svg>
)

const CollapseIcon = ({ w = 18, h = 18 }) => (
  <svg width={w} height={h} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6" />
  </svg>
)

const LockIcon = ({ w = 18, h = 18 }) => (
  <svg width={w} height={h} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
)

// ==========================================
// 2. NAVEGACION
// ==========================================
const NAV_ITEMS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: 'casos', label: 'Casos', icon: FolderIcon },
  { id: 'ingesta', label: 'Evidencias', icon: UploadIcon },
  { id: 'transcripcion', label: 'Transcripcion', icon: TextIcon },
]

// ==========================================
// 3. SIDEBAR
// ==========================================
const Sidebar = memo(function Sidebar() {
  const activeTab = useUIStore((s) => s.activeTab)
  const setActiveTab = useUIStore((s) => s.setActiveTab)
  const sidebarOpen = useUIStore((s) => s.sidebarOpen)
  const toggleSidebar = useUIStore((s) => s.toggleSidebar)
  const activeCase = useCaseStore((s) => s.activeCase)
  const lock = useUIStore((s) => s.lock)
  const { theme, setTheme } = useTheme()

  return (
    <aside className={`${sidebarOpen ? 'w-[280px]' : 'w-[60px]'} h-full flex flex-col bg-[var(--card-bg)] border-r border-[var(--border-subtle)] relative z-50 shrink-0 transition-all duration-300`}>

      {/* CABECERA Y LOGO */}
      <div className="flex-none px-5 pt-6 pb-4 flex items-center gap-3 border-b border-[var(--border-subtle)]">
        <VantaMiniLogo className="w-[18px] h-[18px] shrink-0" />
        {sidebarOpen && (
          <div className="chrome-text text-lg font-extrabold tracking-[0.2em] uppercase whitespace-nowrap">
            VANTA
          </div>
        )}
      </div>

      {/* INDICADOR DE CASO ACTIVO */}
      {sidebarOpen && (
        <div className="px-5 mt-4 min-h-[56px] flex flex-col justify-center border-b border-[var(--border-subtle)] pb-5 mb-4">
          <AnimatePresence mode="wait">
            {activeCase ? (
              <motion.div
                key="active-case"
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="relative group cursor-pointer"
                onClick={() => setActiveTab('casos')}
              >
                <div className="relative flex flex-col bg-[var(--glass-bg)] border border-[var(--border-subtle)] p-3 rounded-xl">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] animate-pulse" />
                    <span className="text-[9px] font-mono uppercase tracking-[0.15em] text-[var(--accent)]">
                      Expediente Activo
                    </span>
                  </div>
                  <span className="text-[13px] font-bold text-[var(--text-main)] truncate pr-2">
                    {activeCase.name}
                  </span>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="no-case"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="flex items-center gap-2.5 p-3 rounded-xl border border-dashed border-[var(--border-subtle)] opacity-50"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-[var(--text-muted)]" />
                <span className="text-[10px] font-mono uppercase tracking-widest text-[var(--text-muted)]">
                  Ningun caso abierto
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* NAVEGACION PRINCIPAL */}
      <nav className="flex-1 px-3 py-6 overflow-y-auto custom-scrollbar">
        <ul className="space-y-1">
          {NAV_ITEMS.map((tab) => {
            const isActive = activeTab === tab.id
            const Icon = tab.icon

            return (
              <li key={tab.id} className="relative h-[52px]">
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active-indicator"
                    className="absolute left-0 top-0 bottom-0 w-[3px] bg-[var(--accent)] rounded-r-full"
                    initial={false}
                    transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                  />
                )}
                <button
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative z-10 w-full h-full flex items-center gap-3 transition-colors duration-150 outline-none rounded-lg ${
                    sidebarOpen ? 'px-4' : 'px-0 justify-center'
                  } ${
                    isActive
                      ? 'text-[var(--accent)] bg-[var(--accent)]/[0.08]'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--glass-bg)]'
                  }`}
                  title={tab.label}
                >
                  <span className="shrink-0"><Icon w={20} h={20} /></span>
                  {sidebarOpen && (
                    <span className={`text-[13px] tracking-wide whitespace-nowrap ${isActive ? 'font-bold' : 'font-medium'}`}>
                      {tab.label}
                    </span>
                  )}
                </button>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* FOOTER */}
      <div className="flex-none border-t border-[var(--border-subtle)] p-4">
        <div className={`flex ${sidebarOpen ? 'items-center justify-between' : 'flex-col items-center gap-1'}`}>
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--glass-bg)] transition-colors outline-none"
            title={sidebarOpen ? 'Colapsar' : 'Expandir'}
          >
            <span className={`block transition-transform duration-300 ${sidebarOpen ? '' : 'rotate-180'}`}>
              <CollapseIcon w={18} h={18} />
            </span>
          </button>

          <div className={`flex ${sidebarOpen ? 'gap-1' : 'flex-col gap-1'}`}>
            <button
              onClick={() => {
                if (theme === 'dark') setTheme('light')
                else if (theme === 'light') setTheme('system')
                else setTheme('dark')
              }}
              className="p-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--glass-bg)] transition-colors outline-none"
              title={`Tema: ${theme}`}
            >
              {theme === 'dark' && <MoonIcon w={18} h={18} />}
              {theme === 'light' && <SunIcon w={18} h={18} />}
              {theme === 'system' && <SystemIcon w={18} h={18} />}
            </button>
            <button
              onClick={lock}
              className="p-2 rounded-lg text-[var(--text-muted)] hover:text-red-400 hover:bg-red-500/10 transition-colors outline-none"
              title="Cerrar Sesion"
            >
              <LockIcon w={18} h={18} />
            </button>
          </div>
        </div>
      </div>
    </aside>
  )
})

export default Sidebar
