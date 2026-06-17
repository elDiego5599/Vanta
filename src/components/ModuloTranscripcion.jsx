import { useState } from 'react';

const TRANSCRIPT = [
  { t: '00:00:14', speaker: 'Agente', text: 'Por favor, indique su nombre completo para el registro.' },
  { t: '00:00:22', speaker: 'Sospechoso', text: 'Mi nombre es Carlos Ramirez Vega.' },
  { t: '00:00:31', speaker: 'Agente', text: 'Confirme la fecha y lugar de los hechos.' },
  { t: '00:00:48', speaker: 'Sospechoso', text: 'El dieciseis de marzo, en la calle Constitucion 204.' },
  { t: '00:01:05', speaker: 'Agente', text: 'Descrimba que ocurrio esa noche.' },
  { t: '00:01:18', speaker: 'Sospechoso', text: 'Estaba en mi oficina cuando escuche ruidos extraños en el pasillo.' },
  { t: '00:01:34', speaker: 'Agente', text: 'A que hora aproximadamente fue esto?' },
  { t: '00:01:42', speaker: 'Sospechoso', text: 'Alrededor de las 11:30 de la noche.' },
  { t: '00:02:01', speaker: 'Agente', text: 'Vio a alguna persona sospechosa?' },
  { t: '00:02:15', speaker: 'Sospechoso', text: 'Si, vi a dos individuos cerca de la puerta trasera.' },
];

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
  const [isPlaying, setIsPlaying] = useState(false);
  const currentTime = '00:00:14';
  const [hoveredLine, setHoveredLine] = useState(null);

  return (
    <div className="h-full flex flex-col p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-lg font-bold text-white/90 tracking-tight">Linea de Tiempo</h1>
        <p className="text-xs text-[#71717a] mt-1">Transcripcion interactiva del archivo de audio.</p>
      </div>

      {/* Audio Player Card */}
      <div className="border border-white/5 rounded-lg bg-white/[0.015] p-4 mb-6">
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
              <div className="text-xs font-semibold text-white/80">interrogatorio_0041.wav</div>
              <div className="text-[10px] text-[#71717a]">48.2 MB · 01:24:38 · 44.1kHz</div>
            </div>
          </div>
          <div className="text-[10px] text-green-500 tracking-wider uppercase">Completado</div>
        </div>

        {/* Waveform */}
        <div className="mb-3 bg-white/[0.02] rounded-md p-3">
          <WaveformSVG />
        </div>

        {/* Controls */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
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
              <div className="h-full bg-blue-500/70 rounded-full" style={{ width: '17%' }} />
            </div>
          </div>
          <div className="text-[10px] text-[#71717a] tabular-nums">
            <span className="text-white/60">{currentTime}</span>
            <span className="mx-1">/</span>
            <span>01:24:38</span>
          </div>
        </div>
      </div>

      {/* Transcript */}
      <div className="flex-1 overflow-y-auto pr-2">
        <div className="text-[10px] font-semibold tracking-[0.12em] uppercase text-[#71717a] mb-3">
          Transcripcion
        </div>
        <div className="space-y-1">
          {TRANSCRIPT.map((line, i) => (
            <div
              key={i}
              onMouseEnter={() => setHoveredLine(i)}
              onMouseLeave={() => setHoveredLine(null)}
              className={`
                flex gap-3 px-3 py-2.5 rounded-md cursor-pointer
                transition-all duration-200
                ${hoveredLine === i
                  ? 'bg-white/[0.04] border border-white/[0.06]'
                  : 'border border-transparent hover:bg-white/[0.02]'
                }
              `}
            >
              <span className="text-[10px] text-[#52525b] tabular-nums flex-shrink-0 w-12 pt-0.5">
                {line.t}
              </span>
              <span className={`
                text-[10px] font-bold flex-shrink-0 w-20 uppercase tracking-wider
                ${line.speaker === 'Agente' ? 'text-[#a1a1aa]' : 'text-blue-400'}
              `}>
                {line.speaker}
              </span>
              <span className="text-xs text-[#a1a1aa] leading-relaxed">
                {line.text}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
