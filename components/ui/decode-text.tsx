"use client";

import { useEffect, useRef } from "react";

const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789<>/{}[]#*+=";

/**
 * Decodes left-to-right from random glyphs the first time it scrolls into view,
 * then stays put. Server-renders the final string (no hydration mismatch); screen
 * readers always get the plain text; reduced motion shows it immediately.
 */
export function DecodeText({
  text,
  duration = 0.9,
  className,
}: {
  text: string;
  duration?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let frame = 0;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        io.disconnect();
        const start = performance.now();
        const tick = (now: number) => {
          const progress = Math.min(1, (now - start) / (duration * 1000));
          const solved = Math.floor(progress * text.length);
          el.textContent = Array.from(text, (ch, i) =>
            i < solved || ch === " " ? ch : GLYPHS[Math.floor(Math.random() * GLYPHS.length)],
          ).join("");
          if (progress < 1) frame = requestAnimationFrame(tick);
        };
        frame = requestAnimationFrame(tick);
      },
      { rootMargin: "0px 0px -10% 0px" },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(frame);
      el.textContent = text;
    };
  }, [text, duration]);

  return (
    <span className={className}>
      <span className="sr-only">{text}</span>
      <span ref={ref} aria-hidden>
        {text}
      </span>
    </span>
  );
}
