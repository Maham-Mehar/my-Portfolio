"use client";

import { motion } from "motion/react";
import { useState } from "react";
import { Reveal } from "@/components/ui/reveal";
import { duration, ease, inView } from "@/lib/motion";
import { useReducedMotion } from "@/lib/use-reduced-motion";
import { cn } from "@/lib/utils";

type Mark = "A" | "B" | "C";

const NOTES: Array<{ mark: Mark; word: string; title: string; note: string; ref: string }> = [
  {
    mark: "A",
    word: "details",
    title: "Details",
    note: "Spacing, type and the small interactions in between.",
    ref: "ui / polish",
  },
  {
    mark: "B",
    word: "states",
    title: "States",
    note: "Loading, error, empty and success, designed up front.",
    ref: "ux / resilience",
  },
  {
    mark: "C",
    word: "code",
    title: "Code",
    note: "Typed, readable components the next developer can extend.",
    ref: "dx / maintainability",
  },
];

const noteId = (m: Mark) => `principle-${m.toLowerCase()}`;

/** A marked word: focusable, linked to its principle module by A / B / C. */
function Marked({
  mark,
  children,
  active,
  onActive,
}: {
  mark: Mark;
  children: string;
  active: Mark | null;
  onActive: (m: Mark | null) => void;
}) {
  const on = active === mark;
  return (
    <button
      type="button"
      aria-describedby={noteId(mark)}
      onMouseEnter={() => onActive(mark)}
      onMouseLeave={() => onActive(null)}
      onFocus={() => onActive(mark)}
      onBlur={() => onActive(null)}
      onClick={() => onActive(mark)}
      className={cn(
        "relative inline rounded-md text-accent-soft transition-[color,background-color,box-shadow] duration-300 outline-none",
        on && "bg-accent/12 text-fg shadow-[0_0_0_6px_rgb(91_140_255/0.12)]",
      )}
    >
      {children}
      <span
        aria-hidden
        className={cn(
          "relative top-[0.35em] ml-1.5 inline-grid size-4 place-items-center rounded-[3px] border align-top font-mono text-[0.58rem] leading-none font-normal tracking-normal transition-[border-color,color,background-color,box-shadow] duration-300 sm:size-5 sm:text-[0.66rem]",
          on
            ? "border-cyan bg-cyan/15 text-cyan shadow-[0_0_12px_-2px_rgb(126_227_245/0.7)]"
            : "border-cyan/40 text-cyan/80",
        )}
      >
        {mark}
      </span>
    </button>
  );
}

const lineVariants = {
  hidden: { y: "105%" },
  shown: (i: number) => ({ y: "0%", transition: { duration: duration.slow, ease, delay: i * 0.09 } }),
};

/**
 * One phrase line rising out of its mask. The trigger lives on the parent
 * paragraph: a fully masked line has no visible area, so it can't detect itself.
 */
function Line({ i, className, children }: { i: number; className?: string; children: React.ReactNode }) {
  return (
    <span className="block overflow-hidden pb-[0.08em]">
      <motion.span className={cn("block", className)} custom={i} variants={lineVariants}>
        {children}
      </motion.span>
    </span>
  );
}

/**
 * The About principle, art-directed: the statement is set as four phrases with
 * alternating indents (the second drops into a quieter voice), the three key
 * words carry A / B / C markers, and each marker is linked to a principle
 * module below — hover, focus or tap either side to light up the pair.
 */
export function AboutStatement() {
  const reduce = useReducedMotion();
  const [active, setActive] = useState<Mark | null>(null);
  // Two voices: the statement (large) and its asides (small, muted), stepping right like a staircase.
  const big = "text-[clamp(1.85rem,3.7vw,3.15rem)] leading-[1.08] font-medium tracking-[-0.04em] text-fg";
  const aside =
    "flex items-baseline gap-3 text-[clamp(1.05rem,1.6vw,1.35rem)] leading-snug tracking-[-0.01em] text-muted";

  return (
    <figure className="relative border-t border-line pt-10 sm:pt-12">
      <Reveal className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
        <span className="label-mono flex items-center gap-3 text-accent-soft">
          <span aria-hidden className="size-1.5 rotate-45 bg-accent-soft" />
          Principle
        </span>
        <span className="label-mono hidden text-subtle sm:block">A · B · C — hover or tap a marked word</span>
      </Reveal>

      <blockquote className="mt-9 sm:mt-12">
        <motion.p initial={reduce ? false : "hidden"} whileInView="shown" viewport={inView}>
          <Line i={0} className={big}>
            I care about the{" "}
            <Marked mark="A" active={active} onActive={setActive}>
              details
            </Marked>
          </Line>
          <Line i={1} className={cn(aside, "mt-2 pl-[6%] sm:mt-3 sm:pl-[8%]")}>
            <span aria-hidden className="font-mono text-subtle">
              —
            </span>
            people never notice until they&apos;re missing:
          </Line>
          <Line i={2} className={cn(big, "mt-5 sm:mt-7 sm:pl-[16%] lg:pl-[24%]")}>
            fast loads, clear{" "}
            <Marked mark="B" active={active} onActive={setActive}>
              states
            </Marked>{" "}
            <span className="whitespace-nowrap">
              and{" "}
              <Marked mark="C" active={active} onActive={setActive}>
                code
              </Marked>
            </span>
          </Line>
          <Line i={3} className={cn(aside, "mt-2 pl-[6%] sm:mt-3 sm:pl-[24%] lg:pl-[32%]")}>
            <span aria-hidden className="font-mono text-subtle">
              —
            </span>
            the next developer is happy to open.
          </Line>
        </motion.p>
      </blockquote>

      {/* Principle modules: open columns on one shared rule, stepped to echo the headline */}
      <figcaption className="mt-14 grid gap-8 sm:mt-16 sm:grid-cols-3 sm:gap-6 lg:gap-10">
        {NOTES.map((n, i) => {
          const on = active === n.mark;
          return (
            <Reveal key={n.mark} delay={0.1 + i * 0.08} className={cn(i === 1 && "sm:mt-8", i === 2 && "sm:mt-16")}>
              <div
                id={noteId(n.mark)}
                onMouseEnter={() => setActive(n.mark)}
                onMouseLeave={() => setActive(null)}
                className="group relative pt-5"
              >
                {/* Rule: hairline that fills with accent when its word is active */}
                <span aria-hidden className="absolute inset-x-0 top-0 h-px bg-line-strong" />
                <span
                  aria-hidden
                  className={cn(
                    "absolute inset-x-0 top-0 h-px origin-left bg-gradient-to-r from-cyan via-accent to-transparent transition-transform duration-500 ease-out-quint",
                    on ? "scale-x-100" : "scale-x-0",
                  )}
                />
                <div className="flex items-center justify-between font-mono text-[0.65rem] tracking-[0.14em] uppercase">
                  <span
                    className={cn(
                      "grid size-7 place-items-center rounded-md border text-xs tracking-normal transition-[border-color,color,background-color,box-shadow] duration-300",
                      on
                        ? "border-cyan bg-cyan/10 text-cyan shadow-[0_0_14px_-2px_rgb(126_227_245/0.6)]"
                        : "border-line-strong text-subtle",
                    )}
                  >
                    {n.mark}
                  </span>
                  <span className={cn("transition-colors duration-300", on ? "text-cyan" : "text-subtle")}>
                    {n.ref}
                  </span>
                </div>
                <p className="mt-5 text-xl font-medium tracking-tight text-fg">{n.title}</p>
                <p className="mt-2 max-w-xs text-[0.9375rem] leading-relaxed text-muted">{n.note}</p>
              </div>
            </Reveal>
          );
        })}
      </figcaption>
    </figure>
  );
}
