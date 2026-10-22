/**
 * WebGL renderer for the neural core (Three.js). Loaded on demand for
 * desktop browsers with WebGL; everything else uses the Canvas 2D renderer.
 */
import {
  AdditiveBlending,
  BackSide,
  BufferAttribute,
  BufferGeometry,
  Color,
  Float32BufferAttribute,
  Group,
  LineSegments,
  Mesh,
  MeshBasicMaterial,
  PerspectiveCamera,
  Points,
  Scene,
  ShaderMaterial,
  SphereGeometry,
  TorusGeometry,
  Vector3,
  WebGLRenderer,
  type Material,
} from "three";
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

const RADIUS = 1.33;
const FOV = 35;
/**
 * Everything in the scene (sphere, atmosphere, rings, particles — including the
 * perspective enlargement of points nearer the camera) stays within this
 * radius, and the camera is placed so exactly this radius fits the canvas.
 * Result: the globe fills the frame without anything ever being clipped.
 */
const FRAME = 2.2;
const CAMERA_Z = FRAME / Math.tan(((FOV / 2) * Math.PI) / 180);

const toColor = (c: RGB) => new Color(c[0] / 255, c[1] / 255, c[2] / 255);

/* Soft, depth-faded glowing points (nodes, pulses, dust). */
const POINT_VERT = /* glsl */ `
  attribute float aSize;
  attribute vec3 aColor;
  attribute float aGlow;
  uniform float uPixelRatio;
  uniform float uForm;
  uniform float uCamDist;
  uniform float uRadius;
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    float depth = clamp((-mv.z - (uCamDist - uRadius)) / (2.0 * uRadius), 0.0, 1.0);
    vColor = aColor;
    vAlpha = mix(1.0, 0.28, depth) * uForm;
    gl_PointSize = aSize * (1.0 + aGlow * 1.4) * uPixelRatio * (6.0 / -mv.z);
    gl_Position = projectionMatrix * mv;
  }
`;
const POINT_FRAG = /* glsl */ `
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float core = smoothstep(0.5, 0.0, d);
    float alpha = pow(core, 1.8) * vAlpha;
    if (alpha < 0.01) discard;
    gl_FragColor = vec4(vColor, alpha);
  }
`;

/* Links fade with depth so the sphere reads as a volume. */
const LINE_VERT = /* glsl */ `
  uniform float uCamDist;
  uniform float uRadius;
  varying float vDepth;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vDepth = clamp((-mv.z - (uCamDist - uRadius)) / (2.0 * uRadius), 0.0, 1.0);
    gl_Position = projectionMatrix * mv;
  }
`;
const LINE_FRAG = /* glsl */ `
  uniform vec3 uColor;
  uniform vec3 uBackColor;
  uniform float uOpacity;
  varying float vDepth;
  void main() {
    gl_FragColor = vec4(mix(uColor, uBackColor, vDepth), uOpacity * mix(1.0, 0.18, vDepth));
  }
`;

/* Glassy inner core: bright rim, translucent centre. */
const FRESNEL_VERT = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vView;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vNormal = normalize(normalMatrix * normal);
    vView = normalize(-mv.xyz);
    gl_Position = projectionMatrix * mv;
  }
`;
const FRESNEL_FRAG = /* glsl */ `
  uniform vec3 uInner;
  uniform vec3 uRim;
  uniform float uEnergy;
  uniform float uForm;
  varying vec3 vNormal;
  varying vec3 vView;
  void main() {
    float f = pow(1.0 - abs(dot(vNormal, vView)), 2.2);
    vec3 col = mix(uInner, uRim, f);
    gl_FragColor = vec4(col, (0.12 + f * (0.75 + uEnergy * 0.25)) * uForm);
  }
`;

/* Atmosphere halo: brightest at the silhouette, fading outward. */
const ATMO_FRAG = /* glsl */ `
  uniform vec3 uInner;
  uniform vec3 uRim;
  uniform float uEnergy;
  uniform float uForm;
  varying vec3 vNormal;
  varying vec3 vView;
  void main() {
    float f = pow(clamp(abs(dot(vNormal, vView)), 0.0, 1.0), 3.0);
    gl_FragColor = vec4(mix(uInner, uRim, f), f * (0.32 + uEnergy * 0.15) * uForm);
  }
`;

export async function startWebGL(rt: CoreRuntime): Promise<() => void> {
  const renderer = new WebGLRenderer({
    canvas: rt.canvas,
    alpha: true,
    antialias: true,
    powerPreference: "high-performance",
  });
  renderer.setClearColor(0x000000, 0);

  const scene = new Scene();
  const camera = new PerspectiveCamera(FOV, 1, 0.1, 50);
  camera.position.z = CAMERA_Z;

  const pal = readPalette();
  const colors = {
    fg: toColor(pal.fg),
    accent: toColor(pal.accent),
    soft: toColor(pal.soft),
    violet: toColor(pal.violet),
    cyan: toColor(pal.cyan),
  };
  const pulsePalette = [colors.cyan, colors.soft, colors.violet];

  const net = createNetwork(160, rt.capabilityCount);
  const { nodes, edges, anchors, clusters } = net;
  rt.onStats(`${nodes.length} nodes · ${edges.length} links · webgl`);

  const disposables: Array<BufferGeometry | Material> = [];
  const track = <T extends BufferGeometry | Material>(x: T) => (disposables.push(x), x);

  const root = new Group();
  const rings = new Group();
  scene.add(root, rings);

  const shared = {
    uPixelRatio: { value: 1 },
    uForm: { value: 0 },
    uCamDist: { value: CAMERA_Z },
    uRadius: { value: RADIUS },
  };

  /* ── Nodes ── */
  const base = nodes.map((n) => new Vector3(n.x * RADIUS, n.y * RADIUS, n.z * RADIUS));
  const nodePos = new Float32Array(nodes.length * 3);
  const nodeSize = new Float32Array(nodes.length);
  const nodeColor = new Float32Array(nodes.length * 3);
  const nodeGlow = new Float32Array(nodes.length);
  base.forEach((v, i) => {
    v.toArray(nodePos, i * 3);
    nodeSize[i] = 7 + (i % 5);
  });
  const nodeGeo = track(new BufferGeometry());
  nodeGeo.setAttribute("position", new BufferAttribute(nodePos, 3));
  nodeGeo.setAttribute("aSize", new BufferAttribute(nodeSize, 1));
  nodeGeo.setAttribute("aColor", new BufferAttribute(nodeColor, 3));
  nodeGeo.setAttribute("aGlow", new BufferAttribute(nodeGlow, 1));
  const pointMat = () =>
    track(
      new ShaderMaterial({
        uniforms: shared,
        vertexShader: POINT_VERT,
        fragmentShader: POINT_FRAG,
        transparent: true,
        depthWrite: false,
        blending: AdditiveBlending,
      }),
    );
  root.add(new Points(nodeGeo, pointMat()));

  /* ── Links ── */
  const linkMat = (color: Color, back: Color, opacity: number) =>
    track(
      new ShaderMaterial({
        uniforms: {
          ...shared,
          uColor: { value: color },
          uBackColor: { value: back },
          uOpacity: { value: opacity },
        },
        vertexShader: LINE_VERT,
        fragmentShader: LINE_FRAG,
        transparent: true,
        depthWrite: false,
        blending: AdditiveBlending,
      }),
    );
  const edgePos = new Float32Array(edges.length * 6);
  edges.forEach(([a, b], i) => {
    base[a]!.toArray(edgePos, i * 6);
    base[b]!.toArray(edgePos, i * 6 + 3);
  });
  const edgeGeo = track(new BufferGeometry());
  edgeGeo.setAttribute("position", new BufferAttribute(edgePos, 3));
  const edgeMat = linkMat(colors.soft, colors.violet, 0.32);
  root.add(new LineSegments(edgeGeo, edgeMat));

  const litGeo = track(new BufferGeometry());
  root.add(new LineSegments(litGeo, linkMat(colors.cyan, colors.cyan, 0.9)));

  /* ── Inner core: glass sphere inside a counter-rotating lattice ── */
  const coreMat = track(
    new ShaderMaterial({
      uniforms: {
        uInner: { value: colors.accent },
        uRim: { value: colors.cyan },
        uEnergy: { value: 0 },
        uForm: shared.uForm,
      },
      vertexShader: FRESNEL_VERT,
      fragmentShader: FRESNEL_FRAG,
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
    }),
  );
  const core = new Mesh(track(new SphereGeometry(0.32, 48, 48)), coreMat);
  root.add(core);

  /* ── Globe surface: latitude / longitude graticule ── */
  const grat: number[] = [];
  const GR = RADIUS * 1.003;
  const SEG = 96;
  for (let lat = -60; lat <= 60; lat += 30) {
    const phi = (lat * Math.PI) / 180;
    const ry = Math.sin(phi) * GR;
    const rr = Math.cos(phi) * GR;
    for (let k = 0; k < SEG; k++) {
      const a0 = (k / SEG) * Math.PI * 2;
      const a1 = ((k + 1) / SEG) * Math.PI * 2;
      grat.push(Math.cos(a0) * rr, ry, Math.sin(a0) * rr, Math.cos(a1) * rr, ry, Math.sin(a1) * rr);
    }
  }
  for (let m = 0; m < 12; m++) {
    const lon = (m / 12) * Math.PI * 2;
    for (let k = 0; k < SEG / 2; k++) {
      const p0 = -Math.PI / 2 + (k / (SEG / 2)) * Math.PI;
      const p1 = -Math.PI / 2 + ((k + 1) / (SEG / 2)) * Math.PI;
      grat.push(
        Math.cos(p0) * Math.cos(lon) * GR,
        Math.sin(p0) * GR,
        Math.cos(p0) * Math.sin(lon) * GR,
        Math.cos(p1) * Math.cos(lon) * GR,
        Math.sin(p1) * GR,
        Math.cos(p1) * Math.sin(lon) * GR,
      );
    }
  }
  const gratGeo = track(new BufferGeometry());
  gratGeo.setAttribute("position", new Float32BufferAttribute(grat, 3));
  root.add(new LineSegments(gratGeo, linkMat(colors.accent, colors.violet, 0.16)));

  /* ── Atmosphere: soft fresnel halo just outside the sphere ── */
  const atmoMat = track(
    new ShaderMaterial({
      uniforms: {
        uInner: { value: colors.accent },
        uRim: { value: colors.cyan },
        uEnergy: { value: 0 },
        uForm: shared.uForm,
      },
      vertexShader: FRESNEL_VERT,
      fragmentShader: ATMO_FRAG,
      transparent: true,
      depthWrite: false,
      side: BackSide,
      blending: AdditiveBlending,
    }),
  );
  root.add(new Mesh(track(new SphereGeometry(RADIUS * 1.12, 64, 64)), atmoMat));

  /* ── Orbit rings with satellites ── */
  const ringDefs = [
    { r: 1.68, tilt: [1.2, 0.0, 0.35], color: colors.soft, speed: 0.22 },
    { r: 1.89, tilt: [1.45, 0.0, -0.5], color: colors.violet, speed: -0.15 },
  ] as const;
  const satellites = ringDefs.map((d) => {
    const pivot = new Group();
    pivot.rotation.set(d.tilt[0], d.tilt[1], d.tilt[2]);
    const ring = new Mesh(
      track(new TorusGeometry(d.r, 0.0035, 6, 220)),
      track(
        new MeshBasicMaterial({
          color: d.color,
          transparent: true,
          opacity: 0.35,
          blending: AdditiveBlending,
          depthWrite: false,
        }),
      ),
    );
    const sat = new Mesh(
      track(new SphereGeometry(0.028, 16, 16)),
      track(
        new MeshBasicMaterial({ color: colors.cyan, transparent: true, opacity: 0.95, blending: AdditiveBlending }),
      ),
    );
    pivot.add(ring, sat);
    rings.add(pivot);
    return { sat, r: d.r, speed: d.speed, angle: Math.random() * Math.PI * 2 };
  });

  /* ── Ambient dust shell ── */
  const DUST = 180;
  const dustPos = new Float32Array(DUST * 3);
  const dustSize = new Float32Array(DUST);
  const dustColor = new Float32Array(DUST * 3);
  for (let i = 0; i < DUST; i++) {
    const u = Math.random() * 2 - 1;
    const th = Math.random() * Math.PI * 2;
    const rr = 1.5 + Math.random() * 0.28; // a thin shell inside FRAME
    const s = Math.sqrt(1 - u * u);
    dustPos.set([Math.cos(th) * s * rr, u * rr, Math.sin(th) * s * rr], i * 3);
    dustSize[i] = 1.5 + Math.random() * 2;
    (i % 3 === 0 ? colors.cyan : colors.soft).toArray(dustColor, i * 3);
  }
  const dustGeo = track(new BufferGeometry());
  dustGeo.setAttribute("position", new BufferAttribute(dustPos, 3));
  dustGeo.setAttribute("aSize", new BufferAttribute(dustSize, 1));
  dustGeo.setAttribute("aColor", new BufferAttribute(dustColor, 3));
  dustGeo.setAttribute("aGlow", new Float32BufferAttribute(new Float32Array(DUST), 1));
  const dust = new Points(dustGeo, pointMat());
  scene.add(dust);

  /* ── Signal pulses (head + fading tail) ── */
  const field = new PulseField(net, 22, pulsePalette.length);
  const MAXP = 22 * 3;
  const pulsePos = new Float32Array(MAXP * 3);
  const pulseSize = new Float32Array(MAXP);
  const pulseColor = new Float32Array(MAXP * 3);
  const pulseGeo = track(new BufferGeometry());
  pulseGeo.setAttribute("position", new BufferAttribute(pulsePos, 3));
  pulseGeo.setAttribute("aSize", new BufferAttribute(pulseSize, 1));
  pulseGeo.setAttribute("aColor", new BufferAttribute(pulseColor, 3));
  pulseGeo.setAttribute("aGlow", new Float32BufferAttribute(new Float32Array(MAXP), 1));
  root.add(new Points(pulseGeo, pointMat()));

  /* ── Selection → recolour nodes & rebuild lit links ── */
  let lastSelected: number | null | undefined;
  function applySelection(sel: number | null) {
    const cluster = sel !== null ? clusters[sel] : undefined;
    nodes.forEach((_, i) => {
      const c = cluster?.has(i) ? colors.cyan : i % 4 === 0 ? colors.violet : i % 3 === 0 ? colors.soft : colors.fg;
      c.toArray(nodeColor, i * 3);
      nodeSize[i] = (cluster?.has(i) ? 12 : 7) + (i % 5);
    });
    nodeGeo.attributes.aColor!.needsUpdate = true;
    nodeGeo.attributes.aSize!.needsUpdate = true;
    const lit = cluster ? edges.filter(([a, b]) => cluster.has(a) && cluster.has(b)) : [];
    const pos = new Float32Array(lit.length * 6);
    lit.forEach(([a, b], i) => {
      base[a]!.toArray(pos, i * 6);
      base[b]!.toArray(pos, i * 6 + 3);
    });
    litGeo.setAttribute("position", new BufferAttribute(pos, 3));
    lastSelected = sel;
  }

  /* ── Frame loop ── */
  const start = performance.now() + introDelay() * 1000;
  let w = 1;
  let h = 1;
  let energy = 0;
  // Original ring tilt (unchanged from before): eases toward the cursor while it's over the globe.
  let tiltX = 0.28;
  let tiltY = 0;
  const orbit = createOrbit(rt.stage, rt.reduce);
  const v = new Vector3();
  const anchorScreen = anchors.map(() => ({ x: 0, y: 0, front: 0 }));
  const screen = nodes.map(() => ({ x: 0, y: 0 }));

  /*
   * Size: the canvas extends evenly past the globe's box on every side (same
   * centre, so the globe doesn't move) and the camera frame is unchanged —
   * so sphere, network, rings and dots all scale up together by GROW.
   * It only grows as far as the hero section has room, so nothing is clipped.
   */
  const GROW = 1.18;
  let stageW = 1;
  let stageH = 1;
  let margin = 0;
  const section = (rt.stage.closest("section") as HTMLElement | null) ?? rt.stage;
  function layout() {
    const st = rt.stage.getBoundingClientRect();
    const sec = section.getBoundingClientRect();
    const room = Math.max(
      0,
      Math.min(st.left - sec.left, sec.right - st.right, st.top - sec.top, sec.bottom - st.bottom) - 8,
    );
    const size = Math.min(stageW, stageH);
    const grow = Math.min(GROW, 1 + (2 * room) / size);
    margin = (size * (grow - 1)) / 2;
    const cs = rt.canvas.style;
    cs.left = `${-margin}px`;
    cs.top = `${-margin}px`;
    cs.width = `${stageW + 2 * margin}px`;
    cs.height = `${stageH + 2 * margin}px`;
    w = stageW + 2 * margin;
    h = stageH + 2 * margin;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    renderer.setPixelRatio(dpr);
    renderer.setSize(w, h, false);
    shared.uPixelRatio.value = dpr;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  window.addEventListener("resize", layout);

  const loop = runLoop(rt, {
    resize(width, height) {
      stageW = Math.max(1, width);
      stageH = Math.max(1, height);
      layout();
    },
    frame(now, dt, labelSizes) {
      const sel = rt.getSelected();
      if (sel !== lastSelected) applySelection(sel);
      const ptr = rt.pointer;
      const form = rt.reduce ? 1 : easeOut((now - start) / 1800);
      const t = now / 1000;

      orbit.update(dt);
      tiltX += ((ptr.inside ? 0.28 + ptr.y * 0.6 : 0.28) - tiltX) * 0.045;
      tiltY += ((ptr.inside ? ptr.x * 0.8 : 0) - tiltY) * 0.045;
      energy += ((ptr.inside ? 1 : 0) - energy) * 0.05;

      shared.uForm.value = form;
      edgeMat.uniforms.uOpacity!.value = 0.3 + energy * 0.12;
      coreMat.uniforms.uEnergy!.value = energy;
      atmoMat.uniforms.uEnergy!.value = energy;

      const scale = (0.35 + 0.65 * form) * (1 + Math.sin(t * 0.9) * 0.012);
      root.scale.setScalar(scale);
      // Mouse/touch-driven orientation (see createOrbit); rings and dust follow at reduced
      // rates, which reads as depth parallax.
      const [qx, qy, qz, qw] = orbit.quaternion;
      root.quaternion.set(qx, qy, qz, qw);
      rings.rotation.set(tiltX * 0.35, tiltY * 0.5, 0);
      dust.rotation.set(orbit.pitch * 0.25, orbit.yaw * 0.35, 0);
      core.scale.setScalar(1 + Math.sin(t * 1.6) * 0.04 + energy * 0.08);

      satellites.forEach((s) => {
        s.angle += dt * s.speed;
        s.sat.position.set(Math.cos(s.angle) * s.r, Math.sin(s.angle) * s.r, 0);
      });

      // Project nodes once per frame: pointer glow + label anchors.
      scene.updateMatrixWorld();
      for (let i = 0; i < nodes.length; i++) {
        v.copy(base[i]!).applyMatrix4(root.matrixWorld).project(camera);
        const sx = (v.x * 0.5 + 0.5) * w;
        const sy = (-v.y * 0.5 + 0.5) * h;
        screen[i]!.x = sx;
        screen[i]!.y = sy;
        const d = ptr.inside ? Math.hypot(sx - margin - ptr.sx, sy - margin - ptr.sy) : 999;
        nodeGlow[i] = Math.max(0, 1 - d / 120);
      }
      nodeGeo.attributes.aGlow!.needsUpdate = true;

      // Pulses travel in root space so they rotate with the network.
      if (form > 0.85) field.update(dt, sel, energy);
      pulseSize.fill(0);
      field.pulses.forEach((p, i) => {
        const a = base[p.from]!;
        const b = base[p.to]!;
        const k = Math.min(1, p.t);
        const c = pulsePalette[p.color]!;
        for (let j = 0; j < 3; j++) {
          const kk = Math.max(0, k - j * 0.12);
          const idx = i * 3 + j;
          pulsePos[idx * 3] = a.x + (b.x - a.x) * kk;
          pulsePos[idx * 3 + 1] = a.y + (b.y - a.y) * kk;
          pulsePos[idx * 3 + 2] = a.z + (b.z - a.z) * kk;
          pulseSize[idx] = j === 0 ? 16 : 11 - j * 3;
          c.toArray(pulseColor, idx * 3);
        }
      });
      pulseGeo.attributes.position!.needsUpdate = true;
      pulseGeo.attributes.aSize!.needsUpdate = true;
      pulseGeo.attributes.aColor!.needsUpdate = true;

      renderer.render(scene, camera);

      anchors.forEach((n, i) => {
        v.copy(base[n]!).applyMatrix4(root.matrixWorld);
        const front = Math.min(1, Math.max(0, (v.z / RADIUS + 1) / 2)); // +z faces the camera
        anchorScreen[i]!.x = screen[n]!.x - margin; // labels live in the globe's box
        anchorScreen[i]!.y = screen[n]!.y - margin;
        anchorScreen[i]!.front = front;
      });
      placeLabels(rt, labelSizes, anchorScreen, stageW, stageH, form);
    },
  });

  const onLost = (e: Event) => {
    e.preventDefault();
    rt.onFail?.();
  };
  rt.canvas.addEventListener("webglcontextlost", onLost);

  return () => {
    loop.stop();
    orbit.dispose();
    window.removeEventListener("resize", layout);
    rt.canvas.removeEventListener("webglcontextlost", onLost);
    disposables.forEach((d) => d.dispose());
    renderer.dispose();
  };
}
