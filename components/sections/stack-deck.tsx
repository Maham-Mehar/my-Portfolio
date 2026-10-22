"use client";

import { Reveal } from "@/components/ui/reveal";
import { useState } from "react";
import { experience } from "@/data/experience";
import { projects } from "@/data/projects";
import { levelMeta, skillGroups, type Level } from "@/data/skills";
import { cn } from "@/lib/utils";

/** The core stack, each with a small syntax "glyph" that hints at how the tool reads in code. */
const STACK: Array<{ name: string; glyph: string }> = [
  { name: "React.js", glyph: "<App />" },
  { name: "Next.js", glyph: "app/page.tsx" },
  { name: "TypeScript", glyph: ": Props" },
  { name: "Tailwind CSS", glyph: "flex gap-4" },
  { name: "Python", glyph: "def run():" },
  { name: "FastAPI", glyph: "@app.get()" },
];

const LEVEL_STEPS: Record<Level, number> = { core: 3, working: 2, growing: 1 };

/** Level and group come straight from data/skills.ts, so the cards never overstate anything. */
const cards = STACK.map((item) => {
  const group = skillGroups.find((g) => g.skills.some((s) => s.name === item.name));
  const level = group?.skills.find((s) => s.name === item.name)?.level;
  const featured = projects.filter((p) => p.stack.includes(item.name)).map((p) => p.title);
  return { ...item, group: group?.title ?? "", level, featured };
});

/**
 * Core stack — its own section directly below the hero (previously a small
 * list inside the hero). A top hairline and its own heading separate it from
 * the hero; the cards are a connected "deck" with a signal running along it.
 */
export function StackDeck() {
  const current = experience[0];
  const [selected, setSelected] = useState<string | null>(null);
  const active = cards.find((c) => c.name === selected);

  /** Selecting a card also lights up that technology's cluster on the hero globe. */
  function choose(name: string) {
    const next = selected === name ? null : name;
    setSelected(next);
    window.dispatchEvent(new CustomEvent<string | null>("core:select", { detail: next }));
  }

  return (
    <section aria-labelledby="stack-title" className="relative border-t border-line py-14 sm:py-16">
      {/* Separation from the hero: a lit hairline along the top edge */}
      <div
        aria-hidden
        className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-accent-soft/60 to-transparent"
      />

      <div className="container-page">
        <Reveal className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
          <div>
            <p className="label-mono flex items-center gap-3 text-accent-soft">
              <span aria-hidden className="h-px w-8 bg-gradient-to-r from-accent to-cyan" />
              Core stack
            </p>
            <h2 id="stack-title" className="mt-3 text-2xl font-medium tracking-tight text-fg sm:text-3xl">
              The tools I build with, <span className="text-muted">day to day.</span>
            </h2>
          </div>
          {current && (
            <p className="inline-flex items-center gap-2.5 rounded-full border border-line bg-ink-900/60 px-3.5 py-2 text-xs text-muted">
              <span aria-hidden className="relative flex size-2">
                <span className="absolute inset-0 rounded-full bg-ok/60 blur-[3px] [animation:pulse-dot_2.4s_ease-in-out_infinite]" />
                <span className="relative size-2 rounded-full bg-ok" />
              </span>
              <span>
                Currently <span className="text-fg">{current.role}</span> at{" "}
                <span className="text-fg">{current.company}</span>
              </span>
            </p>
          )}
        </Reveal>

        <div className="relative mt-9">
          {/* The signal rail that links the deck */}
          <span aria-hidden className="signal-line absolute inset-x-0 top-0 hidden h-px bg-line lg:block" />

          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6 lg:gap-0 lg:pt-px">
            {cards.map((card, i) => (
              <Reveal as="li" key={card.name} delay={i * 0.06} className="min-w-0">
                <button
                  type="button"
                  aria-pressed={selected === card.name}
                  onClick={() => choose(card.name)}
                  data-spotlight
                  className={cn(
                    "spotlight group relative flex h-full w-full flex-col text-left overflow-hidden rounded-2xl border border-line bg-ink-900/40 p-4 transition-[transform,background-color] duration-500 ease-out-quint hover:-translate-y-1 hover:bg-ink-900/80 sm:p-5",
                    "lg:rounded-none lg:border-y-0 lg:border-l-0 lg:last:border-r-0",
                    selected === card.name && "bg-ink-900/90 shadow-[inset_0_0_0_1px_rgb(126_227_245/0.45)]",
                  )}
                >
                  {/* Node on the rail */}
                  <span
                    aria-hidden
                    className="absolute top-0 left-5 hidden size-2 -translate-y-1/2 rounded-full border border-accent-soft/70 bg-ink-950 transition-colors duration-300 group-hover:bg-cyan lg:block"
                  />

                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[0.65rem] text-subtle">{String(i + 1).padStart(2, "0")}</span>
                    <LevelMeter level={card.level} />
                  </div>

                  <p className="mt-6 text-lg font-medium tracking-tight text-fg sm:text-xl">{card.name}</p>
                  <p className="mt-1 truncate text-xs text-subtle">{card.group}</p>

                  <code className="mt-5 block truncate rounded-md border border-line bg-ink-950/70 px-2 py-1.5 font-mono text-[0.68rem] text-accent-soft transition-colors duration-300 group-hover:border-accent/40 group-hover:text-cyan">
                    {card.glyph}
                  </code>
                </button>
              </Reveal>
            ))}
          </ul>
        </div>

        {/* Detail line (moved here from the hero) */}
        <p aria-live="polite" className="mt-5 min-h-6 text-[0.8125rem] leading-relaxed text-muted">
          {active ? (
            <>
              <span className="text-fg">{active.name}</span> · {active.group}
              {active.level && (
                <>
                  {" "}
                  ·{" "}
                  <span className={active.level === "growing" ? "text-cyan" : "text-accent-soft"}>
                    {levelMeta[active.level].label}
                  </span>{" "}
                  — {levelMeta[active.level].description.toLowerCase()}
                </>
              )}
              {active.featured.length > 0 && <> · featured in {active.featured.join(", ")}</>}. It&apos;s highlighted on
              the globe above.
            </>
          ) : (
            "Pick a technology to light up its cluster on the globe and see how I actually use it."
          )}
        </p>
      </div>
    </section>
  );
}

function LevelMeter({ level }: { level?: Level }) {
  if (!level) return null;
  const steps = LEVEL_STEPS[level];
  return (
    <span className="flex items-center gap-1.5" title={levelMeta[level].description}>
      <span aria-hidden className="flex gap-0.5">
        {[1, 2, 3].map((n) => (
          <span
            key={n}
            className={cn(
              "h-2.5 w-1 rounded-full",
              n <= steps ? (level === "growing" ? "bg-cyan" : "bg-accent-soft") : "bg-white/10",
            )}
          />
        ))}
      </span>
      <span className={cn("font-mono text-[0.6rem] uppercase", level === "growing" ? "text-cyan" : "text-muted")}>
        {levelMeta[level].label}
      </span>
    </span>
  );
}
