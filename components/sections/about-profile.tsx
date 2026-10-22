"use client";

import { motion, useInView } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { letterFor } from "@/components/ui/lettered-list";
import { levelMeta, skillGroups } from "@/data/skills";
import { duration, ease, inView } from "@/lib/motion";
import { useReducedMotion } from "@/lib/use-reduced-motion";
import { cn } from "@/lib/utils";

const CORE = ["React.js", "Next.js", "TypeScript", "JavaScript", "Tailwind CSS"];
const LEARNING = skillGroups.flatMap((g) => g.skills.filter((s) => s.level === "growing").map((s) => s.name));

const APPROACH = [
  { k: "Clean architecture", v: "Clear boundaries that keep code easy to change." },
  { k: "Practical solutions", v: "The simplest approach that fully solves the problem." },
  { k: "Collaboration", v: "Close work with designers, developers and product." },
];

/** Everything the inspector shows comes from data/skills.ts — nothing is overstated. */
function describe(name: string) {
  const group = skillGroups.find((g) => g.skills.some((s) => s.name === name));
  const level = group?.skills.find((s) => s.name === name)?.level;
  return { group: group?.title ?? "", level };
}

/* ───────────── Stack: a small, inspectable source file ───────────── */

function Token({
  name,
  label,
  kind,
  onInspect,
}: {
  name: string;
  label: string;
  kind: "core" | "learning";
  onInspect: (n: string) => void;
}) {
  return (
    <button
      type="button"
      onMouseEnter={() => onInspect(name)}
      onFocus={() => onInspect(name)}
      onClick={() => onInspect(name)}
      className={cn(
        "rounded-[4px] transition-[background-color,color] duration-300 outline-none",
        kind === "core"
          ? "text-accent-soft hover:bg-accent/15 hover:text-fg focus-visible:bg-accent/15 focus-visible:text-fg"
          : "text-cyan hover:bg-cyan/10 hover:text-fg focus-visible:bg-cyan/10 focus-visible:text-fg",
      )}
    >
      {label}
    </button>
  );
}

type Tone = "kw" | "fn" | "prop" | "pun" | "com" | "str";
/** One run of text on a line. `skill` makes it an inspectable token. */
type Part = { t: string; tone: Tone; skill?: string };
type Line = Part[];

const p = (t: string, tone: Tone): Part => ({ t, tone });
const skillLine =
  (indent: string) =>
  (name: string): Line => [p(indent, "pun"), { t: `"${name}"`, tone: "str", skill: name }, p(",", "pun")];

const SNIPPETS: Array<{ id: "ts" | "py"; file: string; badge: string; lang: string; lines: Line[] }> = [
  {
    id: "ts",
    file: "stack.ts",
    badge: "TS",
    lang: "TypeScript",
    lines: [
      [p("export const ", "kw"), p("stack", "fn"), p(" = {", "pun")],
      [p("  // shipping daily, in production", "com")],
      [p("  core", "prop"), p(": [", "pun")],
      ...CORE.map(skillLine("    ")),
      [p("  ],", "pun")],
      [p("  // actively learning and building with", "com")],
      [p("  learning", "prop"), p(": [", "pun")],
      ...LEARNING.map(skillLine("    ")),
      [p("  ],", "pun")],
      [p("} ", "pun"), p("as const", "kw"), p(";", "pun")],
    ],
  },
  {
    id: "py",
    file: "learning.py",
    badge: "PY",
    lang: "Python",
    lines: [
      [p("from ", "kw"), p("fastapi ", "prop"), p("import ", "kw"), p("FastAPI", "fn")],
      [],
      [p("app", "prop"), p(" = ", "pun"), p("FastAPI", "fn"), p("()", "pun")],
      [],
      [p("# where my backend depth is growing", "com")],
      [p("@app", "kw"), p(".get(", "pun"), p('"/learning"', "com"), p(")", "pun")],
      [p("async def ", "kw"), p("learning", "fn"), p("():", "pun")],
      [p("    return ", "kw"), p("[", "pun")],
      ...LEARNING.map(skillLine("        ")),
      [p("    ]", "pun")],
    ],
  },
];

type SnippetId = (typeof SNIPPETS)[number]["id"];

const letter = letterFor;

const TONE: Record<Tone, string> = {
  kw: "text-violet",
  fn: "text-fg",
  prop: "text-fg/85",
  pun: "text-subtle",
  com: "text-subtle italic",
  str: "text-accent-soft",
};

/**
 * Gutter cell: shows the line number, then — once the file has settled — the
 * number rolls up and out while a letter rolls in from below, staggered per line.
 * A fixed-width cell and tabular mono keep the code column perfectly still.
 */
function GutterCell({ i, lettered, active }: { i: number; lettered: boolean; active: boolean }) {
  const roll = "absolute inset-y-0 right-4 transition-[transform,opacity,filter] duration-500 ease-out-quint";
  return (
    <span
      aria-hidden
      className={cn(
        "relative block h-7 overflow-hidden tabular-nums select-none transition-colors duration-300",
        active ? "text-cyan" : "text-subtle/60",
      )}
    >
      <span
        className={roll}
        style={{
          transform: lettered ? "translateY(-100%)" : "none",
          opacity: lettered ? 0 : 1,
          filter: lettered ? "blur(2px)" : "none",
          transitionDelay: `${i * 45}ms`,
        }}
      >
        {i + 1}
      </span>
      <span
        className={roll}
        style={{
          transform: lettered ? "none" : "translateY(100%)",
          opacity: lettered ? 1 : 0,
          filter: lettered ? "none" : "blur(2px)",
          transitionDelay: `${i * 45 + 80}ms`,
        }}
      >
        {letter(i)}
      </span>
    </span>
  );
}

export function StackFile() {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLElement>(null);
  const seen = useInView(ref, { once: true, margin: "0px 0px -15% 0px" });
  const [tab, setTab] = useState<SnippetId>("ts");
  const [inspected, setInspected] = useState<string | null>(null);
  const [hoverLine, setHoverLine] = useState<number | null>(null);
  const [settled, setSettled] = useState(false);
  const tabs = useRef<Array<HTMLButtonElement | null>>([]);

  // Reduced motion skips straight to letters; otherwise they roll in once the lines have landed.
  const lettered = settled || (reduce && seen);

  const snippet = SNIPPETS.find((s) => s.id === tab) ?? SNIPPETS[0]!;
  const lines = snippet.lines;
  const info = inspected ? describe(inspected) : null;
  const inspectedLine = inspected ? lines.findIndex((l) => l.some((part) => part.skill === inspected)) : -1;
  const activeLine = hoverLine ?? (inspectedLine >= 0 ? inspectedLine : null);

  useEffect(() => {
    if (!seen || reduce) return;
    const t = window.setTimeout(() => setSettled(true), 1100);
    return () => window.clearTimeout(t);
  }, [seen, reduce]);

  function select(id: SnippetId) {
    setTab(id);
    setInspected(null);
    setHoverLine(null);
  }

  function onTabKey(e: React.KeyboardEvent, i: number) {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    e.preventDefault();
    const next = (i + (e.key === "ArrowRight" ? 1 : -1) + SNIPPETS.length) % SNIPPETS.length;
    const target = SNIPPETS[next];
    if (!target) return;
    select(target.id);
    tabs.current[next]?.focus();
  }

  return (
    <figure
      ref={ref}
      className="relative overflow-hidden rounded-2xl border border-line bg-ink-900/70 shadow-[0_30px_80px_-40px_rgb(91_140_255/0.35)] transition-[border-color,box-shadow] duration-500 hover:border-line-strong hover:shadow-[0_30px_90px_-36px_rgb(91_140_255/0.5)]"
      onMouseLeave={() => {
        setInspected(null);
        setHoverLine(null);
      }}
    >
      {/* Header: file tabs on the left, quiet meta on the right */}
      <div className="flex items-stretch justify-between border-b border-line pr-4">
        <div role="tablist" aria-label="Source files" className="flex">
          {SNIPPETS.map((s, i) => {
            const on = s.id === tab;
            return (
              <button
                key={s.id}
                ref={(el) => {
                  tabs.current[i] = el;
                }}
                type="button"
                role="tab"
                id={`file-tab-${s.id}`}
                aria-selected={on}
                aria-controls="file-panel"
                tabIndex={on ? 0 : -1}
                onClick={() => select(s.id)}
                onKeyDown={(e) => onTabKey(e, i)}
                className={cn(
                  "relative flex items-center gap-2 border-r border-line px-4 py-2.5 font-mono text-xs transition-colors duration-300",
                  on ? "bg-ink-950/40 text-fg" : "text-subtle hover:text-muted",
                )}
              >
                <span
                  className={cn(
                    "rounded-[3px] px-1 text-[0.6rem] font-semibold",
                    on ? "bg-accent/20 text-accent-soft" : "bg-white/5 text-subtle",
                  )}
                >
                  {s.badge}
                </span>
                {s.file}
                {on && <span aria-hidden className="absolute inset-x-0 -bottom-px h-px bg-cyan" />}
              </button>
            );
          })}
        </div>
        <span className="label-mono hidden items-center text-subtle sm:flex">read-only</span>
      </div>

      <pre
        id="file-panel"
        role="tabpanel"
        aria-labelledby={`file-tab-${tab}`}
        className="overflow-x-auto py-4 font-mono text-[0.8rem] leading-7 sm:text-[0.875rem]"
      >
        <code key={tab} className="grid min-w-max">
          {lines.map((line, i) => (
            <motion.span
              key={i}
              onMouseEnter={() => setHoverLine(i)}
              className={cn(
                "relative grid grid-cols-[3rem_1fr] pr-6 transition-colors duration-200",
                activeLine === i && "bg-white/[0.035]",
              )}
              initial={reduce ? false : { opacity: 0, x: -6 }}
              animate={seen ? { opacity: 1, x: 0 } : undefined}
              transition={reduce ? { duration: 0 } : { duration: duration.fast, delay: 0.1 + i * 0.04, ease }}
            >
              {/* Active-line marker */}
              <span
                aria-hidden
                className={cn(
                  "absolute inset-y-0 left-0 w-px bg-cyan transition-opacity duration-200",
                  activeLine === i ? "opacity-100" : "opacity-0",
                )}
              />
              <GutterCell i={i} lettered={lettered} active={activeLine === i} />
              <span className="whitespace-pre">
                {line.map((part, j) =>
                  part.skill ? (
                    <Token
                      key={j}
                      name={part.skill}
                      label={part.t}
                      kind={describe(part.skill).level === "growing" ? "learning" : "core"}
                      onInspect={setInspected}
                    />
                  ) : (
                    <span key={j} className={TONE[part.tone]}>
                      {part.t}
                    </span>
                  ),
                )}
                {i === lines.length - 1 && (
                  <span
                    aria-hidden
                    className="ml-1 inline-block h-[1.05em] w-[2px] translate-y-[3px] bg-cyan [animation:pulse-dot_1.2s_steps(2)_infinite]"
                  />
                )}
              </span>
            </motion.span>
          ))}
        </code>
      </pre>

      {/* Status bar — inspector on the left, editor meta on the right */}
      <figcaption className="flex min-h-11 flex-wrap items-center justify-between gap-x-4 gap-y-1 border-t border-line bg-ink-950/60 px-4 py-2.5 font-mono text-[0.7rem] text-subtle">
        <span aria-live="polite" className="flex flex-wrap items-center gap-x-3 gap-y-1">
          {inspected && info ? (
            <>
              <span className={info.level === "growing" ? "text-cyan" : "text-accent-soft"}>● {inspected}</span>
              <span>{info.group}</span>
              {info.level && (
                <span className="text-muted">
                  {levelMeta[info.level].label} — {levelMeta[info.level].description.toLowerCase()}
                </span>
              )}
            </>
          ) : (
            <span>Hover or tap a value to inspect it.</span>
          )}
        </span>
        <span aria-hidden className="hidden gap-3 sm:flex">
          <span>Ln {activeLine === null ? "–" : lettered ? letter(activeLine) : activeLine + 1}</span>
          <span>{snippet.lang}</span>
        </span>
      </figcaption>
    </figure>
  );
}

/* ───────────── How I work: three principles on one rail ───────────── */

export function Approach() {
  const reduce = useReducedMotion();

  return (
    <div className="relative">
      {/* The rail: horizontal on desktop, vertical on mobile. Draws in once. */}
      <motion.span
        aria-hidden
        className="absolute top-0 bottom-0 left-[5px] w-px origin-top bg-gradient-to-b from-accent/70 via-cyan/50 to-transparent sm:top-[5px] sm:right-0 sm:bottom-auto sm:left-0 sm:h-px sm:w-auto sm:origin-left sm:bg-gradient-to-r"
        initial={reduce ? false : { scaleX: 0, scaleY: 0 }}
        whileInView={{ scaleX: 1, scaleY: 1 }}
        viewport={inView}
        transition={reduce ? { duration: 0 } : { duration: 1.2, ease }}
      />

      <ol className="grid gap-10 sm:grid-cols-3 sm:gap-8">
        {APPROACH.map((a, i) => (
          <motion.li
            key={a.k}
            className="group relative pl-8 sm:pt-10 sm:pl-0"
            initial={reduce ? false : { opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={inView}
            transition={reduce ? { duration: 0 } : { duration: duration.base, delay: 0.3 + i * 0.15, ease }}
          >
            {/* Node on the rail */}
            <span
              aria-hidden
              className="absolute top-1.5 left-0 size-[11px] rounded-full border border-accent-soft/70 bg-ink-950 transition-[background-color,box-shadow] duration-300 group-hover:bg-cyan group-hover:shadow-[0_0_14px_rgb(126_227_245/0.8)] sm:top-0"
            />
            <span className="font-mono text-xs text-accent-soft">0{i + 1}</span>
            <p className="mt-2 text-lg font-medium tracking-tight text-fg sm:text-xl">{a.k}</p>
            <p className="mt-2 max-w-xs text-sm leading-relaxed text-muted sm:text-base">{a.v}</p>
          </motion.li>
        ))}
      </ol>
    </div>
  );
}
