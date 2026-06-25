import { useState, useRef, useEffect, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppContext } from '../../lib/AppContext';
import { loadModel, decodeAudioToF32, transcribeProgressive, formatTimestamp } from '../../lib/whisper';
import type { ChunkResult } from '../../lib/whisper';
import * as db from '../../lib/db';
import { PremiumEdgeWrapper, MagneticButton } from '../landing/Primitives';
import WaveSurferWaveform from './WaveSurferWaveform';
import type { WaveSurferHandle } from './WaveSurferWaveform';

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

const CheckIcon = memo(() => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
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
  const [saveAfterTx, setSaveAfterTx] = useState(true);
  const [savedTx, setSavedTx] = useState(false);
  const waveformRef = useRef<WaveSurferHandle | null>(null);
  const durationRef = useRef(0);

  useEffect(() => {
    if (!selectedFile?.id) {
      setAudioUrl(null);
      return;
    }

    let cancelled = false;
    let url: string | null = null;

    db.getEvidenceFile(selectedFile.id).then(data => {
      if (cancelled) return;
      const blob = new Blob([data]);
      url = URL.createObjectURL(blob);
      setAudioUrl(url);
    }).catch(console.error);

    setTranscript([]);
    setIsTranscribing(false);
    setProgress(0);
    setStatusText('');
    setPlayProgress(0);
    setIsPlaying(false);
    setCurrentTime('00:00:00');
    setDuration('00:00:00');
    setError(null);
    setSavedTx(false);

    db.getTranscriptionByEvidence(selectedFile.id).then(saved => {
      if (saved && saved.saved) {
        setTranscript(saved.lines);
        setSavedTx(true);
        setStatusText('Guardado');
      }
    });

    return () => {
      cancelled = true;
      if (url) URL.revokeObjectURL(url);
    };
  }, [selectedFile]);

  const handleReady = useCallback((d: number) => {
    durationRef.current = d;
    setDuration(formatTimestamp(d));
  }, []);

  const handleTimeUpdate = useCallback((current: number) => {
    setCurrentTime(formatTimestamp(current));
    if (durationRef.current > 0) {
      setPlayProgress((current / durationRef.current) * 100);
    }
  }, []);

  const handlePlayState = useCallback((playing: boolean) => {
    setIsPlaying(playing);
  }, []);

  const togglePlay = useCallback(() => {
    waveformRef.current?.playPause();
  }, []);

  const startTranscription = useCallback(async () => {
    if (!selectedFile) return;

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

      const arrayBuffer = await db.getEvidenceFile(selectedFile.id);

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

      if (saveAfterTx) {
        await db.saveTranscription(selectedFile.id, selectedFile.caseId, allLines);
        setSavedTx(true);
      }

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
  }, [selectedFile, updateEvidence, saveAfterTx]);

  const handleTranscriptClick = useCallback((start: number) => {
    waveformRef.current?.seekTo(start);
    waveformRef.current?.play();
  }, []);

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
          <MagneticButton>
            <button
              onClick={startTranscription}
              className="px-4 py-2 rounded-md text-xs font-medium transition-all outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
              style={{
                backgroundColor: 'var(--accent)',
                color: '#fff',
              }}
            >
              Iniciar Transcripcion
            </button>
          </MagneticButton>
        )}
        {error && (
          <MagneticButton>
            <button
              onClick={startTranscription}
              className="px-4 py-2 bg-red-500/10 border border-red-500/30 rounded-md text-xs text-red-500 hover:bg-red-500/20 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-red-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
            >
              Reintentar
            </button>
          </MagneticButton>
        )}
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-lg text-[10px] text-red-500 font-mono leading-relaxed">
          [ERROR] {error}
        </div>
      )}

      <PremiumEdgeWrapper rounded="rounded-xl" className="mb-6">
        <div className="py-4 px-5">
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

          <motion.div
            className="mb-3 rounded-xl overflow-hidden"
            style={{
              backgroundColor: '#0c0f14',
              border: isTranscribing ? '1px solid rgba(59,130,246,0.3)' : '1px solid rgba(59,130,246,0.12)',
              boxShadow: isTranscribing
                ? '0 0 40px -8px rgba(59,130,246,0.15), inset 0 1px 0 rgba(255,255,255,0.04)'
                : '0 0 40px -8px rgba(59,130,246,0.08), inset 0 1px 0 rgba(255,255,255,0.04)',
            }}
            animate={isTranscribing ? {
              borderColor: ['rgba(59,130,246,0.3)', 'rgba(59,130,246,0.15)', 'rgba(59,130,246,0.3)'],
              boxShadow: [
                '0 0 40px -8px rgba(59,130,246,0.15), inset 0 1px 0 rgba(255,255,255,0.04)',
                '0 0 40px -8px rgba(59,130,246,0.06), inset 0 1px 0 rgba(255,255,255,0.04)',
                '0 0 40px -8px rgba(59,130,246,0.15), inset 0 1px 0 rgba(255,255,255,0.04)',
              ],
            } : {}}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          >
            <div className="px-5 py-3">
              <WaveSurferWaveform
                ref={waveformRef}
                url={audioUrl}
                onReady={handleReady}
                onTimeUpdate={handleTimeUpdate}
                onPlayStateChange={handlePlayState}
              />
            </div>
          </motion.div>

          <div className="flex items-center gap-4">
            <MagneticButton>
              <button
                onClick={togglePlay}
                aria-label={isPlaying ? 'Pausar' : 'Reproducir'}
                className="w-8 h-8 rounded-full flex items-center justify-center hover:opacity-80 transition-all outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
                style={{
                  color: 'var(--text-main)',
                  border: '1px solid var(--border-strong)',
                }}
              >
                {isPlaying ? <PauseIcon /> : <PlayIcon />}
              </button>
            </MagneticButton>
            <div className="flex-1">
              <div className="w-full h-1 rounded-full overflow-hidden relative" style={{ backgroundColor: 'var(--glass-bg)' }}>
                <div
                  className="h-full rounded-full relative overflow-hidden"
                  style={{
                    width: `${playProgress}%`,
                    backgroundColor: 'var(--accent)',
                    opacity: 0.7,
                    transition: 'width 0.3s ease',
                  }}
                >
                  {playProgress > 0 && playProgress < 100 && (
                    <div
                      className="absolute inset-0"
                      style={{
                        background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%)',
                        animation: 'shimmer 1.5s ease-in-out infinite',
                      }}
                    />
                  )}
                </div>
              </div>
            </div>
            <div className="text-[10px] tabular-nums" style={{ color: 'var(--text-muted)' }}>
              <span style={{ color: 'var(--text-main)' }}>{currentTime}</span>
              <span className="mx-1">/</span>
              <span>{duration}</span>
            </div>
          </div>

          {!isTranscribing && transcript.length === 0 && !error && (
            <div className="mt-3 flex items-center gap-2">
              <button
                onClick={() => setSaveAfterTx(!saveAfterTx)}
                className={`w-3.5 h-3.5 rounded flex items-center justify-center transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent ${
                  saveAfterTx ? 'bg-[var(--accent)]' : 'border border-[var(--border-strong)]'
                }`}
                aria-label={saveAfterTx ? 'Guardar transcripcion activado' : 'Guardar transcripcion desactivado'}
              >
                {saveAfterTx && <CheckIcon />}
              </button>
              <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                Guardar transcripcion al completar
              </span>
            </div>
          )}

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

      <div className="flex-1 overflow-y-auto pr-2 scroll-fade">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[10px] font-semibold tracking-[0.12em] uppercase" style={{ color: 'var(--text-muted)' }}>
            Transcripcion {transcript.length > 0 && `(${transcript.length})`}
          </h2>
          {savedTx && (
            <div className="flex items-center gap-1 text-[9px] tracking-wider uppercase" style={{ color: 'var(--accent-text)' }}>
              <CheckIcon />
              Guardado
            </div>
          )}
        </div>

        {transcript.length === 0 && !isTranscribing ? (
          <PremiumEdgeWrapper rounded="rounded-lg">
            <div className="px-8 py-10 text-center relative">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 rounded-full blur-3xl pointer-events-none" style={{ backgroundColor: 'var(--accent)', opacity: 0.06 }} />
              <motion.div
                className="w-10 h-10 rounded-lg border border-[var(--border-subtle)] flex items-center justify-center mx-auto mb-4"
                style={{ backgroundColor: 'var(--glass-bg)' }}
                animate={{ y: [0, -3, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2 12h2l3-9 4 18 4-18 3 9h4" />
                </svg>
              </motion.div>
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
                  whileHover={{ x: 2, transition: { duration: 0.2, ease: [0.16, 1, 0.3, 1] } }}
                  onMouseEnter={() => setHoveredLine(idx)}
                  onMouseLeave={() => setHoveredLine(null)}
                  onClick={() => handleTranscriptClick(line.start)}
                  className="text-left flex gap-4 py-2.5 transition-all duration-200 px-2 -mx-2 rounded cursor-pointer"
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
