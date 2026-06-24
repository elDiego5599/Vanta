import { useState, useMemo, useCallback, memo, lazy, Suspense, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import AppContext from './lib/AppContext';
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
  { id: 'ingesta', label: 'Evidencias', icon: 'upload' },
  { id: 'transcripcion', label: 'Transcripcion', icon: 'waveform' },
  { id: 'busqueda', label: 'Busqueda Semantica', icon: 'search' },
];

const pageVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -12 },
};

const MODULE_MAP = {
  ingesta: ModuloIngesta,
  transcripcion: ModuloTranscripcion,
  busqueda: ModuloBusqueda,
};

const SidebarIcon = memo(function SidebarIcon({ type, active }) {
  const color = active ? 'var(--accent)' : 'var(--text-muted)';
  const icons = {
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
  return icons[type] || null;
});

function AppShell() {
  const { theme, setTheme } = useTheme();
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('ingesta');
  const [evidenceQueue, setEvidenceQueue] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const toggleSidebar = useCallback(() => setSidebarOpen((p) => !p), []);

  const handleTabClick = useCallback((id) => {
    setActiveTab(id);
    if (window.matchMedia('(max-width: 767px)').matches) {
      setSidebarOpen(false);
    }
  }, []);

  const handleKeyDownEsc = useCallback((e) => {
    if (e.key === 'Escape') setSidebarOpen(false);
  }, []);

  useEffect(() => {
    if (sidebarOpen) {
      document.addEventListener('keydown', handleKeyDownEsc);
      return () => document.removeEventListener('keydown', handleKeyDownEsc);
    }
  }, [sidebarOpen, handleKeyDownEsc]);

  const selectFileForTranscription = useCallback((file) => {
    setSelectedFile(file);
    setActiveTab('transcripcion');
  }, []);

  const addEvidence = useCallback((file) => {
    const id = `ev-${Date.now()}`;
    const item = {
      id,
      file,
      nombre: file.name,
      estado: 'listo',
      progreso: 0,
      tamano: formatSize(file.size),
    };
    setEvidenceQueue((prev) => [item, ...prev]);
  }, []);

  const updateEvidence = useCallback((id, updates) => {
    setEvidenceQueue((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
    );
  }, []);

  const handleLogout = useCallback(() => {
    setUser(null);
    setActiveTab('ingesta');
    setSelectedFile(null);
  }, []);

  const handleTabKeyDown = useCallback((e) => {
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
      setActiveTab(TABS[nextIdx].id);
      document.getElementById(`tab-${TABS[nextIdx].id}`)?.focus();
    }
  }, [activeTab]);

  const contextValue = useMemo(() => ({
    evidenceQueue, addEvidence, updateEvidence,
    selectedFile, selectFileForTranscription,
    user,
  }), [evidenceQueue, addEvidence, updateEvidence, selectedFile, selectFileForTranscription, user]);

  if (!user) {
    return <LoginScreen onLogin={setUser} />;
  }

  const ActiveModule = MODULE_MAP[activeTab] || ModuloIngesta;

  return (
    <AppContext.Provider value={contextValue}>
      <div className="flex h-screen bg-[var(--page-bg)] text-[var(--text-main)] font-sans overflow-hidden">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-[var(--card-bg)] focus:text-[var(--text-main)] focus:border focus:border-[var(--border-strong)] focus:rounded-md focus:text-xs focus:font-semibold focus:outline-none"
        >
          Saltar al contenido
        </a>

        <div className="md:hidden">
          {sidebarOpen && (
            <div
              className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm"
              onClick={() => setSidebarOpen(false)}
              aria-hidden="true"
            />
          )}
        </div>

        <aside
          className={`
            fixed inset-y-0 left-0 z-40 md:relative md:z-auto
            flex flex-col bg-[var(--card-bg)]/80 backdrop-blur-[24px]
            border-r border-[var(--border-subtle)]
            transition-all duration-300 ease-in-out
            ${sidebarOpen ? 'w-[220px] translate-x-0' : '-translate-x-full md:translate-x-0 md:w-[64px]'}
          `}
        >
          <div className="relative px-3 py-3 border-b border-[var(--border-subtle)] flex items-center justify-between overflow-hidden flex-shrink-0">
            <div className="absolute -inset-x-20 -top-20 w-[300px] h-[300px] bg-[var(--text-main)] opacity-[0.02] blur-[80px] rounded-full pointer-events-none" />
            <div className="relative z-10 flex items-center gap-3 overflow-hidden">
              <div className={`transition-opacity duration-200 ${sidebarOpen ? 'opacity-100' : 'opacity-0 md:opacity-100'}`}>
                <div className="text-[11px] font-bold tracking-[0.18em] uppercase text-[var(--text-main)] whitespace-nowrap">
                  VANTA
                </div>
                <div className="text-[9px] text-[var(--text-muted)] mt-0.5 tracking-wide whitespace-nowrap">
                  v0.1.0 — offline
                </div>
              </div>
            </div>
            <div className="relative z-10 flex items-center gap-1">
              <button
                onClick={toggleSidebar}
                className="hidden md:flex w-7 h-7 items-center justify-center rounded-md text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--glass-hover)] transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/50"
                aria-label={sidebarOpen ? 'Contraer barra lateral' : 'Expandir barra lateral'}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
                  className={`transition-transform duration-200 ${sidebarOpen ? '' : 'rotate-180'}`}
                >
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </button>
              <button
                onClick={toggleSidebar}
                className="md:hidden w-7 h-7 items-center justify-center rounded-md text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--glass-hover)] transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/50"
                aria-label="Cerrar barra lateral"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
              <ThemeToggle theme={theme} setTheme={setTheme} />
            </div>
          </div>

          <nav className="flex-1 py-3 px-2 overflow-hidden" aria-label="Navegación principal">
            <div role="tablist" aria-orientation="vertical" className="flex flex-col items-stretch">
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
                      flex items-center gap-3 px-3 py-2.5 rounded-md text-left
                      transition-all duration-200 mb-0.5
                      outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/50
                      ${sidebarOpen ? 'w-full' : 'w-full justify-center md:justify-center'}
                      ${active
                        ? 'bg-[var(--glass-bg)] text-[var(--text-main)] border-l-2 border-[var(--accent)]'
                        : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--glass-hover)] border-l-2 border-transparent'
                      }
                    `}
                    title={tab.label}
                  >
                    <SidebarIcon type={tab.icon} active={active} />
                    <span className={`text-[12px] tracking-wide whitespace-nowrap transition-opacity duration-200 ${sidebarOpen ? 'opacity-100' : 'opacity-0 md:opacity-0 w-0 overflow-hidden'}`}>
                      {tab.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </nav>

          <div className={`px-3 py-3 border-t border-[var(--border-subtle)] transition-all duration-200 ${sidebarOpen ? '' : 'md:px-2'}`}>
            <div className={`flex items-center gap-2 mb-3 ${sidebarOpen ? '' : 'md:justify-center'}`}>
              <div className="w-7 h-7 rounded-full bg-[var(--accent-subtle)] border border-[var(--border-subtle)] flex items-center justify-center flex-shrink-0">
                <span className="text-[10px] font-bold text-[var(--accent-text)]">
                  {user.usuario.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className={`flex-1 min-w-0 transition-opacity duration-200 ${sidebarOpen ? 'opacity-100' : 'opacity-0 md:opacity-0 w-0 overflow-hidden'}`}>
                <div className="text-[11px] text-[var(--text-main)] truncate">{user.usuario}</div>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className={`py-1.5 text-[10px] text-[var(--text-muted)] hover:text-[var(--text-main)] border border-[var(--border-subtle)] hover:border-[var(--border-strong)] rounded-md transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/50 ${sidebarOpen ? 'w-full' : 'md:w-full'}`}
              title="Cerrar Sesion"
            >
              {sidebarOpen ? 'Cerrar Sesion' : ''}
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

function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1048576).toFixed(1) + ' MB';
}
