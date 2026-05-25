import { Variants } from 'framer-motion';

// Page transitions
export const pageVariants: Variants = {
  initial: {
    opacity: 0,
    y: 20,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: 'easeOut',
    },
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: {
      duration: 0.3,
    },
  },
};

// Stagger container for list items
export const containerVariants: Variants = {
  initial: {
    opacity: 0,
  },
  animate: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

// Individual item animation
export const itemVariants: Variants = {
  initial: {
    opacity: 0,
    y: 20,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: 'easeOut',
    },
  },
};

// Hero section animations
export const heroTitleVariants: Variants = {
  initial: {
    opacity: 0,
    y: 30,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: 'easeOut',
    },
  },
};

export const heroSubtitleVariants: Variants = {
  initial: {
    opacity: 0,
    y: 20,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      delay: 0.1,
      ease: 'easeOut',
    },
  },
};

// Button animations
export const buttonHoverVariants: Variants = {
  initial: {
    scale: 1,
  },
  hover: {
    scale: 1.02,
    transition: {
      duration: 0.2,
    },
  },
  tap: {
    scale: 0.98,
  },
};

export const buttonGlowVariants: Variants = {
  initial: {
    boxShadow: '0 0 0px rgba(59, 130, 246, 0)',
  },
  hover: {
    boxShadow: '0 0 20px rgba(59, 130, 246, 0.5)',
    transition: {
      duration: 0.3,
    },
  },
};

// Card hover animations
export const cardHoverVariants: Variants = {
  initial: {
    opacity: 1,
  },
  hover: {
    opacity: 1,
    transition: {
      duration: 0.3,
      ease: 'easeOut',
    },
  },
};

// Image reveal animation
export const imageRevealVariants: Variants = {
  initial: {
    opacity: 0,
  },
  animate: {
    opacity: 1,
    transition: {
      duration: 0.5,
      ease: 'easeOut',
    },
  },
};

// Badge pulse animation
export const badgePulseVariants: Variants = {
  initial: {
    scale: 1,
    opacity: 0.7,
  },
  animate: {
    scale: 1,
    opacity: 1,
    transition: {
      duration: 1.5,
      repeat: Infinity,
      repeatType: 'reverse',
    },
  },
};

// Floating animation
export const floatingVariants: Variants = {
  animate: {
    y: [0, -10, 0],
    transition: {
      duration: 3,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
};

// Modal animations
export const modalBackdropVariants: Variants = {
  initial: {
    opacity: 0,
  },
  animate: {
    opacity: 1,
    transition: {
      duration: 0.3,
    },
  },
  exit: {
    opacity: 0,
    transition: {
      duration: 0.2,
    },
  },
};

export const modalContentVariants: Variants = {
  initial: {
    opacity: 0,
    scale: 0.9,
    y: 20,
  },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: 'easeOut',
    },
  },
  exit: {
    opacity: 0,
    scale: 0.9,
    y: 20,
    transition: {
      duration: 0.2,
    },
  },
};

// Carousel animations
export const carouselSlideVariants: Variants = {
  initial: (direction: number) => ({
    x: direction > 0 ? 1000 : -1000,
    opacity: 0,
  }),
  animate: {
    x: 0,
    opacity: 1,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 30,
    },
  },
  exit: (direction: number) => ({
    x: direction < 0 ? 1000 : -1000,
    opacity: 0,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 30,
    },
  }),
};

// Navigation animations
export const navItemVariants: Variants = {
  initial: {
    opacity: 0,
    y: -10,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
    },
  },
};

export const dropdownVariants: Variants = {
  initial: {
    opacity: 0,
    y: -10,
    pointerEvents: 'none',
  },
  animate: {
    opacity: 1,
    y: 0,
    pointerEvents: 'auto',
    transition: {
      duration: 0.2,
    },
  },
  exit: {
    opacity: 0,
    y: -10,
    pointerEvents: 'none',
    transition: {
      duration: 0.15,
    },
  },
};

// Skeleton loader animation
export const skeletonVariants: Variants = {
  initial: {
    backgroundPosition: '200% center',
  },
  animate: {
    backgroundPosition: ['-200% center', '200% center'],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: 'linear',
    },
  },
};

// Ripple effect animation
export const rippleVariants: Variants = {
  initial: {
    scale: 0,
    opacity: 1,
  },
  animate: {
    scale: 4,
    opacity: 0,
    transition: {
      duration: 0.6,
      ease: 'easeOut',
    },
  },
};

// Parallax scroll configuration
export const parallaxConfig = {
  viewport: { once: false, margin: '0px 0px -100px 0px' },
  transition: { duration: 0.8, ease: 'easeOut' },
};
