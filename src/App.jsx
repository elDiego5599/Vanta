import { useState } from 'react';
import AppContext from './lib/AppContext';
import LoginScreen from './components/LoginScreen';
import ModuloIngesta from './components/ModuloIngesta';
import ModuloTranscripcion from './components/ModuloTranscripcion';
import ModuloBusqueda from './components/ModuloBusqueda';

const TABS = [
  { id: 'ingesta', label: 'Evidencias', icon: 'upload' },
  { id: 'transcripcion', label: 'Transcripcion', icon: 'waveform' },
  { id: 'busqueda', label: 'Busqueda Semantica', icon: 'search' },
];

function SidebarIcon({ type, active }) {
  const color = active ? '#3b82f6' : '#71717a';
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
}

function App() {
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
      <div className="flex h-screen bg-[#09090b] text-white font-inter overflow-hidden">
        {/* Sidebar */}
        <aside className="w-[220px] flex-shrink-0 bg-[#060606] border-r border-white/5 flex flex-col">
          {/* Logo */}
          <div className="px-5 py-5 border-b border-white/5">
            <div className="text-[11px] font-bold tracking-[0.18em] uppercase text-white/85">
              VANTA
            </div>
            <div className="text-[9px] text-[#71717a] mt-1 tracking-wide">
              v0.1.0 — offline
            </div>
          </div>

          {/* Nav */}
          <nav className="flex-1 py-3 px-2">
            {TABS.map((tab) => {
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-left
                    transition-all duration-200 mb-0.5
                    ${active
                      ? 'bg-white/[0.06] text-white/90 border-l-2 border-white/70'
                      : 'text-[#71717a] hover:text-white/70 hover:bg-white/[0.03] border-l-2 border-transparent'
                    }
                  `}
                >
                  <SidebarIcon type={tab.icon} active={active} />
                  <span className="text-[12px] tracking-wide">{tab.label}</span>
                </button>
              );
            })}
          </nav>

          {/* User + Logout */}
          <div className="px-4 py-3 border-t border-white/5">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-full bg-blue-500/10 border border-white/10 flex items-center justify-center">
                <span className="text-[10px] font-bold text-blue-400">
                  {user.usuario.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[11px] text-white/70 truncate">{user.usuario}</div>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full py-1.5 text-[10px] text-[#71717a] hover:text-white/60 border border-white/5 hover:border-white/10 rounded-md transition-colors"
            >
              Cerrar Sesion
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-hidden bg-[#09090b]">
          {renderModule()}
        </main>
      </div>
    </AppContext.Provider>
  );
}

function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1048576).toFixed(1) + ' MB';
}

export default App;
