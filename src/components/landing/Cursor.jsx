import { useEffect, useState } from 'react';
import { motion, useMotionValue } from 'framer-motion';

export default function CustomCursor() {
  const cursorX = useMotionValue(-100);
  const cursorY = useMotionValue(-100);
  const [variant, setVariant] = useState('default');

  useEffect(() => {
    const move = (e) => {
      cursorX.set(e.clientX);
      cursorY.set(e.clientY);
    };
    const over = (e) => {
      const el = e.target;
      if (el.closest('button, a, [role="button"], [data-cursor="button"]')) {
        setVariant('button');
      } else {
        setVariant('default');
      }
    };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseover', over);
    return () => {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseover', over);
    };
  }, [cursorX, cursorY]);

  const variants = {
    default: {
      width: 40, height: 40,
      backgroundColor: 'transparent',
      x: '-50%', y: '-50%',
    },
    button: {
      width: 8, height: 8,
      backgroundColor: 'var(--page-text)',
      x: '-50%', y: '-50%',
      borderRadius: '50%',
    },
  };

  return (
    <motion.div
      style={{ x: cursorX, y: cursorY }}
      animate={variants[variant]}
      transition={{ duration: 0.1, ease: 'easeOut' }}
      className="fixed top-0 left-0 pointer-events-none z-[9999] flex items-center justify-center origin-center hidden md:flex mix-blend-difference"
    >
      <motion.div
        animate={{ opacity: variant === 'default' ? 1 : 0, scale: variant === 'default' ? 1 : 0 }}
        transition={{ duration: 0.1 }}
        className="absolute inset-0 flex items-center justify-center gap-[3px]"
      >
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            animate={variant === 'default' ? { height: ['6px', '20px', '6px'] } : { height: '6px' }}
            transition={{ repeat: Infinity, duration: 0.6, delay: i * 0.15, ease: 'easeInOut' }}
            className="w-[2.5px] bg-white rounded-full"
          />
        ))}
      </motion.div>
    </motion.div>
  );
}
