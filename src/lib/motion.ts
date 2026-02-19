/**
 * Shared motion configuration for Framer Motion animations.
 * All durations and easings align with the motion tokens in index.css.
 */

export const motionConfig = {
  // Standard element entrance (fade + slight rise)
  enter: {
    duration: 0.2,
    ease: [0, 0, 0.2, 1] as const,
  },
  // Standard element exit
  exit: {
    duration: 0.15,
    ease: [0.4, 0, 1, 1] as const,
  },
  // Drawer/panel slide transitions
  slide: {
    duration: 0.25,
    ease: [0.4, 0, 0.2, 1] as const,
  },
  // Micro-interactions (icon swaps, badges)
  micro: {
    duration: 0.12,
  },
  // Collapse/expand (height animations)
  collapse: {
    duration: 0.18,
    ease: [0.4, 0, 0.2, 1] as const,
  },
}

// View transition variants (fade + subtle Y offset)
export const viewVariants = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -4 },
}

// Modal/dialog variants (fade + scale)
export const modalVariants = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 },
}

// Backdrop variants (fade only)
export const backdropVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
}

// Stagger container for lists/grids
export const staggerContainer = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.05,
    },
  },
}

// Stagger item (fade + rise)
export const staggerItem = {
  hidden: { opacity: 0, y: 12 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.2,
      ease: [0, 0, 0.2, 1] as const,
    },
  },
}
