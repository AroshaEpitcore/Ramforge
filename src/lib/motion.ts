import type { Transition, Variants } from "motion/react";

/**
 * Central motion presets. Import these instead of hand-writing timings so
 * animation feels consistent across the app. Animate transform/opacity only
 * (60fps); `prefers-reduced-motion` is handled globally in globals.css and by
 * the motion wrappers in components/motion.
 */

export const transitions = {
  /** Emphasized ease — good default for UI reveals. */
  emphasized: { duration: 0.35, ease: [0.2, 0, 0, 1] } satisfies Transition,
  /** Quick, subtle. */
  snappy: { duration: 0.18, ease: [0.2, 0, 0, 1] } satisfies Transition,
  /** Bouncy spring for playful elements (badges, hovers). */
  spring: { type: "spring", stiffness: 420, damping: 28, mass: 0.8 } satisfies Transition,
  /** Soft spring for larger surfaces (sheets, cards). */
  softSpring: { type: "spring", stiffness: 260, damping: 30 } satisfies Transition,
} as const;

export const fade: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: transitions.emphasized },
};

export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: transitions.emphasized },
};

export const fadeInDown: Variants = {
  hidden: { opacity: 0, y: -12 },
  visible: { opacity: 1, y: 0, transition: transitions.emphasized },
};

export const slideInLeft: Variants = {
  hidden: { opacity: 0, x: -24 },
  visible: { opacity: 1, x: 0, transition: transitions.emphasized },
};

export const slideInRight: Variants = {
  hidden: { opacity: 0, x: 24 },
  visible: { opacity: 1, x: 0, transition: transitions.emphasized },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.96 },
  visible: { opacity: 1, scale: 1, transition: transitions.emphasized },
};

/** Container that staggers its children's reveal. Pair with an item variant. */
export const staggerContainer = (stagger = 0.06, delayChildren = 0): Variants => ({
  hidden: {},
  visible: {
    transition: { staggerChildren: stagger, delayChildren },
  },
});

export const staggerItem: Variants = fadeInUp;

/** Subtle lift used on hover for cards. */
export const hoverLift = {
  rest: { y: 0 },
  hover: { y: -4, transition: transitions.spring },
} as const;
