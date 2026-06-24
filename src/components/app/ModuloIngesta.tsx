import { useState, useCallback, memo, DragEvent, ChangeEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppContext } from '../../lib/AppContext';
import { PremiumEdgeWrapper } from '../landing/Primitives';

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
  const { evidenceQueue, addEvidence, selectFileForTranscription } = useAppContext();
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
    const files = Array.from(e.dataTransfer.files);
    for (const file of files) {
      if (file.type.startsWith('audio/') || file.name.match(/\.(wav|mp3|ogg|flac|m4a|opus|wma|aac|mp4|webm)$/i)) {
        addEvidence(file);
      }
    }
  }, [addEvidence]);

  const handleFileInput = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    for (const file of files) {
      addEvidence(file);
    }
    e.target.value = '';
  }, [addEvidence]);

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

      <div className="flex-1 overflow-y-auto">
        <h2 className="text-[10px] font-semibold tracking-[0.12em] uppercase text-[var(--text-muted)] mb-3">
          Archivos Cargados
        </h2>

        {evidenceQueue.length === 0 ? (
          <PremiumEdgeWrapper rounded="rounded-lg">
            <div className="px-12 py-14 text-center">
              <div className="text-[var(--text-muted)] text-xs">No hay archivos</div>
              <div className="text-[var(--text-muted)]/50 text-[10px] mt-1">Arrastre o seleccione archivos de audio</div>
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
                  exit={{ opacity: 0, x: -20, transition: { duration: 0.2 } }}
                  className="flex items-center gap-4 p-3 rounded-lg border border-[var(--border-subtle)] bg-[var(--glass-bg)] hover:bg-[var(--glass-hover)] transition-colors"
                >
                  <div className="w-8 h-8 rounded-md bg-[var(--accent-subtle)] flex items-center justify-center flex-shrink-0">
                    <AudioIcon />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-[var(--text-main)] truncate">{item.nombre}</div>
                    <div className="text-[10px] text-[var(--text-muted)]">{item.tamano}</div>
                  </div>
                  <button
                    onClick={() => selectFileForTranscription(item)}
                    className="px-3 py-1.5 bg-[var(--accent-subtle)] border border-[var(--accent)]/30 rounded-md text-[10px] font-medium text-[var(--accent-text)] hover:bg-[var(--accent)]/30 transition-colors flex-shrink-0"
                  >
                    Transcribir
                  </button>
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
