import { useState, memo } from 'react';
import AppContext from './lib/AppContext';
import { ThemeProvider } from './lib/theme';
import { ThemeToggle } from './components/landing/Primitives';
import { useTheme } from './lib/use-theme';
import LoginScreen from './components/app/LoginScreen';
import ModuloIngesta from './components/app/ModuloIngesta';
import ModuloTranscripcion from './components/app/ModuloTranscripcion';
import ModuloBusqueda from './components/app/ModuloBusqueda';

const TABS = [
  { id: 'ingesta', label: 'Evidencias', icon: 'upload' },
  { id: 'transcripcion', label: 'Transcripcion', icon: 'waveform' },
  { id: 'busqueda', label: 'Busqueda Semantica', icon: 'search' },
];

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

  const selectFileForTranscription = (file) => {
    setSelectedFile(file);
    setActiveTab('transcripcion');
  };

  const addEvidence = (file) => {
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
  };

  const updateEvidence = (id, updates) => {
    setEvidenceQueue((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
    );
  };

  const handleLogout = () => {
    setUser(null);
    setActiveTab('ingesta');
    setSelectedFile(null);
  };

  if (!user) {
    return <LoginScreen onLogin={setUser} />;
  }

  const renderModule = () => {
    switch (activeTab) {
      case 'ingesta': return <ModuloIngesta />;
      case 'transcripcion': return <ModuloTranscripcion />;
      case 'busqueda': return <ModuloBusqueda />;
      default: return <ModuloIngesta />;
    }
  };

  return (
    <AppContext.Provider value={{
      evidenceQueue, addEvidence, updateEvidence,
      selectedFile, selectFileForTranscription,
      user,
    }}>
      <div className="flex h-screen bg-[var(--page-bg)] text-[var(--text-main)] font-sans overflow-hidden">
        <aside className="w-[220px] flex-shrink-0 bg-[var(--card-bg)] border-r border-[var(--border-subtle)] flex flex-col">
          <div className="px-5 py-5 border-b border-[var(--border-subtle)] flex items-center justify-between">
            <div>
              <div className="text-[11px] font-bold tracking-[0.18em] uppercase text-[var(--text-main)]">
                VANTA
              </div>
              <div className="text-[9px] text-[var(--text-muted)] mt-1 tracking-wide">
                v0.1.0 — offline
              </div>
            </div>
            <ThemeToggle theme={theme} setTheme={setTheme} />
          </div>

          <nav className="flex-1 py-3 px-2" aria-label="Navegación principal">
            {TABS.map((tab) => {
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  aria-current={active ? 'page' : undefined}
                  className={`
                    w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-left
                    transition-all duration-200 mb-0.5
                    outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/50
                    ${active
                      ? 'bg-[var(--glass-bg)] text-[var(--text-main)] border-l-2 border-[var(--accent)]'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--glass-hover)] border-l-2 border-transparent'
                    }
                  `}
                >
                  <SidebarIcon type={tab.icon} active={active} />
                  <span className="text-[12px] tracking-wide">{tab.label}</span>
                </button>
              );
            })}
          </nav>

          <div className="px-4 py-3 border-t border-[var(--border-subtle)]">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-full bg-[var(--accent-subtle)] border border-[var(--border-subtle)] flex items-center justify-center">
                <span className="text-[10px] font-bold text-[var(--accent-text)]">
                  {user.usuario.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[11px] text-[var(--text-main)] truncate">{user.usuario}</div>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full py-1.5 text-[10px] text-[var(--text-muted)] hover:text-[var(--text-main)] border border-[var(--border-subtle)] hover:border-[var(--border-strong)] rounded-md transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/50"
            >
              Cerrar Sesion
            </button>
          </div>
        </aside>

        <main className="flex-1 overflow-hidden bg-[var(--page-bg)]">
          {renderModule()}
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
