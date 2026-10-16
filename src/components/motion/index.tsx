"use client";

import {
  fade,
  fadeInUp,
  scaleIn,
  slideInLeft,
  slideInRight,
  staggerContainer,
  staggerItem,
} from "@/lib/motion";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion, type Variants } from "motion/react";
import { usePathname } from "next/navigation";
import type { ComponentProps, ElementType, ReactNode } from "react";

type DivMotionProps = ComponentProps<typeof motion.div>;

interface RevealProps extends Omit<DivMotionProps, "variants"> {
  /** Delay before the reveal starts (seconds). */
  delay?: number;
  /** Animate when scrolled into view instead of on mount. */
  inView?: boolean;
  as?: ElementType;
}

function Reveal({
  variants,
  delay = 0,
  inView = false,
  children,
  ...props
}: RevealProps & { variants: Variants }) {
  const inViewProps = inView
    ? ({ whileInView: "visible", viewport: { once: true, margin: "-80px" } } as const)
    : ({ animate: "visible" } as const);

  return (
    <motion.div
      initial="hidden"
      {...inViewProps}
      variants={variants}
      transition={{ delay }}
      {...props}
    >
      {children}
    </motion.div>
  );
}

/** Fade (optionally upward) reveal. */
export function FadeIn({ up = true, ...props }: RevealProps & { up?: boolean }) {
  return <Reveal variants={up ? fadeInUp : fade} {...props} />;
}

/** Slide in from the left or right. */
export function SlideIn({
  from = "left",
  ...props
}: RevealProps & { from?: "left" | "right" }) {
  return <Reveal variants={from === "left" ? slideInLeft : slideInRight} {...props} />;
}

/** Scale-and-fade reveal. */
export function ScaleIn(props: RevealProps) {
  return <Reveal variants={scaleIn} {...props} />;
}

/**
 * Staggered container. Direct children should be <StaggerItem> (or any element
 * using the `staggerItem` variant) to cascade in.
 */
export function Stagger({
  stagger = 0.06,
  delayChildren = 0,
  inView = false,
  className,
  children,
  ...props
}: Omit<DivMotionProps, "variants"> & {
  stagger?: number;
  delayChildren?: number;
  inView?: boolean;
}) {
  const inViewProps = inView
    ? ({ whileInView: "visible", viewport: { once: true, margin: "-80px" } } as const)
    : ({ animate: "visible" } as const);

  return (
    <motion.div
      initial="hidden"
      {...inViewProps}
      variants={staggerContainer(stagger, delayChildren)}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children, ...props }: DivMotionProps) {
  return (
    <motion.div variants={staggerItem} {...props}>
      {children}
    </motion.div>
  );
}

/**
 * Animated list with enter/exit transitions. Each child must carry a stable
 * `key`. Useful for cart items, toasts-in-page, filter chips, etc.
 */
export function AnimatedList({
  className,
  children,
  ...props
}: ComponentProps<"div"> & { children: ReactNode }) {
  return (
    <div className={cn(className)} {...props}>
      <AnimatePresence initial={false}>{children}</AnimatePresence>
    </div>
  );
}

export function AnimatedListItem({ children, ...props }: DivMotionProps) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.2 }}
      {...props}
    >
      {children}
    </motion.div>
  );
}

/** Wrap page content to cross-fade on route change. */
export function PageTransition({ children, className }: { children: ReactNode; className?: string }) {
  const pathname = usePathname();
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.2, ease: [0.2, 0, 0, 1] }}
        className={className}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
