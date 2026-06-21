import { useEffect, useState, memo } from 'react';
import { motion, useMotionValue } from 'framer-motion';
import { cursorTransition } from '../../lib/motion';

const hasFinePointer =
  typeof window !== 'undefined' && window.matchMedia('(pointer: fine)').matches;

type CursorVariant = 'default' | 'button';

function CustomCursor() {
  const cursorX = useMotionValue(-100);
  const cursorY = useMotionValue(-100);
  const [variant, setVariant] = useState<CursorVariant>('default');

  useEffect(() => {
    if (!hasFinePointer) return;

    document.body.classList.add('hide-native-cursor');

    let rafId: number | null = null;

    const move = (e: Event) => {
      if (rafId != null) return;
      rafId = requestAnimationFrame(() => {
        const mouse = e as MouseEvent;
        cursorX.set(mouse.clientX);
        cursorY.set(mouse.clientY);
        rafId = null;
      });
    };

    const over = (e: Event) => {
      const el = e.target as HTMLElement;
      if (el.closest('button, a, [role="button"]')) setVariant('button');
      else setVariant('default');
    };

    window.addEventListener('mousemove', move, { passive: true });
    window.addEventListener('mouseover', over, { passive: true });

    return () => {
      document.body.classList.remove('hide-native-cursor');
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseover', over);
      if (rafId != null) cancelAnimationFrame(rafId);
    };
  }, [cursorX, cursorY]);

  if (!hasFinePointer) return null;

  const variants = {
    default: { width: 12, height: 12, x: '-50%', y: '-50%', backgroundColor: '#ffffff', border: '1px solid transparent' },
    button: { width: 36, height: 36, x: '-50%', y: '-50%', backgroundColor: 'transparent', border: '1px solid #ffffff' },
  };

  return (
    <motion.div
      style={{ x: cursorX, y: cursorY, mixBlendMode: 'difference' }}
      animate={variants[variant]}
      transition={cursorTransition}
      className="fixed top-0 left-0 pointer-events-none z-[9999] flex items-center justify-center origin-center hidden md:flex rounded-full"
    />
  );
}

export default memo(CustomCursor);
