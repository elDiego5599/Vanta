import { useState, useRef, useEffect, useCallback } from 'react';
import { useAppContext } from '../lib/AppContext';
import { transcribeAudio, fileToArrayBuffer, formatTimestamp } from '../lib/whisper';

function WaveformSVG() {
  const bars = Array.from({ length: 60 }, (_, i) => {
    const h = 8 + Math.abs(Math.sin(i * 0.4 + 1.2) * 35) + Math.abs(Math.sin(i * 0.18) * 15);
    return h;
  });

  return (
    <svg width="100%" height="64" viewBox="0 0 600 64" preserveAspectRatio="none">
      {bars.map((h, i) => (
        <rect
          key={i}
          x={i * 10}
          y={(64 - h) / 2}
          width="6"
          height={h}
          rx="2"
          fill={`rgba(59,130,246,${0.3 + (i % 3) * 0.15})`}
        />
      ))}
    </svg>
  );
}

export default function ModuloTranscripcion() {
  const { selectedFile, updateEvidence } = useAppContext();
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('');
  const [transcript, setTranscript] = useState([]);
  const [audioUrl, setAudioUrl] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState('00:00:00');
  const [duration, setDuration] = useState('00:00:00');
  const [playProgress, setPlayProgress] = useState(0);
  const [hoveredLine, setHoveredLine] = useState(null);
  const audioRef = useRef(null);

  useEffect(() => {
    if (!selectedFile?.file) return;
    const url = URL.createObjectURL(selectedFile.file);
    audioRef.current?.pause();
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

    setIsTranscribing(true);
    setProgress(0);
    setStatusText('Cargando modelo Whisper...');
    setTranscript([]);

    if (selectedFile.id) {
      updateEvidence(selectedFile.id, { estado: 'transcribiendo', progreso: 0 });
    }

    try {
      const arrayBuffer = await fileToArrayBuffer(selectedFile.file);

      setStatusText('Transcribiendo audio...');

      const result = await transcribeAudio(arrayBuffer, (p) => {
        if (p.status === 'progress') {
          setProgress(Math.round(p.progress || 0));
        } else if (p.status === 'loading') {
          setStatusText('Descargando modelo...');
        }
      });

      if (result && result.chunks) {
        const segments = result.chunks.map((chunk) => ({
          t: formatTimestamp(chunk.timestamp[0]),
          text: chunk.text.trim(),
          start: chunk.timestamp[0],
          end: chunk.timestamp[1],
        }));
        setTranscript(segments);
      }

      setProgress(100);
      setStatusText('Completado');

      if (selectedFile.id) {
        updateEvidence(selectedFile.id, { estado: 'listo', progreso: 100 });
      }
    } catch (err) {
      console.error('Error en transcripcion:', err);
      setStatusText('Error: ' + err.message);
      if (selectedFile.id) {
        updateEvidence(selectedFile.id, { estado: 'error', progreso: 0 });
      }
    } finally {
      setIsTranscribing(false);
    }
  }, [selectedFile, updateEvidence]);

  if (!selectedFile) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-xl border border-white/10 flex items-center justify-center mx-auto mb-4">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#52525b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 18V5l12-2v13" />
              <circle cx="6" cy="18" r="3" />
              <circle cx="18" cy="16" r="3" />
            </svg>
          </div>
          <div className="text-sm text-[#71717a] mb-1">Sin archivo seleccionado</div>
          <div className="text-[10px] text-[#52525b]">Seleccione un archivo de evidencia para transcribir</div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col p-6">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-lg font-bold text-white/90 tracking-tight">Linea de Tiempo</h1>
          <p className="text-xs text-[#71717a] mt-1">Transcripcion interactiva con Whisper local.</p>
        </div>
        {!isTranscribing && transcript.length === 0 && (
          <button
            onClick={startTranscription}
            className="px-4 py-2 bg-blue-500/20 border border-blue-500/30 rounded-md text-xs text-blue-400 hover:bg-blue-500/30 transition-colors"
          >
            Iniciar Transcripcion
          </button>
        )}
      </div>

      {/* Audio Player Card */}
      <div className="border border-white/5 rounded-lg bg-white/[0.015] p-4 mb-6">
        <audio
          ref={audioRef}
          src={audioUrl}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={() => setIsPlaying(false)}
        />

        {/* File Info */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-md bg-blue-500/10 flex items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 18V5l12-2v13" />
                <circle cx="6" cy="18" r="3" />
                <circle cx="18" cy="16" r="3" />
              </svg>
            </div>
            <div>
              <div className="text-xs font-semibold text-white/80">{selectedFile.nombre}</div>
              <div className="text-[10px] text-[#71717a]">{selectedFile.tamano}</div>
            </div>
          </div>
          <div className={`text-[10px] tracking-wider uppercase ${
            isTranscribing ? 'text-yellow-500' :
            transcript.length > 0 ? 'text-green-500' : 'text-[#71717a]'
          }`}>
            {isTranscribing ? statusText : transcript.length > 0 ? 'Completado' : 'Pendiente'}
          </div>
        </div>

        {/* Waveform */}
        <div className="mb-3 bg-white/[0.02] rounded-md p-3">
          <WaveformSVG />
        </div>

        {/* Controls */}
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
            className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center hover:bg-white/5 transition-colors"
          >
            {isPlaying ? (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="white">
                <rect x="6" y="4" width="4" height="16" rx="1" />
                <rect x="14" y="4" width="4" height="16" rx="1" />
              </svg>
            ) : (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="white">
                <polygon points="5,3 19,12 5,21" />
              </svg>
            )}
          </button>
          <div className="flex-1">
            <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500/70 rounded-full transition-all duration-300"
                style={{ width: `${playProgress}%` }}
              />
            </div>
          </div>
          <div className="text-[10px] text-[#71717a] tabular-nums">
            <span className="text-white/60">{currentTime}</span>
            <span className="mx-1">/</span>
            <span>{duration}</span>
          </div>
        </div>

        {/* Transcription Progress */}
        {isTranscribing && (
          <div className="mt-4 pt-4 border-t border-white/5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] text-[#71717a]">{statusText}</span>
              <span className="text-[10px] text-blue-400 tabular-nums">{progress}%</span>
            </div>
            <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500/70 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Transcript */}
      <div className="flex-1 overflow-y-auto pr-2">
        <div className="text-[10px] font-semibold tracking-[0.12em] uppercase text-[#71717a] mb-3">
          Transcripcion
        </div>

        {transcript.length === 0 && !isTranscribing ? (
          <div className="border border-white/5 rounded-lg p-8 text-center">
            <div className="text-[#52525b] text-xs">
              {selectedFile ? 'Presione "Iniciar Transcripcion" para comenzar' : 'Seleccione un archivo de audio'}
            </div>
          </div>
        ) : (
          <div className="space-y-1">
            {transcript.map((line, idx) => (
              <div
                key={idx}
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
                  ${hoveredLine === idx
                    ? 'bg-white/[0.04] border border-white/[0.06]'
                    : 'border border-transparent hover:bg-white/[0.02]'
                  }
                `}
              >
                <span className="text-[10px] text-[#52525b] tabular-nums flex-shrink-0 w-14 pt-0.5">
                  {line.t}
                </span>
                <span className="text-xs text-[#a1a1aa] leading-relaxed">
                  {line.text}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
