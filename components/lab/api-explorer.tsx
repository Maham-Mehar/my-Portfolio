"use client";

import { ExternalLink, Loader2, Play } from "lucide-react";
import { Fragment, useState } from "react";
import { API_URL } from "@/lib/api";
import type { BackendStatus } from "@/lib/use-backend";
import { cn } from "@/lib/utils";
import { SetupNote } from "./ui-concept";

interface Preset {
  id: string;
  label: string;
  path: string;
  expect: string;
  explain: string;
}

const PRESETS: Preset[] = [
  {
    id: "search",
    label: "Search projects",
    path: "/api/projects?q=api",
    expect: "200",
    explain: "`q` is a validated query parameter (2–60 chars). Results are ranked by how many fields match.",
  },
  {
    id: "filter",
    label: "Filter by area",
    path: "/api/projects?interest=marketplace",
    expect: "200",
    explain: "`interest` is a `Literal[...]` type in Pydantic — only known values are accepted.",
  },
  {
    id: "invalid",
    label: "Too-short query",
    path: "/api/projects?q=a",
    expect: "422",
    explain: "FastAPI rejects the request before the handler runs and explains exactly which rule failed.",
  },
  {
    id: "project",
    label: "Get one project",
    path: "/api/projects/pawmart",
    expect: "200",
    explain: "A path parameter constrained by a regex pattern, returning a typed `Project` model.",
  },
  {
    id: "missing",
    label: "Unknown project",
    path: "/api/projects/not-a-project",
    expect: "404",
    explain: "Missing resources raise `HTTPException(404)`, mapped to a consistent `{ detail, code }` body.",
  },
  {
    id: "skills",
    label: "Learning skills",
    path: "/api/skills?level=growing",
    expect: "200",
    explain: "Filters skill groups to what's currently being learned — the same honesty rule the site follows.",
  },
  {
    id: "health",
    label: "Health",
    path: "/health",
    expect: "200",
    explain: "Reports whether an LLM is configured without ever exposing the key.",
  },
];

const SCHEMA = `class ProjectMatch(BaseModel):
    id: str
    title: str
    category: str
    stack: list[str]
    score: int  # fields that matched

@app.get("/api/projects")
def search_projects(
    q: Annotated[str | None,
        Query(min_length=2, max_length=60)] = None,
    interest: Interest | None = None,
) -> ProjectSearchResponse: ...`;

/** GET with a timeout, returning the parsed body and round-trip time. */
async function timedGet(url: string) {
  const started = performance.now();
  const res = await fetch(url, { signal: AbortSignal.timeout(10_000) });
  const body: unknown = await res.json().catch(() => null);
  return { status: res.status, ms: Math.round(performance.now() - started), body };
}

type Result = { status: number; ms: number; body: unknown; url: string } | { error: string; url: string };

export function ApiExplorer({ backend }: { backend: BackendStatus }) {
  const reachable = backend.state === "ready";
  const [preset, setPreset] = useState<Preset>(PRESETS[0]!);
  const [path, setPath] = useState(PRESETS[0]!.path);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);

  async function send(p = path) {
    if (!API_URL) return;
    const clean = p.startsWith("/") ? p : `/${p}`;
    if (!/^\/(api\/|health)/.test(clean)) {
      setResult({ error: "Only this API's /api/* and /health routes can be called from here.", url: clean });
      return;
    }
    const url = `${API_URL}${clean}`;
    setLoading(true);
    try {
      setResult({ ...(await timedGet(url)), url });
    } catch {
      setResult({ error: "Request failed — the backend may be offline.", url });
    } finally {
      setLoading(false);
    }
  }

  function choose(p: Preset) {
    setPreset(p);
    setPath(p.path);
    if (reachable) void send(p.path);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-12">
      <div className="min-w-0 lg:col-span-5">
        <p className="text-sm leading-relaxed text-muted">
          The AI features on this page run on a small <span className="text-fg">Python + FastAPI</span> service — part
          of learning the backend side properly. Send real requests and watch validation, status codes and typed
          responses at work.
        </p>

        <div role="group" aria-label="Example requests" className="mt-5 flex flex-wrap gap-1.5">
          {PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              aria-pressed={preset.id === p.id}
              onClick={() => choose(p)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition-colors",
                preset.id === p.id ? "border-accent/50 bg-accent/10 text-fg" : "border-line text-muted hover:text-fg",
              )}
            >
              {p.label}
              <span className={cn("font-mono text-[0.6rem]", p.expect === "200" ? "text-ok" : "text-violet")}>
                {p.expect}
              </span>
            </button>
          ))}
        </div>

        <p className="mt-4 text-sm leading-relaxed text-muted">
          <Code text={preset.explain} />
        </p>

        <div className="mt-5 overflow-hidden rounded-xl border border-line bg-ink-950/80">
          <p className="border-b border-line px-4 py-2 font-mono text-[0.65rem] text-subtle">
            backend/app/main.py · simplified
          </p>
          <pre
            data-lenis-prevent
            className="no-scrollbar overflow-x-auto p-4 font-mono text-[0.72rem] leading-relaxed text-fg/85"
          >
            {SCHEMA}
          </pre>
        </div>
      </div>

      <div className="min-w-0 lg:col-span-7">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void send();
          }}
          className="flex items-center gap-2 rounded-2xl border border-line bg-ink-950/60 p-1.5 pl-3"
        >
          <span className="rounded-md bg-ok/15 px-2 py-1 font-mono text-[0.68rem] font-semibold text-ok">GET</span>
          <label htmlFor="api-path" className="sr-only">
            Request path
          </label>
          <input
            id="api-path"
            value={path}
            onChange={(e) => setPath(e.target.value)}
            disabled={!reachable}
            spellCheck={false}
            autoComplete="off"
            className="min-w-0 flex-1 bg-transparent py-2 font-mono text-[0.8rem] text-fg outline-none disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={!reachable || loading}
            className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-fg px-4 text-sm font-medium text-ink-950 disabled:opacity-40"
          >
            {loading ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : (
              <Play className="size-3.5 fill-current" aria-hidden />
            )}
            Send
          </button>
        </form>

        {!reachable && <SetupNote backend={backend} />}

        <div className="mt-4 overflow-hidden rounded-2xl border border-line-strong bg-ink-900" aria-live="polite">
          <div className="flex flex-wrap items-center gap-3 border-b border-line px-4 py-2.5 font-mono text-[0.68rem]">
            <span className="text-subtle">Response</span>
            {result && "status" in result && (
              <>
                <span
                  className={cn(
                    "rounded px-1.5 py-0.5 font-semibold",
                    result.status < 300
                      ? "bg-ok/15 text-ok"
                      : result.status < 500
                        ? "bg-violet/15 text-violet"
                        : "bg-red-400/15 text-red-300",
                  )}
                >
                  {result.status}
                </span>
                <span className="text-subtle">{result.ms} ms</span>
              </>
            )}
            {API_URL && reachable && (
              <a
                href={`${API_URL}/docs`}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-auto inline-flex items-center gap-1 text-accent-soft hover:text-fg"
              >
                Swagger docs <ExternalLink className="size-3" aria-hidden />
              </a>
            )}
          </div>
          <pre
            data-lenis-prevent
            className="max-h-[440px] min-h-[300px] overflow-auto p-4 font-mono text-[0.72rem] leading-relaxed text-fg/85"
          >
            {result ? (
              "error" in result ? (
                <span className="text-red-300">{result.error}</span>
              ) : (
                <Json value={result.body} />
              )
            ) : reachable ? (
              <span className="text-subtle">Pick an example or press Send.</span>
            ) : (
              <span className="text-subtle">Responses appear here once the backend is reachable.</span>
            )}
          </pre>
        </div>
      </div>
    </div>
  );
}

/** Renders `backticked` spans as inline code. */
function Code({ text }: { text: string }) {
  return (
    <>
      {text.split(/(`[^`]+`)/g).map((part, i) =>
        part.startsWith("`") ? (
          <code key={i} className="rounded bg-white/[0.06] px-1 font-mono text-[0.8em] text-accent-soft">
            {part.slice(1, -1)}
          </code>
        ) : (
          <Fragment key={i}>{part}</Fragment>
        ),
      )}
    </>
  );
}

/** Lightweight JSON highlighter — rendered as React text, never HTML. */
function Json({ value }: { value: unknown }) {
  const text = JSON.stringify(value, null, 2) ?? "null";
  const parts = text.split(/("(?:\\.|[^"\\])*"(?:\s*:)?|\b(?:true|false|null)\b|-?\d+(?:\.\d+)?)/g);
  return (
    <>
      {parts.map((p, i) => {
        if (!p) return null;
        const cls = /^".*":$/.test(p.replace(/\s/g, ""))
          ? "text-accent-soft"
          : p.startsWith('"')
            ? "text-[#9be3c6]"
            : /^(true|false|null)$/.test(p)
              ? "text-violet"
              : /^-?\d/.test(p)
                ? "text-[#f5c98b]"
                : undefined;
        return cls ? (
          <span key={i} className={cls}>
            {p}
          </span>
        ) : (
          <Fragment key={i}>{p}</Fragment>
        );
      })}
    </>
  );
}
