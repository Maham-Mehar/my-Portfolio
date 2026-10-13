"use client";

import { Braces, Component, LayoutTemplate } from "lucide-react";
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "motion/react";
import { useEffect, useRef, useState } from "react";
import { accentHex } from "@/components/ui/project-media";
import { projects } from "@/data/projects";
import { cn } from "@/lib/utils";

const layers = [
  { id: "data", label: "Data", icon: Braces, caption: "Typed data drives the page — here, the real project list from this site." },
  { id: "components", label: "Components", icon: Component, caption: "Small, reusable components compose that data into sections." },
  { id: "interface", label: "Interface", icon: LayoutTemplate, caption: "The result: a responsive interface people actually use." },
] as const;

type LayerId = (typeof layers)[number]["id"];

const positions: Record<LayerId, string> = {
  data: "top-0 left-0",
  components: "top-[17%] left-[9%]",
  interface: "top-[34%] left-[18%]",
};

export function HeroVisual() {
  const reduce = useReducedMotion();
  const [active, setActive] = useState<LayerId>("interface");
  const [interacted, setInteracted] = useState(false);
  const [hovering, setHovering] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Pointer tilt — desktop, fine pointers, motion allowed.
  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const rotateY = useSpring(useTransform(px, [-0.5, 0.5], [-6, 6]), { stiffness: 120, damping: 20 });
  const rotateX = useSpring(useTransform(py, [-0.5, 0.5], [5, -5]), { stiffness: 120, damping: 20 });

  // Gentle auto-advance until the visitor takes over.
  useEffect(() => {
    if (reduce || interacted || hovering) return;
    const t = window.setInterval(() => {
      setActive((current) => {
        const i = layers.findIndex((l) => l.id === current);
        return layers[(i + 1) % layers.length]!.id;
      });
    }, 3800);
    return () => window.clearInterval(t);
  }, [reduce, interacted, hovering]);

  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (reduce || e.pointerType !== "mouse" || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    px.set((e.clientX - rect.left) / rect.width - 0.5);
    py.set((e.clientY - rect.top) / rect.height - 0.5);
  }

  function select(id: LayerId) {
    setInteracted(true);
    setActive(id);
  }

  const activeLayer = layers.find((l) => l.id === active)!;

  return (
    <div className="relative">
      {/* Layer selector */}
      <div role="group" aria-label="Explore how this page is built" className="mb-5 flex flex-wrap items-center gap-2">
        {layers.map((layer, i) => {
          const Icon = layer.icon;
          const isActive = active === layer.id;
          return (
            <button
              key={layer.id}
              type="button"
              aria-pressed={isActive}
              onClick={() => select(layer.id)}
              className={cn(
                "inline-flex min-h-9 items-center gap-2 rounded-full border px-3 text-xs transition-colors",
                isActive
                  ? "border-accent/50 bg-accent/10 text-fg"
                  : "border-line text-muted hover:border-line-strong hover:text-fg",
              )}
            >
              <span className="hidden font-mono text-[0.65rem] text-subtle sm:inline">0{i + 1}</span>
              <Icon className="size-3.5" aria-hidden />
              {layer.label}
            </button>
          );
        })}
      </div>

      <p className="sr-only" aria-live="polite">
        {activeLayer.label} layer: {activeLayer.caption}
      </p>

      <div
        ref={ref}
        onPointerMove={onPointerMove}
        onPointerEnter={() => setHovering(true)}
        onPointerLeave={() => {
          setHovering(false);
          px.set(0);
          py.set(0);
        }}
        className="relative [perspective:1400px]"
        aria-hidden
      >
        <motion.div
          style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
          className="relative h-[380px] sm:h-[440px]"
        >
          {/* Connector rail */}
          <div className="absolute top-[8%] bottom-[8%] left-[3%] w-px bg-gradient-to-b from-accent/0 via-accent/40 to-violet/0" />

          {layers.map((layer, i) => {
            const isActive = active === layer.id;
            return (
              <motion.div
                key={layer.id}
                onClick={() => select(layer.id)}
                animate={{
                  opacity: isActive ? 1 : 0.42,
                  scale: isActive ? 1 : 0.975,
                }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                style={{ zIndex: isActive ? 30 : 10 + i }}
                className={cn(
                  "absolute w-[82%] cursor-pointer overflow-hidden rounded-2xl border bg-ink-900/95 backdrop-blur-md",
                  "shadow-[0_30px_60px_-30px_rgb(0_0_0/0.9)] transition-[border-color] duration-500",
                  isActive ? "border-accent/35" : "border-line",
                  positions[layer.id],
                )}
              >
                <PanelHeader index={i + 1} label={layer.label} active={isActive} />
                {layer.id === "data" && <DataPanel />}
                {layer.id === "components" && <ComponentsPanel />}
                {layer.id === "interface" && <InterfacePanel />}
              </motion.div>
            );
          })}
        </motion.div>
      </div>

      <p className="mt-4 min-h-10 text-xs leading-relaxed text-subtle">{activeLayer.caption}</p>
    </div>
  );
}

function PanelHeader({ index, label, active }: { index: number; label: string; active: boolean }) {
  return (
    <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
      <span className="label-mono text-[0.6rem] text-subtle">
        0{index} · {label}
      </span>
      <span className={cn("size-1.5 rounded-full transition-colors", active ? "bg-accent" : "bg-white/15")} />
    </div>
  );
}

function DataPanel() {
  return (
    <div className="space-y-3 p-4 font-mono text-[0.7rem] leading-relaxed">
      <div className="text-muted">
        <span className="text-violet">type</span> <span className="text-cyan">Project</span> = {"{"}
        <div className="pl-4">
          title: <span className="text-cyan">string</span>;
          <br />
          stack: <span className="text-cyan">string</span>[];
        </div>
        {"}"};
      </div>
      <div className="space-y-1.5 rounded-lg border border-line bg-ink-950/60 p-3">
        {projects.map((p) => (
          <div key={p.id} className="flex items-center gap-2 truncate text-fg/80">
            <span className="text-subtle">{"{"}</span>
            title: <span className="truncate text-[#9be3c6]">&quot;{p.title}&quot;</span>
            <span className="text-subtle">{"}"}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ComponentsPanel() {
  const rows: Array<{ depth: number; name: string; note?: string }> = [
    { depth: 0, name: "<Page>" },
    { depth: 1, name: "<Hero />" },
    { depth: 1, name: "<ProjectShowcase>" },
    { depth: 2, name: "<ProjectCard />", note: `× ${projects.length}` },
    { depth: 1, name: "<Experience />" },
    { depth: 1, name: "<Contact />" },
  ];
  return (
    <ul className="space-y-1 p-4 font-mono text-[0.72rem]">
      {rows.map((r, i) => (
        <li key={i} className="flex items-center gap-2" style={{ paddingLeft: r.depth * 18 }}>
          {r.depth > 0 && <span className="h-px w-3 bg-line-strong" />}
          <span className={r.depth === 2 ? "text-accent-soft" : "text-fg/80"}>{r.name}</span>
          {r.note && <span className="rounded bg-accent/15 px-1.5 text-[0.62rem] text-accent-soft">{r.note}</span>}
        </li>
      ))}
    </ul>
  );
}

function InterfacePanel() {
  return (
    <div className="space-y-3 p-4">
      <div className="flex items-center gap-2">
        <div className="h-2 w-16 rounded-full bg-white/25" />
        <div className="ml-auto h-2 w-8 rounded-full bg-white/10" />
        <div className="h-2 w-8 rounded-full bg-white/10" />
      </div>
      <div className="h-3 w-3/4 rounded bg-white/20" />
      <div className="grid grid-cols-3 gap-2 pt-1">
        {projects.map((p) => (
          <div key={p.id} className="overflow-hidden rounded-lg border border-line bg-white/[0.02]">
            <div
              className="aspect-[4/3]"
              style={{
                background: `linear-gradient(140deg, ${accentHex[p.accent]}55, transparent 75%)`,
              }}
            />
            <div className="p-2">
              <div className="truncate text-[0.6rem] font-medium text-fg/85">{p.title}</div>
              <div className="mt-1 truncate font-mono text-[0.52rem] text-subtle">{p.category.split(" · ")[0]}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
