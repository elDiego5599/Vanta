import { useState, useCallback, memo, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppContext, CaseData } from '../../lib/AppContext';
import { MagneticButton } from '../landing/Primitives';

const CASE_COLORS = [
  { bg: 'rgba(59,130,246,0.12)', icon: '#60a5fa' },
  { bg: 'rgba(168,85,247,0.12)', icon: '#a855f7' },
  { bg: 'rgba(34,197,94,0.12)', icon: '#4ade80' },
  { bg: 'rgba(249,115,22,0.12)', icon: '#fb923c' },
  { bg: 'rgba(236,72,153,0.12)', icon: '#f472b6' },
  { bg: 'rgba(20,184,166,0.12)', icon: '#2dd4bf' },
];

function getCaseColor(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = ((hash << 5) - hash + id.charCodeAt(i)) | 0;
  }
  return CASE_COLORS[Math.abs(hash) % CASE_COLORS.length]!;
}

const FolderIcon = memo(({ color }: { color: string }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
  </svg>
));

const TrashIcon = memo(() => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
));

const ArrowIcon = memo(() => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </svg>
));

const PlusIcon = memo(() => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
));

const cardVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] as const, delay: i * 0.05 },
  }),
};

function CaseCard({
  c,
  isActive,
  colors,
  onSelect,
  onNavigate,
  onDelete,
  index,
}: {
  c: CaseData;
  isActive: boolean;
  colors: typeof CASE_COLORS[number];
  onSelect: (c: CaseData) => void;
  onNavigate: (e: React.MouseEvent, c: CaseData) => void;
  onDelete: (id: string, e: React.MouseEvent) => void;
  index: number;
}) {
  return (
      <motion.div
        custom={index}
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        whileHover={{ y: -3, transition: { duration: 0.25, ease: [0.16, 1, 0.3, 1] } }}
        className="relative p-[1px] group"
      >
      <div
        className="absolute -inset-3 z-[-1] opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(59,130,246,0.06) 0%, transparent 70%)',
          filter: 'blur(16px)',
        }}
      />

      <div
        className="absolute inset-0 rounded-xl overflow-hidden z-0 transition-opacity duration-500 pointer-events-none"
        style={{ opacity: isActive ? 1 : 0 }}
      >
        <div
          className="absolute top-1/2 left-1/2 w-[150%] aspect-square animate-rotate-gradient rounded-full"
          style={{
            background: 'conic-gradient(from 0deg, transparent 0%, transparent 35%, rgba(59,130,246,0.5) 45%, rgba(96,165,250,0.6) 50%, rgba(59,130,246,0.5) 55%, transparent 65%, transparent 100%)',
            filter: 'blur(10px)',
            transform: 'translate(-50%, -50%)',
          }}
        />
      </div>

      {!isActive && (
        <div className="absolute inset-0 rounded-xl overflow-hidden z-0 pointer-events-none opacity-0 group-hover:opacity-40 transition-opacity duration-500">
          <div
            className="absolute top-1/2 left-1/2 w-[150%] aspect-square rounded-full"
            style={{
              background: 'conic-gradient(from 0deg, transparent 0%, transparent 30%, rgba(255,255,255,0.08) 42%, rgba(255,255,255,0.12) 50%, rgba(255,255,255,0.08) 58%, transparent 70%, transparent 100%)',
              filter: 'blur(8px)',
              transform: 'translate(-50%, -50%)',
            }}
          />
        </div>
      )}

      <div
        className="absolute inset-[1px] rounded-xl z-10 transition-all duration-300 pointer-events-none"
        style={{
          backgroundColor: isActive ? 'var(--card-bg)' : 'var(--glass-bg)',
          border: isActive ? 'none' : '1px solid var(--border-subtle)',
          boxShadow: isActive
            ? 'var(--card-bg) 0 0 0 0'
            : 'inset 0 1px 1px var(--border-subtle)',
        }}
      />

      <div
        onClick={() => onSelect(c)}
        className="relative z-20 cursor-pointer rounded-xl p-5 outline-none flex flex-col h-full"
        style={{ minHeight: '180px' }}
      >
        <div className="flex items-start justify-between mb-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: colors.bg }}
          >
            <FolderIcon color={colors.icon} />
          </div>
          {isActive && (
            <div
              className="flex items-center gap-1.5 px-2 py-0.5 rounded-full"
              style={{
                backgroundColor: 'var(--accent-subtle)',
                border: '1px solid color-mix(in srgb, var(--accent) 30%, transparent)',
              }}
            >
              <div className="w-1 h-1 rounded-full" style={{ backgroundColor: 'var(--accent)' }} />
              <span
                className="text-[8px] font-semibold tracking-[0.12em] uppercase"
                style={{ color: 'var(--accent-text)' }}
              >
                Activo
              </span>
            </div>
          )}
        </div>

        <div className="text-[12px] font-semibold mb-0.5 leading-snug" style={{ color: 'var(--text-main)' }}>
          {c.name}
        </div>
        {c.description && (
          <div className="text-[10px] leading-relaxed line-clamp-2 mt-1" style={{ color: 'var(--text-muted)' }}>
            {c.description}
          </div>
        )}

        <div className="mt-auto pt-4 flex items-center justify-between">
          <button
            onClick={(e) => onNavigate(e, c)}
            className="flex items-center gap-1 text-[10px] font-medium transition-colors outline-none rounded-sm focus-visible:ring-2 focus-visible:ring-[var(--accent)]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
            style={{ color: isActive ? 'var(--accent-text)' : 'var(--text-muted)' }}
          >
            {isActive ? 'Ver evidencias' : 'Seleccionar caso'}
            <ArrowIcon />
          </button>
          <button
            onClick={(e) => onDelete(c.id, e)}
            className="opacity-0 group-hover:opacity-100 transition-all duration-200 p-1.5 rounded-md focus-visible:ring-2 focus-visible:ring-red-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent outline-none hover:text-red-400 hover:bg-red-500/10"
            style={{ color: 'var(--text-muted)' }}
            title="Eliminar caso"
          >
            <TrashIcon />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

const ModuloCasos = memo(function ModuloCasos() {
  const { cases, activeCase, setActiveCase, createCase, deleteCase, setActiveTab } = useAppContext();
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');

  const colorMap = useMemo(() => {
    const map: Record<string, typeof CASE_COLORS[number]> = {};
    for (const c of cases) {
      map[c.id] = getCaseColor(c.id);
    }
    return map;
  }, [cases]);

  const handleCreate = useCallback(async () => {
    if (!newName.trim()) return;
    await createCase(newName.trim(), newDesc.trim());
    setNewName('');
    setNewDesc('');
    setShowCreate(false);
  }, [newName, newDesc, createCase]);

  const handleCardClick = useCallback((c: typeof cases[number]) => {
    setActiveCase(c);
  }, [setActiveCase]);

  const handleNavigate = useCallback((e: React.MouseEvent, c: typeof cases[number]) => {
    e.stopPropagation();
    setActiveCase(c);
    setActiveTab('ingesta');
  }, [setActiveCase, setActiveTab]);

  const handleDelete = useCallback(async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (activeCase?.id === id) setActiveCase(null);
    await deleteCase(id);
  }, [activeCase, setActiveCase, deleteCase]);

  return (
    <div className="h-full flex flex-col p-8">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <div className="text-[13px] font-semibold tracking-[-0.01em]" style={{ color: 'var(--text-main)' }}>Casos</div>
          <div className="text-[10px] mt-1 font-mono" style={{ color: 'var(--text-muted)' }}>
            {cases.length} caso{cases.length !== 1 ? 's' : ''} registrado{cases.length !== 1 ? 's' : ''}
          </div>
        </div>
        <MagneticButton>
          <button
            onClick={() => setShowCreate(!showCreate)}
            className="px-3 py-1.5 rounded-lg text-[11px] flex items-center gap-1.5 transition-all outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
            style={{
              backgroundColor: 'var(--accent-subtle)',
              color: 'var(--accent-text)',
              border: '1px solid color-mix(in srgb, var(--accent) 20%, transparent)',
            }}
          >
            <PlusIcon />
            Nuevo Caso
          </button>
        </MagneticButton>
      </div>

      <AnimatePresence>
        {showCreate && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="mb-6 overflow-hidden"
          >
            <div
              className="rounded-xl p-5"
              style={{
                backgroundColor: 'var(--glass-bg)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <div
                className="text-[10px] font-semibold mb-4 uppercase tracking-[0.12em] font-mono"
                style={{ color: 'var(--text-muted)' }}
              >
                Crear nuevo caso
              </div>
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Nombre del caso"
                className="w-full bg-transparent text-[13px] outline-none mb-3 placeholder:text-[var(--text-muted)]"
                style={{ color: 'var(--text-main)', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '10px' }}
                onKeyDown={(e) => { if (e.key === 'Enter') handleCreate(); }}
                autoFocus
              />
              <input
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                placeholder="Descripcion (opcional)"
                className="w-full bg-transparent text-[10px] outline-none mb-4 placeholder:text-[var(--text-muted)]"
                style={{ color: 'var(--text-muted)', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '10px' }}
                onKeyDown={(e) => { if (e.key === 'Enter') handleCreate(); }}
              />
              <div className="flex gap-2">
                <MagneticButton>
                  <button
                    onClick={handleCreate}
                    className="px-3.5 py-1.5 text-[10px] rounded-md font-medium outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
                    style={{ backgroundColor: 'var(--accent)', color: '#fff' }}
                  >
                    Crear Caso
                  </button>
                </MagneticButton>
                <button
                  onClick={() => { setShowCreate(false); setNewName(''); setNewDesc(''); }}
                  className="px-3.5 py-1.5 text-[10px] rounded-md outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
                  style={{ color: 'var(--text-muted)' }}
                >
                  Cancelar
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {cases.length === 0 && !showCreate ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center relative">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 rounded-full blur-3xl pointer-events-none" style={{ backgroundColor: 'var(--accent)', opacity: 0.08 }} />
            <motion.div
              className="w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-4"
              style={{
                backgroundColor: 'var(--glass-bg)',
                border: '1px solid var(--border-subtle)',
              }}
              animate={{ y: [0, -5, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
              </svg>
            </motion.div>
            <div className="chrome-text text-xs font-semibold mb-1">Sin casos</div>
            <div className="text-[10px] font-mono" style={{ color: 'var(--text-muted)' }}>Crea tu primer caso para comenzar</div>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto pr-2 scroll-fade">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 auto-rows-fr">
            {cases.map((c, i) => {
              const isActive = activeCase?.id === c.id;
              const colors = colorMap[c.id] ?? CASE_COLORS[0]!;
              return (
                <CaseCard
                  key={c.id}
                  c={c}
                  isActive={isActive}
                  colors={colors}
                  onSelect={handleCardClick}
                  onNavigate={handleNavigate}
                  onDelete={handleDelete}
                  index={i}
                />
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
});

export default ModuloCasos;
