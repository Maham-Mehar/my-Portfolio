"use client";

import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { ApiExplorer } from "@/components/lab/api-explorer";
import { UIConceptLab } from "@/components/lab/ui-concept";
import { Reveal } from "@/components/ui/reveal";
import { ease } from "@/lib/motion";
import { useBackend } from "@/lib/use-backend";
import { cn } from "@/lib/utils";

const experiments = [
  {
    id: "ui",
    index: "01",
    title: "Prompt → UI",
    blurb: "An LLM drafts a screen as a validated spec; safe components render it.",
    tech: ["LLM JSON mode", "Pydantic", "Safe renderer"],
  },
  {
    id: "api",
    index: "02",
    title: "Behind the interface",
    blurb: "Call the FastAPI service directly and see validation and status codes.",
    tech: ["FastAPI", "Pydantic", "REST"],
  },
] as const;

type ExperimentId = (typeof experiments)[number]["id"];

const pipeline = [
  { label: "Next.js UI", note: "typed fetch · streaming reader" },
  { label: "FastAPI", note: "Pydantic validation · rate limit · CORS" },
  { label: "LLM provider", note: "OpenAI-compatible or Gemini · key server-side" },
];

export function LabExperiments() {
  const backend = useBackend();
  const [active, setActive] = useState<ExperimentId>("ui");
  const live = backend.state === "ready" && backend.health.llm.configured;

  return (
    <>
      {/* System status + request pipeline */}
      <Reveal className="mt-12">
        <div className="surface flex flex-col gap-5 rounded-2xl p-5 sm:p-6 lg:flex-row lg:items-center">
          <div className="flex shrink-0 items-center gap-3 lg:w-56">
            <span
              aria-hidden
              className={cn(
                "size-2 rounded-full",
                live
                  ? "bg-ok shadow-[0_0_10px_rgb(94_224_168/0.8)]"
                  : backend.state === "ready"
                    ? "bg-accent-soft"
                    : "bg-subtle",
              )}
            />
            <p className="font-mono text-[0.7rem] leading-relaxed text-muted">
              {backend.state === "checking"
                ? "Checking backend…"
                : live
                  ? `Live · ${backend.health.llm.provider}`
                  : backend.state === "ready"
                    ? "API online · LLM not configured"
                    : "Backend not connected"}
            </p>
          </div>
          <ol className="grid flex-1 gap-3 sm:grid-cols-3">
            {pipeline.map((step, i) => (
              <li key={step.label} className="relative flex items-center gap-3">
                <span className="grid size-8 shrink-0 place-items-center rounded-lg border border-line bg-ink-800 font-mono text-[0.65rem] text-accent-soft">
                  0{i + 1}
                </span>
                <span className="min-w-0">
                  <span className="block text-sm text-fg">{step.label}</span>
                  <span className="block truncate font-mono text-[0.62rem] text-subtle">{step.note}</span>
                </span>
                {i < pipeline.length - 1 && (
                  <span
                    aria-hidden
                    className="signal-line absolute top-1/2 -right-2 hidden h-px w-4 bg-line sm:block"
                  />
                )}
              </li>
            ))}
          </ol>
        </div>
      </Reveal>

      <Reveal className="mt-8">
        <div role="tablist" aria-label="Experiments" className="grid gap-3 sm:grid-cols-2">
          {experiments.map((e) => {
            const selected = active === e.id;
            return (
              <button
                key={e.id}
                id={`lab-tab-${e.id}`}
                role="tab"
                type="button"
                aria-selected={selected}
                aria-controls={`lab-panel-${e.id}`}
                onClick={() => setActive(e.id)}
                onKeyDown={(ev) => {
                  if (ev.key === "ArrowRight" || ev.key === "ArrowLeft") {
                    const next = experiments[(experiments.findIndex((x) => x.id === e.id) + 1) % experiments.length]!;
                    setActive(next.id);
                    document.getElementById(`lab-tab-${next.id}`)?.focus();
                  }
                }}
                tabIndex={selected ? 0 : -1}
                data-spotlight
                className={cn(
                  "spotlight rounded-2xl border p-5 text-left transition-colors duration-300",
                  selected ? "border-accent/40 bg-accent/[0.06]" : "border-line hover:border-line-strong",
                )}
              >
                <span className="flex items-center justify-between">
                  <span className="font-mono text-[0.7rem] text-accent-soft">{e.index}</span>
                  <span className="flex gap-1.5">
                    {e.tech.map((t) => (
                      <span
                        key={t}
                        className="hidden rounded border border-line px-1.5 py-0.5 font-mono text-[0.58rem] text-subtle md:inline"
                      >
                        {t}
                      </span>
                    ))}
                  </span>
                </span>
                <span className="mt-4 block text-xl font-medium tracking-tight text-fg">{e.title}</span>
                <span className="mt-1.5 block text-sm leading-relaxed text-muted">{e.blurb}</span>
              </button>
            );
          })}
        </div>
      </Reveal>

      <div className="mt-8">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={active}
            id={`lab-panel-${active}`}
            role="tabpanel"
            aria-labelledby={`lab-tab-${active}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.35, ease }}
          >
            {active === "ui" ? <UIConceptLab backend={backend} /> : <ApiExplorer backend={backend} />}
          </motion.div>
        </AnimatePresence>
      </div>
    </>
  );
}
