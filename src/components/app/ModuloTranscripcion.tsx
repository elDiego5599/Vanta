import { useState, useRef, useEffect, useCallback, memo, type RefObject } from 'react';
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

const BAR_COUNT = 50;
const BASE_HEIGHT = 4;
const MAX_HEIGHT = 40;

interface LiveWaveformProps {
  audioRef: RefObject<HTMLAudioElement | null>;
  isPlaying: boolean;
}

const LiveWaveform = memo(function LiveWaveform({ audioRef, isPlaying }: LiveWaveformProps) {
  const [bars, setBars] = useState<number[]>(() => Array(BAR_COUNT).fill(BASE_HEIGHT));
  const analyserRef = useRef<AnalyserNode | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const rafRef = useRef<number>(0);
  const smoothedRef = useRef<Float32Array>(new Float32Array(BAR_COUNT));

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    let ctx = ctxRef.current;
    if (!ctx) {
      ctx = new AudioContext();
      ctxRef.current = ctx;
    }

    if (!analyserRef.current) {
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 128;
      analyser.smoothingTimeConstant = 0.7;
      analyserRef.current = analyser;

      if (!sourceRef.current) {
        try {
          const source = ctx.createMediaElementSource(audio);
          source.connect(analyser);
          analyser.connect(ctx.destination);
          sourceRef.current = source;
        } catch {
          // MediaElementSource already created for this element
          analyser.connect(ctx.destination);
        }
      }
    }

    return () => {
      cancelAnimationFrame(rafRef.current);
    };
  }, [audioRef]);

  useEffect(() => {
    const analyser = analyserRef.current;
    const ctx = ctxRef.current;

    if (!isPlaying || !analyser || !ctx) {
      cancelAnimationFrame(rafRef.current);
      return;
    }

    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    const smoothed = smoothedRef.current;

    const update = () => {
      analyser.getByteFrequencyData(dataArray);

      const binCount = analyser.frequencyBinCount;
      const step = Math.max(1, Math.floor(binCount / BAR_COUNT));

      for (let i = 0; i < BAR_COUNT; i++) {
        const idx = Math.min(i * step, binCount - 1);
        const raw = (dataArray[idx] ?? 0) / 255;
        const target = BASE_HEIGHT + raw * (MAX_HEIGHT - BASE_HEIGHT);
        const prev = smoothed[i] ?? BASE_HEIGHT;
        smoothed[i] = prev * 0.4 + target * 0.6;
      }

      setBars(Array.from(smoothed));
      rafRef.current = requestAnimationFrame(update);
    };

    rafRef.current = requestAnimationFrame(update);

    return () => cancelAnimationFrame(rafRef.current);
  }, [isPlaying, audioRef]);

  useEffect(() => {
    return () => {
      cancelAnimationFrame(rafRef.current);
      ctxRef.current?.close();
      ctxRef.current = null;
      analyserRef.current = null;
      sourceRef.current = null;
    };
  }, []);

  return (
    <div className="flex items-center gap-[3px] h-10 overflow-hidden">
      {bars.map((h, i) => (
        <div
          key={i}
          className="w-[3px] rounded-[1px] bg-blue-500/60 origin-center"
          style={{ height: h, transition: isPlaying ? 'none' : 'height 0.3s ease-out' }}
        />
      ))}
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
    setAudioUrl(url);
    setTranscript([]);
    setIsTranscribing(false);
    setProgress(0);
    setStatusText('');
    setPlayProgress(0);
    setIsPlaying(false);
    setCurrentTime('00:00:00');
    setDuration('00:00:00');
    setError(null);
    return () => URL.revokeObjectURL(url);
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

      <PremiumEdgeWrapper rounded="rounded-xl" className="mb-6">
        <div className="py-4 px-5">
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
            <LiveWaveform audioRef={audioRef} isPlaying={isPlaying} />
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={async () => {
                const audio = audioRef.current;
                if (!audio) return;
                try {
                  if (isPlaying) {
                    audio.pause();
                    setIsPlaying(false);
                  } else {
                    await audio.play();
                    setIsPlaying(true);
                  }
                } catch (e) {
                  console.error('Audio play error:', e);
                  setIsPlaying(false);
                }
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
                    text-left flex gap-4 py-2 border-b border-white/[0.03] transition-colors
                    px-2 -mx-2 rounded outline-none focus-visible:bg-white/[0.05]
                    ${hoveredLine === idx
                      ? 'bg-white/[0.02]'
                      : ''
                    }
                  `}
                >
                  <span className="text-[11px] text-zinc-600 font-mono w-[55px] mt-0.5 flex-shrink-0">
                    {line.t}
                  </span>
                  <span className="text-xs text-white/80 leading-relaxed">
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
