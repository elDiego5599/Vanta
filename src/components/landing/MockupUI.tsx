import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '../../lib/utils';
import { fadeIn } from '../../lib/motion';
import { IconShield, IconLock, VantaMiniLogo } from './Icons';

const WAVE_BARS = Array.from({ length: 50 }, (_, i) =>
  6 + Math.abs(Math.sin(i * 0.52 + 1.3) * 40) + Math.abs(Math.sin(i * 0.21) * 18)
);

const TRANSCRIPT_LINES = [
  { t: '00:00:14', s: 'Agente', txt: 'Indique su nombre completo para el registro.' },
  { t: '00:00:22', s: 'Testigo', txt: 'Carlos Ramirez Vega.' },
  { t: '00:00:31', s: 'Agente', txt: 'Confirme la fecha y lugar exacto de los hechos.' },
];

function Waveform() {
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
}

const MockupStatusView = () => (
  <motion.div variants={fadeIn} initial="hidden" animate="visible" className="flex-1 flex flex-col items-center justify-center gap-6">
    <div className="w-20 h-20 rounded-full border border-white/20 bg-white/5 flex items-center justify-center text-white/80">
      <IconShield w={32} h={32} color="currentColor" />
    </div>
    <div className="text-center font-mono">
      <div className="text-[13px] font-bold text-white tracking-widest uppercase mb-3">Air-Gapped Mode</div>
      <div className="text-[10px] text-zinc-500 space-y-1.5 uppercase tracking-wider">
        <p>Conexiones: <span className="text-zinc-300">Bloqueadas</span></p>
        <p>Telemetría: <span className="text-zinc-300">Desactivada</span></p>
        <p>Motor Local: <span className="text-green-500 font-bold animate-pulse">En Línea</span></p>
      </div>
    </div>
  </motion.div>
);

const MockupTranscriptionView = () => (
  <motion.div variants={fadeIn} initial="hidden" animate="visible" className="flex-1 flex flex-col gap-4">
    <div className="rounded-xl border border-white/[0.05] bg-white/[0.02] py-4 px-5">
      <div className="text-[10px] text-zinc-500 tracking-[0.10em] uppercase mb-3 font-mono">
        interrogatorio_0041.wav
      </div>
      <Waveform />
    </div>
    <div className="flex-1 overflow-y-hidden flex flex-col gap-2">
      {TRANSCRIPT_LINES.map((line, i) => (
        <button key={i} type="button" aria-label={`${line.s}: ${line.txt}`} className="text-left flex gap-4 py-2 border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors px-2 -mx-2 rounded focus-visible:bg-white/[0.05] outline-none">
          <span className="text-[11px] text-zinc-600 font-mono w-[55px] mt-0.5">{line.t}</span>
          <span className={cn('text-[11px] font-bold w-[55px] tracking-wide uppercase mt-0.5', line.s === 'Agente' ? 'text-zinc-500' : 'text-blue-500')}>{line.s}</span>
          <span className="text-xs text-white/80 leading-relaxed">{line.txt}</span>
        </button>
      ))}
    </div>
  </motion.div>
);

const MOCK_HASHES = Array.from({ length: 20 }, (_, i) => ({
  id: i,
  hash: `e3b0c44298fc1c149${(i * 7919).toString(16).padStart(9, '0')}... chunk_${i}`,
}));

const MockupChainView = () => {
  const prefersReducedMotion = useReducedMotion();
  return (
    <motion.div variants={fadeIn} initial="hidden" animate="visible" className="flex-1 rounded-xl border border-white/[0.05] bg-[#000] p-5 font-mono text-[11px] text-zinc-400 overflow-hidden relative">
      <div className="mb-3 text-zinc-600">&gt; Iniciando protocolo de hashing SHA-256...</div>
      <motion.div animate={prefersReducedMotion ? {} : { y: [0, -150] }} transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}>
        {MOCK_HASHES.map((item) => (
          <div key={item.id} className="mb-1.5 opacity-80 truncate">
            <span className="text-green-500 font-bold">[VERIFIED]</span> {item.hash}
          </div>
        ))}
      </motion.div>
      <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-black to-transparent" />
    </motion.div>
  );
};

const MockupCryptoView = () => {
  const prefersReducedMotion = useReducedMotion();
  return (
    <motion.div variants={fadeIn} initial="hidden" animate="visible" className="flex-1 flex items-center justify-center relative">
      <motion.div animate={prefersReducedMotion ? { scale: 1 } : { scale: [0.95, 1.05, 0.95] }} transition={{ duration: 3, repeat: Infinity }} className="absolute w-48 h-48 bg-purple-500/10 rounded-full blur-2xl" />
      <div className="relative flex flex-col items-center gap-4">
        <div className="relative">
          <motion.div animate={prefersReducedMotion ? {} : { boxShadow: ['0 0 20px 6px rgba(168,85,247,0.2)', '0 0 35px 12px rgba(168,85,247,0.35)', '0 0 20px 6px rgba(168,85,247,0.2)'] }} transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }} className="absolute inset-0 rounded-full" />
        <div className="w-20 h-20 rounded-full border border-purple-500/30 bg-purple-500/10 flex items-center justify-center text-purple-400 relative">
          <IconLock color="currentColor" />
        </div>
      </div>
      <div className="text-sm font-bold text-white tracking-widest uppercase mt-2">AES-256 Activo</div>
      <div className="text-[11px] text-zinc-500 font-mono text-center max-w-[250px]">Volumen montado y asegurado localmente. Ningún proceso externo puede leer la evidencia.</div>
    </div>
  </motion.div>
  );
};

interface DetailedMockupUIProps {
  activeIndex?: number;
}

const SIDEBAR_MAP: Record<number, number> = { 0: 4, 1: 2, 2: 1, 3: 0 };

export default function DetailedMockupUI({ activeIndex = 0 }: DetailedMockupUIProps) {
  const isCrypto = activeIndex === 3;
  const sidebarItems = ['Casos Activos', 'Evidencias', 'Transcripciones', 'Informes', 'Ajustes'];
  const activeSidebarIndex = SIDEBAR_MAP[activeIndex] ?? 0;

  return (
    <div className="flex w-full h-full bg-[#050505] rounded-[22px] overflow-hidden border border-white/[0.05]">
      <div className="w-[150px] md:w-[200px] xl:w-[240px] shrink-0 bg-[#000000] border-r border-white/[0.05] flex flex-col py-5 gap-0.5">
        <div className="px-5 pb-5 border-b border-white/[0.05] mb-2.5">
          <div className="flex items-center gap-2 select-none">
            <VantaMiniLogo className="w-4 h-4" />
            <span className="chrome-text text-[12px] tracking-[0.14em] uppercase font-bold">VANTA</span>
          </div>
        </div>
        {sidebarItems.map((item, i) => (
          <button
            key={item}
            type="button"
            className={cn(
              'w-full text-left px-5 py-[8px] text-[11px] md:text-[12px] tracking-[0.04em] border-l-2 outline-none focus-visible:bg-white/[0.05] transition-colors',
              i === activeSidebarIndex
                ? 'font-semibold text-white/90 bg-white/[0.06] border-white/75'
                : 'font-normal text-zinc-600 bg-transparent border-transparent hover:bg-white/[0.02]'
            )}
          >
            {item}
          </button>
        ))}
      </div>

      <div className="flex-1 flex flex-col p-6 gap-5 overflow-hidden bg-[radial-gradient(ellipse_at_top_right,_rgba(255,255,255,0.03),_transparent_50%)] relative">
        <div className="flex items-center justify-between z-10">
          <div className="text-[14px] font-bold text-white/90 tracking-[-0.01em]">
            Caso #2024-0471
          </div>
          <div className="flex gap-1.5 items-center px-3 py-1.5 rounded-md bg-white/[0.03] border border-white/[0.05]">
            <div className={cn('w-1.5 h-1.5 rounded-full animate-pulse', isCrypto
              ? 'bg-purple-500 shadow-[0_0_6px_rgba(168,85,247,0.8)]'
              : 'bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.8)]'
            )} />
            <span className="text-[10px] text-zinc-400 tracking-[0.08em] font-mono uppercase">
              {isCrypto ? 'AES SECURED' : 'Offline Local'}
            </span>
          </div>
        </div>

        {activeIndex === 0 && <MockupStatusView />}
        {activeIndex === 1 && <MockupTranscriptionView />}
        {activeIndex === 2 && <MockupChainView />}
        {activeIndex === 3 && <MockupCryptoView />}
      </div>
    </div>
  );
}
