"use client";

import { useEffect, useRef } from "react";

const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789<>/{}[]#*+=";

interface ScrambleTextProps {
  text: string;
  /** Seconds after the hero choreography starts (see --intro-delay). */
  delay?: number;
  duration?: number;
  className?: string;
}

/**
 * Characters decode left-to-right from random glyphs into the real text.
 * Server-renders the final string (no hydration mismatch, works without JS);
 * screen readers always get the plain text.
 */
export function ScrambleText({ text, delay = 0, duration = 1.1, className }: ScrambleTextProps) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const intro = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--intro-delay")) || 0;
    const start = performance.now() + (intro + delay) * 1000;
    let frame = 0;

    const tick = (now: number) => {
      const progress = Math.max(0, (now - start) / (duration * 1000));
      const solved = Math.floor(progress * text.length);
      el.textContent = Array.from(text, (ch, i) =>
        i < solved || ch === " " || ch === "•" ? ch : GLYPHS[Math.floor(Math.random() * GLYPHS.length)],
      ).join("");
      if (progress < 1) frame = requestAnimationFrame(tick);
      else el.textContent = text;
    };
    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
      el.textContent = text;
    };
  }, [text, delay, duration]);

  return (
    <span className={className}>
      <span className="sr-only">{text}</span>
      <span ref={ref} aria-hidden className="tabular-nums">
        {text}
      </span>
    </span>
  );
}
