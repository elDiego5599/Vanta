import { memo } from 'react';
import { VantaLogo } from './Icons';
import { Reveal, MagneticButton, Title25D } from './Primitives';

function HeroBase() {
  return (
    <section id="main-content" className="relative z-10 min-h-screen flex flex-col justify-center pt-24 pb-8 px-6 lg:px-12 max-w-[1200px] xl:max-w-[1300px] mx-auto overflow-hidden">
      <div className="grid grid-cols-1 lg:grid-cols-3 items-center w-full gap-10">
        <Reveal dir="left" className="flex flex-col items-start justify-center">
          <Title25D text1="Inteligencia" text2="Forense" className="text-[clamp(3.5rem,5vw,5rem)] leading-[0.9]" />
          <div className="flex gap-4 mt-8">
            <MagneticButton>
              <button className="px-6 py-3.5 text-[11px] font-bold tracking-widest uppercase rounded-full text-[var(--btn-text)] bg-[var(--btn-bg)] transition-transform hover:scale-105 outline-none focus-visible:ring-2 focus-visible:ring-white">
                Descargar
              </button>
            </MagneticButton>
            <MagneticButton>
              <button className="px-6 py-3.5 text-[11px] font-bold tracking-widest uppercase rounded-full border border-[var(--border-strong)] text-[var(--text-main)] bg-transparent hover:bg-white/5 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-white">
                Licencias
              </button>
            </MagneticButton>
          </div>
        </Reveal>
        <Reveal dir="up" className="flex justify-center items-center relative h-full">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[250px] h-[250px] bg-[var(--text-main)] opacity-10 blur-[80px] rounded-full pointer-events-none" />
          <div className="w-56 h-56 md:w-64 md:h-64 relative z-10 drop-shadow-[0_0_20px_rgba(255,255,255,0.05)] text-[var(--text-main)]">
            <VantaLogo className="w-full h-full" />
          </div>
        </Reveal>
        <Reveal dir="right" className="flex flex-col items-start lg:items-end justify-center">
          <div className="flex flex-col gap-6 font-mono text-[11px] md:text-[12px] tracking-[0.15em] text-[var(--text-muted)] uppercase text-left">
            <p className="hover:text-[var(--text-main)] transition-colors cursor-default">PARA OPERACIONES ENCUBIERTAS</p>
            <p className="hover:text-[var(--text-main)] transition-colors cursor-default">MOTOR WHISPER AI NATIVO</p>
            <p className="hover:text-[var(--text-main)] transition-colors cursor-default">CUMPLIMIENTO FORENSE ESTRICTO</p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

export const Hero = memo(HeroBase);
