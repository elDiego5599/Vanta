import { useState, useMemo, useCallback, memo, lazy, Suspense, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import AppContext from './lib/AppContext';
import type { AppContextType, EvidenceItem } from './lib/AppContext';
import { ThemeProvider } from './lib/theme';
import { ThemeToggle } from './components/landing/Primitives';
import { useTheme } from './lib/use-theme';
import { transition } from './lib/motion';
import ErrorBoundary from './components/landing/ErrorBoundary';
import { SkeletonSection } from './components/landing/SkeletonSection';
import LoginScreen from './components/app/LoginScreen';

const ModuloIngesta = lazy(() => import('./components/app/ModuloIngesta'));
const ModuloTranscripcion = lazy(() => import('./components/app/ModuloTranscripcion'));
const ModuloBusqueda = lazy(() => import('./components/app/ModuloBusqueda'));

const TABS = [
  { id: 'ingesta', label: 'Evidencias', icon: 'upload' as const },
  { id: 'transcripcion', label: 'Transcripcion', icon: 'waveform' as const },
  { id: 'busqueda', label: 'Busqueda Semantica', icon: 'search' as const },
];

type TabId = (typeof TABS)[number]['id'];

const pageVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -12 },
};

const MODULE_MAP: Record<string, React.LazyExoticComponent<React.ComponentType>> = {
  ingesta: ModuloIngesta,
  transcripcion: ModuloTranscripcion,
  busqueda: ModuloBusqueda,
};

interface SidebarIconProps {
  type: string;
  active: boolean;
}

const SidebarIcon = memo(function SidebarIcon({ type, active }: SidebarIconProps) {
  const color = active ? 'var(--accent)' : 'var(--text-muted)';
  const icons: Record<string, React.ReactNode> = {
    upload: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="17 8 12 3 7 8" />
        <line x1="12" y1="3" x2="12" y2="15" />
      </svg>
    ),
    waveform: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 12h2l3-9 4 18 4-18 3 9h4" />
      </svg>
    ),
    search: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
    ),
  };
  return icons[type] ?? null;
});

function AppShell() {
  const { theme, setTheme } = useTheme();
  const [user, setUser] = useState<{ usuario: string } | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>('ingesta');
  const [evidenceQueue, setEvidenceQueue] = useState<EvidenceItem[]>([]);
  const [selectedFile, setSelectedFile] = useState<EvidenceItem | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const toggleSidebar = useCallback(() => setSidebarOpen((p) => !p), []);

  const handleTabClick = useCallback((id: TabId) => {
    setActiveTab(id);
    if (window.matchMedia('(max-width: 767px)').matches) {
      setSidebarOpen(false);
    }
  }, []);

  const handleKeyDownEsc = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') setSidebarOpen(false);
  }, []);

  useEffect(() => {
    if (sidebarOpen) {
      document.addEventListener('keydown', handleKeyDownEsc);
      return () => document.removeEventListener('keydown', handleKeyDownEsc);
    }
  }, [sidebarOpen, handleKeyDownEsc]);

  const selectFileForTranscription = useCallback((file: EvidenceItem) => {
    setSelectedFile(file);
    setActiveTab('transcripcion');
  }, []);

  const addEvidence = useCallback((file: File) => {
    const id = `ev-${Date.now()}`;
    const item: EvidenceItem = {
      id,
      file,
      nombre: file.name,
      estado: 'listo',
      progreso: 0,
      tamano: formatSize(file.size),
    };
    setEvidenceQueue((prev) => [item, ...prev]);
  }, []);

  const updateEvidence = useCallback((id: string, updates: Partial<EvidenceItem>) => {
    setEvidenceQueue((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
    );
  }, []);

  const handleLogout = useCallback(() => {
    setUser(null);
    setActiveTab('ingesta');
    setSelectedFile(null);
  }, []);

  const handleTabKeyDown = useCallback((e: React.KeyboardEvent) => {
    const idx = TABS.findIndex((t) => t.id === activeTab);
    let nextIdx = idx;
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
      e.preventDefault();
      nextIdx = (idx + 1) % TABS.length;
    } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
      e.preventDefault();
      nextIdx = (idx - 1 + TABS.length) % TABS.length;
    }
    if (nextIdx !== idx) {
      const tab = TABS[nextIdx];
      if (tab) {
        setActiveTab(tab.id);
        document.getElementById(`tab-${tab.id}`)?.focus();
      }
    }
  }, [activeTab]);

  const contextValue: AppContextType = useMemo(() => ({
    evidenceQueue, addEvidence, updateEvidence,
    selectedFile, selectFileForTranscription,
    user,
  }), [evidenceQueue, addEvidence, updateEvidence, selectedFile, selectFileForTranscription, user]);

  if (!user) {
    return <LoginScreen onLogin={setUser} />;
  }

  const ActiveModule = MODULE_MAP[activeTab] ?? ModuloIngesta;

  return (
    <AppContext.Provider value={contextValue}>
      <div className="flex h-screen bg-[var(--page-bg)] text-[var(--text-main)] font-sans overflow-hidden">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-[var(--card-bg)] focus:text-[var(--text-main)] focus:border focus:border-[var(--border-strong)] focus:rounded-md focus:text-xs focus:font-semibold focus:outline-none"
        >
          Saltar al contenido
        </a>

        {sidebarOpen && (
          <div
            className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm md:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />
        )}

        <aside
          className={`
            fixed inset-y-0 left-0 z-40 md:relative md:z-auto
            flex flex-col bg-[var(--card-bg)]/80 backdrop-blur-[24px]
            border-r border-[var(--border-subtle)]
            transition-all duration-300 ease-in-out
            ${sidebarOpen ? 'w-[220px] translate-x-0' : '-translate-x-full md:translate-x-0 md:w-[56px]'}
            ${sidebarOpen ? 'shadow-2xl md:shadow-none' : ''}
          `}
        >
          <div className={`
            flex items-center border-b border-[var(--border-subtle)] flex-shrink-0
            ${sidebarOpen ? 'h-14 px-4 justify-between' : 'h-12 px-0 justify-center'}
          `}>
            <div className={`flex items-center gap-3 overflow-hidden ${sidebarOpen ? '' : 'hidden'}`}>
              <div className="text-[11px] font-bold tracking-[0.18em] uppercase text-[var(--text-main)] whitespace-nowrap">
                VANTA
              </div>
              <div className="text-[9px] text-[var(--text-muted)] tracking-wide whitespace-nowrap">
                v0.1.0
              </div>
            </div>
            <div className={`flex items-center gap-1 ${sidebarOpen ? '' : 'flex-col'}`}>
              <button
                onClick={toggleSidebar}
                className="w-7 h-7 flex items-center justify-center rounded-md text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--glass-hover)] transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/50"
                aria-label={sidebarOpen ? 'Contraer barra lateral' : 'Expandir barra lateral'}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
                  className={`transition-transform duration-200 ${sidebarOpen ? '' : 'rotate-180'}`}
                >
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </button>
              <div className={`${sidebarOpen ? '' : 'hidden'}`}>
                <ThemeToggle theme={theme} setTheme={setTheme} />
              </div>
            </div>
          </div>

          <nav className="flex-1 py-2 overflow-y-auto" aria-label="Navegación principal">
            <div role="tablist" aria-orientation="vertical" className="flex flex-col items-stretch gap-0.5 px-1">
              {TABS.map((tab) => {
                const active = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    id={`tab-${tab.id}`}
                    role="tab"
                    aria-selected={active}
                    aria-controls={`panel-${tab.id}`}
                    tabIndex={active ? 0 : -1}
                    onClick={() => handleTabClick(tab.id)}
                    onKeyDown={handleTabKeyDown}
                    className={`
                      flex items-center rounded-md transition-all duration-200
                      outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/50
                      ${sidebarOpen
                        ? 'gap-3 px-3 py-2.5 text-left w-full'
                        : 'gap-0 px-0 py-2.5 justify-center w-full'
                      }
                      ${active
                        ? 'bg-[var(--glass-bg)] text-[var(--text-main)] md:border-l-2 md:border-[var(--accent)]'
                        : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--glass-hover)]'
                      }
                    `}
                    title={tab.label}
                  >
                    <SidebarIcon type={tab.icon} active={active} />
                    <span className={`text-xs tracking-wide whitespace-nowrap ${sidebarOpen ? '' : 'hidden'}`}>
                      {tab.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </nav>

          <div className={`
            border-t border-[var(--border-subtle)] flex-shrink-0
            ${sidebarOpen ? 'px-4 py-3' : 'px-1 py-2'}
          `}>
            <div className={`flex items-center ${sidebarOpen ? 'gap-2 mb-3' : 'gap-0 mb-2 justify-center'}`}>
              <div className="w-7 h-7 rounded-full bg-[var(--accent-subtle)] border border-[var(--border-subtle)] flex items-center justify-center flex-shrink-0">
                <span className="text-[10px] font-bold text-[var(--accent-text)]">
                  {user.usuario.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className={`flex-1 min-w-0 ${sidebarOpen ? '' : 'hidden'}`}>
                <div className="text-[11px] text-[var(--text-main)] truncate">{user.usuario}</div>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className={`
                text-[10px] text-[var(--text-muted)] hover:text-[var(--text-main)]
                border border-[var(--border-subtle)] hover:border-[var(--border-strong)]
                rounded-md transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/50
                ${sidebarOpen ? 'w-full py-1.5' : 'w-full py-1.5 flex items-center justify-center'}
              `}
              title="Cerrar Sesion"
              aria-label="Cerrar Sesion"
            >
              {sidebarOpen ? 'Cerrar Sesion' : (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
              )}
            </button>
          </div>
        </aside>

        <main id="main-content" className="flex-1 overflow-hidden bg-[var(--page-bg)] relative" tabIndex={-1}>
          <div className="md:hidden absolute top-3 left-3 z-20">
            <button
              onClick={() => setSidebarOpen(true)}
              className="w-8 h-8 flex items-center justify-center rounded-md text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--glass-hover)] transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/50"
              aria-label="Abrir barra lateral"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
          </div>
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={transition}
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
        </main>
      </div>
    </AppContext.Provider>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppShell />
    </ThemeProvider>
  );
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1048576).toFixed(1) + ' MB';
}
