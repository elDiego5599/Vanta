import { memo } from 'react';
import { motion } from 'framer-motion';
import { ULTRA_EASE } from '../../constants';

export const Reveal = memo(function Reveal({ children, dir = 'left', delay = 0, className = '' }) {
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
});