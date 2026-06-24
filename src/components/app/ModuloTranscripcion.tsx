import { useState, useRef, useEffect, useCallback, memo, useImperativeHandle, forwardRef } from 'react';
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

const BAR_COUNT = 120;
const HALF = BAR_COUNT / 2;

function staticWaveform(): number[] {
  const out: number[] = [];
  for (let i = 0; i < BAR_COUNT; i++) {
    const norm = i / BAR_COUNT;
    const envelope = Math.sin(norm * Math.PI);
    const wave = Math.sin(i * 0.3) * 0.3 + Math.sin(i * 0.7) * 0.25 + Math.sin(i * 1.4) * 0.2 + Math.sin(i * 2.8) * 0.1;
    out.push(4 + envelope * (14 + wave * 12));
  }
  return out;
}

const STATIC_BARS = staticWaveform();

interface LiveWaveformProps {
  audioRef: React.RefObject<HTMLAudioElement | null>;
  isPlaying: boolean;
}

const LiveWaveform = memo(forwardRef(function LiveWaveform({ audioRef, isPlaying }: LiveWaveformProps, ref) {
  const [bars, setBars] = useState<number[]>(() => [...STATIC_BARS]);
  const ctxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const rafRef = useRef<number>(0);
  const smoothedRef = useRef<number[]>([...STATIC_BARS]);

  const initAudioChain = useCallback(() => {
    if (sourceRef.current) return;

    const audio = audioRef.current;
    if (!audio) return;

    const ctx = new AudioContext();
    ctxRef.current = ctx;

    const analyser = ctx.createAnalyser();
    analyser.fftSize = 512;
    analyser.smoothingTimeConstant = 0.75;
    analyserRef.current = analyser;

    const source = ctx.createMediaElementSource(audio);
    source.connect(analyser);
    analyser.connect(ctx.destination);
    sourceRef.current = source;
  }, [audioRef]);

  useImperativeHandle(ref, () => ({
    initAudioChain,
  }));

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
    const binCount = analyser.frequencyBinCount;
    const step = Math.max(1, Math.floor(binCount / HALF));

    const tick = () => {
      analyser.getByteFrequencyData(dataArray);

      for (let i = 0; i < HALF; i++) {
        let sum = 0;
        for (let j = 0; j < step; j++) {
          sum += dataArray[Math.min(i * step + j, binCount - 1)] ?? 0;
        }
        const raw = (sum / step) / 255;
        const target = 4 + raw * 50;
        const prev = smoothed[i] ?? 4;
        smoothed[i] = prev * 0.4 + target * 0.6;
        smoothed[BAR_COUNT - 1 - i] = smoothed[i] ?? 4;
      }

      setBars([...smoothed]);
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [isPlaying]);

  useEffect(() => {
    return () => {
      cancelAnimationFrame(rafRef.current);
      sourceRef.current?.disconnect();
      analyserRef.current?.disconnect();
      ctxRef.current?.close();
      ctxRef.current = null;
      analyserRef.current = null;
      sourceRef.current = null;
    };
  }, []);

  return (
    <div
      className="flex items-center w-full overflow-hidden cursor-pointer"
      style={{ gap: '2px', height: '64px' }}
      onClick={() => {
        const audio = audioRef.current;
        if (!audio) return;
        initAudioChain();
        if (ctxRef.current?.state === 'suspended') {
          ctxRef.current.resume();
        }
        if (audio.paused) {
          audio.play().catch(() => {});
        } else {
          audio.pause();
        }
      }}
    >
      {bars.map((h, i) => {
        const norm = i / BAR_COUNT;
        const edgeFade = norm < 0.08 ? norm / 0.08 : norm > 0.92 ? (1 - norm) / 0.08 : 1;

        return (
          <div
            key={i}
            className="flex-shrink-0 rounded-full"
            style={{
              width: '3px',
              height: `${Math.max(4, h * edgeFade)}px`,
              backgroundColor: 'var(--accent)',
              opacity: isPlaying ? 0.85 : 0.4,
              transition: isPlaying ? 'none' : 'height 0.5s cubic-bezier(0.16,1,0.3,1)',
            }}
          />
        );
      })}
    </div>
  );
}));

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
  const waveformRef = useRef<{ initAudioChain: () => void } | null>(null);

  useEffect(() => {
    if (!selectedFile?.file) return;
    const url = URL.createObjectURL(selectedFile.file);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
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

  const togglePlay = useCallback(async () => {
    waveformRef.current?.initAudioChain();
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
  }, [isPlaying]);

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
            <div className="w-16 h-16 rounded-xl flex items-center justify-center mx-auto mb-4" style={{ border: '1px solid var(--border-subtle)' }}>
              <MusicIcon />
            </div>
            <div className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Sin archivo seleccionado</div>
            <div className="text-[10px]" style={{ color: 'var(--text-muted)', opacity: 0.6 }}>Seleccione un archivo de evidencia para transcribir</div>
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
        : 'text-zinc-400';

  return (
    <div className="h-full flex flex-col p-6">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <p className="text-[10px] mt-0.5 tracking-[0.06em] font-mono" style={{ color: 'var(--text-muted)' }}>
            Transcripcion interactiva con Whisper local.
          </p>
        </div>
        {!isTranscribing && transcript.length === 0 && !error && (
          <button
            onClick={startTranscription}
            className="px-4 py-2 rounded-md text-xs transition-opacity outline-none"
            style={{
              backgroundColor: 'var(--accent-subtle)',
              border: '1px solid var(--accent-subtle)',
              color: 'var(--accent-text)',
            }}
          >
            Iniciar Transcripcion
          </button>
        )}
        {error && (
          <button
            onClick={startTranscription}
            className="px-4 py-2 bg-red-500/10 border border-red-500/30 rounded-md text-xs text-red-500 hover:bg-red-500/20 transition-colors outline-none"
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
              <div
                className="w-8 h-8 rounded-md flex items-center justify-center"
                style={{ backgroundColor: 'var(--accent-subtle)' }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 18V5l12-2v13" />
                  <circle cx="6" cy="18" r="3" />
                  <circle cx="18" cy="16" r="3" />
                </svg>
              </div>
              <div>
                <div className="text-xs font-semibold" style={{ color: 'var(--text-main)' }}>{selectedFile.nombre}</div>
                <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{selectedFile.tamano}</div>
              </div>
            </div>
            <div className={`text-[10px] tracking-wider uppercase ${statusColor}`}>
              {error ? 'Error' : isTranscribing ? statusText : transcript.length > 0 ? 'Completado' : 'Pendiente'}
            </div>
          </div>

          <div
            className="mb-3 rounded-lg overflow-hidden"
            style={{
              backgroundColor: '#0c0f14',
              border: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            <div className="px-4 pt-3 pb-1">
              <div className="text-[10px] font-mono tracking-wider uppercase" style={{ color: 'rgba(255,255,255,0.35)' }}>
                {selectedFile.nombre}
              </div>
            </div>
            <div className="px-3 pb-3">
              <LiveWaveform ref={waveformRef} audioRef={audioRef} isPlaying={isPlaying} />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={togglePlay}
              aria-label={isPlaying ? 'Pausar' : 'Reproducir'}
              className="w-8 h-8 rounded-full flex items-center justify-center hover:opacity-80 transition-opacity outline-none"
              style={{
                color: 'var(--text-main)',
                border: '1px solid var(--border-strong)',
              }}
            >
              {isPlaying ? <PauseIcon /> : <PlayIcon />}
            </button>
            <div className="flex-1">
              <div className="w-full h-1 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--glass-bg)' }}>
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${playProgress}%`,
                    backgroundColor: 'color-mix(in srgb, var(--accent) 70%, transparent)',
                  }}
                />
              </div>
            </div>
            <div className="text-[10px] tabular-nums" style={{ color: 'var(--text-muted)' }}>
              <span style={{ color: 'var(--text-main)' }}>{currentTime}</span>
              <span className="mx-1">/</span>
              <span>{duration}</span>
            </div>
          </div>

          {isTranscribing && (
            <div className="mt-4 pt-4" style={{ borderTop: '1px solid var(--border-subtle)' }}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{statusText}</span>
                <span className="text-[10px] tabular-nums" style={{ color: 'var(--accent-text)' }}>{progress}%</span>
              </div>
              <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--glass-bg)' }}>
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${progress}%`,
                    backgroundColor: 'color-mix(in srgb, var(--accent) 70%, transparent)',
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </PremiumEdgeWrapper>

      <div className="flex-1 overflow-y-auto pr-2">
        <h2 className="text-[10px] font-semibold tracking-[0.12em] uppercase mb-3" style={{ color: 'var(--text-muted)' }}>
          Transcripcion {transcript.length > 0 && `(${transcript.length})`}
        </h2>

        {transcript.length === 0 && !isTranscribing ? (
          <PremiumEdgeWrapper rounded="rounded-lg">
            <div className="px-8 py-10 text-center">
              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {error
                  ? 'Ocurrio un error durante la transcripcion. Presione Reintentar.'
                  : selectedFile
                    ? 'Presione "Iniciar Transcripcion" para comenzar'
                    : 'Seleccione un archivo de audio'}
              </div>
            </div>
          </PremiumEdgeWrapper>
        ) : (
          <div className="space-y-0">
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
                      waveformRef.current?.initAudioChain();
                      audioRef.current.currentTime = line.start;
                      audioRef.current.play();
                      setIsPlaying(true);
                    }
                  }}
                  className="text-left flex gap-4 py-2.5 transition-colors px-2 -mx-2 rounded cursor-pointer"
                  style={{
                    borderBottom: '1px solid var(--border-subtle)',
                    backgroundColor: hoveredLine === idx ? 'var(--glass-hover)' : 'transparent',
                  }}
                >
                  <span className="text-[11px] font-mono w-[55px] mt-0.5 flex-shrink-0" style={{ color: 'var(--text-muted)' }}>
                    {line.t}
                  </span>
                  <span className="text-xs leading-relaxed" style={{ color: 'var(--text-main)' }}>
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
                  <span className="text-[10px] tabular-nums w-14 pt-0.5 font-mono" style={{ color: 'var(--text-muted)' }}>
                    ...
                  </span>
                  <span className="text-xs italic" style={{ color: 'var(--text-muted)', opacity: 0.5 }}>
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
