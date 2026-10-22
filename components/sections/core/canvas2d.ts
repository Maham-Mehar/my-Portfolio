/**
 * Canvas 2D renderer for the neural core — the fallback for small screens,
 * reduced motion and browsers without WebGL. Projects the 3D network by hand.
 */
import {
  createNetwork,
  createOrbit,
  easeOut,
  introDelay,
  placeLabels,
  PulseField,
  readPalette,
  runLoop,
  type CoreRuntime,
  type RGB,
} from "./network";

const rgba = (c: RGB, a: number) => `rgba(${c[0]},${c[1]},${c[2]},${a.toFixed(3)})`;

export function start2D(rt: CoreRuntime): () => void {
  const ctx = rt.canvas.getContext("2d");
  if (!ctx) return () => {};

  const net = createNetwork(rt.small ? 96 : 150, rt.capabilityCount);
  const { nodes, edges, anchors, clusters } = net;
  rt.onStats(`${nodes.length} nodes · ${edges.length} links · canvas`);

  const pal = readPalette();
  const pulseColors = [pal.cyan, pal.soft, pal.violet];
  const field = new PulseField(net, rt.small ? 10 : 18, pulseColors.length);
  const start = performance.now() + introDelay() * 1000;

  let w = 0;
  let h = 0;
  let dpr = 1;
  const orbit = createOrbit(rt.stage, rt.reduce);
  let energy = 0;
  const proj = nodes.map(() => ({ x: 0, y: 0, z: 0, s: 1 }));

  const loop = runLoop(rt, {
    resize(width, height) {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = width;
      h = height;
      rt.canvas.width = Math.round(w * dpr);
      rt.canvas.height = Math.round(h * dpr);
    },
    frame(now, dt, labelSizes) {
      const form = rt.reduce ? 1 : easeOut((now - start) / 1800);
      const sel = rt.getSelected();
      const ptr = rt.pointer;

      if (!rt.reduce) {
        orbit.update(dt);
        energy += ((ptr.inside ? 1 : 0) - energy) * 0.05;
      }

      const cx = w / 2;
      const cy = h / 2;
      const R = Math.min(w, h) * 0.4 * (0.35 + 0.65 * form);
      const f = R * 2.6;
      const t = now / 1000;

      nodes.forEach((n, i) => {
        const breathe = rt.reduce ? 1 : 1 + Math.sin(t * 0.9 + n.phase) * 0.018;
        // Same orientation as the WebGL renderer (+y up, +z toward the viewer).
        const [rx, ry, rz] = orbit.apply(n.x, n.y, n.z);
        const z2 = -rz; // this renderer's depth: positive = further away
        const s = f / (f + z2 * R);
        const p = proj[i]!;
        p.x = cx + rx * R * breathe * s;
        p.y = cy - ry * R * breathe * s;
        p.z = z2;
        p.s = s;
      });

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      ctx.globalCompositeOperation = "lighter";

      const cluster = sel !== null ? clusters[sel] : undefined;
      const near = (i: number) => {
        if (!ptr.inside) return 0;
        const d = Math.hypot(proj[i]!.x - ptr.sx, proj[i]!.y - ptr.sy);
        return Math.max(0, 1 - d / 110);
      };

      // Links: batched into depth buckets to keep draw calls low.
      const buckets: Array<Array<[number, number]>> = [[], [], [], []];
      const lit: Array<[number, number]> = [];
      for (const [a, b] of edges) {
        if (cluster && cluster.has(a) && cluster.has(b)) {
          lit.push([a, b]);
          continue;
        }
        const depth = ((proj[a]!.z + proj[b]!.z) / 2 + 1) / 2; // 0 front → 1 back
        buckets[Math.min(3, Math.max(0, Math.floor(depth * 4)))]!.push([a, b]);
      }
      ctx.lineWidth = 0.7;
      buckets.forEach((list, bi) => {
        ctx.strokeStyle = rgba(bi < 2 ? pal.soft : pal.violet, (0.26 - bi * 0.055 + energy * 0.06) * form * form);
        ctx.beginPath();
        for (const [a, b] of list) {
          ctx.moveTo(proj[a]!.x, proj[a]!.y);
          ctx.lineTo(proj[b]!.x, proj[b]!.y);
        }
        ctx.stroke();
      });
      if (lit.length) {
        ctx.lineWidth = 1.1;
        ctx.strokeStyle = rgba(pal.cyan, 0.55 * form);
        ctx.beginPath();
        for (const [a, b] of lit) {
          ctx.moveTo(proj[a]!.x, proj[a]!.y);
          ctx.lineTo(proj[b]!.x, proj[b]!.y);
        }
        ctx.stroke();
      }

      nodes.forEach((_, i) => {
        const p = proj[i]!;
        const depth = (p.z + 1) / 2;
        const glow = near(i);
        const inCluster = cluster?.has(i) ?? false;
        const r = (0.7 + (1 - depth) * 1.5 + glow * 1.6 + (inCluster ? 0.9 : 0)) * p.s;
        const base = inCluster ? pal.cyan : depth < 0.5 ? pal.fg : pal.violet;
        const a = (0.25 + (1 - depth) * 0.6 + glow * 0.4) * form;
        if (glow > 0.2 || inCluster) {
          ctx.fillStyle = rgba(inCluster ? pal.cyan : pal.soft, 0.12 * form);
          ctx.beginPath();
          ctx.arc(p.x, p.y, r * 4, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.fillStyle = rgba(base, Math.min(1, a));
        ctx.beginPath();
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
        ctx.fill();
      });

      if (!rt.reduce && form > 0.85) {
        field.update(dt, sel, energy);
        for (const p of field.pulses) {
          const a = proj[p.from]!;
          const b = proj[p.to]!;
          const k = Math.min(1, p.t);
          const x = a.x + (b.x - a.x) * k;
          const y = a.y + (b.y - a.y) * k;
          const tail = Math.max(0, k - 0.35);
          const tx = a.x + (b.x - a.x) * tail;
          const ty = a.y + (b.y - a.y) * tail;
          const front = 1 - ((a.z + b.z) / 2 + 1) / 2;
          const c = pulseColors[p.color]!;
          const grad = ctx.createLinearGradient(tx, ty, x, y);
          grad.addColorStop(0, rgba(c, 0));
          grad.addColorStop(1, rgba(c, 0.5 + front * 0.5));
          ctx.strokeStyle = grad;
          ctx.lineWidth = 1.4;
          ctx.beginPath();
          ctx.moveTo(tx, ty);
          ctx.lineTo(x, y);
          ctx.stroke();
          ctx.fillStyle = rgba(c, 0.6 + front * 0.4);
          ctx.beginPath();
          ctx.arc(x, y, 1.6, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.globalCompositeOperation = "source-over";

      placeLabels(
        rt,
        labelSizes,
        anchors.map((n) => ({ x: proj[n]!.x, y: proj[n]!.y, front: 1 - (proj[n]!.z + 1) / 2 })),
        w,
        h,
        form,
      );
    },
  });

  return () => {
    loop.stop();
    orbit.dispose();
  };
}
