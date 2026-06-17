import { useState } from 'react';
import ModuloIngesta from './components/ModuloIngesta';
import ModuloTranscripcion from './components/ModuloTranscripcion';
import ModuloBusqueda from './components/ModuloBusqueda';

const TABS = [
  { id: 'ingesta', label: 'Evidencias', icon: 'upload' },
  { id: 'transcripcion', label: 'Transcripcion', icon: 'waveform' },
  { id: 'busqueda', label: 'Busqueda Semantica', icon: 'search' },
  { id: 'config', label: 'Configuracion', icon: 'settings' },
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
    settings: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </svg>
    ),
  };
  return icons[type] || null;
}

function App() {
  const [activeTab, setActiveTab] = useState('ingesta');

  const renderModule = () => {
    switch (activeTab) {
      case 'ingesta': return <ModuloIngesta />;
      case 'transcripcion': return <ModuloTranscripcion />;
      case 'busqueda': return <ModuloBusqueda />;
      case 'config': return (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="text-[#71717a] text-sm mb-2">Configuracion</div>
            <div className="text-[#52525b] text-xs">Proximamente</div>
          </div>
        </div>
      );
      default: return <ModuloIngesta />;
    }
  };

  return (
    <div className="flex h-screen bg-[#09090b] text-white font-inter overflow-hidden">
      {/* Sidebar */}
      <aside className="w-[220px] flex-shrink-0 bg-[#060606] border-r border-white/5 flex flex-col">
        {/* Logo */}
        <div className="px-5 py-5 border-b border-white/5">
          <div className="text-[11px] font-bold tracking-[0.18em] uppercase text-white/85">
            VANTA
          </div>
          <div className="text-[9px] text-[#71717a] mt-1 tracking-wide">
            v3.0.0 — offline
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
                <span className="text-[12px] tracking-wide">
                  {tab.label}
                </span>
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-white/5">
          <div className="text-[9px] text-[#52525b] tracking-wider">
            VANTA FORENSICS
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden bg-[#09090b]">
        {renderModule()}
      </main>
    </div>
  );
}

export default App;
