import { useState, useCallback, useRef, memo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useCaseStore } from '../../lib/stores/caseStore';
import { useEvidenceStore } from '../../lib/stores/evidenceStore';
import { useUIStore } from '../../lib/stores/uiStore';
import * as db from '../../lib/db';
import { TrashIcon, PlusIcon } from '../landing/Icons';




const UploadCloudIcon = ({ w = 24, h = 24 }) => (
  <svg width={w} height={h} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17 8 12 3 7 8" />
    <line x1="12" y1="3" x2="12" y2="15" />
  </svg>
);

const AudioFileIcon = ({ w = 24, h = 24 }) => (
  <svg width={w} height={h} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <path d="M8 13h2" />
    <path d="M14 13h2" />
    <path d="M11 13v4" />
  </svg>
);

const CheckCircleIcon = ({ w = 24, h = 24, color = "currentColor" }) => (
  <svg width={w} height={h} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

const LockSmallIcon = ({ w = 24, h = 24, color = "currentColor" }) => (
  <svg width={w} height={h} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

const TextIcon = ({ w = 24, h = 24, color = "currentColor" }) => (
  <svg width={w} height={h} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <polyline points="10 9 9 9 8 9" />
  </svg>
);




function formatBytes(bytes: number, decimals = 2) {
  if (!+bytes) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}


interface StagedFile {
  id: string;
  file: File;
}


interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  hash: string;
  isTranscribed: boolean;
}




function ConfirmBatchDeleteModal({ isOpen, onClose, onConfirm, count }: { isOpen: boolean, onClose: () => void, onConfirm: () => void, count: number }) {
  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-[var(--page-bg)]/60 backdrop-blur-md cursor-pointer"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="relative w-full max-w-[400px] bg-[var(--card-bg)] border border-[var(--border-subtle)] rounded-3xl p-8 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] overflow-hidden"
          >
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-32 bg-red-500/10 blur-[50px] pointer-events-none" />
            <div className="relative z-10 flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-5 text-red-500 shadow-[0_0_15px_rgba(239,68,68,0.15)]">
                <TrashIcon w={22} h={22} />
              </div>
              <h3 className="text-xl font-extrabold text-[var(--text-main)] mb-3 tracking-tight">Destruir Evidencias</h3>
              <p className="text-[13px] font-mono text-[var(--text-muted)] mb-8 leading-relaxed">
                Se eliminarán permanentemente <span className="text-[var(--text-main)] font-bold">{count} evidencia{count !== 1 ? 's' : ''}</span> y sus transcripciones. Esta acción es <span className="text-red-500 font-bold">irreversible</span>.
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

function ConfirmDeleteEvidenceModal({ isOpen, onClose, onConfirm, fileName }: { isOpen: boolean, onClose: () => void, onConfirm: () => void, fileName: string }) {
  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-[var(--page-bg)]/60 backdrop-blur-md cursor-pointer"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="relative w-full max-w-[400px] bg-[var(--card-bg)] border border-[var(--border-subtle)] rounded-3xl p-8 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] overflow-hidden"
          >
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-32 bg-red-500/10 blur-[50px] pointer-events-none" />
            <div className="relative z-10 flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-5 text-red-500 shadow-[0_0_15px_rgba(239,68,68,0.15)]">
                <TrashIcon w={22} h={22} />
              </div>
              <h3 className="text-xl font-extrabold text-[var(--text-main)] mb-3 tracking-tight">Destruir Evidencia</h3>
              <p className="text-[13px] font-mono text-[var(--text-muted)] mb-8 leading-relaxed">
                Se eliminará permanentemente el archivo <span className="text-[var(--text-main)] font-bold">"{fileName}"</span> y su transcripción. Esta acción es <span className="text-red-500 font-bold">irreversible</span>.
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




const ModuloEvidencias = memo(function ModuloEvidencias() {
  const activeCase = useCaseStore((s) => s.activeCase);
  const selectFileForTranscription = useEvidenceStore((s) => s.selectFileForTranscription);
  const evidenceQueue = useEvidenceStore((s) => s.evidenceQueue);
  const setActiveTab = useUIStore((s) => s.setActiveTab);

  const [stagedFiles, setStagedFiles] = useState<StagedFile[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [batchDeleteTarget, setBatchDeleteTarget] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);
  const hasLoaded = useRef(false);


  useEffect(() => {
    if (activeCase?.id && !hasLoaded.current) {
      hasLoaded.current = true;
      setStagedFiles([]);
      const stored = localStorage.getItem(`vanta_evidencia_${activeCase.id}`);
      if (stored) {
        try {

          setUploadedFiles(JSON.parse(stored));
        } catch {
          console.error("Error parseando evidencia local");
        }
      }
    }
  }, [activeCase?.id]);


  useEffect(() => {
    if (activeCase?.id) {
      localStorage.setItem(`vanta_evidencia_${activeCase.id}`, JSON.stringify(uploadedFiles));
    }
  }, [uploadedFiles, activeCase?.id]);


  useEffect(() => {
    if (evidenceQueue.length === 0 || uploadedFiles.length === 0) return;

    setUploadedFiles(prev => {
      let changed = false;
      const next = prev.map(pf => {
        const match = evidenceQueue.find(eq => eq.id === pf.id);
        if (match && match.isTranscribed !== pf.isTranscribed) {
          changed = true;
          return { ...pf, isTranscribed: !!match.isTranscribed };
        }
        return pf;
      });
      return changed ? next : prev;
    });
  }, [evidenceQueue, uploadedFiles.length]);


  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const processFiles = useCallback((files: FileList | File[]) => {
    const newStaged: StagedFile[] = Array.from(files).map(file => ({
      id: Math.random().toString(36).substring(2, 9) + Date.now().toString(36),
      file
    }));
    setStagedFiles(prev => [...prev, ...newStaged]);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  }, [processFiles]);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [processFiles]);


  const removeStagedFile = useCallback((idToRemove: string) => {
    setStagedFiles(prev => prev.filter(f => f.id !== idToRemove));
  }, []);

  const removeUploadedFile = useCallback(async (idToRemove: string) => {
    await db.deleteEvidence(idToRemove);
    setUploadedFiles(prev => prev.filter(f => f.id !== idToRemove));
    setDeleteTarget(null);
  }, []);

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    setSelectedIds(prev => {
      if (prev.size === uploadedFiles.length) return new Set();
      return new Set(uploadedFiles.map(f => f.id));
    });
  }, [uploadedFiles]);

  const confirmBatchDelete = useCallback(async () => {
    for (const id of selectedIds) {
      await db.deleteEvidence(id);
    }
    setUploadedFiles(prev => prev.filter(f => !selectedIds.has(f.id)));
    setSelectedIds(new Set());
    setBatchDeleteTarget(false);
  }, [selectedIds]);

  const handleUploadToCase = useCallback(async () => {
    if (stagedFiles.length === 0) return;
    setIsUploading(true);

    try {
      const newlyUploaded: UploadedFile[] = [];

      for (const sf of stagedFiles) {
        const id = sf.id;
        const arrayBuffer = await sf.file.arrayBuffer();
        const tamano = formatBytes(sf.file.size);
        await db.saveEvidence(id, activeCase?.id ?? '', sf.file.name, tamano, arrayBuffer);

        const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');

        newlyUploaded.push({
          id,
          name: sf.file.name,
          size: sf.file.size,
          type: sf.file.type || 'AUDIO/UNKNOWN',
          hash: hashHex,
          isTranscribed: false,
        });
      }

      setUploadedFiles(prev => [...prev, ...newlyUploaded]);
      setStagedFiles([]);
    } catch (error) {
      console.error("Error cargando evidencias:", error);
    } finally {
      setIsUploading(false);
    }
  }, [stagedFiles, activeCase]);

  if (!activeCase) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-[var(--page-bg)] p-8">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-[var(--glass-bg)] border border-[var(--border-subtle)] flex items-center justify-center mx-auto mb-4 text-[var(--text-muted)]">
            <AudioFileIcon w={28} h={28} />
          </div>
          <h2 className="text-xl font-bold text-[var(--text-main)]">Ningún caso seleccionado</h2>
          <p className="text-[12px] font-mono text-[var(--text-muted)] mt-2">Seleccione un caso en el menú principal para ingestar evidencia.</p>
        </div>
      </div>
    );
  }

  const totalSize = stagedFiles.reduce((acc, curr) => acc + curr.file.size, 0);

  return (
    <div className="absolute inset-0 flex flex-col bg-[var(--page-bg)]">

      {}
      <div className="flex-none p-6 lg:px-10 lg:pt-10 lg:pb-6 border-b border-[var(--border-subtle)] bg-[var(--card-bg)]/50 backdrop-blur-md z-20">
        <div className="flex items-center gap-3 text-[11px] font-mono tracking-widest uppercase text-[var(--accent)] mb-2">
          <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] animate-pulse" />
          {activeCase.name}
        </div>
        <div className="text-2xl font-extrabold tracking-tight text-[var(--text-main)]">
          Ingesta de Evidencia
        </div>
        <div className="text-[13px] mt-1 text-[var(--text-muted)]">
          Arrastre archivos de audio o video para asegurar su cadena de custodia y transcripción.
        </div>
      </div>

      {}
      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-6 lg:p-10 relative">
        <div className="max-w-4xl mx-auto flex flex-col gap-10 pb-28">

          {}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[11px] font-bold font-mono uppercase tracking-[0.15em] text-[var(--text-muted)]">Importación Forense</h3>
            </div>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileInputChange}
              className="hidden"
              multiple
              accept=".wav,.mp3,.m4a,.ogg,.flac,.mp4,.mov,.opus,.aac,.wma,.aiff,.aif,.ac3,.3gp,.webm,.amr"
            />

            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`relative overflow-hidden w-full h-[220px] rounded-3xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all duration-300 group ${isDragging
                  ? 'border-[var(--accent)] bg-[var(--accent)]/[0.05] scale-[1.02]'
                  : 'border-[var(--border-strong)] bg-[var(--glass-bg)] hover:bg-[var(--glass-hover)] hover:border-[var(--text-muted)]'
                }`}
            >
              <div className={`absolute inset-0 bg-gradient-to-b from-transparent to-[var(--accent)]/[0.05] transition-opacity duration-300 ${isDragging ? 'opacity-100' : 'opacity-0'}`} />

              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 transition-all duration-300 shadow-sm relative z-10 ${isDragging ? 'bg-[var(--accent)] text-white scale-110 shadow-[0_0_20px_var(--accent)]' : 'bg-[var(--card-bg)] border border-[var(--border-subtle)] text-[var(--text-muted)] group-hover:text-[var(--text-main)]'
                }`}>
                <UploadCloudIcon w={26} h={26} />
              </div>

              <div className="relative z-10 text-[15px] font-bold text-[var(--text-main)] mb-1">
                {isDragging ? 'Suelte los archivos aquí...' : 'Haga clic o arrastre archivos aquí'}
              </div>
              <div className="relative z-10 text-[11px] font-mono text-[var(--text-muted)] uppercase tracking-wider">
                WAV, MP3, FLAC, M4A, MP4 — Máx 5GB
              </div>
            </div>
          </section>

          {}
          {stagedFiles.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[11px] font-bold font-mono uppercase tracking-[0.15em] text-[var(--text-muted)]">
                  Archivos en Preparación ({stagedFiles.length})
                </h3>
              </div>

              {stagedFiles.some(f => f.file.size > 50 * 1024 * 1024) && (
                <div className="flex items-center gap-2 px-4 py-2.5 mb-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] font-mono text-amber-600 dark:text-amber-400">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                    <line x1="12" y1="9" x2="12" y2="13" />
                    <line x1="12" y1="17" x2="12.01" y2="17" />
                  </svg>
                  <span>Archivos mayores a 50 MB pueden tardar varios minutos en procesarse.</span>
                </div>
              )}

              <div className="flex flex-col gap-2">
                <AnimatePresence mode="popLayout">
                  {stagedFiles.map((item) => (
                    <motion.div
                      key={item.id}
                      layout
                      initial={{ opacity: 0, y: 10, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, x: -20, scale: 0.95 }}
                      transition={{ duration: 0.25, ease: "easeOut" }}
                      className="group relative flex items-center justify-between p-3.5 pr-4 rounded-2xl bg-[var(--card-bg)] border border-[var(--border-subtle)] hover:border-[var(--border-strong)] transition-colors shadow-sm"
                    >
                      <div className="flex items-center gap-4 overflow-hidden">
                        <div className="flex-none w-10 h-10 rounded-lg bg-[var(--accent)]/10 text-[var(--accent)] flex items-center justify-center border border-[var(--accent)]/20">
                          <AudioFileIcon w={18} h={18} />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-[13px] font-bold text-[var(--text-main)] truncate block">
                            {item.file.name}
                          </span>
                          <span className="text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-wider mt-0.5">
                            {formatBytes(item.file.size)} • Listo para cifrado
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => removeStagedFile(item.id)}
                        disabled={isUploading}
                        className="flex-none ml-4 w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:text-red-500 hover:bg-red-500/10 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-red-500 disabled:opacity-30"
                        title="Quitar archivo"
                      >
                        <TrashIcon w={16} h={16} />
                      </button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </section>
          )}

          {}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[11px] font-bold font-mono uppercase tracking-[0.15em] text-[var(--text-muted)]">
                Evidencia Asegurada ({uploadedFiles.length})
              </h3>
              {uploadedFiles.length > 0 && (
                <label className="flex items-center gap-2 text-[10px] font-mono text-[var(--text-muted)] cursor-pointer hover:text-[var(--text-main)] transition-colors">
                  <input
                    type="checkbox"
                    checked={selectedIds.size === uploadedFiles.length && uploadedFiles.length > 0}
                    onChange={toggleSelectAll}
                    className="w-3.5 h-3.5 rounded border-[var(--border-strong)] bg-[var(--glass-bg)] text-[var(--accent)] accent-[var(--accent)] cursor-pointer"
                  />
                  Seleccionar todo
                </label>
              )}
            </div>

            {uploadedFiles.length === 0 ? (
              <div className="w-full rounded-3xl border border-[var(--border-subtle)] bg-[var(--glass-bg)] p-8 flex flex-col items-center justify-center text-center">
                <div className="w-12 h-12 rounded-full flex items-center justify-center text-[var(--text-muted)] opacity-50 mb-2">
                  <LockSmallIcon w={22} h={22} />
                </div>
                <div className="text-[12px] font-bold text-[var(--text-main)]">La bóveda está vacía</div>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <AnimatePresence mode="popLayout">
                  {uploadedFiles.map((item) => (
                    <motion.div
                      key={item.id}
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.3, ease: "easeOut" }}

                      className={`group flex flex-col p-4 rounded-2xl border shadow-sm relative transition-colors ${selectedIds.has(item.id) ? 'bg-[var(--accent)]/[0.04] border-[var(--accent)]/40' : 'bg-[var(--card-bg)] border-[var(--border-strong)]'}`}
                    >
                      {}
                      <button
                        onClick={() => setDeleteTarget({ id: item.id, name: item.name })}
                        className="absolute top-4 right-4 z-20 w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:text-red-500 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all outline-none focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-red-500"
                        title="Destruir evidencia"
                      >
                        <TrashIcon w={15} h={15} />
                      </button>

                      <div className="flex items-center gap-3 overflow-hidden mb-3 pr-10">
                        <label className="flex-none flex items-center justify-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedIds.has(item.id)}
                            onChange={() => toggleSelect(item.id)}
                            className="w-4 h-4 rounded border-[var(--border-strong)] bg-[var(--glass-bg)] text-[var(--accent)] accent-[var(--accent)] cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
                          />
                        </label>
                        <div className="flex-none w-10 h-10 rounded-lg bg-green-500/10 text-green-500 flex items-center justify-center border border-green-500/20">
                          <CheckCircleIcon w={18} h={18} />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-[13px] font-bold text-[var(--text-main)] truncate block">
                            {item.name}
                          </span>
                          <span className="text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-wider mt-0.5 flex items-center gap-1.5">
                            {formatBytes(item.size)} • {item.type}
                          </span>
                        </div>
                      </div>

                      {}
                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-purple-500/10 border border-purple-500/20 w-fit">
                        <LockSmallIcon w={10} h={10} color="#a855f7" />
                        <span className="text-[9px] font-bold tracking-widest uppercase text-purple-400">AES-256</span>
                      </div>

                      {}
                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-[var(--border-subtle)]">
                        <div className="flex items-center">
                          {item.isTranscribed ? (
                            <span className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-1 rounded-md">
                              <CheckCircleIcon w={10} h={10} /> Transcrito
                            </span>
                          ) : (
                            <span className="text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-wider">Pendiente de análisis</span>
                          )}
                        </div>

                        <button
                          onClick={() => {
                            selectFileForTranscription({
                              id: item.id,
                              caseId: activeCase?.id ?? '',
                              nombre: item.name,
                              estado: 'listo',
                              progreso: 0,
                              tamano: formatBytes(item.size),
                            });
                            setActiveTab('transcripcion');
                          }}
                          className="px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] hover:text-[var(--text-main)] bg-[var(--glass-bg)] hover:bg-[var(--glass-hover)] border border-[var(--border-subtle)] hover:border-[var(--border-strong)] transition-all outline-none focus-visible:ring-2 focus-visible:ring-blue-500 flex items-center gap-2"
                        >
                          <TextIcon w={12} h={12} />
                          {item.isTranscribed ? 'Ver' : 'Transcribir'}
                        </button>
                      </div>

                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </section>

        </div>
      </div>

      <ConfirmBatchDeleteModal
        isOpen={batchDeleteTarget}
        count={selectedIds.size}
        onClose={() => setBatchDeleteTarget(false)}
        onConfirm={confirmBatchDelete}
      />
      <ConfirmDeleteEvidenceModal
        isOpen={!!deleteTarget}
        fileName={deleteTarget?.name || ''}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && removeUploadedFile(deleteTarget.id)}
      />

      <AnimatePresence>
        {selectedIds.size > 0 && stagedFiles.length === 0 && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-2xl px-4"
          >
            <div className="bg-[var(--card-bg)] border border-[var(--border-strong)] shadow-lg rounded-2xl p-4 flex items-center justify-between backdrop-blur-xl">
              <div className="flex flex-col px-2">
                <span className="text-[13px] font-bold text-[var(--text-main)]">{selectedIds.size} seleccionada{selectedIds.size !== 1 ? 's' : ''}</span>
                <span className="text-[10px] font-mono text-[var(--text-muted)] tracking-wider">
                  {formatBytes(uploadedFiles.filter(f => selectedIds.has(f.id)).reduce((sum, f) => sum + f.size, 0))} en total
                </span>
              </div>
              <button
                onClick={() => setBatchDeleteTarget(true)}
                className="px-8 py-3 rounded-xl text-[11px] font-bold tracking-widest uppercase transition-all duration-300 outline-none focus-visible:ring-2 focus-visible:ring-red-400 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white border border-red-500/20 hover:border-red-500 shadow-sm active:scale-95"
              >
                <span className="relative z-10 flex items-center gap-2">
                  <TrashIcon w={14} h={14} />
                  Destruir
                </span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {}
      <AnimatePresence>
        {stagedFiles.length > 0 && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-2xl px-4"
          >
            <div className="bg-[var(--card-bg)] border border-[var(--border-strong)] shadow-lg rounded-2xl p-4 flex items-center justify-between backdrop-blur-xl">

              <div className="flex flex-col px-2">
                <span className="text-[13px] font-bold text-[var(--text-main)]">Listo para Ingestar</span>
                <span className="text-[10px] font-mono text-[var(--text-muted)] tracking-wider">
                  {stagedFiles.length} archivo{stagedFiles.length !== 1 ? 's' : ''} • {formatBytes(totalSize)}
                </span>
              </div>

              {}
              <button
                onClick={handleUploadToCase}
                disabled={isUploading}
                className="px-8 py-3 rounded-xl text-[11px] font-bold tracking-widest uppercase transition-all duration-300 outline-none focus-visible:ring-2 focus-visible:ring-white disabled:opacity-50 disabled:cursor-not-allowed bg-[var(--accent)] text-white shadow-[0_0_15px_color-mix(in_srgb,var(--accent)_30%,transparent)] hover:shadow-[0_0_25px_color-mix(in_srgb,var(--accent)_60%,transparent)] hover:brightness-110 active:scale-95"
              >
                <span className="relative z-10 flex items-center gap-2">
                  {isUploading ? (
                    <>
                      <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Cifrando...
                    </>
                  ) : (
                    <>
                      <PlusIcon w={14} h={14} />
                      Cargar al Expediente
                    </>
                  )}
                </span>
              </button>

            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
});

export default ModuloEvidencias;