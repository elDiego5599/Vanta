import { motion } from 'framer-motion';
import { Ico } from './Icons';

function Waveform() {
  const bars = Array.from({ length: 50 }, (_, i) =>
    6 + Math.abs(Math.sin(i * 0.52 + 1.3) * 40) + Math.abs(Math.sin(i * 0.21) * 18)
  );
  return (
    <div className="flex items-center gap-[3px] h-10 overflow-hidden">
      {bars.map((h, i) => (
        <motion.div
          key={i}
          animate={{ scaleY: [0.3, 1, 0.4, 0.9, 0.3] }}
          transition={{ duration: 1.5 + (i % 5) * 0.2, repeat: Infinity }}
          className="w-[3px] rounded-[1px] bg-blue-500/60 origin-center"
          style={{ height: h }}
        />
      ))}
    </div>
  );
}

const TRANSCRIPT_LINES = [
  { t: '00:00:14', s: 'Agente', txt: 'Indique su nombre completo para el registro.' },
  { t: '00:00:22', s: 'Testigo', txt: 'Carlos Ramirez Vega.' },
  { t: '00:00:31', s: 'Agente', txt: 'Confirme la fecha y lugar exacto de los hechos.' },
];

export default function DetailedMockupUI({ activeIndex = 0 }) {
  const isUpload = activeIndex === 0;
  const isTranscribing = activeIndex === 1;
  const isChain = activeIndex === 2;
  const isCrypto = activeIndex === 3;

  return (
    <div className="flex w-full h-full bg-[#050505] rounded-[22px] overflow-hidden border border-white/[0.05]">
      <div className="w-[160px] md:w-[200px] shrink-0 bg-[#000000] border-r border-white/[0.05] flex flex-col py-5 gap-0.5">
        <div className="px-5 pb-5 border-b border-white/[0.05] mb-2.5">
          <div className="text-[12px] tracking-[0.14em] uppercase text-white/90 font-bold flex items-center gap-2">
            <svg viewBox="0 0 100 100" className="w-4 h-4 text-white" fill="currentColor">
              <polygon points="10,25 40,85 55,85 25,25" />
              <polygon points="90,25 60,85 45,85 75,25" opacity="0.6" />
              <polygon points="35,25 65,25 50,55" opacity="0.8" />
            </svg>
            VANTA
          </div>
          <div className="text-[10px] text-zinc-600 mt-[4px] tracking-[0.06em] font-mono">
            v3.0.0 — offline
          </div>
        </div>
        {['Casos Activos', 'Evidencias', 'Transcripciones', 'Informes', 'Ajustes'].map((item, i) => (
          <div
            key={item}
            data-cursor="button"
            className={`px-5 py-[8px] text-[11px] tracking-[0.04em] border-l-2 ${
              i === 0
                ? 'font-semibold text-white/90 bg-white/[0.06] border-white/75'
                : 'font-normal text-zinc-600 bg-transparent border-transparent hover:bg-white/[0.02]'
            }`}
          >
            {item}
          </div>
        ))}
      </div>

      <div className="flex-1 flex flex-col p-6 gap-5 overflow-hidden bg-[radial-gradient(ellipse_at_top_right,_rgba(255,255,255,0.03),_transparent_50%)] relative">
        <div className="flex items-center justify-between z-10">
          <div className="text-[14px] font-bold text-white/90 tracking-[-0.01em]">
            Caso #2024-0471
          </div>
          <div className="flex gap-1.5 items-center px-3 py-1.5 rounded-md bg-white/[0.03] border border-white/[0.05]">
            <div className={`w-1.5 h-1.5 rounded-full ${
              isCrypto
                ? 'bg-purple-500 shadow-[0_0_6px_rgba(168,85,247,0.8)]'
                : 'bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.8)]'
            } animate-pulse`} />
            <span className="text-[10px] text-zinc-400 tracking-[0.08em] font-mono uppercase">
              {isCrypto ? 'AES SECURED' : 'Offline Local'}
            </span>
          </div>
        </div>

        {isUpload && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            data-cursor="button"
            className="flex-1 border border-dashed border-white/[0.12] rounded-lg py-5 px-6 flex flex-col items-center justify-center gap-[8px] bg-white/[0.015] hover:bg-white/[0.03] transition-colors"
          >
            <div className="w-[48px] h-[48px] border border-white/15 rounded-lg flex items-center justify-center mb-3">
              {Ico.upload('#71717a')}
            </div>
            <div className="text-sm text-zinc-400 tracking-[0.05em] text-center">
              Arrastre archivos de evidencia aquí
            </div>
            <div className="text-xs text-zinc-600 tracking-[0.04em] font-mono mt-1">
              MP3, MP4, WAV, MOV — hasta 8 GB
            </div>
          </motion.div>
        )}

        {isTranscribing && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 flex flex-col gap-4">
            <div className="rounded-xl border border-white/[0.05] bg-white/[0.02] py-4 px-5">
              <div className="text-[10px] text-zinc-500 tracking-[0.10em] uppercase mb-3 font-mono">
                interrogatorio_0041.wav
              </div>
              <Waveform />
            </div>
            <div className="flex-1 overflow-y-hidden flex flex-col gap-2">
              {TRANSCRIPT_LINES.map((line, i) => (
                <div
                  key={i}
                  data-cursor="button"
                  className="flex gap-4 py-2 border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors px-2 -mx-2 rounded"
                >
                  <span className="text-[11px] text-zinc-600 font-mono w-[55px] mt-0.5">
                    {line.t}
                  </span>
                  <span className={`text-[11px] font-bold w-[55px] tracking-wide uppercase mt-0.5 ${
                    line.s === 'Agente' ? 'text-zinc-500' : 'text-blue-500'
                  }`}>
                    {line.s}
                  </span>
                  <span className="text-xs text-white/80 leading-relaxed">{line.txt}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {isChain && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex-1 rounded-xl border border-white/[0.05] bg-[#000] p-5 font-mono text-[11px] text-zinc-400 overflow-hidden relative"
          >
            <div className="mb-3 text-zinc-600">&gt; Iniciando protocolo de hashing SHA-256...</div>
            <motion.div animate={{ y: [0, -150] }} transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}>
              {Array.from({ length: 20 }).map((_, i) => (
                <div key={i} className="mb-1.5 opacity-80 truncate">
                  <span className="text-green-500 font-bold">[VERIFIED]</span>{' '}
                  {Math.random().toString(16).substr(2, 64)} ... chunk_{i}
                </div>
              ))}
            </motion.div>
            <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-black to-transparent" />
          </motion.div>
        )}

        {isCrypto && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 flex items-center justify-center relative">
            <motion.div
              animate={{ scale: [0.95, 1.05, 0.95] }}
              transition={{ duration: 3, repeat: Infinity }}
              className="absolute w-48 h-48 bg-purple-500/10 rounded-full blur-2xl"
            />
            <div className="relative flex flex-col items-center gap-4">
              <div className="relative">
                <motion.div
                  animate={{
                    boxShadow: [
                      '0 0 20px 6px rgba(168,85,247,0.2)',
                      '0 0 35px 12px rgba(168,85,247,0.35)',
                      '0 0 20px 6px rgba(168,85,247,0.2)',
                    ],
                  }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                  className="absolute inset-0 rounded-full"
                />
                <div className="w-20 h-20 rounded-full border border-purple-500/30 bg-purple-500/10 flex items-center justify-center text-purple-400 relative">
                  {Ico.lock('currentColor')}
                </div>
              </div>
              <div className="text-sm font-bold text-white tracking-widest uppercase mt-2">
                AES-256 Activo
              </div>
              <div className="text-[11px] text-zinc-500 font-mono text-center max-w-[250px]">
                Volumen montado y asegurado localmente. Ningún proceso externo puede leer la evidencia.
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
