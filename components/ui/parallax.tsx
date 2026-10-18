"use client";

import { motion, useScroll, useTransform } from "motion/react";
import { useReducedMotion } from "@/lib/use-reduced-motion";
import { useRef } from "react";

interface ParallaxProps {
  children: React.ReactNode;
  /** Total vertical travel in px across the element's pass through the viewport. */
  distance?: number;
  className?: string;
  /** "top": starts at rest when the page loads (for above-the-fold content). */
  origin?: "viewport" | "top";
}

/** Scroll-linked drift: the child moves slower than the page for a sense of depth. */
export function Parallax({ children, distance = 80, className, origin = "viewport" }: ParallaxProps) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const { scrollY } = useScroll();
  const drift = useTransform(scrollYProgress, [0, 1], [distance / 2, -distance / 2]);
  // Above the fold: at rest on load, drifting over the first viewport of scroll.
  const lift = useTransform(scrollY, [0, 900], [0, -distance]);
  const y = origin === "top" ? lift : drift;

  return (
    <motion.div ref={ref} style={reduce ? undefined : { y }} className={className}>
      {children}
    </motion.div>
  );
}
