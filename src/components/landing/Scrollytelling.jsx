import { useRef, useEffect, useState } from 'react';
import { motion, useInView } from 'framer-motion';
import { Ico } from './Icons';
import DetailedMockupUI from './MockupUI';
import { PremiumEdgeWrapper } from './Primitives';

function ScrollFeature({ feature, index, setActiveIndex }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { margin: '-45% 0px -45% 0px' });

  useEffect(() => {
    if (isInView) setActiveIndex(index);
  }, [isInView, index, setActiveIndex]);

  return (
    <div ref={ref} className="min-h-[70vh] flex flex-col justify-center px-4 lg:pr-16">
      <div className={`transition-all duration-700 ${isInView ? 'opacity-100 scale-100' : 'opacity-30 scale-95'}`}>
        <div className="w-14 h-14 rounded-2xl border border-[var(--border-subtle)] bg-[var(--glass-bg)] flex items-center justify-center mb-6 shadow-[inset_0_1px_1px_var(--border-subtle)] text-[var(--text-main)]">
          {feature.icon}
        </div>
        <h3 className="text-4xl font-extrabold text-[var(--text-main)] mb-4 tracking-tight">
          {feature.title}
        </h3>
        <p className="text-xl text-[var(--text-muted)] leading-relaxed font-mono max-w-lg">
          {feature.desc}
        </p>
      </div>
    </div>
  );
}

const FEATURES = [
  { id: 0, icon: Ico.shield(), title: '100% Offline', desc: 'Su máquina es el único contenedor. No hay llamadas a APIs externas ni telemetría oculta.' },
  { id: 1, icon: Ico.brain(), title: 'Transcripción Local', desc: 'Motor Whisper optimizado ejecutando diarización en tiempo real directamente en su CPU/GPU.' },
  { id: 2, icon: Ico.link(), title: 'Cadena de Custodia', desc: 'Protegido con hashing SHA-256 automático en el momento exacto de la importación forense.' },
  { id: 3, icon: Ico.lock(), title: 'Cifrado de Reposo', desc: 'Todos los casos son guardados bajo estándar militar AES-256. Nadie más puede acceder a su evidencia.' },
];

export default function ScrollytellingSection() {
  const [activeIndex, setActiveIndex] = useState(0);

  return (
    <section id="docs" className="relative z-10 w-full max-w-[1800px] mx-auto px-6 lg:pl-16 lg:pr-0 pt-20 pb-[100px]">
      <div className="flex flex-col lg:flex-row relative items-start gap-10 lg:gap-0">
        <div className="w-full lg:w-4/12 relative z-20 pb-[30vh]">
          {FEATURES.map((feat, i) => (
            <ScrollFeature key={feat.id} feature={feat} index={i} setActiveIndex={setActiveIndex} />
          ))}
        </div>
        <div className="w-full lg:w-8/12 sticky top-[10vh] h-[60vh] lg:h-[80vh] flex items-center justify-end z-10">
          <motion.div
            className="relative w-full max-w-[1100px] lg:translate-x-[15%]"
            animate={{ scale: 1.05 }}
            transition={{ type: 'spring', stiffness: 50, damping: 20 }}
          >
            <PremiumEdgeWrapper rounded="rounded-[24px]">
              <div className="relative aspect-[16/10]">
                <DetailedMockupUI activeIndex={activeIndex} />
              </div>
            </PremiumEdgeWrapper>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
