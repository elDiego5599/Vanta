import { memo } from 'react';
import { motion } from 'framer-motion';

export const PremiumEdgeWrapper = memo(function PremiumEdgeWrapper({ children, className = '', rounded = 'rounded-[24px]' }) {
  return (
    <div className={`relative group ${className} p-[1px]`}>
      <div className={`absolute -inset-[1px] ${rounded} overflow-hidden blur-[12px] opacity-30 transition-opacity duration-700 -z-10`}>
        <div className="absolute top-1/2 left-1/2 w-[200%] aspect-square -translate-x-1/2 -translate-y-1/2">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 6, ease: 'linear' }}
            className="w-full h-full rounded-full bg-[conic-gradient(from_0deg,transparent_0%,transparent_30%,var(--glow-edge)_45%,var(--text-main)_50%,var(--glow-edge)_55%,transparent_70%,transparent_100%)]"
          />
        </div>
      </div>
      <div className={`absolute -inset-[1px] ${rounded} overflow-hidden z-0`}>
        <div className="absolute top-1/2 left-1/2 w-[200%] aspect-square -translate-x-1/2 -translate-y-1/2">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 6, ease: 'linear' }}
            className="w-full h-full rounded-full bg-[conic-gradient(from_0deg,transparent_0%,transparent_40%,rgba(255,255,255,0.2)_48%,var(--text-main)_50%,rgba(255,255,255,0.2)_52%,transparent_60%,transparent_100%)]"
          />
        </div>
      </div>
      <div className={`absolute inset-[1px] bg-[var(--card-bg)] ${rounded} z-10 transition-colors duration-700 shadow-[inset_0_1px_1px_var(--border-subtle)]`} />
      <div className="relative z-20 h-full">{children}</div>
    </div>
  );
});