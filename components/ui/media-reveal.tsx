"use client";

import { motion, useMotionValue, useSpring, useTransform } from "motion/react";
import { useReducedMotion } from "@/lib/use-reduced-motion";
import { useRef } from "react";
import { ease, inView } from "@/lib/motion";

/**
 * Project visual choreography:
 *  1. mask reveal — the frame opens from an inset clip as it scrolls in;
 *  2. subtle 3D tilt toward the pointer (mouse only, max ~4°).
 */
export function MediaReveal({ children }: { children: React.ReactNode }) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const rotateY = useSpring(useTransform(px, [-0.5, 0.5], [-4, 4]), { stiffness: 150, damping: 20 });
  const rotateX = useSpring(useTransform(py, [-0.5, 0.5], [3, -3]), { stiffness: 150, damping: 20 });

  function onPointerMove(e: React.PointerEvent) {
    if (reduce || e.pointerType !== "mouse" || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    px.set((e.clientX - r.left) / r.width - 0.5);
    py.set((e.clientY - r.top) / r.height - 0.5);
  }

  function reset() {
    px.set(0);
    py.set(0);
  }

  return (
    <motion.div
      initial={reduce ? false : { clipPath: "inset(14% 10% 14% 10% round 28px)", opacity: 0.3 }}
      // Drop the clip once open so the tilt and shadow aren't cropped.
      whileInView={{ clipPath: "inset(0% 0% 0% 0% round 16px)", opacity: 1, transitionEnd: { clipPath: "none" } }}
      viewport={inView}
      transition={reduce ? { duration: 0 } : { duration: 1.3, ease }}
    >
      <div ref={ref} onPointerMove={onPointerMove} onPointerLeave={reset} className="[perspective:1600px]">
        <motion.div style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}>{children}</motion.div>
      </div>
    </motion.div>
  );
}
