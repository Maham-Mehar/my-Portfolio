"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

const INTERACTIVE = 'a, button, [role="button"], [role="tab"], input, textarea, select, summary, label';

type CursorState = { kind: "idle" } | { kind: "hover" } | { kind: "label"; text: string };

/**
 * One pointer listener for the whole page:
 *  • a soft follower ring that grows over interactive elements and can show
 *    a short label (set `data-cursor="Label"` on an element);
 *  • writes --mx / --my onto every [data-spotlight] ancestor under the pointer.
 * The native cursor is never hidden. Mouse/trackpad only; off for reduced motion.
 */
export function PointerEffects() {
  const ring = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  const [enabled, setEnabled] = useState(false);
  const [state, setState] = useState<CursorState>({ kind: "idle" });

  useEffect(() => {
    const mq = window.matchMedia("(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)");
    const update = () => setEnabled(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (!enabled) return;
    const target = { x: -100, y: -100 };
    const pos = { x: -100, y: -100 };
    let visible = false;
    let frame = 0;
    let lastKey = "idle";

    function tick() {
      pos.x += (target.x - pos.x) * 0.18;
      pos.y += (target.y - pos.y) * 0.18;
      if (ring.current) ring.current.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0)`;
      if (dot.current) dot.current.style.transform = `translate3d(${target.x}px, ${target.y}px, 0)`;
      frame = requestAnimationFrame(tick);
    }
    frame = requestAnimationFrame(tick);

    function onMove(e: PointerEvent) {
      if (e.pointerType !== "mouse") return;
      target.x = e.clientX;
      target.y = e.clientY;
      if (!visible) {
        visible = true;
        pos.x = target.x;
        pos.y = target.y;
        ring.current?.parentElement?.setAttribute("data-visible", "");
      }

      const el = e.target as Element | null;

      // Spotlights (nested ones each get their own local coordinates).
      let spot = el?.closest<HTMLElement>("[data-spotlight]");
      while (spot) {
        const r = spot.getBoundingClientRect();
        spot.style.setProperty("--mx", `${e.clientX - r.left}px`);
        spot.style.setProperty("--my", `${e.clientY - r.top}px`);
        spot = spot.parentElement?.closest<HTMLElement>("[data-spotlight]");
      }

      // Cursor state — only re-render when it actually changes.
      const labelled = el?.closest<HTMLElement>("[data-cursor]");
      const next: CursorState = labelled
        ? { kind: "label", text: labelled.dataset.cursor ?? "" }
        : el?.closest(INTERACTIVE)
          ? { kind: "hover" }
          : { kind: "idle" };
      const key = next.kind === "label" ? `label:${next.text}` : next.kind;
      if (key !== lastKey) {
        lastKey = key;
        setState(next);
      }
    }

    function onLeave() {
      visible = false;
      ring.current?.parentElement?.removeAttribute("data-visible");
    }

    window.addEventListener("pointermove", onMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("pointerleave", onLeave);
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <div aria-hidden className="group/cursor pointer-events-none fixed inset-0 z-[150] opacity-0 transition-opacity duration-300 data-[visible]:opacity-100">
      <div ref={ring} className="absolute top-0 left-0 will-change-transform">
        <div
          className={cn(
            "grid -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border transition-[width,height,background-color,border-color] duration-300 ease-out-quint",
            state.kind === "idle" && "size-8 border-accent-soft/40",
            state.kind === "hover" && "size-12 border-accent-soft/70 bg-accent/10",
            state.kind === "label" && "size-20 border-transparent bg-fg text-ink-950",
          )}
        >
          {state.kind === "label" && <span className="label-mono text-[0.6rem] font-semibold">{state.text}</span>}
        </div>
      </div>
      <div
        ref={dot}
        className={cn(
          "absolute top-0 left-0 will-change-transform transition-opacity duration-200",
          state.kind === "label" && "opacity-0",
        )}
      >
        <div className="size-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent-soft" />
      </div>
    </div>
  );
}
