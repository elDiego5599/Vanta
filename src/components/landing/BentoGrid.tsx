import { memo } from 'react';
import { IconBrain, IconLock, IconUpload } from './Icons';
import { Reveal, PremiumEdgeWrapper } from './Primitives';

const BENTO_CARDS = [
  { icon: <IconBrain />, title: 'Hardware Optimizado', desc: 'Diarización y procesamiento Whisper usando toda la potencia de Apple Silicon y GPUs dedicadas.' },
  { icon: <IconLock />, title: 'Bóveda Criptográfica', desc: 'Volúmenes locales sellados bajo AES-256. Su evidencia permanece completamente inalcanzable.' },
  { icon: <IconUpload />, title: 'Flujo Forense', desc: 'Arraste formatos estándar y exporte documentos listos para su uso judicial inmediato.' },
];

function BentoGridBase() {
  return (
    <section id="caracteristicas" className="relative z-10 px-6 lg:px-12 py-16">
      <div className="max-w-[1200px] xl:max-w-[1300px] mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
        {BENTO_CARDS.map((card, i) => (
          <Reveal key={i} dir="up" delay={(i + 1) * 0.1}>
            <PremiumEdgeWrapper rounded="rounded-2xl" className="h-full">
              <div className="p-8 h-full flex flex-col justify-between min-h-[200px]">
                <div className="text-[var(--text-main)] mb-4">{card.icon}</div>
                <div>
                  <h3 className="text-xl font-bold text-[var(--text-main)] tracking-tight mb-2">{card.title}</h3>
                  <p className="text-[13px] leading-relaxed text-[var(--text-muted)] font-mono">{card.desc}</p>
                </div>
              </div>
            </PremiumEdgeWrapper>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

export const BentoGrid = memo(BentoGridBase);
