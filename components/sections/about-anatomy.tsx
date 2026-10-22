"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "@/lib/use-reduced-motion";
import { cn } from "@/lib/utils";

/* ───────────── Content: the four layers of an interface ───────────── */

export const LAYERS = [
  {
    id: "design",
    name: "Design",
    title: "Start with the person using it.",
    body: "I turn Figma designs into precise, responsive and accessible layouts that hold up on every screen.",
    tags: ["Figma → code", "Responsive UI", "Accessibility"],
  },
  {
    id: "components",
    name: "Components",
    title: "Make it reusable.",
    body: "Small, typed React components with clear props, so pages stay consistent and new screens come together fast.",
    tags: ["React.js", "TypeScript", "Tailwind CSS"],
  },
  {
    id: "data",
    name: "Data",
    title: "Connect it to real data.",
    body: "API integration with loading, error and empty states planned up front, backed by PHP experience and growing Python skills.",
    tags: ["Next.js", "REST APIs", "Python · FastAPI"],
  },
  {
    id: "intelligence",
    name: "Intelligence",
    title: "Make it intelligent.",
    body: "I build the parts of AI products people touch, like prompts, streamed responses and clear error states.",
    tags: ["AI interfaces", "Streaming UI", "LLM integration"],
  },
] as const;

type LayerId = (typeof LAYERS)[number]["id"];

/* ───────────── The exploded 3D stack ───────────── */

function LayerArt({ id }: { id: LayerId }) {
  // Tiny, purely decorative illustrations — one per layer.
  if (id === "design")
    return (
      <div className="grid h-full grid-cols-6 grid-rows-4 gap-1.5 p-4">
        <div className="col-span-6 rounded-sm border border-dashed border-accent-soft/50" />
        <div className="col-span-4 row-span-2 rounded-sm border border-dashed border-accent-soft/40" />
        <div className="col-span-2 row-span-2 rounded-sm border border-dashed border-violet/40" />
        <div className="col-span-3 rounded-sm border border-dashed border-accent-soft/30" />
        <div className="col-span-3 rounded-sm border border-dashed border-accent-soft/30" />
      </div>
    );
  if (id === "components")
    return (
      <div className="grid h-full grid-cols-3 gap-2 p-4">
        {["<Nav />", "<Hero />", "<Card />", "<Button />", "<Tag />", "<Form />"].map((c) => (
          <span
            key={c}
            className="grid place-items-center rounded-md border border-accent/40 bg-accent/10 font-mono text-[0.55rem] text-accent-soft"
          >
            {c}
          </span>
        ))}
      </div>
    );
  if (id === "data")
    return (
      <div className="flex h-full flex-col justify-center gap-1.5 p-4 font-mono text-[0.55rem] leading-tight">
        <span className="text-violet">GET /api/projects</span>
        <span className="text-muted">{"{ status: 200,"}</span>
        <span className="pl-3 text-cyan">{"data: [ … ] }"}</span>
        <span className="mt-1 h-px w-2/3 bg-gradient-to-r from-cyan/70 to-transparent" />
      </div>
    );
  return (
    <svg viewBox="0 0 120 80" className="h-full w-full p-3" aria-hidden>
      {[
        [20, 20, 60, 40],
        [60, 40, 100, 18],
        [60, 40, 98, 62],
        [20, 60, 60, 40],
        [20, 20, 20, 60],
      ].map(([x1, y1, x2, y2], i) => (
        <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="var(--color-cyan)" strokeOpacity="0.55" />
      ))}
      {[
        [20, 20],
        [60, 40],
        [100, 18],
        [98, 62],
        [20, 60],
      ].map(([cx, cy], i) => (
        <circle
          key={i}
          cx={cx}
          cy={cy}
          r={i === 1 ? 5 : 3}
          fill={i === 1 ? "var(--color-cyan)" : "var(--color-accent-soft)"}
        />
      ))}
    </svg>
  );
}

function LayerStack({ active }: { active: number }) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  function onMove(e: React.PointerEvent) {
    if (reduce || e.pointerType !== "mouse" || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    setTilt({ x: ((e.clientX - r.left) / r.width - 0.5) * 10, y: ((e.clientY - r.top) / r.height - 0.5) * -8 });
  }

  return (
    <div
      ref={ref}
      onPointerMove={onMove}
      onPointerLeave={() => setTilt({ x: 0, y: 0 })}
      className="relative mx-auto aspect-square w-full max-w-[460px] [perspective:1400px]"
      aria-hidden
    >
      {/* Soft light under the stack */}
      <div className="absolute inset-[18%] rounded-full bg-[radial-gradient(closest-side,rgb(91_140_255/0.22),transparent)] blur-2xl" />
      <div
        className="absolute inset-0 transition-transform duration-700 ease-out-quint [transform-style:preserve-3d]"
        style={{ transform: `rotateX(${56 + tilt.y}deg) rotateZ(${-38 + tilt.x}deg)` }}
      >
        {LAYERS.map((layer, i) => {
          const on = i === active;
          const done = i < active;
          // Bottom layer first; each sits higher. The active one lifts out of the stack.
          const z = i * 58 + (on ? 34 : 0);
          return (
            <div
              key={layer.id}
              className={cn(
                "absolute inset-[16%] rounded-2xl border backdrop-blur-[2px] transition-[transform,border-color,background-color,box-shadow,opacity] duration-700 ease-out-quint",
                on
                  ? "border-cyan/60 bg-ink-900/85 shadow-[0_0_60px_-10px_rgb(126_227_245/0.55)]"
                  : done
                    ? "border-accent/35 bg-ink-900/70 opacity-60"
                    : "border-line-strong bg-ink-900/40 opacity-25", // layers still to come stay faint
              )}
              style={{ transform: `translateZ(${z}px)` }}
            >
              <LayerArt id={layer.id} />
              <span
                className={cn(
                  "absolute -top-6 left-1 font-mono text-[0.6rem] tracking-[0.16em] uppercase transition-colors duration-500",
                  on ? "text-cyan" : "text-subtle",
                )}
              >
                {String(i + 1).padStart(2, "0")} · {layer.name}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ───────────── Chapters + sticky stack ───────────── */

export function AboutAnatomy() {
  const [active, setActive] = useState(0);
  const chapters = useRef<Array<HTMLLIElement | null>>([]);

  // The chapter crossing the middle band of the viewport drives the stack.
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setActive(Number((e.target as HTMLElement).dataset.index));
      },
      { rootMargin: "-45% 0px -45% 0px" },
    );
    chapters.current.forEach((el) => el && io.observe(el));
    return () => io.disconnect();
  }, []);

  return (
    <div className="mt-16 grid gap-10 sm:mt-20 lg:grid-cols-12 lg:gap-12">
      <div className="lg:col-span-5">
        <div className="lg:sticky lg:top-28">
          <LayerStack active={active} />
          {/* Progress rail */}
          <ol aria-hidden className="mt-4 flex justify-center gap-2">
            {LAYERS.map((l, i) => (
              <li
                key={l.id}
                className={cn(
                  "h-1 rounded-full transition-all duration-500",
                  i === active ? "w-8 bg-cyan" : i < active ? "w-3 bg-accent/60" : "w-3 bg-white/10",
                )}
              />
            ))}
          </ol>
        </div>
      </div>

      <ol className="space-y-6 lg:col-span-7 lg:space-y-[22vh] lg:py-[8vh]">
        {LAYERS.map((layer, i) => {
          const on = i === active;
          return (
            <li
              key={layer.id}
              ref={(el) => {
                chapters.current[i] = el;
              }}
              data-index={i}
              className={cn(
                "relative rounded-2xl border p-6 transition-[border-color,background-color,opacity] duration-500 sm:p-8",
                on ? "border-cyan/35 bg-ink-900/60" : "border-line bg-transparent lg:opacity-45",
              )}
            >
              <p className="flex items-center gap-3 font-mono text-[0.7rem] tracking-[0.16em] uppercase">
                <span className={on ? "text-cyan" : "text-accent-soft"}>Layer {String(i + 1).padStart(2, "0")}</span>
                <span aria-hidden className="h-px w-6 bg-line-strong" />
                <span className="text-subtle">{layer.name}</span>
              </p>
              <h3 className="mt-4 text-xl font-medium tracking-[-0.02em] text-balance text-fg sm:text-2xl">
                {layer.title}
              </h3>
              <p className="mt-3 max-w-xl text-base leading-relaxed text-pretty text-muted">{layer.body}</p>
              <ul className="mt-5 flex flex-wrap gap-1.5">
                {layer.tags.map((t) => (
                  <li
                    key={t}
                    className="rounded-md border border-line bg-white/[0.025] px-2 py-1 font-mono text-[0.68rem] text-accent-soft"
                  >
                    {t}
                  </li>
                ))}
              </ul>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
