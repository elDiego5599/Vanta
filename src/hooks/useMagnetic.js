import { useRef } from 'react';
import { useMotionValue, useSpring } from 'framer-motion';

export function useMagnetic(strength = 0.2, springConfig = { stiffness: 150, damping: 15, mass: 0.1 }) {
  const ref = useRef(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, springConfig);
  const springY = useSpring(y, springConfig);

  const handleMouse = (e) => {
    const { left, top, width, height } = ref.current.getBoundingClientRect();
    x.set((e.clientX - (left + width / 2)) * strength);
    y.set((e.clientY - (top + height / 2)) * strength);
  };
  const handleLeave = () => { x.set(0); y.set(0); };

  return { ref, springX, springY, handleMouse, handleLeave };
}