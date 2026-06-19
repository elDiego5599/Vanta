import { useRef } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';
import { ULTRA_EASE } from './styles';
import { Ico } from './Icons';

export function Reveal({ children, dir = 'left', delay = 0, className = '' }) {
  const xOffset = dir === 'left' ? -40 : dir === 'right' ? 40 : 0;
  const yOffset = dir === 'up' ? 40 : dir === 'down' ? -40 : 0;
  return (
    <motion.div
      initial={{ opacity: 0, x: xOffset, y: yOffset, filter: 'blur(8px)' }}
      whileInView={{ opacity: 1, x: 0, y: 0, filter: 'blur(0px)' }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 1, ease: ULTRA_EASE, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function MagneticButton({ children, className = '' }) {
  const ref = useRef(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 150, damping: 15, mass: 0.1 });
  const springY = useSpring(y, { stiffness: 150, damping: 15, mass: 0.1 });

  const handleMouse = (e) => {
    const { left, top, width, height } = ref.current.getBoundingClientRect();
    x.set((e.clientX - (left + width / 2)) * 0.2);
    y.set((e.clientY - (top + height / 2)) * 0.2);
  };
  const handleLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouse}
      onMouseLeave={handleLeave}
      style={{ x: springX, y: springY }}
      className={`inline-block ${className}`}
    >
      {children}
    </motion.div>
  );
}

export function Title25D({ text1, text2, className = 'text-[clamp(3.5rem,5vw,5.5rem)]' }) {
  return (
    <div className="mb-6 w-fit cursor-none">
      <h1 className={`font-extrabold leading-[0.95] tracking-tighter text-[var(--text-main)] text-25d ${className}`}>
        {text1} <br />
        <span className="chrome-text pb-2">{text2}</span>
      </h1>
    </div>
  );
}

export function PremiumEdgeWrapper({ children, className = '', rounded = 'rounded-[24px]' }) {
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
}

export function ThemeToggle({ theme, setTheme }) {
  const toggle = () => {
    if (theme === 'dark') setTheme('light');
    else if (theme === 'light') setTheme('system');
    else setTheme('dark');
  };

  return (
    <MagneticButton>
      <button
        onClick={toggle}
        className="p-2.5 rounded-full border border-[var(--border-strong)] bg-[var(--glass-bg)] hover:bg-[var(--glass-hover)] transition-colors text-[var(--text-muted)] hover:text-[var(--text-main)]"
        data-cursor="button"
        aria-label="Cambiar Tema"
      >
        {theme === 'dark' && Ico.moon}
        {theme === 'light' && Ico.sun}
        {theme === 'system' && Ico.system}
      </button>
    </MagneticButton>
  );
}
