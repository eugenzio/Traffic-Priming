/**
 * Motion Design Tokens
 * Research-grade animation system with reduced-motion support
 */

export const motion = {
  // Duration (ms)
  dur: {
    xfast: 120,
    fast: 200,
    base: 280,
    slow: 380,
    xslow: 600,
  },

  // Easing curves
  ease: {
    in: [0.32, 0, 0.67, 0] as const,
    out: [0.33, 1, 0.68, 1] as const,
    inOut: [0.65, 0, 0.35, 1] as const,
  },

  // Spring presets
  spring: {
    type: 'spring' as const,
    stiffness: 320,
    damping: 28,
    mass: 0.7,
  },

  overlaySpring: {
    type: 'spring' as const,
    stiffness: 260,
    damping: 30,
    mass: 0.8,
  },

  // Stagger delays
  stagger: {
    small: 0.06,
    medium: 0.12,
  },
} as const;

/**
 * Page transition variants
 */
export const pageVariants = {
  initial: {
    opacity: 0,
    y: 16,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: motion.dur.base / 1000,
      ease: motion.ease.out,
    },
  },
  exit: {
    opacity: 0,
    y: 8,
    transition: {
      duration: motion.dur.fast / 1000,
      ease: motion.ease.in,
    },
  },
};

/**
 * Reduced motion fallback - opacity only
 */
export const pageVariantsReduced = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: { duration: motion.dur.base / 1000 },
  },
  exit: {
    opacity: 0,
    transition: { duration: motion.dur.fast / 1000 },
  },
};

/**
 * Card/component fade-up entrance
 */
export const fadeUpVariants = {
  initial: {
    opacity: 0,
    y: 8,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: motion.dur.base / 1000,
      ease: motion.ease.out,
    },
  },
};

export const fadeUpVariantsReduced = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: { duration: motion.dur.base / 1000 },
  },
};

/**
 * Staggered container
 */
export const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: motion.stagger.small,
    },
  },
};

export const staggerContainerMedium = {
  animate: {
    transition: {
      staggerChildren: motion.stagger.medium,
    },
  },
};
