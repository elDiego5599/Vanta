import { useRef, type ReactNode, type MouseEvent as ReactMouseEvent } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';
import { cn } from '../../lib/utils';
import { getRevealVariants, transition } from '../../lib/motion';
import { IconSun, IconMoon, IconSystem } from './Icons';

type RevealDirection = 'left' | 'right' | 'up' | 'down';

interface RevealProps {
  children: ReactNode;
  dir?: RevealDirection;
  delay?: number;
  className?: string;
}

export function Reveal({ children, dir = 'left', delay = 0, className = '' }: RevealProps) {
  const revealVariants = getRevealVariants(dir);
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      variants={revealVariants}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ ...transition, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

interface MagneticButtonProps {
  children: ReactNode;
  className?: string;
}

export function MagneticButton({ children, className = '' }: MagneticButtonProps) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 150, damping: 15, mass: 0.1 });
  const springY = useSpring(y, { stiffness: 150, damping: 15, mass: 0.1 });

  const handleMouse = (e: ReactMouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const { left, top, width, height } = ref.current.getBoundingClientRect();
    x.set((e.clientX - (left + width / 2)) * 0.2);
    y.set((e.clientY - (top + height / 2)) * 0.2);
  };

  const handleLeave = () => { x.set(0); y.set(0); };

  return (
    <div ref={ref} onMouseMove={handleMouse} onMouseLeave={handleLeave} className={cn('relative inline-flex items-center justify-center', className)}>
      <motion.div style={{ x: springX, y: springY }} className="w-full h-full">
        {children}
      </motion.div>
    </div>
  );
}

interface Title25DProps {
  text1: string;
  text2: string;
  className?: string;
  as?: 'h1' | 'h2' | 'h3';
}

export function Title25D({ text1, text2, className = 'text-[clamp(3rem,5vw,5.5rem)]', as: Tag = 'h1' }: Title25DProps) {
  return (
    <div className="mb-6 w-fit">
      <Tag className={cn('font-extrabold tracking-tighter text-[var(--text-main)] text-25d', className)}>
        {text1} <br />
        <span className="chrome-text pb-2 block mt-1">{text2}</span>
      </Tag>
    </div>
  );
}

interface PremiumEdgeWrapperProps {
  children: ReactNode;
  className?: string;
  rounded?: string;
  glowColor?: string;
  mainColor?: string;
}

export function PremiumEdgeWrapper({ children, className = '', rounded = 'rounded-[24px]', glowColor, mainColor }: PremiumEdgeWrapperProps) {
  const cGlow = glowColor || 'var(--glow-edge)';
  const cMain = mainColor || 'var(--text-main)';

  return (
    <div className={cn('relative group', className, 'p-[1px]')}>
      <div className={cn('absolute inset-0', rounded, 'overflow-hidden z-0')}>
        <div
          className="absolute top-1/2 left-1/2 w-[150%] aspect-square animate-rotate-gradient rounded-full opacity-60"
          style={{
            background: `conic-gradient(from 0deg, transparent 0%, transparent 35%, ${cGlow} 45%, ${cMain} 50%, ${cGlow} 55%, transparent 65%, transparent 100%)`,
            filter: 'blur(10px)'
          }}
        />
      </div>
      <div className={cn('absolute inset-[1px] bg-[var(--card-bg)]', rounded, 'z-10 transition-colors duration-700 shadow-[inset_0_1px_1px_var(--border-subtle)]')} />
      <div className="relative z-20 h-full">{children}</div>
    </div>
  );
}

type Theme = 'dark' | 'light' | 'system';

interface ThemeToggleProps {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

export function ThemeToggle({ theme, setTheme }: ThemeToggleProps) {
  const toggle = () => {
    if (theme === 'dark') setTheme('light');
    else if (theme === 'light') setTheme('system');
    else setTheme('dark');
  };

  return (
    <MagneticButton>
      <button
        onClick={toggle}
        className="p-2.5 rounded-full border border-[var(--border-strong)] bg-[var(--glass-bg)] hover:bg-[var(--glass-hover)] transition-colors text-[var(--text-muted)] hover:text-[var(--text-main)] outline-none focus-visible:ring-2 focus-visible:ring-white/50"
        aria-label="Cambiar Tema"
      >
        {theme === 'dark' && <IconMoon />}
        {theme === 'light' && <IconSun />}
        {theme === 'system' && <IconSystem />}
      </button>
    </MagneticButton>
  );
}

export type { Theme };
