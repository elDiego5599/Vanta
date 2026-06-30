import { useState, useCallback, memo, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { useCaseStore } from '../../lib/stores/caseStore';
import { useUIStore } from '../../lib/stores/uiStore';
import type { CaseData } from '../../lib/types';
import { MagneticButton } from '../landing/Primitives';
import { FolderIcon, TrashIcon, ArrowIcon, PlusIcon } from '../landing/Icons';




const CASE_COLORS = [
  { bg: 'rgba(59,130,246,0.12)', icon: '#3b82f6' },
  { bg: 'rgba(168,85,247,0.12)', icon: '#a855f7' },
  { bg: 'rgba(34,197,94,0.12)', icon: '#22c55e' },
  { bg: 'rgba(249,115,22,0.12)', icon: '#f97316' },
  { bg: 'rgba(236,72,153,0.12)', icon: '#ec4899' },
  { bg: 'rgba(20,184,166,0.12)', icon: '#14b8a6' },
];

function getCaseColor(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = ((hash << 5) - hash + id.charCodeAt(i)) | 0;
  }
  return CASE_COLORS[Math.abs(hash) % CASE_COLORS.length]!;
}

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.5,
      ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
      delay: i * 0.05
    },
  }),
  exit: {
    opacity: 0,
    scale: 0.9,
    transition: { duration: 0.2 }
  }
};




function ConfirmDeleteModal({ isOpen, onClose, onConfirm, caseName }: { isOpen: boolean, onClose: () => void, onConfirm: () => void, caseName: string }) {
  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-[var(--page-bg)]/60 backdrop-blur-md cursor-pointer"
          />

          {}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="relative w-full max-w-[400px] bg-[var(--card-bg)] border border-[var(--border-subtle)] rounded-3xl p-8 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] overflow-hidden"
          >
            {}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-32 bg-red-500/10 blur-[50px] pointer-events-none" />

            <div className="relative z-10 flex flex-col items-center text-center">
              {}
              <div className="w-14 h-14 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-5 text-red-500 shadow-[0_0_15px_rgba(239,68,68,0.15)]">
                <TrashIcon w={22} h={22} />
              </div>

              <h3 className="text-xl font-extrabold text-[var(--text-main)] mb-3 tracking-tight">Destruir Expediente</h3>
              <p className="text-[13px] font-mono text-[var(--text-muted)] mb-8 leading-relaxed">
                Se eliminará permanentemente el caso <span className="text-[var(--text-main)] font-bold">"{caseName}"</span> y su cadena de custodia. Esta acción es <span className="text-red-500 font-bold">irreversible</span>.
              </p>

              <div className="flex gap-3 w-full">
                <button
                  onClick={onClose}
                  className="flex-1 py-3 rounded-xl text-[11px] font-bold uppercase tracking-widest text-[var(--text-muted)] hover:text-[var(--text-main)] bg-[var(--glass-bg)] border border-[var(--border-subtle)] hover:border-[var(--border-strong)] transition-all outline-none focus-visible:ring-2 focus-visible:ring-[var(--text-main)]"
                >
                  Cancelar
                </button>
                <button
                  onClick={onConfirm}
                  className="flex-1 py-3 rounded-xl text-[11px] font-bold uppercase tracking-widest bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white border border-red-500/20 hover:border-red-500 shadow-sm transition-all outline-none focus-visible:ring-2 focus-visible:ring-red-400"
                >
                  Confirmar
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}




interface CaseCardProps {
  c: CaseData;
  isActive: boolean;
  onSelect: (c: CaseData) => void;
  onNavigate: (e: React.MouseEvent, c: CaseData) => void;
  onDeleteRequest: (c: CaseData, e: React.MouseEvent) => void;
  index: number;
}

const CaseCard = memo(function CaseCard({ c, isActive, onSelect, onNavigate, onDeleteRequest, index }: CaseCardProps) {
  const colors = getCaseColor(c.id);

  return (
    <motion.div
      layout
      custom={index}
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      whileHover={{ y: -2, transition: { duration: 0.2, ease: "easeOut" } }}
      className="relative group h-[170px] flex flex-col"
    >
      <div className={`absolute inset-0 rounded-2xl transition-all duration-300 ${isActive ? 'shadow-[0_0_20px_color-mix(in_srgb,var(--accent)_20%,transparent)]' : 'shadow-sm hover:shadow-md'
        }`}>

        <div className="absolute inset-0 z-0 rounded-2xl bg-[var(--border-subtle)] transition-colors duration-300" />

        {!isActive && (
          <div className="absolute inset-0 z-0 overflow-hidden rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500">
            <div
              className="absolute top-1/2 left-1/2 w-[200%] aspect-square animate-rotate-gradient rounded-full"
              style={{ background: `conic-gradient(from 0deg, transparent 0%, transparent 40%, var(--text-muted) 50%, transparent 60%, transparent 100%)` }}
            />
          </div>
        )}

        {isActive && (
          <div className="absolute inset-0 z-0 overflow-hidden rounded-2xl">
            <div
              className="absolute top-1/2 left-1/2 w-[200%] aspect-square animate-rotate-gradient rounded-full"
              style={{ background: `conic-gradient(from 0deg, transparent 0%, transparent 40%, var(--accent) 50%, transparent 60%, transparent 100%)` }}
            />
          </div>
        )}

        <div className={`absolute z-10 rounded-[15px] bg-[var(--card-bg)] transition-all duration-300 ${isActive ? 'inset-[2px]' : 'inset-[1px] group-hover:inset-[2px]'}`} />

        {isActive && (
          <div className="absolute inset-[2px] z-11 rounded-[15px] bg-[var(--accent)]/[0.03] pointer-events-none" />
        )}

        <div className="relative z-20 flex flex-col h-full p-5">

          <button
            onClick={(e) => isActive ? onNavigate(e, c) : onSelect(c)}
            className="absolute inset-0 w-full h-full rounded-[15px] outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--accent)] z-10 cursor-pointer"
            aria-label={isActive ? `Ver evidencias de ${c.name}` : `Seleccionar caso ${c.name}`}
          />

          <div className="flex-none flex items-start justify-between mb-3 pointer-events-none">
            {}
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 duration-300 shadow-sm"
              style={{ backgroundColor: colors.bg, color: colors.icon }}
            >
              <FolderIcon w={20} h={20} />
            </div>

            {isActive && (
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-[var(--border-strong)] bg-[var(--card-bg)] shadow-sm">
                <div className="w-2 h-2 rounded-full bg-[var(--accent)] animate-pulse" />
                <span className="text-[10px] font-bold tracking-widest uppercase text-[var(--accent)]">
                  Activo
                </span>
              </div>
            )}
          </div>

          <div className="flex-none pointer-events-none">
            <div className="text-[15px] font-bold mb-0.5 leading-snug truncate text-[var(--text-main)]">
              {c.name}
            </div>
            {c.description && (
              <div className="text-[12px] leading-relaxed line-clamp-2 mt-1 font-mono text-[var(--text-muted)] transition-colors">
                {c.description}
              </div>
            )}
          </div>

          <div className="flex-grow" />

          <div className="flex-none flex items-center justify-between pointer-events-none pt-2 overflow-hidden h-[24px]">
            <span className={`flex items-center gap-1.5 text-[11px] font-bold tracking-wider uppercase transition-all duration-300 transform ${isActive
              ? 'text-[var(--accent)] translate-y-0 opacity-100'
              : 'text-[var(--text-main)] translate-y-5 opacity-0 group-hover:translate-y-0 group-hover:opacity-100'
              }`}>
              {isActive ? 'Explorar caso' : 'Seleccionar'}
              {}
              <span className={`flex items-center transition-all duration-300 ${isActive ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-3 group-hover:translate-x-0 group-hover:opacity-100'}`}>
                <ArrowIcon w={13} h={13} />
              </span>
            </span>

            <button
              onClick={(e) => onDeleteRequest(c, e)}
              className="pointer-events-auto relative z-30 opacity-0 group-hover:opacity-100 transition-all duration-200 p-1.5 rounded-md outline-none hover:text-red-500 hover:bg-red-500/10 text-[var(--text-muted)] focus-visible:opacity-100"
              title="Eliminar caso"
              aria-label={`Eliminar caso ${c.name}`}
            >
              <TrashIcon w={15} h={15} />
            </button>
          </div>

        </div>
      </div>
    </motion.div>
  );
});




const ModuloCasos = memo(function ModuloCasos() {
  const cases = useCaseStore((s) => s.cases);
  const activeCase = useCaseStore((s) => s.activeCase);
  const setActiveCase = useCaseStore((s) => s.setActiveCase);
  const createCase = useCaseStore((s) => s.createCase);
  const deleteCase = useCaseStore((s) => s.deleteCase);
  const setActiveTab = useUIStore((s) => s.setActiveTab);

  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [caseToDelete, setCaseToDelete] = useState<CaseData | null>(null);

  const isDuplicateName = useMemo(() => {
    const trimmed = newName.trim().toLowerCase();
    if (!trimmed) return false;
    return cases.some(c => c.name.toLowerCase() === trimmed);
  }, [newName, cases]);

  const handleCreate = useCallback(async () => {
    if (!newName.trim() || isDuplicateName || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await createCase(newName.trim(), newDesc.trim());
      setNewName('');
      setNewDesc('');
      setShowCreate(false);
    } catch (error) {
      console.error("Error al crear el caso:", error);
    } finally {
      setIsSubmitting(false);
    }
  }, [newName, newDesc, createCase, isDuplicateName, isSubmitting]);

  const handleCardClick = useCallback((c: CaseData) => {
    setActiveCase(c);
  }, [setActiveCase]);

  const handleNavigate = useCallback((_e: React.MouseEvent, c: CaseData) => {
    setActiveCase(c);
    setActiveTab('ingesta');
  }, [setActiveCase, setActiveTab]);

  const handleDeleteRequest = useCallback((c: CaseData, e: React.MouseEvent) => {
    e.stopPropagation();
    setCaseToDelete(c);
  }, []);

  const confirmDelete = useCallback(async () => {
    if (!caseToDelete) return;
    if (activeCase?.id === caseToDelete.id) setActiveCase(null);
    try {
      await deleteCase(caseToDelete.id);
    } catch (error) {
      console.error("Error al eliminar el caso:", error);
    } finally {
      setCaseToDelete(null);
    }
  }, [caseToDelete, activeCase, setActiveCase, deleteCase]);

  return (
    <div className="absolute inset-0 flex flex-col p-6 lg:p-8 bg-[var(--page-bg)]">
      {}
      <style>{`
        @keyframes rotate-gradient {
          from { transform: translate(-50%, -50%) rotate(0deg); }
          to { transform: translate(-50%, -50%) rotate(360deg); }
        }
        .animate-rotate-gradient {
          animation: rotate-gradient 4s linear infinite;
        }
        input {
          caret-color: var(--text-main);
        }
      `}</style>

      {}
      <ConfirmDeleteModal
        isOpen={!!caseToDelete}
        caseName={caseToDelete?.name || ''}
        onClose={() => setCaseToDelete(null)}
        onConfirm={confirmDelete}
      />

      {}
      <div className="mb-6 flex items-start justify-between shrink-0">
        <div>
          <div className="text-2xl font-extrabold tracking-tight text-[var(--text-main)]">Gestión de Casos</div>
          <div className="text-[11px] mt-1 font-mono tracking-widest uppercase text-[var(--text-muted)]">
            {cases.length} expediente{cases.length !== 1 ? 's' : ''} registrado{cases.length !== 1 ? 's' : ''}
          </div>
        </div>
        <MagneticButton>
          <button
            onClick={() => setShowCreate(!showCreate)}
            className="px-4 py-2.5 rounded-xl text-[11px] font-bold tracking-wider uppercase flex items-center gap-2 transition-all outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] hover:bg-blue-600 shadow-md"
            style={{ backgroundColor: 'var(--accent)', color: '#ffffff' }}
          >
            {}
            <div className="text-white"><PlusIcon w={16} h={16} /></div>
            Nuevo Caso
          </button>
        </MagneticButton>
      </div>

      {}
      <AnimatePresence>
        {showCreate && (
          <motion.div
            initial={{ height: 0, opacity: 0, y: -10 }}
            animate={{ height: 'auto', opacity: 1, y: 0 }}
            exit={{ height: 0, opacity: 0, y: -10 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="mb-6 overflow-hidden shrink-0"
          >
            <div className="rounded-2xl bg-[var(--card-bg)] border border-[var(--border-subtle)] p-6 shadow-sm">
              <div className="text-[10px] font-bold mb-4 uppercase tracking-[0.15em] font-mono text-[var(--text-muted)] flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]" /> Apertura de Expediente
              </div>
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Nombre de la Operación / Caso"
                className={`w-full bg-transparent text-[15px] font-semibold outline-none mb-1 placeholder:text-[var(--text-muted)] text-[var(--text-main)] border-b-2 pb-2.5 transition-colors ${isDuplicateName ? 'border-red-500 focus:border-red-500' : 'border-[var(--border-subtle)] focus:border-[var(--accent)]'}`}
                onKeyDown={(e) => { if (e.key === 'Enter' && !isDuplicateName) handleCreate(); }}
                autoFocus
                disabled={isSubmitting}
              />
              {isDuplicateName && (
                <div className="text-[10px] text-red-500 mt-1 mb-2 font-mono uppercase tracking-wider">Conflicto: Ya existe un caso con este nombre</div>
              )}
              {!isDuplicateName && <div className="mb-4" />}

              <input
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                placeholder="Descripción o metadatos (opcional)"
                className="w-full bg-transparent text-[12px] font-mono outline-none mb-6 placeholder:text-[var(--text-muted)] text-[var(--text-muted)] border-b border-[var(--border-subtle)] focus:border-[var(--text-main)] pb-2.5 transition-colors"
                onKeyDown={(e) => { if (e.key === 'Enter') handleCreate(); }}
                disabled={isSubmitting}
              />
              <div className="flex gap-3">
                <button
                  onClick={handleCreate}
                  disabled={isDuplicateName || !newName.trim() || isSubmitting}
                  className="px-6 py-2.5 text-[11px] rounded-lg font-bold uppercase tracking-widest outline-none focus-visible:ring-2 focus-visible:ring-[var(--text-main)] transition-all disabled:opacity-30 disabled:cursor-not-allowed bg-[var(--accent)] text-white hover:bg-blue-600 shadow-sm"
                >
                  {isSubmitting ? 'Procesando...' : 'Registrar'}
                </button>
                <button
                  onClick={() => { setShowCreate(false); setNewName(''); setNewDesc(''); }}
                  disabled={isSubmitting}
                  className="px-6 py-2.5 text-[11px] rounded-lg font-bold uppercase tracking-widest outline-none focus-visible:ring-2 focus-visible:ring-[var(--text-main)] transition-all text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--glass-bg)] border border-transparent hover:border-[var(--border-subtle)]"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {}
      {cases.length === 0 && !showCreate ? (
        <div className="flex-1 flex items-center justify-center min-h-0 bg-[var(--glass-bg)] rounded-3xl border border-[var(--border-subtle)]">
          <div className="text-center relative">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full blur-[80px] pointer-events-none bg-[var(--accent)]/10" />
            <motion.div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 bg-[var(--card-bg)] border border-[var(--border-subtle)] shadow-sm relative z-10 text-[var(--text-muted)]"
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            >
              <FolderIcon w={28} h={28} />
            </motion.div>
            <div className="text-lg font-extrabold mb-1 text-[var(--text-main)] tracking-tight relative z-10">Bóveda Vacía</div>
            <div className="text-[11px] font-mono text-[var(--text-muted)] tracking-widest uppercase relative z-10">Crea un caso para comenzar</div>
          </div>
        </div>
      ) : (
        <div className="flex-1 min-h-0 relative rounded-3xl border border-[var(--border-subtle)] bg-[var(--glass-bg)] shadow-sm overflow-hidden">
          {}
          <div className="h-full overflow-y-auto p-6 custom-scrollbar">
            <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 auto-rows-max pb-10">
              <AnimatePresence mode="popLayout">
                {cases.map((c, i) => (
                  <CaseCard
                    key={c.id}
                    c={c}
                    isActive={activeCase?.id === c.id}
                    onSelect={handleCardClick}
                    onNavigate={handleNavigate}
                    onDeleteRequest={handleDeleteRequest}
                    index={i}
                  />
                ))}
              </AnimatePresence>
            </motion.div>
          </div>
        </div>
      )}
    </div>
  );
});

export default ModuloCasos;