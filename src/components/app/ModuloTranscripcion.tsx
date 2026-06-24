import { useState, useRef, useEffect, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppContext } from '../../lib/AppContext';
import { loadModel, decodeAudioToF32, transcribeProgressive, fileToArrayBuffer, formatTimestamp } from '../../lib/whisper';
import type { ChunkResult } from '../../lib/whisper';
import { PremiumEdgeWrapper } from '../landing/Primitives';

interface TranscriptLine {
  t: string;
  text: string;
  start: number;
  end: number;
}

const lineVariants = {
  hidden: { opacity: 0, x: -12 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] as const, delay: i * 0.04 },
  }),
};

const WAVE_BARS = Array.from({ length: 60 }, (_, i) =>
  6 + Math.abs(Math.sin(i * 0.52 + 1.3) * 40) + Math.abs(Math.sin(i * 0.21) * 18)
);

const WaveformAnimated = memo(function WaveformAnimated() {
  return (
    <div className="flex items-center gap-[3px] h-10 overflow-hidden">
      {WAVE_BARS.map((h, i) => {
        const dur = 1.5 + (i % 5) * 0.2;
        return (
          <div
            key={i}
            className="w-[3px] rounded-[1px] bg-blue-500/60 origin-center"
            style={{ height: h, animation: `wave-bar-beat ${dur}s ease-in-out infinite` }}
          />
        );
      })}
    </div>
  );
});

const PauseIcon = memo(() => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
    <rect x="6" y="4" width="4" height="16" rx="1" />
    <rect x="14" y="4" width="4" height="16" rx="1" />
  </svg>
));

const PlayIcon = memo(() => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
    <polygon points="5,3 19,12 5,21" />
  </svg>
));

const MusicIcon = memo(() => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 18V5l12-2v13" />
    <circle cx="6" cy="18" r="3" />
    <circle cx="18" cy="16" r="3" />
  </svg>
));

const ModuloTranscripcion = memo(function ModuloTranscripcion() {
  const { selectedFile, updateEvidence } = useAppContext();
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('');
  const [transcript, setTranscript] = useState<TranscriptLine[]>([]);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState('00:00:00');
  const [duration, setDuration] = useState('00:00:00');
  const [playProgress, setPlayProgress] = useState(0);
  const [hoveredLine, setHoveredLine] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!selectedFile?.file) return;
    const url = URL.createObjectURL(selectedFile.file);
    if (audioRef.current) {
      audioRef.current.pause();
    }
    audioRef.current = null;
    const timer = setTimeout(() => {
      setAudioUrl(url);
      setTranscript([]);
      setIsTranscribing(false);
      setProgress(0);
      setStatusText('');
      setPlayProgress(0);
      setCurrentTime('00:00:00');
      setDuration('00:00:00');
      setError(null);
    }, 0);
    return () => {
      clearTimeout(timer);
      URL.revokeObjectURL(url);
    };
  }, [selectedFile]);

  const handleTimeUpdate = useCallback(() => {
    if (audioRef.current) {
      setCurrentTime(formatTimestamp(audioRef.current.currentTime));
      const pct = (audioRef.current.currentTime / audioRef.current.duration) * 100;
      setPlayProgress(isNaN(pct) ? 0 : pct);
    }
  }, []);

  const handleLoadedMetadata = useCallback(() => {
    if (audioRef.current) {
      setDuration(formatTimestamp(audioRef.current.duration));
    }
  }, []);

  const startTranscription = useCallback(async () => {
    if (!selectedFile?.file) return;

    setError(null);
    setIsTranscribing(true);
    setProgress(0);
    setStatusText('Cargando modelo Whisper...');
    setTranscript([]);

    if (selectedFile.id) {
      updateEvidence(selectedFile.id, { estado: 'transcribiendo', progreso: 0 });
    }

    try {
      const model = await loadModel((p) => {
        if (p.status === 'loading') setStatusText('Descargando modelo Whisper...');
        else if (p.status === 'progress') setProgress(Math.min(Math.round(p.progress || 0), 10));
      });

      setProgress(10);
      setStatusText('Leyendo archivo de audio...');

      const arrayBuffer = await fileToArrayBuffer(selectedFile.file);

      setProgress(15);
      setStatusText('Decodificando audio...');

      const audioData = await decodeAudioToF32(arrayBuffer);

      setProgress(20);
      setStatusText('Transcribiendo...');

      let lineIdx = 0;
      const allLines: TranscriptLine[] = [];

      await transcribeProgressive(model, audioData, {
        chunkLengthSec: 30,
        onChunk: (chunk: ChunkResult) => {
          const line: TranscriptLine = {
            t: formatTimestamp(chunk.timestamp[0]),
            text: chunk.text,
            start: chunk.timestamp[0],
            end: chunk.timestamp[1],
          };
          allLines.push(line);
          lineIdx++;
          setTranscript([...allLines]);
          const pct = Math.round((lineIdx * 100) / Math.ceil(audioData.length / (16000 * 30)));
          setProgress(Math.min(20 + Math.round(pct * 0.75), 95));
        },
      });

      setProgress(100);
      setStatusText('Completado');

      if (selectedFile.id) {
        updateEvidence(selectedFile.id, { estado: 'listo', progreso: 100 });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('Error en transcripcion:', msg);
      setError(msg);
      setStatusText('Error');
      if (selectedFile.id) {
        updateEvidence(selectedFile.id, { estado: 'error', progreso: 0 });
      }
    } finally {
      setIsTranscribing(false);
    }
  }, [selectedFile, updateEvidence]);

  if (!selectedFile) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <PremiumEdgeWrapper rounded="rounded-lg">
          <div className="px-12 py-14 text-center">
            <div className="w-16 h-16 rounded-xl border border-[var(--border-subtle)] flex items-center justify-center mx-auto mb-4">
              <MusicIcon />
            </div>
            <div className="text-xs text-[var(--text-muted)] mb-1">Sin archivo seleccionado</div>
            <div className="text-[10px] text-[var(--text-muted)]/60">Seleccione un archivo de evidencia para transcribir</div>
          </div>
        </PremiumEdgeWrapper>
      </div>
    );
  }

  const statusColor = error
    ? 'text-red-500'
    : isTranscribing
      ? 'text-yellow-500'
      : transcript.length > 0
        ? 'text-green-500'
        : 'text-[var(--text-muted)]';

  return (
    <div className="h-full flex flex-col p-6">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <p className="text-[10px] text-[var(--text-muted)] mt-0.5 tracking-[0.06em] font-mono">Transcripcion interactiva con Whisper local.</p>
        </div>
        {!isTranscribing && transcript.length === 0 && !error && (
          <button
            onClick={startTranscription}
            className="px-4 py-2 bg-[var(--accent-subtle)] border border-[var(--accent)]/30 rounded-md text-xs text-[var(--accent-text)] hover:bg-[var(--accent)]/30 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/50"
          >
            Iniciar Transcripcion
          </button>
        )}
        {error && (
          <button
            onClick={startTranscription}
            className="px-4 py-2 bg-red-500/10 border border-red-500/30 rounded-md text-xs text-red-500 hover:bg-red-500/20 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-red-500/50"
          >
            Reintentar
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-lg text-[10px] text-red-500 font-mono leading-relaxed">
          [ERROR] {error}
        </div>
      )}

      <PremiumEdgeWrapper rounded="rounded-lg" className="mb-6">
        <div className="p-4">
          <audio
            ref={audioRef}
            src={audioUrl ?? undefined}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onEnded={() => setIsPlaying(false)}
          />

          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-md bg-[var(--accent-subtle)] flex items-center justify-center">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 18V5l12-2v13" />
                  <circle cx="6" cy="18" r="3" />
                  <circle cx="18" cy="16" r="3" />
                </svg>
              </div>
              <div>
                <div className="text-xs font-semibold text-[var(--text-main)]">{selectedFile.nombre}</div>
                <div className="text-[10px] text-[var(--text-muted)]">{selectedFile.tamano}</div>
              </div>
            </div>
            <div className={`text-[10px] tracking-wider uppercase ${statusColor}`}>
              {error ? 'Error' : isTranscribing ? statusText : transcript.length > 0 ? 'Completado' : 'Pendiente'}
            </div>
          </div>

          <div className="mb-3 bg-[var(--glass-bg)] rounded-md p-3">
            <WaveformAnimated />
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                if (!audioRef.current) return;
                if (isPlaying) {
                  audioRef.current.pause();
                } else {
                  audioRef.current.play();
                }
                setIsPlaying(!isPlaying);
              }}
              aria-label={isPlaying ? 'Pausar' : 'Reproducir'}
              className="w-8 h-8 rounded-full border border-[var(--border-strong)] flex items-center justify-center hover:bg-[var(--glass-hover)] transition-colors text-[var(--text-main)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/50"
            >
              {isPlaying ? <PauseIcon /> : <PlayIcon />}
            </button>
            <div className="flex-1">
              <div className="w-full h-1 bg-[var(--glass-bg)] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[var(--accent)]/70 rounded-full transition-all duration-300"
                  style={{ width: `${playProgress}%` }}
                />
              </div>
            </div>
            <div className="text-[10px] text-[var(--text-muted)] tabular-nums">
              <span className="text-[var(--text-main)]">{currentTime}</span>
              <span className="mx-1">/</span>
              <span>{duration}</span>
            </div>
          </div>

          {isTranscribing && (
            <div className="mt-4 pt-4 border-t border-[var(--border-subtle)]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] text-[var(--text-muted)]">{statusText}</span>
                <span className="text-[10px] text-[var(--accent-text)] tabular-nums">{progress}%</span>
              </div>
              <div className="w-full h-1.5 bg-[var(--glass-bg)] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[var(--accent)]/70 rounded-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </PremiumEdgeWrapper>

      <div className="flex-1 overflow-y-auto pr-2">
        <h2 className="text-[10px] font-semibold tracking-[0.12em] uppercase text-[var(--text-muted)] mb-3">
          Transcripcion {transcript.length > 0 && `(${transcript.length})`}
        </h2>

        {transcript.length === 0 && !isTranscribing ? (
          <PremiumEdgeWrapper rounded="rounded-lg">
            <div className="px-8 py-10 text-center">
              <div className="text-[var(--text-muted)] text-xs">
                {error
                  ? 'Ocurrio un error durante la transcripcion. Presione Reintentar.'
                  : selectedFile
                    ? 'Presione "Iniciar Transcripcion" para comenzar'
                    : 'Seleccione un archivo de audio'}
              </div>
            </div>
          </PremiumEdgeWrapper>
        ) : (
          <div className="space-y-1">
            <AnimatePresence>
              {transcript.map((line, idx) => (
                <motion.div
                  key={idx}
                  custom={idx}
                  variants={lineVariants}
                  initial="hidden"
                  animate="visible"
                  onMouseEnter={() => setHoveredLine(idx)}
                  onMouseLeave={() => setHoveredLine(null)}
                  onClick={() => {
                    if (audioRef.current && line.start != null) {
                      audioRef.current.currentTime = line.start;
                      audioRef.current.play();
                      setIsPlaying(true);
                    }
                  }}
                  className={`
                    flex gap-3 px-3 py-2.5 rounded-md cursor-pointer
                    transition-all duration-200
                    outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/50
                    ${hoveredLine === idx
                      ? 'bg-[var(--glass-hover)] border border-[var(--border-subtle)]'
                      : 'border border-transparent hover:bg-[var(--glass-bg)]'
                    }
                  `}
                >
                  <span className="text-[10px] text-[var(--text-muted)] tabular-nums flex-shrink-0 w-14 pt-0.5 font-mono">
                    {line.t}
                  </span>
                  <span className="text-xs text-[var(--text-muted)] leading-relaxed">
                    {line.text}
                  </span>
                </motion.div>
              ))}
              {isTranscribing && (
                <motion.div
                  key="loading"
                  className="flex gap-3 px-3 py-2.5 rounded-md"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <span className="text-[10px] text-[var(--text-muted)] tabular-nums w-14 pt-0.5 font-mono">
                    ...
                  </span>
                  <span className="text-xs text-[var(--text-muted)]/50 italic">
                    Transcribiendo...
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
});

export default ModuloTranscripcion;
