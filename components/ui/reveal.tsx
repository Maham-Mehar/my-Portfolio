"use client";

import { motion } from "motion/react";
import { useReducedMotion } from "@/lib/use-reduced-motion";
import { duration, ease, inView } from "@/lib/motion";

interface RevealProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  as?: "div" | "li" | "article";
}

/** Rise-and-unblur entrance on first scroll into view. Renders statically for reduced motion. */
export function Reveal({ children, className, delay = 0, as = "div" }: RevealProps) {
  const reduce = useReducedMotion();
  const Component = motion[as];

  return (
    <Component
      className={className}
      initial={reduce ? false : { opacity: 0, y: 22, filter: "blur(6px)" }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={inView}
      // SSR ships the hidden state, so reduced-motion users get an instant snap rather than a fade.
      transition={reduce ? { duration: 0 } : { duration: duration.base, delay, ease }}
    >
      {children}
    </Component>
  );
}
