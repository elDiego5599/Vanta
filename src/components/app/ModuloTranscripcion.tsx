import { useState, useRef, useEffect, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppContext } from '../../lib/AppContext';
import { loadModel, decodeAudioToF32, transcribeProgressive, formatTimestamp } from '../../lib/whisper';
import type { ChunkResult } from '../../lib/whisper';
import * as db from '../../lib/db';
import WaveSurferWaveform from './WaveSurferWaveform';
import type { WaveSurferHandle } from './WaveSurferWaveform';

// ==========================================
// 1. ÍCONOS LOCALES (Garantizando compatibilidad)
// ==========================================
const PlayIcon = ({ w = 24, h = 24 }) => (
  <svg width={w} height={h} viewBox="0 0 24 24" fill="currentColor">
    <path d="M6 4l15 8-15 8z" />
  </svg>
);

const PauseIcon = ({ w = 24, h = 24 }) => (
  <svg width={w} height={h} viewBox="0 0 24 24" fill="currentColor">
    <path d="M6 4h4v16H6zM14 4h4v16h-4z" />
  </svg>
);

const AudioIcon = ({ w = 24, h = 24, color = "currentColor" }) => (
  <svg width={w} height={h} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 18V5l12-2v13" />
    <circle cx="6" cy="18" r="3" />
    <circle cx="18" cy="16" r="3" />
  </svg>
);

const CheckIcon = ({ w = 24, h = 24 }) => (
  <svg width={w} height={h} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const BrainIcon = ({ w = 24, h = 24 }) => (
  <svg width={w} height={h} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2a5 5 0 0 1 4.5 2.8A4 4 0 0 1 20 8a4 4 0 0 1-1.8 3.3A4.5 4.5 0 0 1 17 14a4 4 0 0 1-3 3.9V22h-4v-4.1A4 4 0 0 1 7 14a4.5 4.5 0 0 1-1.2-2.7A4 4 0 0 1 4 8a4 4 0 0 1 3.5-3.2A5 5 0 0 1 12 2z" />
    <path d="M12 2v8" />
  </svg>
);

// ==========================================
// 2. INTERFACES Y CONSTANTES
// ==========================================
interface TranscriptLine {
  t: string;
  text: string;
  start: number;
  end: number;
  speaker?: 'Agente' | 'Testigo'; // Fix: Tipado correcto añadido
}

const lineVariants = {
  hidden: { opacity: 0, x: -12 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] as [number, number, number, number], delay: i * 0.04 },
  }),
};

// ==========================================
// 3. COMPONENTE PRINCIPAL
// ==========================================
const ModuloTranscripcion = memo(function ModuloTranscripcion() {
  const { selectedFile, updateEvidence, setActiveTab } = useAppContext();
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

  // Inicialización del archivo de audio
  useEffect(() => {
    if (!selectedFile?.id) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
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
    }).catch(err => {
      console.error(err);
      if (!cancelled) setError('No se pudo cargar el archivo de audio');
    });

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
        setStatusText('Análisis Recuperado');
      }
    });

    return () => {
      cancelled = true;
      if (url) URL.revokeObjectURL(url);
    };
  }, [selectedFile]);

  // Manejadores del Reproductor
  const handleReady = useCallback((d: number) => {
    durationRef.current = d;
    setDuration(formatTimestamp(d));
    setPlayProgress(0);
    setCurrentTime('00:00:00');
  }, []);

  const handleTimeUpdate = useCallback((current: number) => {
    setCurrentTime(formatTimestamp(current));
    const dur = durationRef.current;
    if (dur > 0 && current <= dur) {
      setPlayProgress((current / dur) * 100);
    }
  }, []);

  const handlePlayState = useCallback((playing: boolean) => {
    setIsPlaying(playing);
  }, []);

  const togglePlay = useCallback(() => {
    waveformRef.current?.playPause();
  }, []);

  const handleTranscriptClick = useCallback((start: number) => {
    waveformRef.current?.seekTo(start);
    waveformRef.current?.play();
  }, []);

  const toggleSpeaker = useCallback((index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setTranscript(prev => {
      const newT = [...prev];
      const line = newT[index]!;
      const current = line.speaker ?? 'Agente';
      newT[index] = { ...line, speaker: current === 'Agente' ? 'Testigo' : 'Agente' };
      return newT;
    });
  }, []);

  // Lógica de Transcripción (Whisper)
  const startTranscription = useCallback(async () => {
    if (!selectedFile) return;

    setError(null);
    setIsTranscribing(true);
    setProgress(0);
    setStatusText('Iniciando Motor Whisper AI...');
    setTranscript([]);

    if (selectedFile.id) {
      updateEvidence(selectedFile.id, { estado: 'transcribiendo', progreso: 0 });
    }

    try {
      const model = await loadModel((p) => {
        if (p.status === 'loading') setStatusText('Descargando modelo neuronal...');
        else if (p.status === 'progress') setProgress(Math.min(Math.round(p.progress || 0), 10));
      });

      setProgress(10);
      setStatusText('Procesando espectrograma...');
      const arrayBuffer = await db.getEvidenceFile(selectedFile.id);

      setProgress(15);
      setStatusText('Aplicando decodificación F32...');
      const audioData = await decodeAudioToF32(arrayBuffer);

      setProgress(20);
      setStatusText('Ejecutando transcripción y diarización...');

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
            speaker: 'Agente' // Asignación por defecto
          };
          allLines.push(line);
          lineIdx++;
          setTranscript([...allLines]);
          const pct = Math.round((lineIdx * 100) / Math.ceil(audioData.length / (16000 * 30)));
          setProgress(Math.min(20 + Math.round(pct * 0.75), 95));
        },
      });

      setProgress(100);
      setStatusText('Análisis Completado');

      if (saveAfterTx) {
        await db.saveTranscription(selectedFile.id, selectedFile.caseId, allLines);
        setSavedTx(true);
      }

      if (selectedFile.id) {
        updateEvidence(selectedFile.id, { estado: 'listo', progreso: 100, isTranscribed: true });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('Error en transcripcion:', msg);
      setError(msg);
      setStatusText('Fallo en el Sistema');
      if (selectedFile.id) {
        updateEvidence(selectedFile.id, { estado: 'error', progreso: 0 });
      }
    } finally {
      setIsTranscribing(false);
    }
  }, [selectedFile, updateEvidence, saveAfterTx]);

  // ESTADO VACÍO (Sin archivo)
  if (!selectedFile) {
    return (
      <div className="absolute inset-0 flex flex-col bg-[var(--page-bg)]">
        <div className="flex-none p-6 lg:px-10 lg:pt-10 lg:pb-6 border-b border-[var(--border-subtle)] bg-[var(--card-bg)]/50 backdrop-blur-md z-20">
          <div className="text-2xl font-extrabold tracking-tight text-[var(--text-main)]">Motor de Transcripción</div>
          <div className="text-[13px] mt-1 text-[var(--text-muted)]">Análisis de espectro y reconocimiento de voz local con Whisper AI.</div>
        </div>
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center relative">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full blur-[80px] pointer-events-none bg-[var(--accent)]/10" />
            <motion.div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 bg-[var(--card-bg)] border border-[var(--border-subtle)] shadow-sm relative z-10 text-[var(--text-muted)]"
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            >
              <BrainIcon w={32} h={32} />
            </motion.div>
            <div className="text-lg font-extrabold mb-1 text-[var(--text-main)] tracking-tight relative z-10">Esperando Evidencia</div>
            <div className="text-[11px] font-mono text-[var(--text-muted)] tracking-widest uppercase relative z-10">Seleccione un archivo en Evidencias</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 flex flex-col bg-[var(--page-bg)]">
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 8px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: var(--border-strong);
          border-radius: 10px;
          border: 2px solid var(--card-bg);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background-color: var(--text-muted); }
      `}</style>

      {/* CABECERA */}
      <div className="flex-none flex items-center justify-between p-6 lg:px-10 lg:pt-10 lg:pb-6 border-b border-[var(--border-subtle)] bg-[var(--card-bg)]/50 backdrop-blur-md z-20">
        <div>
          <div className="flex items-center gap-2 text-[11px] font-mono tracking-widest uppercase mb-2">
            <motion.button
              onClick={() => setActiveTab('ingesta')}
              whileHover={{ x: -2 }}
              whileTap={{ scale: 0.97 }}
              className="group flex items-center gap-2 px-3 py-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--accent)] bg-[var(--glass-bg)] hover:bg-[var(--accent)]/10 border border-[var(--border-subtle)] hover:border-[var(--accent)]/30 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
            >
              <motion.svg
                width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                animate={{ x: 0 }}
                whileHover={{ x: -3 }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
              >
                <polyline points="15 18 9 12 15 6" />
              </motion.svg>
              <span>Volver a Evidencias</span>
            </motion.button>
          </div>
          <div className="text-2xl font-extrabold tracking-tight text-[var(--text-main)]">Análisis Forense</div>
        </div>

        {/* ACCIÓN PRINCIPAL */}
        {!isTranscribing && transcript.length === 0 && !error && (
          <button
            onClick={startTranscription}
            className="px-6 py-2.5 rounded-xl text-[11px] font-bold tracking-widest uppercase outline-none focus-visible:ring-2 focus-visible:ring-white transition-all bg-[var(--accent)] text-white shadow-[0_0_15px_color-mix(in_srgb,var(--accent)_30%,transparent)] hover:shadow-[0_0_25px_color-mix(in_srgb,var(--accent)_60%,transparent)] hover:brightness-110 active:scale-95 flex items-center gap-2"
          >
            <BrainIcon w={16} h={16} /> Iniciar Transcripción
          </button>
        )}

        {error && (
          <button
            onClick={startTranscription}
            className="px-6 py-2.5 bg-red-500/10 border border-red-500/30 rounded-xl text-[11px] font-bold uppercase tracking-widest text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-sm"
          >
            Reintentar Análisis
          </button>
        )}
      </div>

      {/* CUERPO PRINCIPAL (2 COLUMNAS EN DESKTOP) */}
      <div className="flex-1 min-h-0 flex flex-col lg:flex-row p-6 lg:p-10 gap-8 overflow-y-auto lg:overflow-hidden">

        {/* ==========================================
            PANEL IZQUIERDO: REPRODUCTOR Y CONTROLES
           ========================================== */}
        <div className="w-full lg:w-5/12 flex flex-col gap-6 shrink-0 h-fit" key={selectedFile.id}>

          <div className="relative rounded-3xl p-[1px] bg-gradient-to-b from-[var(--border-strong)] to-[var(--border-subtle)] shadow-sm">
            <div className="relative bg-[var(--card-bg)] rounded-[23px] p-6">

              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/20 shadow-inner">
                  <AudioIcon w={24} h={24} color="currentColor" />
                </div>
                <div className="min-w-0">
                  <div className="text-[14px] font-bold text-[var(--text-main)] truncate">{selectedFile.nombre}</div>
                  <div className="text-[11px] font-mono text-[var(--text-muted)] mt-1 uppercase tracking-wider">{selectedFile.tamano} • Evidencia Activa</div>
                </div>
              </div>

              {/* CONTENEDOR DEL WAVESURFER CON GLOW INTELIGENTE */}
              <div className={`relative rounded-xl overflow-hidden mb-6 p-4 border transition-all duration-500 ${isTranscribing || isPlaying ? 'border-[var(--accent)]/40 shadow-[0_0_30px_color-mix(in_srgb,var(--accent)_15%,transparent)] bg-[var(--accent)]/[0.02]' : 'border-[var(--border-subtle)] bg-[var(--glass-bg)]'
                }`}>
                <WaveSurferWaveform
                  ref={waveformRef}
                  url={audioUrl}
                  onReady={handleReady}
                  onTimeUpdate={handleTimeUpdate}
                  onPlayStateChange={handlePlayState}
                />
              </div>

              {/* CONTROLES DE REPRODUCCIÓN */}
              <div className="flex items-center gap-5 bg-[var(--glass-bg)] p-3 rounded-xl border border-[var(--border-subtle)]">
                <button
                  onClick={togglePlay}
                  className="w-10 h-10 rounded-full flex items-center justify-center transition-all bg-[var(--text-main)] text-[var(--page-bg)] hover:scale-105 active:scale-95 shadow-md shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
                >
                  {isPlaying ? <PauseIcon w={20} h={20} /> : <PlayIcon w={20} h={20} />}
                </button>

                <div className="flex-1">
                  <div className="w-full h-1.5 rounded-full bg-[var(--border-subtle)] overflow-hidden relative">
                    <div
                      className="h-full rounded-full bg-[var(--accent)] relative"
                      style={{ width: `${playProgress}%` }}
                    >
                      {isPlaying && (
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-[shimmer_1.5s_infinite]" />
                      )}
                    </div>
                  </div>
                </div>

                <div className="text-[10px] tabular-nums font-mono text-[var(--text-muted)] shrink-0">
                  <span className="text-[var(--text-main)]">{currentTime}</span> / {duration}
                </div>
              </div>

              {/* PROGRESO DE TRANSCRIPCIÓN Y ESTADO */}
              <div className="mt-6 pt-6 border-t border-[var(--border-subtle)]">
                {isTranscribing ? (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-mono text-[var(--text-muted)] uppercase tracking-wider">{statusText}</span>
                      <span className="text-[11px] font-bold tabular-nums text-[var(--accent)]">{progress}%</span>
                    </div>
                    <div className="w-full h-2 rounded-full overflow-hidden bg-[var(--border-subtle)]">
                      <div
                        className="h-full rounded-full bg-[var(--accent)] transition-all duration-300 relative"
                        style={{ width: `${progress}%` }}
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-[shimmer_1s_infinite]" />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    <div className={`text-[11px] font-bold uppercase tracking-widest ${error ? 'text-red-500' : transcript.length > 0 ? 'text-green-500' : 'text-[var(--text-muted)]'}`}>
                      Estado: {error ? 'Error en Motor' : transcript.length > 0 ? 'Análisis Finalizado' : 'En Espera'}
                    </div>

                    {!isTranscribing && transcript.length === 0 && !error && (
                      <label className="flex items-center gap-3 cursor-pointer group">
                        <div className="relative">
                          <input type="checkbox" className="sr-only" checked={saveAfterTx} onChange={() => setSaveAfterTx(!saveAfterTx)} />
                          <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${saveAfterTx ? 'bg-[var(--accent)] border-[var(--accent)] text-white' : 'bg-transparent border-[var(--border-strong)] text-transparent group-hover:border-[var(--text-muted)]'}`}>
                            <CheckIcon w={14} h={14} />
                          </div>
                        </div>
                        <span className="text-[11px] text-[var(--text-muted)] group-hover:text-[var(--text-main)] transition-colors">Guardar automáticamente en la base de datos</span>
                      </label>
                    )}
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>

        {/* ==========================================
            PANEL DERECHO: REGISTRO DE TRANSCRIPCIÓN
           ========================================== */}
        <div className="flex-1 w-full lg:w-7/12 flex flex-col min-h-[400px] lg:min-h-0 bg-[var(--card-bg)] rounded-3xl border border-[var(--border-subtle)] shadow-sm overflow-hidden relative">

          {/* Header del panel derecho */}
          <div className="flex-none p-5 border-b border-[var(--border-subtle)] bg-[var(--card-bg)]/80 backdrop-blur-md flex items-center justify-between z-10">
            <h2 className="text-[11px] font-bold tracking-[0.15em] uppercase text-[var(--text-muted)]">
              Registro del Interrogatorio {transcript.length > 0 && `(${transcript.length} líneas)`}
            </h2>
            {savedTx && (
              <div className="flex items-center gap-1.5 text-[9px] font-bold tracking-widest uppercase text-green-500 bg-green-500/10 px-2.5 py-1 rounded-md border border-green-500/20">
                <CheckIcon w={12} h={12} /> Bóveda Asegurada
              </div>
            )}
          </div>

          {/* Área scrolleable de líneas */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-6 bg-[var(--page-bg)]/30">
            {transcript.length === 0 && !isTranscribing ? (
              <div className="h-full flex flex-col items-center justify-center text-center opacity-50">
                <TextIcon w={32} h={32} color="var(--text-muted)" />
                <div className="mt-4 text-[13px] font-bold text-[var(--text-main)]">Sin Registro</div>
                <div className="mt-1 text-[11px] font-mono text-[var(--text-muted)]">Inicie el motor Whisper para generar el acta.</div>
              </div>
            ) : (
              <div className="space-y-1 pb-10">
                <AnimatePresence>
                  {transcript.map((item, i) => (
                    <motion.div
                      key={i}
                      custom={i}
                      variants={lineVariants}
                      initial="hidden"
                      animate="visible"
                      onMouseEnter={() => setHoveredLine(i)}
                      onMouseLeave={() => setHoveredLine(null)}
                      className={`group flex gap-5 text-[14px] leading-relaxed p-4 rounded-2xl transition-all border cursor-pointer ${hoveredLine === i ? 'bg-[var(--glass-hover)] border-[var(--border-strong)] shadow-sm' : 'bg-transparent border-transparent'
                        }`}
                      onClick={() => handleTranscriptClick(item.start)}
                    >
                      <div className="flex flex-col items-start gap-2 w-20 flex-shrink-0 pt-1">
                        <div className="text-[10px] font-mono text-[var(--text-muted)] bg-[var(--glass-bg)] px-2 py-0.5 rounded border border-[var(--border-subtle)]">
                          {item.t}
                        </div>

                        {/* Botón de Orador (Diarización) */}
                        <button
                          onClick={(e) => toggleSpeaker(i, e)}
                          className={`text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded-md outline-none transition-colors w-full text-left ${(item.speaker || 'Agente') === 'Agente'
                            ? 'bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/20 hover:bg-[var(--accent)]/20'
                            : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 hover:bg-emerald-500/20'
                            }`}
                        >
                          {item.speaker || 'Agente'}
                        </button>
                      </div>

                      <div className={`flex-1 transition-colors ${hoveredLine === i ? 'text-[var(--text-main)]' : 'text-zinc-400'}`}>
                        {item.text}
                      </div>
                    </motion.div>
                  ))}

                  {/* Loader simulado al final de la lista si está transcribiendo */}
                  {isTranscribing && (
                    <motion.div
                      key="loading"
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      className="flex gap-5 p-4 rounded-2xl opacity-60"
                    >
                      <div className="w-20 flex-shrink-0">
                        <div className="w-12 h-4 rounded bg-[var(--border-strong)] animate-pulse" />
                      </div>
                      <div className="flex-1 space-y-2">
                        <div className="w-3/4 h-3 rounded bg-[var(--border-strong)] animate-pulse" />
                        <div className="w-1/2 h-3 rounded bg-[var(--border-strong)] animate-pulse delay-75" />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
});

// Ícono faltante añadido aquí para no romper nada
const TextIcon = ({ w = 24, h = 24, color = "currentColor" }) => (
  <svg width={w} height={h} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <polyline points="10 9 9 9 8 9" />
  </svg>
);

export default ModuloTranscripcion;