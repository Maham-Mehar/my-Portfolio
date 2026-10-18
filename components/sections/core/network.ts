/**
 * Shared model for the hero's neural core — used by both the WebGL renderer
 * and the Canvas 2D fallback so they look and behave the same.
 */

export interface Node3 {
  x: number;
  y: number;
  z: number;
  /** Per-node phase for the gentle breathing offset. */
  phase: number;
}

export interface Network {
  nodes: Node3[];
  edges: Array<[number, number]>;
  adjacency: number[][];
  /** One node per capability label. */
  anchors: number[];
  /** Anchor + two rings of neighbours, lit when a capability is selected. */
  clusters: Set<number>[];
}

/** Evenly spread points on a sphere, slightly jittered so it reads as organic. */
function fibonacciSphere(count: number): Node3[] {
  const nodes: Node3[] = [];
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < count; i++) {
    const y = 1 - (i / (count - 1)) * 2;
    const r = Math.sqrt(1 - y * y);
    const theta = golden * i;
    const jitter = 0.94 + ((((Math.sin(i * 12.9898) * 43758.5453) % 1) + 1) % 1) * 0.12;
    nodes.push({ x: Math.cos(theta) * r * jitter, y: y * jitter, z: Math.sin(theta) * r * jitter, phase: i * 0.37 });
  }
  return nodes;
}

/** Connect every node to its k nearest neighbours (deduplicated). */
function buildEdges(nodes: Node3[], k: number) {
  const edges: Array<[number, number]> = [];
  const seen = new Set<string>();
  const adjacency: number[][] = nodes.map(() => []);
  nodes.forEach((a, i) => {
    nodes
      .map((b, j) => ({ j, d: (a.x - b.x) ** 2 + (a.y - b.y) ** 2 + (a.z - b.z) ** 2 }))
      .filter((n) => n.j !== i)
      .sort((p, q) => p.d - q.d)
      .slice(0, k)
      .forEach(({ j }) => {
        const key = i < j ? `${i}-${j}` : `${j}-${i}`;
        if (seen.has(key)) return;
        seen.add(key);
        edges.push([i, j]);
        adjacency[i]!.push(j);
        adjacency[j]!.push(i);
      });
  });
  return { edges, adjacency };
}

/** Anchor each capability to a node spread around the sphere's middle band. */
function pickAnchors(nodes: Node3[], count: number): number[] {
  return Array.from({ length: count }, (_, i) => {
    const angle = (i / count) * Math.PI * 2 + 0.4;
    const lat = (i % 2 === 0 ? 0.32 : -0.28) + (i % 3) * 0.06;
    const target = { x: Math.cos(angle), y: lat, z: Math.sin(angle) };
    let best = 0;
    let bestD = Infinity;
    nodes.forEach((n, j) => {
      const d = (n.x - target.x) ** 2 + (n.y - target.y) ** 2 + (n.z - target.z) ** 2;
      if (d < bestD) {
        bestD = d;
        best = j;
      }
    });
    return best;
  });
}

export function createNetwork(nodeCount: number, capabilityCount: number): Network {
  const nodes = fibonacciSphere(nodeCount);
  const { edges, adjacency } = buildEdges(nodes, 3);
  const anchors = pickAnchors(nodes, capabilityCount);
  const clusters = anchors.map((a) => new Set([a, ...adjacency[a]!, ...adjacency[a]!.flatMap((n) => adjacency[n]!)]));
  return { nodes, edges, adjacency, anchors, clusters };
}

/* ───────────── Signals ───────────── */

export interface Pulse {
  from: number;
  to: number;
  t: number;
  speed: number;
  hops: number;
  color: number;
}

/** Signals hop along links; with a capability selected they drift toward it. */
export class PulseField {
  readonly pulses: Pulse[] = [];

  constructor(
    private readonly net: Network,
    private readonly max: number,
    private readonly colors: number,
  ) {}

  private spawn(origin?: number) {
    const { nodes, adjacency } = this.net;
    const from = origin ?? Math.floor(Math.random() * nodes.length);
    const nbrs = adjacency[from]!;
    if (!nbrs.length) return;
    this.pulses.push({
      from,
      to: nbrs[Math.floor(Math.random() * nbrs.length)]!,
      t: 0,
      speed: 0.9 + Math.random() * 0.8,
      hops: 4 + Math.floor(Math.random() * 5),
      color: Math.floor(Math.random() * this.colors),
    });
  }

  private hop(p: Pulse, selected: number | null) {
    const { nodes, adjacency, anchors } = this.net;
    const nbrs = adjacency[p.to]!.filter((n) => n !== p.from);
    if (!nbrs.length || p.hops <= 0) return false;
    let next = nbrs[Math.floor(Math.random() * nbrs.length)]!;
    if (selected !== null && Math.random() < 0.75) {
      const a = nodes[anchors[selected]!]!;
      const d = (m: number) => (nodes[m]!.x - a.x) ** 2 + (nodes[m]!.y - a.y) ** 2 + (nodes[m]!.z - a.z) ** 2;
      next = nbrs.reduce((best, n) => (d(n) < d(best) ? n : best), next);
    }
    p.from = p.to;
    p.to = next;
    p.t = 0;
    p.hops--;
    return true;
  }

  update(dt: number, selected: number | null, energy: number) {
    const rate = (selected !== null ? 7 : 4) + energy * 4;
    if (this.pulses.length < this.max && Math.random() < rate * dt) {
      this.spawn(selected !== null && Math.random() < 0.3 ? this.net.anchors[selected] : undefined);
    }
    for (let i = this.pulses.length - 1; i >= 0; i--) {
      const p = this.pulses[i]!;
      p.t += dt * p.speed * 1.6;
      if (p.t >= 1 && !this.hop(p, selected)) this.pulses.splice(i, 1);
    }
  }
}

/* ───────────── Shared helpers ───────────── */

export const easeOut = (t: number) => 1 - Math.pow(1 - Math.min(1, Math.max(0, t)), 3);

export type RGB = readonly [number, number, number];

export function readPalette() {
  const css = getComputedStyle(document.documentElement);
  const hex = (name: string, fallback: string): RGB => {
    const v = css.getPropertyValue(name).trim() || fallback;
    const n = parseInt(v.replace("#", ""), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  };
  return {
    fg: hex("--color-fg", "#e9edf7"),
    accent: hex("--color-accent", "#5b8cff"),
    soft: hex("--color-accent-soft", "#8fb0ff"),
    violet: hex("--color-violet", "#9d8cff"),
    cyan: hex("--color-cyan", "#7ee3f5"),
  };
}
export type Palette = ReturnType<typeof readPalette>;

/** Seconds until the hero choreography starts (after the intro, if it plays). */
export function introDelay(): number {
  return parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--intro-delay")) || 0.15;
}

export interface Pointer {
  inside: boolean;
  /** -0.5…0.5 across the stage */
  x: number;
  y: number;
  /** stage-local pixels */
  sx: number;
  sy: number;
}

export interface CoreRuntime {
  stage: HTMLDivElement;
  canvas: HTMLCanvasElement;
  labels: Array<HTMLElement | null>;
  pointer: Pointer;
  getSelected: () => number | null;
  capabilityCount: number;
  reduce: boolean;
  small: boolean;
  onStats: (text: string) => void;
  /** Lets the component repaint a static (reduced-motion) frame after a selection change. */
  setRedraw: (fn: () => void) => void;
  /** WebGL only: called if the GPU context is lost so the 2D fallback can take over. */
  onFail?: () => void;
}

/** Places floating labels beside their anchor nodes, clamped inside the stage. */
export function placeLabels(
  rt: CoreRuntime,
  sizes: Array<[number, number]>,
  anchorsScreen: Array<{ x: number; y: number; front: number }>,
  w: number,
  h: number,
  form: number,
) {
  const cx = w / 2;
  const cy = h / 2;
  const selected = rt.getSelected();
  anchorsScreen.forEach((p, i) => {
    const el = rt.labels[i];
    if (!el) return;
    const dx = p.x - cx;
    const dy = p.y - cy;
    const len = Math.hypot(dx, dy) || 1;
    const [lw, lh] = sizes[i] ?? [0, 0];
    const ox = (dx / len) * 16;
    const oy = (dy / len) * 16;
    const left = Math.min(w - lw - 2, Math.max(2, dx < 0 ? p.x + ox - lw : p.x + ox));
    const top = Math.min(h - lh - 2, Math.max(2, p.y + oy - lh / 2));
    el.style.transform = `translate3d(${left}px, ${top}px, 0)`;
    el.style.opacity = String(form * (selected === i ? 1 : 0.15 + p.front * 0.75));
  });
}

/**
 * Shared lifecycle: sizing, label measurement, and a render loop that only
 * runs while the stage is on screen and the tab is visible.
 */
export function runLoop(
  rt: CoreRuntime,
  hooks: {
    resize: (w: number, h: number) => void;
    frame: (now: number, dt: number, labelSizes: Array<[number, number]>) => void;
  },
) {
  let sizes: Array<[number, number]> = [];
  const measure = () => {
    sizes = rt.labels.map((el) => [el?.offsetWidth ?? 0, el?.offsetHeight ?? 0]);
  };
  let last = performance.now();
  const tick = (now: number) => {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    hooks.frame(now, dt, sizes);
  };
  const resize = () => {
    measure();
    const r = rt.stage.getBoundingClientRect();
    hooks.resize(r.width, r.height);
    if (rt.reduce) tick(performance.now());
  };

  let frame = 0;
  let running = false;
  const loop = (now: number) => {
    tick(now);
    frame = requestAnimationFrame(loop);
  };
  const play = () => {
    if (running || rt.reduce) return;
    running = true;
    last = performance.now();
    frame = requestAnimationFrame(loop);
  };
  const pause = () => {
    running = false;
    cancelAnimationFrame(frame);
  };

  const ro = new ResizeObserver(resize);
  ro.observe(rt.stage);
  resize();
  document.fonts?.ready.then(measure).catch(() => {});
  if (rt.reduce) rt.setRedraw(() => tick(performance.now()));

  let onScreen = true;
  const io = new IntersectionObserver(([entry]) => {
    onScreen = entry?.isIntersecting ?? true;
    if (onScreen && !document.hidden) play();
    else pause();
  });
  io.observe(rt.stage);
  const onVis = () => (document.hidden || !onScreen ? pause() : play());
  document.addEventListener("visibilitychange", onVis);

  return {
    stop() {
      pause();
      rt.setRedraw(() => {});
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
    },
  };
}
