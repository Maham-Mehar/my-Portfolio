"use client";

import { motion, useScroll, useTransform, type MotionValue } from "motion/react";
import { useReducedMotion } from "@/lib/use-reduced-motion";
import { useRef } from "react";

interface ScrollLitTextProps {
  text: string;
  /** Words (exact match, trailing punctuation ignored) to render in the accent colour. */
  highlight?: string[];
  className?: string;
}

/**
 * Words brighten one after another as the paragraph scrolls through the
 * viewport — reading pace set by the reader. Fully lit for reduced motion.
 */
export function ScrollLitText({ text, highlight = [], className }: ScrollLitTextProps) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLParagraphElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 0.85", "end 0.5"] });
  const words = text.split(" ");

  return (
    <p ref={ref} className={className}>
      {words.map((word, i) => {
        const accent = highlight.includes(word.replace(/[,.;:]+$/, ""));
        return (
          <span key={i}>
            {reduce ? (
              <span className={accent ? "text-accent-soft" : undefined}>{word}</span>
            ) : (
              <Word progress={scrollYProgress} range={[i / words.length, (i + 1) / words.length]} accent={accent}>
                {word}
              </Word>
            )}
            {i < words.length - 1 && " "}
          </span>
        );
      })}
    </p>
  );
}

function Word({
  children,
  progress,
  range,
  accent,
}: {
  children: string;
  progress: MotionValue<number>;
  range: [number, number];
  accent: boolean;
}) {
  const opacity = useTransform(progress, range, [0.2, 1]);
  return (
    <motion.span style={{ opacity }} className={accent ? "text-accent-soft" : undefined}>
      {children}
    </motion.span>
  );
}
