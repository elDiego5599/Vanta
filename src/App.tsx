import { useState, useMemo, useCallback, memo, lazy, Suspense, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import AppContext from './lib/AppContext';
import type { AppContextType, EvidenceItem } from './lib/AppContext';
import { ThemeProvider } from './lib/theme';
import { useTheme } from './lib/use-theme';
import { fadeIn, transition } from './lib/motion';
import ErrorBoundary from './components/landing/ErrorBoundary';
import { SkeletonSection } from './components/landing/SkeletonSection';
import { CSSGrid } from './components/landing/CSSGrid';
import { VantaMiniLogo } from './components/landing/Icons';
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

const MODULE_TITLES: Record<TabId, string> = {
  ingesta: 'Ingesta de Evidencia',
  transcripcion: 'Linea de Tiempo',
  busqueda: 'Busqueda Semantica',
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
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="17 8 12 3 7 8" />
        <line x1="12" y1="3" x2="12" y2="15" />
      </svg>
    ),
    waveform: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 12h2l3-9 4 18 4-18 3 9h4" />
      </svg>
    ),
    search: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
    ),
  };
  return icons[type] ?? null;
});

const ThemeIcon = memo(function ThemeIcon({ theme }: { theme: string }) {
  const color = 'var(--text-muted)';
  if (theme === 'light') {
    return (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="5" />
        <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
      </svg>
    );
  }
  if (theme === 'dark') {
    return (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
      </svg>
    );
  }
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
      <line x1="8" y1="21" x2="16" y2="21" />
      <line x1="12" y1="17" x2="12" y2="21" />
    </svg>
  );
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
            className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm md:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />
        )}

        <div className="flex w-full h-full bg-[#050505] rounded-[22px] overflow-hidden border border-white/[0.05] shadow-[0_0_80px_rgba(0,0,0,0.8)] relative">
          <aside
            className={`
              ${sidebarOpen
                ? 'w-[150px] md:w-[200px] xl:w-[240px]'
                : '-translate-x-full md:translate-x-0 md:w-[56px]'
              }
              shrink-0 flex flex-col
              transition-all duration-300 ease-in-out
              ${sidebarOpen ? '' : '-translate-x-full md:translate-x-0'}
              bg-[var(--card-bg)] border-r border-[var(--border-subtle)]
            `}
          >
            <div className={`
              flex border-b border-[var(--border-subtle)] flex-shrink-0
              ${sidebarOpen ? 'px-5 py-4' : 'h-14 justify-center items-center'}
            `}>
              {sidebarOpen ? (
                <div className="w-full">
                  <div className="text-[13px] tracking-[0.16em] uppercase text-[var(--text-main)] font-bold flex items-center gap-2.5">
                    <VantaMiniLogo className="w-[18px] h-[18px]" />
                    VANTA
                  </div>
                  <div className="text-[10px] text-[var(--text-muted)] mt-1.5 tracking-[0.06em] font-mono">
                    v0.1.0 — offline
                  </div>
                </div>
              ) : (
                <VantaMiniLogo className="w-[20px] h-[20px]" />
              )}
            </div>

            <nav className="flex-1 py-3 overflow-y-auto" aria-label="Navegación principal">
              <div role="tablist" aria-orientation="vertical" className="flex flex-col items-stretch gap-0.5 px-2">
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
                        outline-none focus-visible:bg-[var(--glass-hover)] transition-all duration-200
                        ${sidebarOpen
                          ? 'w-full text-left px-3 py-2 text-[12px] tracking-[0.03em] border-l-2 flex items-center gap-2.5 rounded-r-md'
                          : 'w-full py-2.5 justify-center flex items-center rounded-md'
                        }
                        ${active
                          ? sidebarOpen
                            ? 'font-medium text-[var(--text-main)] bg-[var(--glass-bg)] border-l-[var(--accent)]'
                            : 'text-[var(--text-main)] bg-[var(--glass-bg)]'
                          : sidebarOpen
                            ? 'font-normal text-[var(--text-muted)] border-l-transparent hover:text-[var(--text-main)] hover:bg-[var(--glass-hover)]'
                            : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--glass-hover)]'
                        }
                      `}
                      title={tab.label}
                    >
                      <SidebarIcon type={tab.icon} active={active} />
                      <span className={`whitespace-nowrap ${sidebarOpen ? '' : 'hidden'}`}>
                        {tab.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </nav>

            <div className="border-t border-[var(--border-subtle)] flex-shrink-0 p-3">
              <div className={`flex items-center ${sidebarOpen ? 'gap-2.5 mb-3' : 'justify-center mb-2'}`}>
                <div className="w-8 h-8 rounded-full bg-[var(--accent-subtle)] border border-[var(--border-subtle)] flex items-center justify-center flex-shrink-0">
                  <span className="text-[11px] font-bold text-[var(--accent-text)]">
                    {user.usuario.charAt(0).toUpperCase()}
                  </span>
                </div>
                {sidebarOpen && (
                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] text-[var(--text-main)] truncate font-medium">{user.usuario}</div>
                  </div>
                )}
              </div>
              <div className={`flex items-center gap-1 ${sidebarOpen ? '' : 'flex-col'}`}>
                <button
                  onClick={toggleSidebar}
                  className="w-7 h-7 flex items-center justify-center rounded-md text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--glass-hover)] transition-colors outline-none"
                  aria-label={sidebarOpen ? 'Contraer barra lateral' : 'Expandir barra lateral'}
                  title={sidebarOpen ? 'Contraer' : 'Expandir'}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
                    className={`transition-transform duration-200 ${sidebarOpen ? '' : 'rotate-180'}`}
                  >
                    <polyline points="15 18 9 12 15 6" />
                  </svg>
                </button>
                <button
                  onClick={() => {
                    if (theme === 'dark') setTheme('light');
                    else if (theme === 'light') setTheme('system');
                    else setTheme('dark');
                  }}
                  className="w-7 h-7 flex items-center justify-center rounded-md text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--glass-hover)] transition-colors outline-none"
                  aria-label="Cambiar Tema"
                  title="Cambiar Tema"
                >
                  <ThemeIcon theme={theme} />
                </button>
                <button
                  onClick={handleLogout}
                  className="w-7 h-7 flex items-center justify-center rounded-md text-[var(--text-muted)] hover:text-red-500 hover:bg-[var(--glass-hover)] transition-colors outline-none"
                  title="Cerrar Sesion"
                  aria-label="Cerrar Sesion"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                </button>
              </div>
            </div>
          </aside>

          <main id="main-content" className="flex-1 flex flex-col overflow-hidden bg-[radial-gradient(ellipse_at_top_right,_rgba(255,255,255,0.03),_transparent_50%)] relative" tabIndex={-1}>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[var(--text-main)] opacity-[0.03] blur-[120px] rounded-full pointer-events-none z-0" />

            <div className="md:hidden absolute top-3 left-3 z-20">
              <button
                onClick={() => setSidebarOpen(true)}
                className="w-8 h-8 flex items-center justify-center rounded-md text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--glass-hover)] transition-colors outline-none"
                aria-label="Abrir barra lateral"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="18" x2="21" y2="18" />
                </svg>
              </button>
            </div>

            <div className="z-10 flex items-center justify-between px-6 pt-6 pb-0">
              <div className="text-[14px] font-bold text-white/90 tracking-[-0.01em]">
                {MODULE_TITLES[activeTab]}
              </div>
              <div className="flex gap-1.5 items-center px-3 py-1.5 rounded-md bg-white/[0.03] border border-white/[0.05]">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse shadow-[0_0_6px_rgba(34,197,94,0.8)]" />
                <span className="text-[10px] text-zinc-400 tracking-[0.08em] font-mono uppercase">
                  Offline Local
                </span>
              </div>
            </div>

            <div className="flex-1 overflow-hidden z-10">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  variants={fadeIn}
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
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
            </div>
          </main>
        </div>
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
