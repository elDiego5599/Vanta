import type { Variants, Transition } from 'framer-motion'

export const ULTRA_EASE: [number, number, number, number] = [0.16, 1, 0.3, 1]

export const transition: Transition = {
  duration: 1,
  ease: ULTRA_EASE,
}

export const spring: Transition = {
  type: 'spring',
  stiffness: 100,
  damping: 20,
}

export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0 },
}

export const fadeInDown: Variants = {
  hidden: { opacity: 0, y: -40 },
  visible: { opacity: 1, y: 0 },
}

export const fadeInLeft: Variants = {
  hidden: { opacity: 0, x: -40 },
  visible: { opacity: 1, x: 0 },
}

export const fadeInRight: Variants = {
  hidden: { opacity: 0, x: 40 },
  visible: { opacity: 1, x: 0 },
}

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
}

export function getRevealVariants(dir: 'left' | 'right' | 'up' | 'down'): Variants {
  switch (dir) {
    case 'left': return fadeInLeft
    case 'right': return fadeInRight
    case 'up': return fadeInUp
    case 'down': return fadeInDown
  }
}
