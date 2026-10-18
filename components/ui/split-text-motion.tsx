"use client";

import { motion } from "motion/react";
import { useReducedMotion } from "@/lib/use-reduced-motion";
import { duration, ease, inView, stagger } from "@/lib/motion";

const wordVariants = {
  hidden: { y: "105%", rotate: 3 },
  shown: (i: number) => ({
    y: "0%",
    rotate: 0,
    transition: { duration: duration.slow, ease, delay: i * stagger },
  }),
};

interface SplitRootProps {
  as: "h2" | "h3" | "p" | "span";
  id?: string;
  className?: string;
  children: React.ReactNode;
}

/** Owns the in-view trigger; words below inherit it through variants. */
export function SplitRoot({ as, id, className, children }: SplitRootProps) {
  const reduce = useReducedMotion();
  const Tag = motion[as];
  return (
    <Tag id={id} className={className} initial={reduce ? false : "hidden"} whileInView="shown" viewport={inView}>
      {children}
    </Tag>
  );
}

export function SplitWord({ i, children }: { i: number; children: string }) {
  return (
    <span className="word-mask">
      <motion.span className="inline-block" custom={i} variants={wordVariants}>
        {children}
      </motion.span>
    </span>
  );
}
