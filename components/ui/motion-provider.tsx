"use client";

import { MotionConfig } from "motion/react";

/** Disables transform/layout animations for users who prefer reduced motion. */
export function MotionProvider({ children }: { children: React.ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
