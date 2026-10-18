"use client";

import { motion, useScroll, useSpring } from "motion/react";
import { useReducedMotion } from "@/lib/use-reduced-motion";
import { useRef } from "react";
import { cn } from "@/lib/utils";

/** Vertical rail that fills as the reader scrolls through the timeline. */
export function TimelineRail({ className }: { className?: string }) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLSpanElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 0.75", "end 0.55"] });
  const scaleY = useSpring(scrollYProgress, { stiffness: 120, damping: 28, restDelta: 0.001 });

  return (
    <span ref={ref} aria-hidden className={cn("absolute w-px bg-line", className)}>
      <motion.span
        style={reduce ? undefined : { scaleY }}
        className="absolute inset-0 origin-top bg-gradient-to-b from-accent via-violet to-cyan shadow-[0_0_12px_rgb(91_140_255/0.6)]"
      />
    </span>
  );
}

/** Timeline node that lights up once the rail reaches it. */
export function TimelineNode({ className }: { className?: string }) {
  return (
    <motion.span
      aria-hidden
      initial={{ borderColor: "rgb(150 165 215 / 0.22)", boxShadow: "0 0 0 rgb(91 140 255 / 0)" }}
      whileInView={{ borderColor: "rgb(91 140 255 / 1)", boxShadow: "0 0 16px rgb(91 140 255 / 0.75)" }}
      viewport={{ once: true, margin: "0px 0px -45% 0px" }}
      transition={{ duration: 0.5 }}
      className={cn("size-[11px] rounded-full border-2 bg-ink-950", className)}
    />
  );
}
