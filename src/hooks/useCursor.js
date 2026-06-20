import { useEffect, useState } from 'react';
import { useMotionValue } from 'framer-motion';

export function useCursor() {
  const cursorX = useMotionValue(-100);
  const cursorY = useMotionValue(-100);
  const [variant, setVariant] = useState('default');

  useEffect(() => {
    const move = (e) => { cursorX.set(e.clientX); cursorY.set(e.clientY); };
    const over = (e) => {
      const el = e.target;
      if (el.closest('button, a, [role="button"], [data-cursor="button"]')) setVariant('button');
      else setVariant('default');
    };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseover', over);
    return () => { window.removeEventListener('mousemove', move); window.removeEventListener('mouseover', over); };
  }, [cursorX, cursorY]);

  return { cursorX, cursorY, variant };
}