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

/* ───────────── Orbit control (shared by both renderers) ───────────── */

type Quat = [number, number, number, number]; // x, y, z, w

function qMul(a: Quat, b: Quat): Quat {
  const [ax, ay, az, aw] = a;
  const [bx, by, bz, bw] = b;
  return [
    aw * bx + ax * bw + ay * bz - az * by,
    aw * by - ax * bz + ay * bw + az * bx,
    aw * bz + ax * by - ay * bx + az * bw,
    aw * bw - ax * bx - ay * by - az * bz,
  ];
}
function qAxis(x: number, y: number, z: number, angle: number): Quat {
  const s = Math.sin(angle / 2);
  return [x * s, y * s, z * s, Math.cos(angle / 2)];
}
function qNormalize(q: Quat): Quat {
  const l = Math.hypot(...q) || 1;
  return [q[0] / l, q[1] / l, q[2] / l, q[3] / l];
}

export interface Orbit {
  /** Current orientation as a quaternion [x, y, z, w] (Three.js convention: +y up, +z toward the viewer). */
  readonly quaternion: Quat;
  /** Rotates a point by the current orientation (same convention). */
  apply(x: number, y: number, z: number): [number, number, number];
  /** Total horizontal / vertical rotation so far — used for gentle parallax on decorative layers. */
  readonly yaw: number;
  readonly pitch: number;
  /** Advance one frame; call once per rendered frame. */
  update(dt: number): void;
  dispose(): void;
}

const IDLE_SPEED = 0.12; // rad/s before anyone interacts
const MAX_YAW_SPEED = 0.95; // rad/s — a full turn takes ~6.6s at most
const MAX_PITCH_SPEED = 0.6;
const MIN_CRUISE = 0.2; // once a direction is chosen, the speed never fades below this
const ACCEL = 2.2; // how quickly the actual speed eases toward the target (1/s)

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const cruise = (v: number, max: number) => (v === 0 ? 0 : Math.sign(v) * clamp(Math.abs(v), MIN_CRUISE, max));

/**
 * Mouse-steered, persistent rotation — like spinning a real ball.
 *
 * Each pointer movement sets a *target angular velocity* (direction from the
 * movement's sign, speed from how fast it moved). Every frame the actual
 * velocity eases toward that target and is applied as a small extra turn
 * around the SCREEN's axes (vertical axis for left/right, horizontal axis for
 * up/down), on top of the current orientation. So:
 *   • the globe always starts from where it is — no jumps or resets;
 *   • it keeps turning in the last chosen direction after the mouse stops;
 *   • moving the other way smoothly decelerates and reverses it;
 *   • "right" always rolls the front of the globe to the right, whatever its tilt.
 *
 *  • mouse: anywhere over the hero section;  • touch: dragging on the globe
 *    (vertical page scrolling stays native via touch-action: pan-y).
 */
export function createOrbit(stage: HTMLElement, reduce: boolean): Orbit {
  const host = (stage.closest("section") as HTMLElement | null) ?? stage;
  // Same starting orientation as before: tilted 0.28 rad toward the viewer, turned 0.6 rad.
  let q: Quat = qNormalize(qMul(qAxis(1, 0, 0, 0.28), qAxis(0, 1, 0, 0.6)));
  let yawTotal = 0;
  let pitchTotal = 0;
  let yawVel = IDLE_SPEED;
  let pitchVel = 0;
  let yawTarget = IDLE_SPEED;
  let pitchTarget = 0;
  let last: { x: number; y: number; t: number } | null = null;
  let dragId: number | null = null;
  const m = new Float64Array(9); // rotation matrix cache for apply()

  function refreshMatrix() {
    const [x, y, z, w] = q;
    m[0] = 1 - 2 * (y * y + z * z);
    m[1] = 2 * (x * y - z * w);
    m[2] = 2 * (x * z + y * w);
    m[3] = 2 * (x * y + z * w);
    m[4] = 1 - 2 * (x * x + z * z);
    m[5] = 2 * (y * z - x * w);
    m[6] = 2 * (x * z - y * w);
    m[7] = 2 * (y * z + x * w);
    m[8] = 1 - 2 * (x * x + y * y);
  }
  refreshMatrix();

  /** dx, dy in px over dtMs → new target velocities (blended so one jittery event can't flip direction). */
  function steer(dx: number, dy: number, dtMs: number) {
    const dt = clamp(dtMs, 12, 120) / 1000;
    if (Math.abs(dx) >= 1) {
      const want = clamp((dx / dt) * 0.0009, -MAX_YAW_SPEED, MAX_YAW_SPEED);
      yawTarget = cruise(yawTarget * 0.6 + want * 0.4, MAX_YAW_SPEED);
    }
    if (Math.abs(dy) >= 1) {
      const want = clamp((dy / dt) * 0.0007, -MAX_PITCH_SPEED, MAX_PITCH_SPEED);
      pitchTarget = cruise(pitchTarget * 0.6 + want * 0.4, MAX_PITCH_SPEED);
    }
  }

  const onMove = (e: PointerEvent) => {
    if (e.pointerType !== "mouse" && e.pointerId !== dragId) return;
    const now = performance.now();
    if (last) steer(e.clientX - last.x, e.clientY - last.y, now - last.t);
    last = { x: e.clientX, y: e.clientY, t: now };
  };
  // Leaving the hero only forgets the last pointer position — the chosen rotation keeps going.
  const onLeave = () => {
    last = null;
  };
  const onDown = (e: PointerEvent) => {
    if (e.pointerType === "mouse") return;
    dragId = e.pointerId;
    last = { x: e.clientX, y: e.clientY, t: performance.now() };
  };
  const onUp = (e: PointerEvent) => {
    if (e.pointerId === dragId) {
      dragId = null;
      last = null;
    }
  };

  if (!reduce) {
    host.addEventListener("pointermove", onMove);
    host.addEventListener("pointerleave", onLeave);
    stage.addEventListener("pointerdown", onDown);
    stage.addEventListener("pointerup", onUp);
    stage.addEventListener("pointercancel", onUp);
    stage.style.touchAction = "pan-y";
  }

  return {
    get quaternion() {
      return q;
    },
    apply(x, y, z) {
      return [m[0]! * x + m[1]! * y + m[2]! * z, m[3]! * x + m[4]! * y + m[5]! * z, m[6]! * x + m[7]! * y + m[8]! * z];
    },
    get yaw() {
      return yawTotal;
    },
    get pitch() {
      return pitchTotal;
    },
    update(dt) {
      if (reduce) return;
      const k = Math.min(1, dt * ACCEL); // smooth acceleration, deceleration and reversal
      yawVel += (yawTarget - yawVel) * k;
      pitchVel += (pitchTarget - pitchVel) * k;
      const dYaw = yawVel * dt;
      const dPitch = pitchVel * dt;
      yawTotal += dYaw;
      pitchTotal += dPitch;
      // Pre-multiply = rotate about the fixed screen axes, starting from the current orientation.
      q = qNormalize(qMul(qMul(qAxis(0, 1, 0, dYaw), qAxis(1, 0, 0, dPitch)), q));
      refreshMatrix();
    },
    dispose() {
      host.removeEventListener("pointermove", onMove);
      host.removeEventListener("pointerleave", onLeave);
      stage.removeEventListener("pointerdown", onDown);
      stage.removeEventListener("pointerup", onUp);
      stage.removeEventListener("pointercancel", onUp);
    },
  };
}
