import { useState, useMemo, useCallback, lazy, Suspense, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import AppContext from './lib/AppContext';
import type { AppContextType, EvidenceItem, CaseData } from './lib/AppContext';
import * as db from './lib/db';
import { ThemeProvider } from './lib/theme';
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
import LoginScreen from './components/app/LoginScreen';

const ModuloCasos = lazy(() => import('./components/app/ModuloCasos'));
const ModuloIngesta = lazy(() => import('./components/app/ModuloIngesta'));
const ModuloTranscripcion = lazy(() => import('./components/app/ModuloTranscripcion'));
const ModuloBusqueda = lazy(() => import('./components/app/ModuloBusqueda'));
const Sidebar = lazy(() => import('./components/app/Sidebar'));

const TABS = [
  { id: 'casos', label: 'Casos', icon: 'folder' as const },
  { id: 'ingesta', label: 'Evidencias', icon: 'upload' as const },
  { id: 'transcripcion', label: 'Transcripcion', icon: 'waveform' as const },
  { id: 'busqueda', label: 'Busqueda Semantica', icon: 'search' as const },
];

type TabId = (typeof TABS)[number]['id'];

const MODULE_MAP: Record<string, React.LazyExoticComponent<React.ComponentType>> = {
  casos: ModuloCasos,
  ingesta: ModuloIngesta,
  transcripcion: ModuloTranscripcion,
  busqueda: ModuloBusqueda,
};

function AppShell() {
  const [user, setUser] = useState<{ usuario: string } | null>(() => {
    const saved = localStorage.getItem('vanta_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [activeTab, setActiveTab] = useState<TabId>(() => {
    const saved = localStorage.getItem('vanta_active_tab');
    if (saved && ['casos', 'ingesta', 'transcripcion', 'busqueda'].includes(saved)) return saved as TabId;
    return 'casos';
  });
  const [evidenceQueue, setEvidenceQueue] = useState<EvidenceItem[]>([]);
  const [selectedFile, setSelectedFile] = useState<EvidenceItem | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [cases, setCases] = useState<CaseData[]>([]);
  const [activeCase, setActiveCase] = useState<CaseData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const loadedRef = useRef(false);
  const prevActiveCaseId = useRef<string | null>(null);
  const persistReady = useRef(false);

  useEffect(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;
    (async () => {
      try {
        const storedCases = await db.getCases();
        setCases(storedCases);

        const savedCaseId = localStorage.getItem('vanta_active_case_id');
        const savedFileRaw = localStorage.getItem('vanta_selected_file');

        if (storedCases.length > 0) {
          let targetCase: CaseData | undefined;
          if (savedCaseId) {
            targetCase = storedCases.find(c => c.id === savedCaseId);
          }
          if (!targetCase) {
            targetCase = storedCases[0];
          }
          setActiveCase(targetCase!);
          const evs = await db.getEvidenceByCaseWithStatus(targetCase!.id);
          setEvidenceQueue(evs.map(e => ({
            id: e.id, caseId: e.caseId, nombre: e.nombre,
            estado: e.estado, progreso: e.progreso, tamano: e.tamano,
            isTranscribed: e.isTranscribed,
          })));

          if (savedFileRaw) {
            try {
              const savedFile = JSON.parse(savedFileRaw);
              const fileData = evs.find(e => e.id === savedFile.id);
              if (fileData) {
                setSelectedFile({
                  id: fileData.id,
                  caseId: fileData.caseId,
                  nombre: fileData.nombre,
                  estado: fileData.estado,
                  progreso: fileData.progreso,
                  tamano: fileData.tamano,
                });
              }
            } catch {}
          }
        }
        persistReady.current = true;
      } catch (e) {
        console.error('Failed to restore state:', e);
      }
      setIsLoading(false);
    })();
  }, []);

  useEffect(() => {
    if (!activeCase || !loadedRef.current) return;
    const prevId = prevActiveCaseId.current;
    prevActiveCaseId.current = activeCase.id;
    (async () => {
      try {
        const evs = await db.getEvidenceByCaseWithStatus(activeCase.id);
        setEvidenceQueue(evs.map(e => ({
          id: e.id, caseId: e.caseId, nombre: e.nombre,
          estado: e.estado, progreso: e.progreso, tamano: e.tamano,
          isTranscribed: e.isTranscribed,
        })));
        if (prevId !== null && prevId !== activeCase.id) {
          setSelectedFile(null);
        }
      } catch (e) {
        console.error('Failed to load evidence:', e);
      }
    })();
  }, [activeCase]);

  const toggleSidebar = useCallback(() => setSidebarOpen((p) => !p), []);

  const handleKeyDownEsc = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') setSidebarOpen(false);
  }, []);

  useEffect(() => {
    if (sidebarOpen) {
      document.addEventListener('keydown', handleKeyDownEsc);
      return () => document.removeEventListener('keydown', handleKeyDownEsc);
    }
  }, [sidebarOpen, handleKeyDownEsc]);

  useEffect(() => {
    localStorage.setItem('vanta_active_tab', activeTab);
  }, [activeTab]);

  useEffect(() => {
    if (activeCase) {
      localStorage.setItem('vanta_active_case_id', activeCase.id);
    } else if (persistReady.current) {
      localStorage.removeItem('vanta_active_case_id');
    }
  }, [activeCase]);

  useEffect(() => {
    if (selectedFile) {
      localStorage.setItem('vanta_selected_file', JSON.stringify({ id: selectedFile.id, caseId: selectedFile.caseId }));
    } else if (persistReady.current) {
      localStorage.removeItem('vanta_selected_file');
    }
  }, [selectedFile]);

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
    if (updates.estado !== undefined || updates.progreso !== undefined || updates.isTranscribed !== undefined) {
      db.updateEvidenceStatus(id, updates.estado ?? 'listo', updates.progreso ?? 0, updates.isTranscribed);
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
    const evs = await db.getEvidenceByCaseWithStatus(activeCase.id);
    setEvidenceQueue(evs.map(e => ({
      id: e.id, caseId: e.caseId, nombre: e.nombre,
      estado: e.estado, progreso: e.progreso, tamano: e.tamano,
      isTranscribed: e.isTranscribed,
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

  const contextValue: AppContextType = useMemo(() => ({
    evidenceQueue, addEvidence, updateEvidence,
    selectedFile, selectFileForTranscription,
    user,
    cases, activeCase, setActiveCase,
    createCase, deleteCase: handleDeleteCase,
    refreshCases, refreshEvidence,
    isLoading,
    activeTab, setActiveTab,
    sidebarOpen, toggleSidebar,
    handleLogout,
  }), [evidenceQueue, addEvidence, updateEvidence, selectedFile, selectFileForTranscription,
    user, cases, activeCase, createCase, handleDeleteCase,
    refreshCases, refreshEvidence, isLoading, activeTab, setActiveTab,
    sidebarOpen, toggleSidebar, handleLogout]);

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
