import { memo } from 'react';
import { Reveal } from './Reveal';
import { Title25D } from './Title25D';
import { VantaLogo } from './VantaLogo';
import { MagneticButton } from './MagneticButton';

export const Hero = memo(function Hero() {
  return (
    <section className="relative z-10 min-h-screen flex flex-col justify-between pt-32 pb-8 px-6 lg:px-12 max-w-[1400px] mx-auto">
      <div className="flex-1 flex flex-col lg:flex-row items-center justify-between w-full gap-16 lg:gap-8">
        <Reveal dir="left" className="flex flex-col items-start w-full lg:w-1/3">
          <Title25D text1="Inteligencia" text2="Forense." />
          <p className="text-base text-[var(--text-muted)] max-w-sm mb-8 leading-relaxed font-mono">
            Motor Whisper embebido y cadena de custodia inmutable. Totalmente Offline.
          </p>
          <MagneticButton>
            <button className="px-8 py-4 text-xs font-bold tracking-widest uppercase rounded-full border border-[var(--border-strong)] text-[var(--text-main)] bg-[var(--glass-bg)] backdrop-blur-md transition-all hover:bg-[var(--glass-hover)]">
              Para Mac / Win
            </button>
          </MagneticButton>
        </Reveal>

        <Reveal dir="up" className="flex justify-center relative w-full lg:w-1/3">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[250px] h-[250px] bg-[var(--text-main)] opacity-10 blur-[80px] rounded-full pointer-events-none" />
          <div className="w-48 h-48 md:w-64 md:h-64 relative z-10 drop-shadow-2xl text-[var(--text-main)]">
            <VantaLogo className="w-full h-full" />
          </div>
        </Reveal>

        <Reveal dir="right" className="flex flex-col items-start lg:items-end w-full lg:w-1/3 text-left lg:text-right">
          <div className="flex flex-col gap-8 font-mono text-xs tracking-[0.15em] text-[var(--text-muted)] uppercase">
            <div>
              <span className="text-[var(--text-main)] font-bold block mb-1">Cifrado de Reposo</span>
              AES-256 Estándar Militar
            </div>
            <div>
              <span className="text-[var(--text-main)] font-bold block mb-1">Cadena de Custodia</span>
              Hashing SHA-256 Local
            </div>
            <div>
              <span className="text-[var(--text-main)] font-bold block mb-1">Transcripción</span>
              Zero Latency IA Local
            </div>
          </div>
        </Reveal>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1, duration: 1 }}
        className="w-full pt-8 border-t border-[var(--border-subtle)] overflow-hidden shrink-0 mt-10"
      >
        <div className="flex gap-12 text-[11px] tracking-[0.2em] font-mono text-[var(--text-muted)] uppercase whitespace-nowrap opacity-80">
          <span>Diseñado para Operaciones Encubiertas</span>
          <span>•</span>
          <span>Zero Telemetría</span>
          <span>•</span>
          <span>Cumplimiento Forense Estricto</span>
          <span>•</span>
          <span>Independencia de Nube Absoluta</span>
          <span className="hidden md:inline">•</span>
          <span className="hidden md:inline">Whisper AI Native</span>
        </div>
      </motion.div>
    </section>
  );
});