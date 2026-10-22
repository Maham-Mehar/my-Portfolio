"use client";

import { AnimatePresence, motion } from "motion/react";
import { useRef, useState } from "react";
import { CodeBlock } from "@/components/ui/code-block";
import { Reveal } from "@/components/ui/reveal";
import { Accent, SectionHeading } from "@/components/ui/section-heading";
import { craftNotes } from "@/data/craft";
import { cn } from "@/lib/utils";

const philosophy = [
  "Clean, maintainable code",
  "Reusable components",
  "Responsive by default",
  "Performance & accessibility",
  "Typed API integration",
  "Scalable frontend architecture",
  "Thoughtful user experience",
];

export function Craft() {
  const [active, setActive] = useState(0);
  const tabs = useRef<Array<HTMLButtonElement | null>>([]);
  const note = craftNotes[active]!;

  // Roving focus for the tablist (WAI-ARIA tabs pattern).
  function onKeyDown(e: React.KeyboardEvent) {
    const last = craftNotes.length - 1;
    const next =
      e.key === "ArrowDown" || e.key === "ArrowRight"
        ? active === last
          ? 0
          : active + 1
        : e.key === "ArrowUp" || e.key === "ArrowLeft"
          ? active === 0
            ? last
            : active - 1
          : e.key === "Home"
            ? 0
            : e.key === "End"
              ? last
              : null;
    if (next === null) return;
    e.preventDefault();
    setActive(next);
    tabs.current[next]?.focus();
  }

  return (
    <section id="philosophy" aria-labelledby="craft-title" className="relative py-24 sm:py-32">
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-line-strong to-transparent"
      />
      <div className="container-page">
        <SectionHeading
          index="06"
          eyebrow="Development philosophy"
          id="craft-title"
          variant="manifesto"
          title={
            <>
              How I think about <Accent>building</Accent> interfaces.
            </>
          }
          intro="The principles behind the code I write — and a few habits that put them into practice, with short, simplified examples."
        />

        <ul aria-label="Principles" className="mt-12 flex flex-wrap gap-2">
          {philosophy.map((item, i) => (
            <Reveal as="li" key={item} delay={i * 0.04}>
              <span className="inline-flex min-h-9 items-center gap-2.5 rounded-full border border-line bg-white/[0.025] px-3.5 text-[0.8125rem] text-fg/85 transition-colors duration-300 hover:border-accent/40 hover:text-fg">
                <span className="font-mono text-[0.62rem] text-accent-soft">0{i + 1}</span>
                {item}
              </span>
            </Reveal>
          ))}
        </ul>

        <Reveal className="mt-14 grid gap-6 lg:grid-cols-12 lg:gap-10">
          <div
            role="tablist"
            aria-label="Engineering practices"
            aria-orientation="vertical"
            onKeyDown={onKeyDown}
            className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 sm:-mx-6 sm:px-6 lg:col-span-5 lg:mx-0 lg:flex-col lg:gap-0 lg:overflow-visible lg:border-t lg:border-line lg:px-0"
          >
            {craftNotes.map((n, i) => {
              const selected = i === active;
              return (
                <button
                  key={n.id}
                  ref={(el) => {
                    tabs.current[i] = el;
                  }}
                  role="tab"
                  id={`craft-tab-${n.id}`}
                  aria-selected={selected}
                  aria-controls={`craft-panel-${n.id}`}
                  tabIndex={selected ? 0 : -1}
                  onClick={() => setActive(i)}
                  className={cn(
                    "relative shrink-0 rounded-full border px-4 py-2 text-left text-sm transition-colors",
                    "lg:rounded-none lg:border-0 lg:border-b lg:border-line lg:px-0 lg:py-5",
                    selected
                      ? "border-accent/50 bg-accent/10 text-fg lg:bg-transparent"
                      : "border-line text-muted hover:text-fg",
                  )}
                >
                  <span className="flex items-baseline gap-4">
                    <span
                      className={cn(
                        "hidden font-mono text-[0.7rem] lg:inline",
                        selected ? "text-accent-soft" : "text-subtle",
                      )}
                    >
                      0{i + 1}
                    </span>
                    <span className="lg:text-lg lg:font-medium lg:tracking-tight">{n.title}</span>
                  </span>
                  {selected && (
                    <motion.span
                      layoutId="craft-indicator"
                      aria-hidden
                      className="absolute -bottom-px left-0 hidden h-px w-full bg-accent lg:block"
                    />
                  )}
                </button>
              );
            })}
          </div>

          <div className="min-w-0 lg:col-span-7">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={note.id}
                role="tabpanel"
                id={`craft-panel-${note.id}`}
                aria-labelledby={`craft-tab-${note.id}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              >
                <p className="text-pretty leading-relaxed text-muted">{note.summary}</p>
                <ul className="mt-4 flex flex-wrap gap-x-6 gap-y-2">
                  {note.points.map((p) => (
                    <li key={p} className="flex items-center gap-2 text-sm text-fg/85">
                      <span aria-hidden className="size-1 rounded-full bg-accent" />
                      {p}
                    </li>
                  ))}
                </ul>
                <div className="mt-6">
                  <CodeBlock code={note.code} filename={note.filename} />
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
