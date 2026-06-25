import { useState, useMemo, useCallback, memo, lazy, Suspense, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import AppContext from './lib/AppContext';
import type { AppContextType, EvidenceItem, CaseData } from './lib/AppContext';
import * as db from './lib/db';
import { ThemeProvider } from './lib/theme';
import { useTheme } from './lib/use-theme';
import { fadeIn } from './lib/motion';
import ErrorBoundary from './components/landing/ErrorBoundary';
import { MagneticButton } from './components/landing/Primitives';
import { SkeletonSection } from './components/landing/SkeletonSection';

const GLOW_COLORS: Record<TabId, string> = {
  casos: '#f59e0b',
  ingesta: '#3b82f6',
  transcripcion: '#10b981',
  busqueda: '#a855f7',
};

const CASE_DEPENDENT_TABS: Set<TabId> = new Set(['ingesta', 'transcripcion', 'busqueda']);
import { CSSGrid } from './components/landing/CSSGrid';
import { VantaMiniLogo } from './components/landing/Icons';
import LoginScreen from './components/app/LoginScreen';

const ModuloCasos = lazy(() => import('./components/app/ModuloCasos'));
const ModuloIngesta = lazy(() => import('./components/app/ModuloIngesta'));
const ModuloTranscripcion = lazy(() => import('./components/app/ModuloTranscripcion'));
const ModuloBusqueda = lazy(() => import('./components/app/ModuloBusqueda'));

const TABS = [
  { id: 'casos', label: 'Casos', icon: 'folder' as const },
  { id: 'ingesta', label: 'Evidencias', icon: 'upload' as const },
  { id: 'transcripcion', label: 'Transcripcion', icon: 'waveform' as const },
  { id: 'busqueda', label: 'Busqueda Semantica', icon: 'search' as const },
];

type TabId = (typeof TABS)[number]['id'];

const MODULE_TITLES: Record<TabId, string> = {
  casos: 'Casos',
  ingesta: 'Ingesta de Evidencia',
  transcripcion: 'Linea de Tiempo',
  busqueda: 'Busqueda Semantica',
};

const MODULE_MAP: Record<string, React.LazyExoticComponent<React.ComponentType>> = {
  casos: ModuloCasos,
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
    folder: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
      </svg>
    ),
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
  const [user, setUser] = useState<{ usuario: string } | null>(() => {
    const saved = localStorage.getItem('vanta_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [activeTab, setActiveTab] = useState<TabId>('ingesta');
  const [evidenceQueue, setEvidenceQueue] = useState<EvidenceItem[]>([]);
  const [selectedFile, setSelectedFile] = useState<EvidenceItem | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [cases, setCases] = useState<CaseData[]>([]);
  const [activeCase, setActiveCase] = useState<CaseData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const loadedRef = useRef(false);

  useEffect(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;
    (async () => {
      try {
        const storedCases = await db.getCases();
        setCases(storedCases);
        if (storedCases.length > 0) {
          const first = storedCases[0]!;
          setActiveCase(first);
          const evs = await db.getEvidenceByCase(first.id);
          setEvidenceQueue(evs.map(e => ({
            id: e.id, caseId: e.caseId, nombre: e.nombre,
            estado: e.estado, progreso: e.progreso, tamano: e.tamano,
          })));
        }
      } catch (e) {
        console.error('Failed to restore state:', e);
      }
      setIsLoading(false);
    })();
  }, []);

  useEffect(() => {
    if (!activeCase || !loadedRef.current) return;
    (async () => {
      try {
        const evs = await db.getEvidenceByCase(activeCase.id);
        setEvidenceQueue(evs.map(e => ({
          id: e.id, caseId: e.caseId, nombre: e.nombre,
          estado: e.estado, progreso: e.progreso, tamano: e.tamano,
        })));
        setSelectedFile(null);
      } catch (e) {
        console.error('Failed to load evidence:', e);
      }
    })();
  }, [activeCase]);

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

  const addEvidence = useCallback(async (file: File, caseId: string) => {
    const id = `ev-${Date.now()}`;
    const tamano = formatSize(file.size);
    const arrayBuffer = await file.arrayBuffer();
    await db.saveEvidence(id, caseId, file.name, tamano, arrayBuffer);
    const item: EvidenceItem = { id, caseId, nombre: file.name, estado: 'listo', progreso: 0, tamano };
    setEvidenceQueue((prev) => [item, ...prev]);
  }, []);

  const updateEvidence = useCallback((id: string, updates: Partial<EvidenceItem>) => {
    setEvidenceQueue((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
    );
    if (updates.estado !== undefined || updates.progreso !== undefined) {
      db.updateEvidenceStatus(id, updates.estado ?? 'listo', updates.progreso ?? 0);
    }
  }, []);

  const createCase = useCallback(async (name: string, description: string): Promise<string> => {
    const id = await db.createCase(name, description);
    const newCase: CaseData = { id, name, description, createdAt: Date.now(), updatedAt: Date.now() };
    setCases(prev => [...prev, newCase]);
    setActiveCase(newCase);
    setEvidenceQueue([]);
    setSelectedFile(null);
    return id;
  }, []);

  const handleDeleteCase = useCallback(async (id: string) => {
    await db.deleteCase(id);
    setCases(prev => prev.filter(c => c.id !== id));
    if (activeCase?.id === id) {
      setActiveCase(null);
      setEvidenceQueue([]);
      setSelectedFile(null);
    }
  }, [activeCase]);

  const refreshCases = useCallback(async () => {
    const storedCases = await db.getCases();
    setCases(storedCases);
  }, []);

  const refreshEvidence = useCallback(async () => {
    if (!activeCase) return;
    const evs = await db.getEvidenceByCase(activeCase.id);
    setEvidenceQueue(evs.map(e => ({
      id: e.id, caseId: e.caseId, nombre: e.nombre,
      estado: e.estado, progreso: e.progreso, tamano: e.tamano,
    })));
  }, [activeCase]);

  const handleLogin = useCallback((u: { usuario: string } | null) => {
    setUser(u);
    if (u) localStorage.setItem('vanta_user', JSON.stringify(u));
    else localStorage.removeItem('vanta_user');
  }, []);

  const handleLogout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('vanta_user');
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
    cases, activeCase, setActiveCase,
    createCase, deleteCase: handleDeleteCase,
    refreshCases, refreshEvidence,
    isLoading,
    activeTab, setActiveTab,
  }), [evidenceQueue, addEvidence, updateEvidence, selectedFile, selectFileForTranscription,
      user, cases, activeCase, createCase, handleDeleteCase,
      refreshCases, refreshEvidence, isLoading, activeTab, setActiveTab]);

  if (isLoading) {
    return (
      <div className="flex h-screen bg-[var(--page-bg)] items-center justify-center">
        <div className="text-xs text-[var(--text-muted)] animate-pulse">Cargando...</div>
      </div>
    );
  }

  if (!user) {
    return <LoginScreen onLogin={handleLogin} />;
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
            className="fixed inset-0 z-30 bg-black/30 backdrop-blur-sm md:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />
        )}

        <div className="flex w-full h-full bg-[var(--card-bg)] rounded-[22px] overflow-hidden border border-[var(--border-subtle)] shadow-[0_8px_60px_-12px_rgba(0,0,0,0.3)] relative">
          <aside
            className={`
              ${sidebarOpen ? 'w-[150px] md:w-[200px] xl:w-[240px]' : 'md:w-[56px]'}
              ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
              shrink-0 flex flex-col
              transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]
              bg-[var(--card-bg)] border-r border-[var(--border-subtle)]
              overflow-hidden
            `}
          >
            <div className={`
              flex border-b border-[var(--border-subtle)] flex-shrink-0
              ${sidebarOpen ? 'px-5 py-4' : 'h-14 justify-center items-center'}
            `}>
              {sidebarOpen ? (
                <div className="w-full">
                  <div className="flex items-center gap-2.5 select-none">
                    <VantaMiniLogo className="w-[18px] h-[18px]" />
                    <span className="chrome-text text-[13px] tracking-[0.16em] uppercase font-bold">VANTA</span>
                  </div>
                </div>
              ) : (
                <VantaMiniLogo className="w-[20px] h-[20px]" />
              )}
            </div>

            <nav className="flex-1 overflow-y-auto py-4 scroll-fade" aria-label="Navegacion principal">
              {sidebarOpen && activeCase && (
                <div className="px-5 mb-4 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: 'var(--accent)', boxShadow: '0 0 6px var(--accent)' }} />
                  <div className="text-[11px] font-medium truncate" style={{ color: 'var(--text-main)' }}>{activeCase.name}</div>
                </div>
              )}

              <div role="tablist" aria-orientation="vertical" className="flex flex-col items-stretch gap-1 px-3">
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
                        outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--card-bg)] transition-all duration-200
                        ${sidebarOpen
                          ? 'w-full text-left px-4 py-3 text-[12px] tracking-[0.04em] border-l-2 flex items-center gap-3 rounded-r-md hover:translate-x-[2px]'
                          : 'w-full py-3 justify-center flex items-center rounded-md'
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
                      <AnimatePresence initial={false}>
                        {sidebarOpen && (
                          <motion.span
                            key="label"
                            initial={{ opacity: 0, width: 0 }}
                            animate={{ opacity: 1, width: 'auto' }}
                            exit={{ opacity: 0, width: 0 }}
                            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                            className="whitespace-nowrap overflow-hidden"
                          >
                            {tab.label}
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </button>
                  );
                })}
              </div>
            </nav>

            <div className="border-t border-[var(--border-subtle)] flex-shrink-0 p-4">
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
              <div className={`flex items-center gap-2 ${sidebarOpen ? '' : 'flex-col'}`}>
                <button
                  onClick={toggleSidebar}
                  className="w-8 h-8 flex items-center justify-center rounded-md text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--glass-hover)] hover:scale-110 active:scale-95 transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/50"
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
                  className="w-8 h-8 flex items-center justify-center rounded-md text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--glass-hover)] hover:scale-110 active:scale-95 transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/50"
                  aria-label="Cambiar Tema"
                  title="Cambiar Tema"
                >
                  <ThemeIcon theme={theme} />
                </button>
                <button
                  onClick={handleLogout}
                  className="w-8 h-8 flex items-center justify-center rounded-md text-[var(--text-muted)] hover:text-red-400 hover:bg-[var(--glass-hover)] hover:scale-110 active:scale-95 transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] outline-none focus-visible:ring-2 focus-visible:ring-red-500/50"
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

          <main id="main-content" className="flex-1 flex flex-col overflow-hidden bg-[var(--page-bg)] relative" tabIndex={-1}>
            <div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] opacity-[0.04] blur-[120px] rounded-full pointer-events-none z-0 transition-colors duration-700"
              style={{ backgroundColor: GLOW_COLORS[activeTab] }}
            />

            <div className="md:hidden absolute top-3 left-3 z-20">
              <button
                onClick={() => setSidebarOpen(true)}
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

            <div className="z-10 flex items-center justify-between px-6 pt-6 pb-0">
              <div className="text-[14px] font-bold tracking-[-0.01em] chrome-text select-none">
                {activeCase ? `${activeCase.name} / ` : ''}{MODULE_TITLES[activeTab]}
              </div>
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
