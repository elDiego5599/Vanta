import { memo } from 'react';
import { Reveal } from './Reveal';
import { Title25D } from './Title25D';
import { PremiumEdgeWrapper } from './PremiumEdgeWrapper';
import { MagneticButton } from './MagneticButton';

export const MegaCTA = memo(function MegaCTA() {
  return (
    <section id="privacidad" className="relative z-10 px-6 lg:px-12 pt-[100px] pb-[160px]">
      <div className="max-w-[1400px] mx-auto">
        <Reveal dir="up">
          <PremiumEdgeWrapper rounded="rounded-[32px]">
            <div className="p-14 md:p-24 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 bg-[var(--card-bg)] rounded-[31px]">
              <div>
                <Title25D text1="El análisis" text2="comienza aquí." className="text-[clamp(3.5rem,6vw,5.5rem)]" />
                <p className="text-[var(--text-muted)] text-sm md:text-base font-mono max-w-xl leading-relaxed">
                  Sin suscripciones recurrentes. Compra única para la herramienta forense definitiva.
                </p>
              </div>
              <div className="flex flex-col items-start lg:items-center gap-4 mt-6 lg:mt-0 shrink-0">
                <MagneticButton>
                  <button className="px-10 py-5 text-sm font-bold tracking-widest uppercase rounded-full bg-[var(--btn-bg)] text-[var(--btn-text)] transition-transform hover:scale-105">
                    Descargar Vanta
                  </button>
                </MagneticButton>
                <span className="text-xs text-[var(--text-muted)] font-mono tracking-widest uppercase">
                  Mac & Windows
                </span>
              </div>
            </div>
          </PremiumEdgeWrapper>
        </Reveal>
      </div>
    </section>
  );
});