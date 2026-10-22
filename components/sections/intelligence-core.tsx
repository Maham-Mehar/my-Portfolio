"use client";

import { motion, useSpring, useTransform } from "motion/react";
import { useReducedMotion } from "@/lib/use-reduced-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { start2D } from "./core/canvas2d";
import type { CoreRuntime, Pointer } from "./core/network";

export interface Capability {
  name: string;
  group: string;
  level: string;
  levelNote: string;
  /** Featured projects that list this technology in their stack. */
  projects: string[];
}

type Renderer = "pending" | "webgl" | "2d";

/** WebGL only where it pays off: desktop-sized, motion allowed, and actually supported. */
function pickRenderer(reduce: boolean): Renderer {
  if (reduce || window.matchMedia("(max-width: 767px)").matches) return "2d";
  try {
    const probe = document.createElement("canvas");
    return probe.getContext("webgl2") || probe.getContext("webgl") ? "webgl" : "2d";
  } catch {
    return "2d";
  }
}

/* ───────────── Component ───────────── */

export function IntelligenceCore({ capabilities }: { capabilities: Capability[] }) {
  const reduce = useReducedMotion();
  const stage = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const labels = useRef<Array<HTMLSpanElement | null>>([]);
  const selectedRef = useRef<number | null>(null);
  const pointer = useRef<Pointer>({ x: 0, y: 0, inside: false, sx: -9999, sy: -9999 });

  const [selected, setSelected] = useState<number | null>(null);
  const [interacted, setInteracted] = useState(false);
  const [hovering, setHovering] = useState(false);
  const hoverRef = useRef(false);
  const statsEl = useRef<HTMLSpanElement>(null);
  /** Repaints the static frame (reduced motion) after a selection change. */
  const redraw = useRef<() => void>(() => {});

  // Cursor parallax for the DOM layers around the canvas.
  const lx = useSpring(0, { stiffness: 60, damping: 18 });
  const ly = useSpring(0, { stiffness: 60, damping: 18 });
  const rx = useTransform(lx, (v) => -v * 0.6);
  const ry = useTransform(ly, (v) => -v * 0.6);

  const select = useCallback((i: number | null, byUser: boolean) => {
    selectedRef.current = i;
    setSelected(i);
    if (byUser) setInteracted(true);
    redraw.current();
  }, []);

  /* Selections now come from the Core Stack section's cards (see stack-deck.tsx). */
  useEffect(() => {
    function onSelect(e: Event) {
      const name = (e as CustomEvent<string | null>).detail;
      const i = name ? capabilities.findIndex((c) => c.name === name) : -1;
      select(i >= 0 ? i : null, true);
    }
    window.addEventListener("core:select", onSelect);
    return () => window.removeEventListener("core:select", onSelect);
  }, [capabilities, select]);

  /* Ambient: gently walk through capabilities (two loops) until the visitor takes over. */
  useEffect(() => {
    if (reduce || interacted) return;
    let step = 0;
    const total = capabilities.length * 2;
    const t = window.setInterval(() => {
      if (document.hidden || hoverRef.current) return;
      if (step >= total) {
        select(null, false);
        window.clearInterval(t);
        return;
      }
      select(step % capabilities.length, false);
      step++;
    }, 3200);
    return () => window.clearInterval(t);
  }, [reduce, interacted, capabilities.length, select]);

  /* Choose a renderer once on the client (WebGL on capable desktops, Canvas 2D otherwise). */
  const [renderer, setRenderer] = useState<Renderer>("pending");
  useEffect(() => {
    // Deferred so the choice (which needs browser APIs) never affects hydration.
    const t = window.setTimeout(() => setRenderer(pickRenderer(reduce)), 0);
    return () => window.clearTimeout(t);
  }, [reduce]);

  useEffect(() => {
    const cv = canvas.current;
    const st = stage.current;
    if (!cv || !st || renderer === "pending") return;

    const runtime: CoreRuntime = {
      stage: st,
      canvas: cv,
      labels: labels.current,
      pointer: pointer.current,
      getSelected: () => selectedRef.current,
      capabilityCount: capabilities.length,
      reduce,
      small: window.matchMedia("(max-width: 767px)").matches,
      onStats: (text) => {
        if (statsEl.current) statsEl.current.textContent = text;
      },
      setRedraw: (fn) => {
        redraw.current = fn;
      },
      onFail: () => setRenderer("2d"),
    };

    if (renderer === "2d") return start2D(runtime);

    let stop: (() => void) | undefined;
    let cancelled = false;
    import("./core/webgl")
      .then((m) => m.startWebGL(runtime))
      .then((s) => (cancelled ? s() : (stop = s)))
      .catch(() => !cancelled && setRenderer("2d"));
    return () => {
      cancelled = true;
      stop?.();
    };
  }, [renderer, reduce, capabilities.length]);

  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (e.pointerType !== "mouse" || !stage.current) return;
    const r = stage.current.getBoundingClientRect();
    const p = pointer.current;
    p.sx = e.clientX - r.left;
    p.sy = e.clientY - r.top;
    p.x = p.sx / r.width - 0.5;
    p.y = p.sy / r.height - 0.5;
    p.inside = true;
    if (!reduce) {
      lx.set(p.x * 22);
      ly.set(p.y * 22);
    }
  }

  function onPointerLeave() {
    pointer.current.inside = false;
    hoverRef.current = false;
    setHovering(false);
    lx.set(0);
    ly.set(0);
  }

  return (
    <div className="relative">
      <div
        ref={stage}
        onPointerMove={onPointerMove}
        onPointerEnter={(e) => {
          if (e.pointerType !== "mouse") return;
          hoverRef.current = true;
          setHovering(true);
        }}
        onPointerLeave={onPointerLeave}
        data-active={hovering || selected !== null ? "" : undefined}
        className="group/core relative mx-auto aspect-square w-full max-w-[min(560px,100%)]"
      >
        {/* Light: the core's glow, a little stronger while engaged */}
        <motion.div
          aria-hidden
          style={{ x: lx, y: ly }}
          className="absolute inset-[18%] rounded-full bg-[radial-gradient(closest-side,rgb(91_140_255/0.32),rgb(157_140_255/0.12)_55%,transparent)] opacity-70 blur-2xl transition-opacity duration-700 group-data-[active]/core:opacity-100"
        />
        <div
          aria-hidden
          className="absolute inset-[42%] rounded-full bg-[radial-gradient(closest-side,rgb(233_237_247/0.55),rgb(126_227_245/0.18)_45%,transparent)] blur-md [animation:pulse-dot_5s_ease-in-out_infinite]"
        />

        {/* Orbit rings in perspective — they drift opposite to the glow for depth */}
        <motion.div
          aria-hidden
          style={{ x: rx, y: ry }}
          className={cn("absolute inset-0 [perspective:900px]", renderer === "webgl" && "hidden")}
        >
          <div className="core-ring absolute inset-[6%] rounded-full border border-accent-soft/15 [--tilt:74deg] [animation-duration:60s]">
            <span className="absolute top-1/2 -left-1 size-2 -translate-y-1/2 rounded-full bg-cyan shadow-[0_0_12px_rgb(126_227_245/0.9)]" />
          </div>
          <div className="core-ring absolute inset-[14%] rounded-full border border-dashed border-violet/20 [--tilt:66deg] [animation-direction:reverse] [animation-duration:90s]">
            <span className="absolute -top-1 left-1/2 size-1.5 -translate-x-1/2 rounded-full bg-violet shadow-[0_0_10px_rgb(157_140_255/0.9)]" />
          </div>
        </motion.div>

        {/* A fresh canvas per renderer: a canvas can't switch between 2D and WebGL contexts. */}
        <canvas key={renderer} ref={canvas} aria-hidden className="absolute inset-0 size-full" />

        {/* Capability labels — decorative; the console below is the accessible control */}
        <div aria-hidden className="pointer-events-none absolute inset-0">
          {capabilities.map((c, i) => (
            <span
              key={c.name}
              ref={(el) => {
                labels.current[i] = el;
              }}
              className={cn(
                "absolute top-0 left-0 rounded-full border px-2 py-0.5 font-mono text-[0.62rem] whitespace-nowrap opacity-0 backdrop-blur-sm transition-[color,border-color,background-color,box-shadow] duration-500 sm:text-[0.68rem]",
                selected === i
                  ? "border-cyan/50 bg-cyan/10 text-fg shadow-[0_0_20px_-4px_rgb(126_227_245/0.7)]"
                  : "border-line bg-ink-950/50 text-muted",
              )}
            >
              {c.name}
            </span>
          ))}
        </div>

        {/* Readouts removed for a cleaner hero; stats stay available to the renderer. */}
        <span ref={statsEl} hidden />
      </div>
    </div>
  );
}
