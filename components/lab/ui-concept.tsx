"use client";

import { AnimatePresence, motion } from "motion/react";
import { AlertCircle, Braces, LayoutTemplate, Loader2, RotateCcw, Wand2 } from "lucide-react";
import { useState } from "react";
import { ApiError, apiFetch } from "@/lib/api";
import { ease } from "@/lib/motion";
import type { BackendStatus } from "@/lib/use-backend";
import { cn } from "@/lib/utils";

/* Mirrors backend/app/schemas.py → UISpec */
type SectionKind =
  | "navbar"
  | "hero"
  | "stats"
  | "card-grid"
  | "list"
  | "form"
  | "table"
  | "chart"
  | "tabs"
  | "cta"
  | "footer"
  | "sidebar";
interface UISection {
  kind: SectionKind;
  title: string;
  items: string[];
  note: string;
}
interface UISpec {
  title: string;
  summary: string;
  layout: "single-column" | "sidebar" | "split" | "dashboard";
  sections: UISection[];
  accessibility: string[];
  components: string[];
}

const IDEAS = [
  "A booking page for yacht charters",
  "An admin dashboard for a pet marketplace",
  "A job tracker for remote developers",
  "An onboarding flow for an AI writing tool",
];

/** Clearly labelled sample, shown when the live endpoint isn't available. */
const SAMPLE: UISpec = {
  title: "Pet marketplace admin",
  summary: "Moderators review new listings, verify sellers and keep an eye on adoption requests.",
  layout: "sidebar",
  sections: [
    {
      kind: "sidebar",
      title: "Navigation",
      items: ["Overview", "Listings", "Sellers", "Adoptions", "Settings"],
      note: "",
    },
    {
      kind: "stats",
      title: "Today",
      items: ["New listings", "Pending reviews", "Verified sellers", "Adoptions"],
      note: "",
    },
    { kind: "table", title: "Listings awaiting review", items: ["Pet", "Seller", "Price", "Status"], note: "" },
    { kind: "chart", title: "Listings this week", items: [], note: "" },
  ],
  accessibility: ["Status conveyed by text, not colour alone", "Table rows reachable by keyboard"],
  components: ["AdminShell", "StatCard", "ReviewTable", "WeeklyChart"],
};

type State =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "done"; spec: UISpec; sample?: boolean }
  | { kind: "error"; message: string };

export function UIConceptLab({ backend }: { backend: BackendStatus }) {
  const live = backend.state === "ready" && backend.health.llm.configured;
  const [idea, setIdea] = useState("");
  const [state, setState] = useState<State>({ kind: "idle" });
  const [view, setView] = useState<"preview" | "json">("preview");

  async function generate(text = idea) {
    const value = text.trim();
    if (value.length < 8) {
      setState({ kind: "error", message: "Describe the interface in at least a few words (8+ characters)." });
      return;
    }
    setIdea(value);
    setState({ kind: "loading" });
    try {
      const spec = await apiFetch<UISpec>("/api/lab/ui-concept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idea: value }),
        timeoutMs: 45_000,
      });
      setState({ kind: "done", spec });
      setView("preview");
    } catch (err) {
      setState({ kind: "error", message: err instanceof ApiError ? err.message : "Something went wrong." });
    }
  }

  const shown = state.kind === "done" ? state : !live ? { kind: "done" as const, spec: SAMPLE, sample: true } : null;

  return (
    <div className="grid gap-6 lg:grid-cols-12">
      <div className="min-w-0 lg:col-span-5">
        <p className="text-sm leading-relaxed text-muted">
          Describe a screen. An LLM returns a <span className="text-fg">structured design spec</span> — validated by a
          Pydantic schema on the server — and the preview is assembled from a fixed set of safe components. Nothing the
          model writes is executed as code.
        </p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            void generate();
          }}
          className="mt-5"
        >
          <label htmlFor="ui-idea" className="label-mono mb-2 block text-subtle">
            Interface idea
          </label>
          <textarea
            id="ui-idea"
            rows={3}
            maxLength={240}
            value={idea}
            onChange={(e) => setIdea(e.target.value)}
            disabled={!live}
            data-lenis-prevent
            placeholder={
              live ? "e.g. A dashboard for tracking job applications" : "Available once the AI backend is connected"
            }
            className="w-full resize-none rounded-xl border border-line bg-ink-950/60 px-4 py-3 text-[0.9375rem] text-fg outline-none transition-[border-color,box-shadow] placeholder:text-subtle focus:border-accent/60 focus:shadow-[0_0_0_4px_rgb(91_140_255/0.12)] disabled:opacity-60"
          />
          <div className="mt-2 flex flex-wrap gap-1.5">
            {IDEAS.map((i) => (
              <button
                key={i}
                type="button"
                disabled={!live || state.kind === "loading"}
                onClick={() => void generate(i)}
                className="rounded-full border border-line px-2.5 py-1 text-[0.72rem] text-muted transition-colors hover:border-accent/50 hover:text-fg disabled:opacity-40"
              >
                {i}
              </button>
            ))}
          </div>
          <div className="mt-4 flex items-center gap-3">
            <button
              type="submit"
              disabled={!live || state.kind === "loading"}
              className="inline-flex min-h-11 items-center gap-2 rounded-full bg-fg px-5 text-sm font-medium text-ink-950 shadow-[0_8px_30px_-8px_rgb(91_140_255/0.55)] transition-[background-color,opacity] hover:bg-white disabled:opacity-40"
            >
              {state.kind === "loading" ? (
                <Loader2 className="size-4 animate-spin" aria-hidden />
              ) : (
                <Wand2 className="size-4" aria-hidden />
              )}
              {state.kind === "loading" ? "Designing…" : "Generate concept"}
            </button>
            <span className="font-mono text-[0.65rem] text-subtle">{idea.length}/240</span>
          </div>
        </form>

        {!live && <SetupNote backend={backend} />}

        <AnimatePresence>
          {state.kind === "error" && (
            <motion.p
              role="alert"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-4 flex items-start gap-2 rounded-xl border border-red-400/30 bg-red-400/5 p-3 text-sm text-red-200"
            >
              <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
              <span className="flex-1">{state.message}</span>
              {idea.trim().length >= 8 && (
                <button
                  type="button"
                  onClick={() => void generate()}
                  className="inline-flex items-center gap-1 text-fg"
                >
                  <RotateCcw className="size-3.5" aria-hidden /> Retry
                </button>
              )}
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      <div className="min-w-0 lg:col-span-7" aria-live="polite" aria-busy={state.kind === "loading"}>
        <div className="overflow-hidden rounded-2xl border border-line-strong bg-ink-900">
          <div className="flex items-center gap-3 border-b border-line px-4 py-2.5">
            <div aria-hidden className="flex gap-1.5">
              <span className="size-2 rounded-full bg-white/15" />
              <span className="size-2 rounded-full bg-white/15" />
              <span className="size-2 rounded-full bg-white/15" />
            </div>
            <span className="truncate font-mono text-[0.65rem] text-subtle">
              {shown ? shown.spec.title : "concept preview"}
            </span>
            <div role="group" aria-label="View" className="ml-auto flex rounded-full border border-line p-0.5">
              {(["preview", "json"] as const).map((v) => (
                <button
                  key={v}
                  type="button"
                  aria-pressed={view === v}
                  onClick={() => setView(v)}
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-mono text-[0.62rem] uppercase",
                    view === v ? "bg-white/10 text-fg" : "text-subtle hover:text-fg",
                  )}
                >
                  {v === "preview" ? (
                    <LayoutTemplate className="size-3" aria-hidden />
                  ) : (
                    <Braces className="size-3" aria-hidden />
                  )}
                  {v}
                </button>
              ))}
            </div>
          </div>

          <div className="relative min-h-[360px] p-4">
            {state.kind === "loading" ? (
              <Skeleton />
            ) : shown ? (
              view === "preview" ? (
                <Preview spec={shown.spec} />
              ) : (
                <pre
                  data-lenis-prevent
                  className="max-h-[420px] overflow-auto font-mono text-[0.72rem] leading-relaxed text-fg/85"
                >
                  {JSON.stringify(shown.spec, null, 2)}
                </pre>
              )
            ) : (
              <div className="grid min-h-[320px] place-content-center text-center text-sm text-subtle">
                Your generated concept will render here.
              </div>
            )}
            {shown?.sample && (
              <span className="absolute right-3 bottom-3 rounded-md border border-line bg-ink-950/85 px-2 py-1 font-mono text-[0.6rem] text-muted">
                Pre-made sample · not generated live
              </span>
            )}
          </div>
        </div>

        {shown && (
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <p className="label-mono text-subtle">Intent</p>
              <p className="mt-1.5 text-sm leading-relaxed text-muted">{shown.spec.summary}</p>
            </div>
            <div>
              <p className="label-mono text-subtle">Suggested components</p>
              <p className="mt-1.5 flex flex-wrap gap-1.5">
                {shown.spec.components.map((c) => (
                  <code
                    key={c}
                    className="rounded border border-line px-1.5 py-0.5 font-mono text-[0.7rem] text-accent-soft"
                  >
                    {"<"}
                    {c}
                    {" />"}
                  </code>
                ))}
              </p>
              {shown.spec.accessibility.length > 0 && (
                <ul className="mt-3 space-y-1 text-xs text-muted">
                  {shown.spec.accessibility.map((a) => (
                    <li key={a} className="flex gap-2">
                      <span aria-hidden className="mt-1.5 size-1 shrink-0 rounded-full bg-ok" />
                      {a}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function SetupNote({ backend }: { backend: BackendStatus }) {
  const text =
    backend.state === "missing"
      ? "The FastAPI backend isn't connected to this deployment yet (NEXT_PUBLIC_API_URL is not set)."
      : backend.state === "unreachable"
        ? "The FastAPI backend is configured but not reachable right now."
        : backend.state === "checking"
          ? "Checking the backend…"
          : "The backend is running, but no LLM provider key is configured (LLM_PROVIDER / LLM_API_KEY / LLM_MODEL).";
  return (
    <p className="mt-4 rounded-xl border border-dashed border-line-strong p-3 text-xs leading-relaxed text-subtle">
      <span className="text-muted">Setup state.</span> {text} The preview shows a clearly labelled sample instead.
    </p>
  );
}

function Skeleton() {
  return (
    <div className="space-y-3" aria-label="Generating concept">
      {[40, 90, 70, 100].map((w, i) => (
        <motion.div
          key={i}
          className="h-14 rounded-lg bg-white/[0.04]"
          style={{ width: `${w}%` }}
          animate={{ opacity: [0.4, 0.9, 0.4] }}
          transition={{ duration: 1.4, repeat: Infinity, delay: i * 0.15 }}
        />
      ))}
    </div>
  );
}

/* ───────────── Safe renderer: every section kind maps to a fixed component ───────────── */

function Preview({ spec }: { spec: UISpec }) {
  const sidebar = spec.sections.find((s) => s.kind === "sidebar");
  const nav = spec.sections.find((s) => s.kind === "navbar");
  const body = spec.sections.filter((s) => s !== sidebar && s !== nav);
  const grid = spec.layout === "dashboard" || spec.layout === "split" ? "grid gap-3 sm:grid-cols-2" : "grid gap-3";

  return (
    <motion.div
      key={spec.title}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease }}
      className="text-fg"
    >
      {nav && <Section s={nav} />}
      <div className={cn("mt-3 flex gap-3", !nav && "mt-0")}>
        {sidebar && (
          <div className="hidden w-36 shrink-0 sm:block">
            <Section s={sidebar} />
          </div>
        )}
        <div className={cn("min-w-0 flex-1", grid)}>
          {body.map((s, i) => (
            <motion.div
              key={`${s.kind}-${i}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease, delay: 0.05 * i }}
              className={cn(["hero", "table", "cta", "footer", "tabs"].includes(s.kind) && "sm:col-span-2")}
            >
              <Section s={s} />
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

function Frame({ s, children }: { s: UISection; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-white/[0.07] bg-white/[0.025] p-3" title={s.note || undefined}>
      <p className="mb-2 flex items-center justify-between font-mono text-[0.58rem] tracking-wider text-subtle uppercase">
        <span className="truncate">{s.title}</span>
        <span className="text-accent-soft/70">{s.kind}</span>
      </p>
      {children}
    </div>
  );
}

function Section({ s }: { s: UISection }) {
  const items = s.items.length ? s.items : ["Item one", "Item two", "Item three"];
  switch (s.kind) {
    case "navbar":
      return (
        <div className="flex items-center gap-3 rounded-lg border border-white/[0.07] bg-white/[0.025] px-3 py-2">
          <span className="size-3 rounded bg-accent/70" />
          <span className="truncate text-xs font-medium">{s.title}</span>
          <span className="ml-auto hidden gap-3 sm:flex">
            {items.slice(0, 5).map((i) => (
              <span key={i} className="text-[0.65rem] text-muted">
                {i}
              </span>
            ))}
          </span>
        </div>
      );
    case "sidebar":
      return (
        <div className="space-y-1 rounded-lg border border-white/[0.07] bg-white/[0.025] p-2">
          {items.map((i, n) => (
            <div
              key={i}
              className={cn(
                "truncate rounded px-2 py-1 text-[0.68rem]",
                n === 0 ? "bg-accent/15 text-fg" : "text-muted",
              )}
            >
              {i}
            </div>
          ))}
        </div>
      );
    case "hero":
    case "cta":
      return (
        <div className="rounded-lg border border-white/[0.07] bg-[radial-gradient(120%_100%_at_0%_0%,rgb(91_140_255/0.18),transparent_60%)] p-4">
          <p className="text-sm font-medium">{s.title}</p>
          {s.note && <p className="mt-1 text-[0.7rem] text-muted">{s.note}</p>}
          <div className="mt-3 flex gap-2">
            {items.slice(0, 2).map((i, n) => (
              <span
                key={i}
                className={cn(
                  "rounded-full px-2.5 py-1 text-[0.65rem]",
                  n === 0 ? "bg-fg text-ink-950" : "border border-line text-fg",
                )}
              >
                {i}
              </span>
            ))}
          </div>
        </div>
      );
    case "stats":
      return (
        <Frame s={s}>
          <div className="grid grid-cols-2 gap-2">
            {items.slice(0, 4).map((i, n) => (
              <div key={i} className="rounded-md bg-white/[0.03] p-2">
                <p className="truncate text-[0.6rem] text-subtle">{i}</p>
                <p className="mt-0.5 text-sm font-medium tabular-nums">{[128, 24, 96, 12][n]}</p>
              </div>
            ))}
          </div>
        </Frame>
      );
    case "card-grid":
      return (
        <Frame s={s}>
          <div className="grid grid-cols-3 gap-2">
            {items.slice(0, 6).map((i, n) => (
              <div key={i} className="overflow-hidden rounded-md border border-white/[0.06]">
                <div
                  className="aspect-[4/3]"
                  style={{ background: `linear-gradient(${120 + n * 30}deg, rgb(91 140 255 / 0.25), transparent)` }}
                />
                <p className="truncate p-1.5 text-[0.6rem]">{i}</p>
              </div>
            ))}
          </div>
        </Frame>
      );
    case "table":
      return (
        <Frame s={s}>
          <div className="overflow-hidden rounded-md border border-white/[0.06] text-[0.62rem]">
            <div
              className="grid bg-white/[0.04] px-2 py-1.5 text-muted"
              style={{ gridTemplateColumns: `repeat(${Math.min(items.length, 5)}, minmax(0,1fr))` }}
            >
              {items.slice(0, 5).map((i) => (
                <span key={i} className="truncate">
                  {i}
                </span>
              ))}
            </div>
            {[0, 1, 2].map((r) => (
              <div
                key={r}
                className="grid border-t border-white/[0.05] px-2 py-1.5"
                style={{ gridTemplateColumns: `repeat(${Math.min(items.length, 5)}, minmax(0,1fr))` }}
              >
                {items.slice(0, 5).map((i) => (
                  <span key={i} className="h-1.5 w-3/4 self-center rounded-full bg-white/10" />
                ))}
              </div>
            ))}
          </div>
        </Frame>
      );
    case "chart":
      return (
        <Frame s={s}>
          <div className="flex h-20 items-end gap-1.5">
            {[40, 65, 52, 80, 58, 90, 72].map((h, n) => (
              <motion.span
                key={n}
                className="flex-1 rounded-t bg-gradient-to-t from-accent/40 to-violet/70"
                initial={{ height: 0 }}
                animate={{ height: `${h}%` }}
                transition={{ duration: 0.6, ease, delay: n * 0.04 }}
              />
            ))}
          </div>
        </Frame>
      );
    case "form":
      return (
        <Frame s={s}>
          <div className="space-y-2">
            {items.slice(0, 4).map((i) => (
              <div key={i}>
                <p className="text-[0.6rem] text-subtle">{i}</p>
                <div className="mt-0.5 h-6 rounded border border-white/10 bg-ink-950/60" />
              </div>
            ))}
            <div className="h-6 w-24 rounded-full bg-fg/90" />
          </div>
        </Frame>
      );
    case "tabs":
      return (
        <Frame s={s}>
          <div className="flex gap-1 border-b border-white/[0.06] pb-1.5">
            {items.slice(0, 5).map((i, n) => (
              <span
                key={i}
                className={cn("rounded px-2 py-0.5 text-[0.62rem]", n === 0 ? "bg-white/10 text-fg" : "text-muted")}
              >
                {i}
              </span>
            ))}
          </div>
          <div className="mt-2 h-10 rounded bg-white/[0.03]" />
        </Frame>
      );
    case "list":
      return (
        <Frame s={s}>
          <ul className="space-y-1.5">
            {items.slice(0, 6).map((i) => (
              <li key={i} className="flex items-center gap-2 text-[0.68rem] text-fg/85">
                <span className="size-1.5 rounded-full bg-accent-soft" />
                {i}
              </li>
            ))}
          </ul>
        </Frame>
      );
    case "footer":
      return (
        <div className="flex flex-wrap gap-3 rounded-lg border border-white/[0.07] px-3 py-2 text-[0.6rem] text-subtle">
          {items.map((i) => (
            <span key={i}>{i}</span>
          ))}
        </div>
      );
  }
}
