import { memo, useRef, useEffect } from 'react';
import { motion, useInView } from 'framer-motion';
import { Ico } from './Icons';

const ICON_MAP = { shield: Ico.shield(), brain: Ico.brain('#3b82f6'), link: Ico.link('#22c55e'), lock: Ico.lock('#a78bfa') };

export const ScrollFeature = memo(function ScrollFeature({ feature, index, setActiveIndex }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { margin: '-45% 0px -45% 0px' });

  useEffect(() => { if (isInView) setActiveIndex(index); }, [isInView, index, setActiveIndex]);

  return (
    <div ref={ref} className="min-h-[70vh] flex flex-col justify-center px-4 lg:pr-16">
      <div className={`transition-all duration-700 ${isInView ? 'opacity-100 scale-100' : 'opacity-30 scale-95'}`}>
        <div className="w-14 h-14 rounded-2xl border border-[var(--border-subtle)] bg-[var(--glass-bg)] flex items-center justify-center mb-6 shadow-[inset_0_1px_1px_var(--border-subtle)] text-[var(--text-main)]">
          {ICON_MAP[feature.icon]}
        </div>
        <h3 className="text-4xl font-extrabold text-[var(--text-main)] mb-4 tracking-tight">{feature.title}</h3>
        <p className="text-xl text-[var(--text-muted)] leading-relaxed font-mono max-w-lg">{feature.desc}</p>
      </div>
    </div>
  );
});