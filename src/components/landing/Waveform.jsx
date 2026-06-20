import { memo, useMemo } from 'react';
import { motion } from 'framer-motion';

const BARS = useMemo(() =>
  Array.from({ length: 50 }, (_, i) =>
    6 + Math.abs(Math.sin(i * 0.52 + 1.3) * 40) + Math.abs(Math.sin(i * 0.21) * 18)
  ), []);

export const Waveform = memo(function Waveform() {
  return (
    <div className="flex items-center gap-[3px] h-10 overflow-hidden">
      {BARS.map((h, i) => (
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
});