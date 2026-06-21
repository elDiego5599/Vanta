import { useState, memo, type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';
import { spring } from '../../lib/motion';
import { IconShield, IconBrain, IconLink, IconLock } from './Icons';
import DetailedMockupUI from './MockupUI';
import { PremiumEdgeWrapper } from './Primitives';

interface Feature {
  id: number;
  icon: ReactNode;
  title: string;
  desc: string;
}

interface ScrollColor {
  glow: string;
  main: string;
}

const FEATURE_COUNT = 4;

const FEATURES: Feature[] = [
  { id: 0, icon: <IconShield />, title: '100% Offline', desc: 'Su máquina es el único contenedor. No hay llamadas a APIs externas ni telemetría oculta.' },
  { id: 1, icon: <IconBrain color="#3b82f6" />, title: 'Transcripción Local', desc: 'Motor Whisper optimizado ejecutando diarización en tiempo real directamente en su CPU/GPU.' },
  { id: 2, icon: <IconLink color="#22c55e" />, title: 'Cadena de Custodia', desc: 'Protegido con hashing SHA-256 automático en el momento exacto de la importación forense.' },
  { id: 3, icon: <IconLock color="#a78bfa" />, title: 'Cifrado de Reposo', desc: 'Todos los casos son guardados bajo estándar militar AES-256. Nadie más puede acceder a su evidencia.' },
];

const SCROLL_COLORS: ScrollColor[] = [
  { glow: 'rgba(255,255,255,0.3)', main: '#ffffff' },
  { glow: 'rgba(59,130,246,0.4)', main: '#3b82f6' },
  { glow: 'rgba(34,197,94,0.4)', main: '#22c55e' },
  { glow: 'rgba(168,85,247,0.4)', main: '#a78bfa' },
];

interface ScrollFeatureProps {
  feature: Feature;
  index: number;
  activeIndex: number;
  setActiveIndex: (index: number) => void;
}

function ScrollFeature({ feature, index, activeIndex, setActiveIndex }: ScrollFeatureProps) {
  const isActive = activeIndex === index;

  return (
    <motion.div
      onViewportEnter={() => setActiveIndex(index)}
      viewport={{ margin: '-45% 0px -45% 0px' }}
      className="min-h-[70vh] flex flex-col justify-center px-4 lg:pr-8"
    >
      <div className={cn('transition-all duration-700 origin-left', isActive ? 'opacity-100 scale-100' : 'opacity-30 scale-95')}>
        <div className="w-12 h-12 rounded-2xl border border-[var(--border-subtle)] bg-[var(--glass-bg)] flex items-center justify-center mb-5 shadow-[inset_0_1px_1px_var(--border-subtle)] text-[var(--text-main)]">
          {feature.icon}
        </div>
        <h3 className="text-3xl font-extrabold text-[var(--text-main)] mb-3 tracking-tight">
          {feature.title}
        </h3>
        <p className="text-[15px] text-[var(--text-muted)] leading-relaxed font-mono max-w-[400px]">
          {feature.desc}
        </p>
      </div>
    </motion.div>
  );
}

function ScrollytellingSection() {
  const [activeIndex, setActiveIndex] = useState(0);
  const safeIndex = Math.min(Math.max(activeIndex, 0), FEATURE_COUNT - 1);
  const activeColors: ScrollColor = SCROLL_COLORS[safeIndex] ?? SCROLL_COLORS[0]!;

  return (
    <section id="docs" className="relative z-10 w-full max-w-[1200px] xl:max-w-[1400px] mx-auto px-6 lg:px-12 pt-20 pb-[100px]">
      <div className="flex flex-col lg:flex-row relative items-start gap-10 lg:gap-0">
        <div className="w-full lg:w-[35%] relative z-20 pb-[30vh]">
          {FEATURES.map((feat, i) => (
            <ScrollFeature key={feat.id} feature={feat} index={i} activeIndex={safeIndex} setActiveIndex={setActiveIndex} />
          ))}
        </div>
        <div className="w-full lg:w-[65%] lg:sticky lg:top-[10vh] h-[60vh] lg:h-[80vh] flex items-center justify-end z-10">
          <motion.div
            className="relative w-full lg:w-[115%] xl:w-[125%] lg:translate-x-[8%]"
            animate={{ scale: 1.02 }}
            transition={spring}
          >
            <PremiumEdgeWrapper rounded="rounded-[24px]" glowColor={activeColors.glow} mainColor={activeColors.main}>
              <div className="relative aspect-[16/10] md:aspect-[16/11]">
                <DetailedMockupUI activeIndex={activeIndex} />
              </div>
            </PremiumEdgeWrapper>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

export default memo(ScrollytellingSection);
