import { memo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Reveal, MagneticButton, Title25D, PremiumEdgeWrapper } from './Primitives';

function MegaCTABase() {
  const navigate = useNavigate()
  const goDownload = useCallback(() => navigate('/download'), [navigate])
  return (
    <section id="privacidad" className="relative z-10 px-6 lg:px-12 pt-[100px] pb-[160px]">
      <div className="max-w-[1200px] xl:max-w-[1300px] mx-auto">
        <Reveal dir="up">
          <div className="max-w-[900px] mx-auto">
            <PremiumEdgeWrapper rounded="rounded-[32px]">
              <div className="p-12 md:p-20 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 bg-[var(--card-bg)] rounded-[31px]">
              <div>
                <Title25D as="h2" text1="El análisis" text2="comienza aquí." className="text-[clamp(3rem,5vw,4.5rem)] leading-none" />
                <p className="text-[var(--text-muted)] text-[15px] font-mono max-w-lg leading-relaxed mt-4">
                  Sin suscripciones recurrentes. Compra única para la herramienta forense definitiva.
                </p>
              </div>
              <div className="flex flex-col items-start lg:items-center gap-4 mt-6 lg:mt-0 shrink-0">
                <MagneticButton>
                  <button
                    onClick={goDownload}
                    className="px-10 py-5 text-[13px] font-bold tracking-widest uppercase rounded-full bg-[var(--btn-bg)] text-[var(--btn-text)] transition-transform hover:scale-105 outline-none focus-visible:ring-4 focus-visible:ring-[var(--border-strong)]"
                  >
                    Descargar Vanta
                  </button>
                </MagneticButton>
                <span className="text-[11px] text-[var(--text-muted)] font-mono tracking-widest uppercase">
                  Mac, Windows & Linux
                </span>
              </div>
            </div>
            </PremiumEdgeWrapper>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

export const MegaCTA = memo(MegaCTABase);
