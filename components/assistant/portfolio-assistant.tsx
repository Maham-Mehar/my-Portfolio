"use client";

import { AnimatePresence, motion } from "motion/react";
import { AlertCircle, ArrowUp, ArrowUpRight, RotateCcw, Sparkles, Square, X } from "lucide-react";
import { Fragment, useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { ApiError, getHealth, streamChat, type ChatTurn, type Health } from "@/lib/api";
import { answer, ownerName, starterQuestions, type AnswerLink } from "@/lib/assistant";
import { site } from "@/data/site";
import { ease } from "@/lib/motion";
import { useReducedMotion } from "@/lib/use-reduced-motion";
import { cn } from "@/lib/utils";

const noopSubscribe = () => () => {};

const { subject: they, object: them, possessive: their } = site.pronouns;
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** Recruiter-focused prompts for live mode (the local engine has its own). */
const liveStarters = [
  `Summarize ${their} strengths for a hiring manager`,
  "Which projects show React and Next.js?",
  `What's ${their} experience with Python and FastAPI?`,
  `${cap(they === "they" ? "do they" : `does ${they}`)} work with backend technologies?`,
  `How can I contact ${them} about a role?`,
];

type Mode = { kind: "checking" } | { kind: "live"; provider: string } | { kind: "local"; reason: string };

type UserMessage = { id: number; role: "user"; text: string };
type BotMessage = {
  id: number;
  role: "assistant";
  text: string;
  source: "live" | "local";
  status: "streaming" | "done" | "error";
  links?: AnswerLink[];
  next?: string[];
  error?: string;
  question: string;
};
type Message = UserMessage | BotMessage;

const SECTION_LINKS: Record<string, string> = {
  "#projects": "Projects",
  "#expertise": "Skills",
  "#experience": "Experience",
  "#lab": "AI Lab",
  "#contact": "Contact",
};

function describeMode(health: Health | null, configuredUrl: boolean): Mode {
  if (health?.llm.configured) return { kind: "live", provider: health.llm.provider ?? "LLM" };
  if (!configuredUrl) return { kind: "local", reason: "AI backend not configured" };
  if (!health) return { kind: "local", reason: "AI backend unreachable" };
  return { kind: "local", reason: "LLM key not configured on the server" };
}

/**
 * "Ask My Portfolio". Live mode streams grounded answers from the FastAPI
 * backend's LLM endpoint; without it, the local answer engine responds and
 * the header says so. Conversations aren't stored anywhere.
 */
export function PortfolioAssistant() {
  const reduce = useReducedMotion();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [mode, setMode] = useState<Mode>({ kind: "checking" });
  const [busy, setBusy] = useState(false);
  const launcher = useRef<HTMLButtonElement>(null);
  const field = useRef<HTMLInputElement>(null);
  const log = useRef<HTMLDivElement>(null);
  const nextId = useRef(0);
  const abort = useRef<AbortController | null>(null);
  const pendingAsk = useRef<string | null>(null);
  const shortcut = useSyncExternalStore(
    noopSubscribe,
    () => (/Mac|iPhone|iPad/.test(navigator.userAgent) ? "⌘K" : "Ctrl K"),
    () => "Ctrl K",
  );

  const close = useCallback(() => {
    setOpen(false);
    launcher.current?.focus();
  }, []);

  // Probe the backend the first time the panel opens.
  useEffect(() => {
    if (!open || mode.kind !== "checking") return;
    let cancelled = false;
    getHealth().then((h) => {
      if (!cancelled) setMode(describeMode(h, Boolean(process.env.NEXT_PUBLIC_API_URL)));
    });
    return () => {
      cancelled = true;
    };
  }, [open, mode.kind]);

  // ⌘K / Ctrl+K toggles, Escape closes.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      } else if (e.key === "Escape" && open) {
        close();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, close]);

  useEffect(() => {
    if (open) field.current?.focus();
  }, [open]);

  useEffect(() => {
    log.current?.scrollTo({ top: log.current.scrollHeight, behavior: reduce ? "auto" : "smooth" });
  }, [messages, reduce]);

  useEffect(() => () => abort.current?.abort(), []);

  const update = (id: number, patch: Partial<BotMessage>) =>
    setMessages((all) => all.map((m) => (m.id === id && m.role === "assistant" ? { ...m, ...patch } : m)));

  const answerLocally = useCallback((id: number, q: string) => {
    const local = answer(q);
    setMessages((all) =>
      all.map((m) =>
        m.id === id ? { ...m, ...local, source: "local" as const, status: "done" as const, error: undefined } : m,
      ),
    );
  }, []);

  const runLive = useCallback(
    async (id: number, q: string, history: ChatTurn[]) => {
      const controller = new AbortController();
      abort.current = controller;
      setBusy(true);
      let text = "";
      try {
        for await (const chunk of streamChat([...history, { role: "user", content: q }], controller.signal)) {
          text += chunk;
          update(id, { text });
        }
        update(id, { status: text ? "done" : "error", error: text ? undefined : "The answer came back empty." });
      } catch (err) {
        if ((err as Error).name === "AbortError") {
          update(id, { status: "done", text: text || "Stopped." });
        } else if (err instanceof ApiError && err.status === 503 && /configured/i.test(err.message)) {
          setMode({ kind: "local", reason: "LLM key not configured on the server" });
          answerLocally(id, q);
        } else {
          const message = err instanceof ApiError ? err.message : "Something went wrong.";
          update(id, { status: "error", error: message, text });
        }
      } finally {
        setBusy(false);
        abort.current = null;
      }
    },
    [answerLocally],
  );

  const ask = useCallback(
    (question: string) => {
      const q = question.trim().slice(0, 500);
      if (!q || busy || mode.kind === "checking") return;
      const replyId = nextId.current + 1;
      nextId.current += 2;
      const history: ChatTurn[] = messages
        .filter((m) => m.role === "user" || (m.source === "live" && m.status === "done"))
        .slice(-10)
        .map((m) => ({ role: m.role, content: m.text }));
      setMessages((m) => [
        ...m,
        { id: replyId - 1, role: "user", text: q },
        {
          id: replyId,
          role: "assistant",
          text: "",
          source: mode.kind === "live" ? "live" : "local",
          status: "streaming",
          question: q,
        },
      ]);
      setInput("");
      if (mode.kind === "live") void runLive(replyId, q, history);
      else answerLocally(replyId, q);
    },
    [busy, mode.kind, messages, runLive, answerLocally],
  );

  function retry(m: BotMessage) {
    setMessages((all) => all.filter((x) => x.id !== m.id && x.id !== m.id - 1));
    // Re-asked by the pending-question effect once state settles, so history excludes the failed turn.
    pendingAsk.current = m.question;
  }

  // Other parts of the page can open the panel with a question (askAssistant()).
  useEffect(() => {
    function onAsk(e: Event) {
      const q = (e as CustomEvent<string>).detail;
      setOpen(true);
      pendingAsk.current = q;
    }
    window.addEventListener("assistant:ask", onAsk);
    return () => window.removeEventListener("assistant:ask", onAsk);
  }, []);

  useEffect(() => {
    if (open && mode.kind !== "checking" && pendingAsk.current && !busy) {
      // Deferred a tick so the re-ask sees freshly committed messages.
      const q = pendingAsk.current;
      pendingAsk.current = null;
      const t = window.setTimeout(() => ask(q), 0);
      return () => window.clearTimeout(t);
    }
  }, [open, mode.kind, busy, ask, messages]);

  const lastBot = [...messages].reverse().find((m): m is BotMessage => m.role === "assistant");
  const suggestions =
    lastBot?.source === "local" && lastBot.next?.length
      ? lastBot.next
      : mode.kind === "live"
        ? liveStarters
        : starterQuestions;

  return (
    <>
      {/* Outer wrapper carries the CSS entrance; the button animates open/closed. */}
      <div
        className="stage-in fixed right-4 bottom-4 z-[70] sm:right-6 sm:bottom-6"
        style={{ "--d": "1.4s" } as React.CSSProperties}
      >
        <motion.button
          ref={launcher}
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="portfolio-assistant"
          animate={{ opacity: open ? 0 : 1, scale: open ? 0.9 : 1 }}
          transition={{ duration: 0.35, ease }}
          className={cn(
            "group inline-flex min-h-12 items-center gap-2.5 rounded-full border border-accent/30 bg-ink-900/85 p-1.5 text-sm text-fg shadow-[0_10px_40px_-10px_rgb(91_140_255/0.7)] backdrop-blur-xl transition-colors hover:border-accent/60 sm:pr-4",
            open && "pointer-events-none",
          )}
        >
          <span className="relative grid size-9 place-items-center rounded-full bg-gradient-to-br from-accent to-violet text-white">
            <Sparkles className="size-4" aria-hidden />
            <span
              aria-hidden
              className="absolute inset-0 rounded-full bg-accent/40 [animation:pulse-dot_2.8s_ease-in-out_infinite] blur-md"
            />
          </span>
          <span className="sr-only sm:not-sr-only">Ask my portfolio</span>
          <kbd className="hidden rounded border border-line px-1.5 py-0.5 font-mono text-[0.62rem] text-subtle sm:inline">
            {shortcut}
          </kbd>
        </motion.button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            id="portfolio-assistant"
            role="dialog"
            aria-labelledby="assistant-title"
            initial={{ opacity: 0, y: 24, scale: 0.97, filter: "blur(8px)" }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: 16, scale: 0.98, filter: "blur(6px)" }}
            transition={{ duration: 0.45, ease }}
            className="fixed inset-x-3 bottom-3 z-[80] flex max-h-[min(680px,calc(100dvh-1.5rem))] origin-bottom-right flex-col overflow-hidden rounded-3xl border border-line-strong bg-ink-900/95 shadow-[0_40px_120px_-30px_rgb(0_0_0/0.9),0_0_0_1px_rgb(91_140_255/0.08)] backdrop-blur-2xl sm:inset-x-auto sm:right-6 sm:bottom-6 sm:w-[440px]"
          >
            <header className="flex items-start gap-3 border-b border-line p-4">
              <span className="grid size-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-accent to-violet text-white">
                <Sparkles className="size-4" aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <h2 id="assistant-title" className="text-sm font-medium text-fg">
                  Ask my portfolio
                  {ownerName !== "this portfolio" && <span className="text-muted"> · {ownerName}</span>}
                </h2>
                <ModeBadge mode={mode} />
              </div>
              <button
                type="button"
                onClick={close}
                aria-label="Close assistant"
                className="grid size-9 shrink-0 place-items-center rounded-full text-muted transition-colors hover:bg-white/5 hover:text-fg"
              >
                <X className="size-4" aria-hidden />
              </button>
            </header>

            <div ref={log} data-lenis-prevent className="flex-1 space-y-3 overflow-y-auto p-4">
              {messages.length === 0 && (
                <div className="text-sm leading-relaxed text-muted">
                  <p>Hiring or scoping a project? Ask about projects, skills, experience or how to get in touch.</p>
                  {mode.kind === "local" && (
                    <p className="mt-3 rounded-xl border border-dashed border-line-strong p-3 text-xs text-subtle">
                      Offline mode: answers come from a local index of this portfolio, not an AI model. Connect the
                      FastAPI backend with an LLM key to enable live answers (see README).
                    </p>
                  )}
                </div>
              )}
              {messages.map((m) =>
                m.role === "user" ? (
                  <motion.p
                    key={m.id}
                    initial={reduce ? false : { opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, ease }}
                    className="ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-md bg-accent/90 px-3.5 py-2 text-sm text-white"
                  >
                    {m.text}
                  </motion.p>
                ) : (
                  <BotBubble
                    key={m.id}
                    message={m}
                    onRetry={() => retry(m)}
                    onNavigate={() => {
                      if (window.matchMedia("(max-width: 639px)").matches) setOpen(false);
                    }}
                  />
                ),
              )}
              {/* One polite announcement per finished answer for screen readers. */}
              <p className="sr-only" aria-live="polite">
                {lastBot?.status === "done" ? lastBot.text : lastBot?.status === "error" ? lastBot.error : ""}
              </p>
            </div>

            <div className="border-t border-line p-3">
              <div className="no-scrollbar -mx-3 mb-3 flex gap-1.5 overflow-x-auto px-3">
                {suggestions.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => ask(s)}
                    disabled={busy || mode.kind === "checking"}
                    className="shrink-0 rounded-full border border-line px-3 py-1.5 text-xs whitespace-nowrap text-muted transition-colors hover:border-accent/50 hover:text-fg disabled:opacity-50"
                  >
                    {s}
                  </button>
                ))}
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  ask(input);
                }}
                className="flex items-center gap-2 rounded-2xl border border-line bg-ink-950/60 p-1.5 pl-3.5 transition-colors focus-within:border-accent/50"
              >
                <label htmlFor="assistant-input" className="sr-only">
                  Your question
                </label>
                <input
                  ref={field}
                  id="assistant-input"
                  value={input}
                  maxLength={500}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="e.g. Which projects use Next.js?"
                  autoComplete="off"
                  className="min-w-0 flex-1 bg-transparent py-2 text-sm text-fg outline-none placeholder:text-subtle"
                />
                {busy ? (
                  <button
                    type="button"
                    onClick={() => abort.current?.abort()}
                    aria-label="Stop answer"
                    className="grid size-9 shrink-0 place-items-center rounded-xl border border-line-strong text-fg"
                  >
                    <Square className="size-3.5 fill-current" aria-hidden />
                  </button>
                ) : (
                  <button
                    type="submit"
                    aria-label="Ask"
                    disabled={!input.trim() || mode.kind === "checking"}
                    className="grid size-9 shrink-0 place-items-center rounded-xl bg-fg text-ink-950 transition-opacity disabled:opacity-30"
                  >
                    <ArrowUp className="size-4" aria-hidden />
                  </button>
                )}
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function ModeBadge({ mode }: { mode: Mode }) {
  if (mode.kind === "checking") {
    return <p className="mt-0.5 font-mono text-[0.62rem] text-subtle">Connecting…</p>;
  }
  if (mode.kind === "live") {
    return (
      <p className="mt-0.5 flex items-center gap-1.5 font-mono text-[0.62rem] text-subtle">
        <span className="size-1.5 rounded-full bg-ok" aria-hidden />
        Live · {mode.provider} via FastAPI · grounded in portfolio data
      </p>
    );
  }
  return (
    <p className="mt-0.5 flex items-center gap-1.5 font-mono text-[0.62rem] text-subtle">
      <span className="size-1.5 rounded-full bg-subtle" aria-hidden />
      Offline mode · {mode.reason} · local answers
    </p>
  );
}

function BotBubble({
  message,
  onRetry,
  onNavigate,
}: {
  message: BotMessage;
  onRetry: () => void;
  onNavigate: () => void;
}) {
  const sectionLinks = Object.entries(SECTION_LINKS)
    .filter(([hash]) => message.source === "live" && message.status === "done" && message.text.includes(hash))
    .map(([href, label]) => ({ href, label }));
  const links = message.links ?? sectionLinks;

  return (
    <div className="max-w-[94%]" aria-busy={message.status === "streaming"}>
      <div className="rounded-2xl rounded-bl-md border border-line bg-white/[0.03] px-3.5 py-2.5 text-sm leading-relaxed text-fg/90">
        {message.text ? (
          <RichText text={message.text} />
        ) : message.status === "streaming" ? (
          <span className="inline-flex gap-1 py-1" aria-label="Thinking">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="size-1.5 rounded-full bg-accent-soft [animation:pulse-dot_1s_ease-in-out_infinite]"
                style={{ animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </span>
        ) : null}
        {message.status === "streaming" && message.text && (
          <span aria-hidden className="ml-0.5 inline-block h-3.5 w-px translate-y-0.5 bg-accent-soft" />
        )}
        {message.status === "error" && (
          <div
            className={cn(
              "flex items-start gap-2 text-xs text-red-300",
              message.text && "mt-2 border-t border-line pt-2",
            )}
          >
            <AlertCircle className="mt-px size-3.5 shrink-0" aria-hidden />
            <span className="flex-1">{message.error}</span>
            <button
              type="button"
              onClick={onRetry}
              className="inline-flex items-center gap-1 rounded-full border border-line-strong px-2 py-0.5 text-fg hover:border-accent/60"
            >
              <RotateCcw className="size-3" aria-hidden /> Retry
            </button>
          </div>
        )}
      </div>
      {message.status === "done" && links.length > 0 && (
        <motion.ul
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease }}
          className="mt-2 flex flex-wrap gap-1.5"
        >
          {links.map((link) => {
            const external = /^https?:/.test(link.href);
            return (
              <li key={link.href}>
                <a
                  href={link.href}
                  onClick={external ? undefined : onNavigate}
                  {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                  className="inline-flex min-h-8 items-center gap-1 rounded-full border border-accent/30 bg-accent/10 px-3 text-xs text-accent-soft transition-colors hover:border-accent/60 hover:text-fg"
                >
                  {link.label}
                  <ArrowUpRight className="size-3" aria-hidden />
                </a>
              </li>
            );
          })}
        </motion.ul>
      )}
      {message.source === "local" && message.status === "done" && (
        <p className="mt-1 pl-1 font-mono text-[0.58rem] text-subtle">local answer · not AI-generated</p>
      )}
    </div>
  );
}

/** Minimal, safe Markdown: paragraphs, "-" bullets and **bold**. Rendered as text — never HTML. */
function RichText({ text }: { text: string }) {
  const blocks = text.trim().split(/\n{2,}/);
  return (
    <>
      {blocks.map((block, bi) => {
        const lines = block.split("\n");
        const bullets = lines.every((l) => /^\s*([-*•]|\d+\.)\s+/.test(l));
        if (bullets) {
          return (
            <ul key={bi} className={cn("space-y-1", bi > 0 && "mt-2")}>
              {lines.map((l, li) => (
                <li key={li} className="flex gap-2">
                  <span aria-hidden className="mt-[0.55rem] h-px w-2.5 shrink-0 bg-accent-soft" />
                  <span>{inline(l.replace(/^\s*([-*•]|\d+\.)\s+/, ""))}</span>
                </li>
              ))}
            </ul>
          );
        }
        return (
          <p key={bi} className={cn(bi > 0 && "mt-2")}>
            {lines.map((l, li) => (
              <Fragment key={li}>
                {li > 0 && <br />}
                {inline(l)}
              </Fragment>
            ))}
          </p>
        );
      })}
    </>
  );
}

function inline(s: string) {
  return s.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    /^\*\*[^*]+\*\*$/.test(part) ? (
      <strong key={i} className="font-medium text-fg">
        {part.slice(2, -2)}
      </strong>
    ) : (
      part
    ),
  );
}
