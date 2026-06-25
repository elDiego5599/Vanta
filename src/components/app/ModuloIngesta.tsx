import { useState, useCallback, memo, DragEvent, ChangeEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppContext } from '../../lib/AppContext';
import { PremiumEdgeWrapper, MagneticButton } from '../landing/Primitives';

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16, scale: 0.98 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] as const } },
};

const UploadIcon = memo(() => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17 8 12 3 7 8" />
    <line x1="12" y1="3" x2="12" y2="15" />
  </svg>
));

const AudioIcon = memo(() => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 18V5l12-2v13" />
    <circle cx="6" cy="18" r="3" />
    <circle cx="18" cy="16" r="3" />
  </svg>
));

const ModuloIngesta = memo(function ModuloIngesta() {
  const { evidenceQueue, addEvidence, selectFileForTranscription, activeCase } = useAppContext();
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (!activeCase) return;
    const files = Array.from(e.dataTransfer.files);
    for (const file of files) {
      if (file.type.startsWith('audio/') || file.name.match(/\.(wav|mp3|ogg|flac|m4a|opus|wma|aac|mp4|webm)$/i)) {
        addEvidence(file, activeCase.id);
      }
    }
  }, [addEvidence, activeCase]);

  const handleFileInput = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    if (!activeCase) return;
    const files = Array.from(e.target.files ?? []);
    for (const file of files) {
      addEvidence(file, activeCase.id);
    }
    e.target.value = '';
  }, [addEvidence, activeCase]);

  return (
    <div className="h-full flex flex-col p-6">
      <div className="mb-4">
        <p className="text-[10px] text-[var(--text-muted)] tracking-[0.06em] font-mono">Arrastre archivos de audio para transcripcion local con Whisper.</p>
      </div>

      <PremiumEdgeWrapper rounded="rounded-lg" className="mb-6">
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`
            relative border border-dashed rounded-lg p-8
            flex flex-col items-center justify-center gap-3
            transition-all duration-300
            outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/50
            ${isDragging
              ? 'border-[var(--accent)]/50 bg-[var(--accent-subtle)]'
              : 'border-transparent bg-transparent'
            }
          `}
        >
          <input
            type="file"
            accept="audio/*,.wav,.mp3,.ogg,.flac,.m4a,.opus,.wma,.aac"
            multiple
            onChange={handleFileInput}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            aria-label="Seleccionar archivos de audio"
          />
          <div className="w-12 h-12 rounded-lg border border-[var(--border-subtle)] flex items-center justify-center">
            <UploadIcon />
          </div>
          <div className="text-center">
            <div className="text-xs text-[var(--text-muted)]">Arrastre archivos de audio aqui</div>
            <div className="text-[10px] text-[var(--text-muted)]/60 mt-1">WAV, MP3, OGG, FLAC, M4A</div>
          </div>
        </div>
      </PremiumEdgeWrapper>

      <div className="flex-1 overflow-y-auto scroll-fade">
        <h2 className="text-[10px] font-semibold tracking-[0.12em] uppercase text-[var(--text-muted)] mb-3">
          Archivos Cargados
        </h2>

        {evidenceQueue.length === 0 ? (
          <PremiumEdgeWrapper rounded="rounded-lg">
            <div className="px-12 py-14 text-center relative">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 rounded-full blur-3xl pointer-events-none" style={{ backgroundColor: 'var(--accent)', opacity: 0.08 }} />
              <motion.div
                className="w-12 h-12 rounded-lg border border-[var(--border-subtle)] flex items-center justify-center mx-auto mb-4"
                animate={{ y: [0, -4, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              >
                <UploadIcon />
              </motion.div>
              <div className="chrome-text text-xs font-semibold mb-1">No hay archivos</div>
              <div className="text-[10px] font-mono" style={{ color: 'var(--text-muted)' }}>Arrastre o seleccione archivos de audio</div>
            </div>
          </PremiumEdgeWrapper>
        ) : (
          <motion.div
            className="space-y-2"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <AnimatePresence>
              {evidenceQueue.map((item) => (
                <motion.div
                  key={item.id}
                  layout
                  variants={itemVariants}
                  whileHover={{ y: -2, transition: { duration: 0.25, ease: [0.16, 1, 0.3, 1] } }}
                  exit={{ opacity: 0, x: -20, transition: { duration: 0.2 } }}
                  className="flex items-center gap-4 p-3 rounded-lg border border-[var(--border-subtle)] bg-[var(--glass-bg)] hover:bg-[var(--glass-hover)] transition-all duration-200"
                  style={{
                    boxShadow: 'inset 0 1px 1px var(--border-subtle)',
                    ...(item.estado === 'transcribiendo' ? { borderColor: 'var(--accent)' } : {}),
                    ...(item.estado === 'error' ? { borderColor: 'rgba(239,68,68,0.3)' } : {}),
                  }}
                >
                  <div className="w-8 h-8 rounded-md bg-[var(--accent-subtle)] flex items-center justify-center flex-shrink-0 relative">
                    <AudioIcon />
                    {item.estado === 'transcribiendo' && (
                      <motion.div
                        className="absolute inset-0 rounded-md border-2"
                        style={{ borderColor: 'var(--accent)', opacity: 0.5 }}
                        animate={{ opacity: [0.3, 0.8, 0.3] }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                      />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-[var(--text-main)] truncate flex items-center gap-2">
                      {item.nombre}
                      {item.estado === 'transcribiendo' && (
                        <span className="flex items-center gap-1 text-[9px] font-mono uppercase tracking-wider" style={{ color: 'var(--accent)' }}>
                          <motion.span
                            className="w-1 h-1 rounded-full inline-block"
                            style={{ backgroundColor: 'var(--accent)' }}
                            animate={{ scale: [1, 1.6, 1] }}
                            transition={{ duration: 1, repeat: Infinity }}
                          />
                          Transcribiendo
                        </span>
                      )}
                      {item.estado === 'error' && (
                        <span className="text-[9px] font-mono uppercase tracking-wider" style={{ color: '#ef4444' }}>Error</span>
                      )}
                      {item.progreso === 100 && item.estado === 'listo' && (
                        <span className="flex items-center gap-1 text-[9px] font-mono uppercase tracking-wider" style={{ color: '#22c55e' }}>
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                          Completado
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-[var(--text-muted)]">
                      {item.tamano}
                      {item.progreso > 0 && item.estado === 'transcribiendo' && (
                        <span className="ml-2 font-mono">{item.progreso}%</span>
                      )}
                    </div>
                  </div>
                  {item.estado !== 'transcribiendo' && (!item.estado || item.estado === 'listo') && (
                    <MagneticButton>
                    <button
                      onClick={() => selectFileForTranscription(item)}
                      className="px-3 py-1.5 bg-[var(--accent-subtle)] border border-[var(--accent)]/30 rounded-md text-[10px] font-medium text-[var(--accent-text)] hover:bg-[var(--accent)]/30 transition-colors flex-shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
                    >
                      {item.progreso === 100 ? 'Ver' : 'Transcribir'}
                    </button>
                  </MagneticButton>
                  )}
                  {item.estado === 'error' && (
                    <MagneticButton>
                      <button
                        onClick={() => selectFileForTranscription(item)}
                        className="px-3 py-1.5 bg-red-500/10 border border-red-500/30 rounded-md text-[10px] font-medium text-red-500 hover:bg-red-500/20 transition-colors flex-shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-red-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
                      >
                        Reintentar
                      </button>
                    </MagneticButton>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </div>
  );
});

export default ModuloIngesta;
