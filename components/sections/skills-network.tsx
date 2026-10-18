"use client";

import { motion } from "motion/react";
import { useMemo, useState } from "react";
import { experience } from "@/data/experience";
import { projects } from "@/data/projects";
import { levelMeta, skillGroups, type Level, type Skill, type SkillGroupId } from "@/data/skills";
import { ease, inView } from "@/lib/motion";
import { useReducedMotion } from "@/lib/use-reduced-motion";
import { cn } from "@/lib/utils";

/* ───────────── Presentation data ───────────── */

/** Short labels so the radial map stays legible; full names are used everywhere else. */
const SHORT: Record<string, string> = {
  "Responsive UI Development": "Responsive UI",
  "Performance optimization": "Performance",
  "HTML5 & CSS3": "HTML & CSS",
  "Reusable component architecture": "Component architecture",
  "Figma-to-code implementation": "Figma → code",
  "Form handling & validation": "Forms & validation",
  "Loading, error, empty & success states": "UI states",
  "Authentication & authorization": "Auth",
  "REST API concepts": "REST APIs",
  "AI-powered application interfaces": "AI app interfaces",
  "LLM API integration": "LLM APIs",
  "AI-assisted development tools": "AI dev tools",
};

const GROUP_SHORT: Record<SkillGroupId, string> = {
  frontend: "Frontend",
  architecture: "UI architecture",
  backend: "APIs & backend",
  ai: "AI & LLMs",
  tools: "Data & tools",
};

/** How skills feed into each other — the "why it connects" layer of the map. */
const LINKS: Array<[string, string]> = [
  ["TypeScript", "React.js"],
  ["React.js", "Next.js"],
  ["React.js", "Redux Toolkit"],
  ["Next.js", "SEO"],
  ["Next.js", "Performance optimization"],
  ["API Integration", "Loading, error, empty & success states"],
  ["API Integration", "FastAPI"],
  ["Python", "FastAPI"],
  ["FastAPI", "LLM API integration"],
  ["React.js", "AI-powered application interfaces"],
  ["Prisma", "PostgreSQL"],
  ["Supabase", "PostgreSQL"],
  ["Figma", "Figma-to-code implementation"],
  ["Tailwind CSS", "Reusable component architecture"],
  ["Authentication & authorization", "Supabase"],
];

type Filter = "all" | "confident" | "learning";

const C = 380; // viewBox centre
const HUB_R = 96;
const RING_R = 186;

interface PlacedSkill extends Skill {
  group: SkillGroupId;
  angle: number;
  x: number;
  y: number;
}

/** Trig results differ in the last bits between Node and browsers; rounding keeps SSR and hydration identical. */
const r2 = (n: number) => Math.round(n * 100) / 100;

function layout() {
  const total = skillGroups.reduce((n, g) => n + g.skills.length, 0);
  const gap = 0.32; // radians between sectors
  const usable = Math.PI * 2 - gap * skillGroups.length;
  let angle = -Math.PI / 2 - (skillGroups[0]!.skills.length / total) * usable * 0.5;
  const hubs: Array<{ id: SkillGroupId; angle: number; x: number; y: number }> = [];
  const skills: PlacedSkill[] = [];
  for (const g of skillGroups) {
    const span = (g.skills.length / total) * usable;
    const step = span / Math.max(1, g.skills.length - 1);
    const mid = angle + span / 2;
    hubs.push({ id: g.id, angle: r2(mid), x: r2(C + Math.cos(mid) * HUB_R), y: r2(C + Math.sin(mid) * HUB_R) });
    g.skills.forEach((s, i) => {
      const a = g.skills.length === 1 ? mid : angle + step * i;
      skills.push({ ...s, group: g.id, angle: r2(a), x: r2(C + Math.cos(a) * RING_R), y: r2(C + Math.sin(a) * RING_R) });
    });
    angle += span + gap;
  }
  return { hubs, skills };
}

const { hubs, skills: placed } = layout();
const byName = new Map(placed.map((s) => [s.name, s]));

function matchesFilter(level: Level | undefined, filter: Filter) {
  if (filter === "all") return true;
  if (filter === "learning") return level === "growing";
  return level === "core" || level === "working";
}

/** Projects and roles on this site that list the skill — the evidence behind a claim. */
function evidenceFor(name: string) {
  const n = name.toLowerCase();
  const inProjects = projects.filter((p) => p.stack.some((s) => s.toLowerCase() === n)).map((p) => p.title);
  const inRoles = experience
    .filter((e) => e.tags.some((t) => t.toLowerCase() === n) || e.points.some((pt) => pt.toLowerCase().includes(n)))
    .map((e) => `${e.role} · ${e.company}`);
  return [...inProjects, ...inRoles];
}

/* ───────────── Component ───────────── */

export function SkillsNetwork() {
  const reduce = useReducedMotion();
  const [group, setGroup] = useState<SkillGroupId>("frontend");
  const [skill, setSkill] = useState<string | null>(null);
  const [hover, setHover] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("all");

  const focus = hover ?? skill;
  const related = useMemo(() => {
    if (!focus) return new Set<string>();
    return new Set(LINKS.flatMap(([a, b]) => (a === focus ? [b] : b === focus ? [a] : [])));
  }, [focus]);

  const activeGroup = skillGroups.find((g) => g.id === group)!;
  const selected = skill ? byName.get(skill) : undefined;

  function pick(name: string) {
    const s = byName.get(name);
    if (!s) return;
    setGroup(s.group);
    setSkill((cur) => (cur === name ? null : name));
  }

  const nodeState = (s: PlacedSkill) => {
    const filteredOut = !matchesFilter(s.level, filter);
    if (focus) return s.name === focus ? "focus" : related.has(s.name) ? "related" : "dim";
    if (filteredOut) return "dim";
    return s.group === group ? "group" : "idle";
  };

  return (
    <div className="mt-12 grid gap-8 lg:grid-cols-12 lg:gap-10">
      {/* ── Map (pointer-friendly; the panel holds the accessible controls) ── */}
      <div className="relative min-w-0 overflow-x-clip lg:col-span-7">
        <motion.svg
          viewBox="0 0 760 760"
          aria-hidden
          className="mx-auto w-full max-w-[680px] overflow-visible select-none max-sm:scale-150"
          initial={reduce ? false : "hidden"}
          whileInView="shown"
          viewport={inView}
        >
          <defs>
            <radialGradient id="sn-core" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="var(--color-accent)" stopOpacity="0.45" />
              <stop offset="100%" stopColor="var(--color-accent)" stopOpacity="0" />
            </radialGradient>
          </defs>

          <circle cx={C} cy={C} r={RING_R} fill="none" stroke="var(--color-line)" strokeDasharray="2 6" />
          <circle cx={C} cy={C} r={HUB_R} fill="none" stroke="var(--color-line)" />
          <circle cx={C} cy={C} r={70} fill="url(#sn-core)" />

          {/* Cross-skill connections */}
          {LINKS.map(([a, b]) => {
            const pa = byName.get(a);
            const pb = byName.get(b);
            if (!pa || !pb) return null;
            const lit = focus === a || focus === b;
            return (
              <motion.path
                key={`${a}-${b}`}
                d={`M${pa.x},${pa.y} Q${C + (pa.x + pb.x - 2 * C) * 0.15},${C + (pa.y + pb.y - 2 * C) * 0.15} ${pb.x},${pb.y}`}
                fill="none"
                stroke={lit ? "var(--color-cyan)" : "var(--color-violet)"}
                strokeOpacity={lit ? 0.9 : focus ? 0.06 : 0.16}
                strokeWidth={lit ? 1.6 : 1}
                className={cn(lit && "sn-flow")}
                variants={{
                  hidden: { pathLength: 0 },
                  shown: { pathLength: 1, transition: { duration: 1.4, ease, delay: 0.5 } },
                }}
              />
            );
          })}

          {/* Hub → skill spokes */}
          {placed.map((s) => {
            const hub = hubs.find((h) => h.id === s.group)!;
            const state = nodeState(s);
            return (
              <motion.line
                key={`spoke-${s.name}`}
                x1={hub.x}
                y1={hub.y}
                x2={s.x}
                y2={s.y}
                stroke={state === "focus" ? "var(--color-cyan)" : "var(--color-accent-soft)"}
                strokeOpacity={state === "dim" ? 0.05 : state === "group" || state === "focus" ? 0.45 : 0.14}
                variants={{
                  hidden: { pathLength: 0 },
                  shown: { pathLength: 1, transition: { duration: 0.9, ease, delay: 0.25 } },
                }}
              />
            );
          })}

          {/* Centre → hubs */}
          {hubs.map((h) => (
            <line
              key={`core-${h.id}`}
              x1={C}
              y1={C}
              x2={h.x}
              y2={h.y}
              stroke="var(--color-accent-soft)"
              strokeOpacity={h.id === group ? 0.55 : 0.18}
            />
          ))}

          {/* Skill nodes */}
          {placed.map((s, i) => {
            const state = nodeState(s);
            const deg = r2((s.angle * 180) / Math.PI);
            const left = Math.cos(s.angle) < 0;
            const r = s.level === "core" ? 6 : s.level === "working" ? 5 : s.level === "growing" ? 5 : 3.5;
            return (
              <motion.g
                key={s.name}
                onPointerEnter={() => setHover(s.name)}
                onPointerLeave={() => setHover(null)}
                onClick={() => pick(s.name)}
                className="cursor-pointer"
                style={{ opacity: state === "dim" ? 0.28 : 1, transition: "opacity .35s" }}
                variants={{
                  hidden: { opacity: 0, scale: 0.4 },
                  shown: { opacity: 1, scale: 1, transition: { duration: 0.6, ease, delay: 0.35 + i * 0.02 } },
                }}
              >
                <circle cx={s.x} cy={s.y} r={16} fill="transparent" />
                {s.level === "growing" ? (
                  <circle
                    cx={s.x}
                    cy={s.y}
                    r={r + 1}
                    fill="var(--color-ink-950)"
                    stroke="var(--color-cyan)"
                    strokeWidth={1.6}
                    strokeDasharray="2.5 2"
                  />
                ) : (
                  <circle
                    cx={s.x}
                    cy={s.y}
                    r={r}
                    fill={
                      s.level
                        ? s.level === "core"
                          ? "var(--color-accent-soft)"
                          : "var(--color-violet)"
                        : "var(--color-ink-950)"
                    }
                    stroke={s.level ? "none" : "var(--color-muted)"}
                    strokeWidth={1.2}
                  />
                )}
                {(state === "focus" || state === "related") && (
                  <circle cx={s.x} cy={s.y} r={r + 7} fill="none" stroke="var(--color-cyan)" strokeOpacity={0.6} />
                )}
                <g transform={`rotate(${left ? deg + 180 : deg} ${s.x} ${s.y})`}>
                  <text
                    x={s.x + (left ? -14 : 14)}
                    y={s.y}
                    dy="0.35em"
                    textAnchor={left ? "end" : "start"}
                    className="hidden fill-current font-mono text-[13px] sm:block"
                    style={{
                      color:
                        state === "focus"
                          ? "var(--color-fg)"
                          : state === "related"
                            ? "var(--color-cyan)"
                            : s.group === group
                              ? "var(--color-fg)"
                              : "var(--color-muted)",
                    }}
                  >
                    {SHORT[s.name] ?? s.name}
                  </text>
                </g>
              </motion.g>
            );
          })}

          {/* Group hubs */}
          {hubs.map((h) => {
            const active = h.id === group;
            // Labels sit on the far side of the hub from the centre, so they never collide in the middle.
            const below = Math.sin(h.angle) > 0;
            return (
              <g key={h.id} onClick={() => (setGroup(h.id), setSkill(null))} className="cursor-pointer">
                <circle cx={h.x} cy={h.y} r={22} fill="transparent" />
                <circle
                  cx={h.x}
                  cy={h.y}
                  r={active ? 9 : 7}
                  fill={active ? "var(--color-accent)" : "var(--color-ink-800)"}
                  stroke="var(--color-accent-soft)"
                  strokeOpacity={active ? 1 : 0.5}
                  style={{ transition: "r .3s, fill .3s" }}
                />
                {active && (
                  <circle cx={h.x} cy={h.y} r={16} fill="none" stroke="var(--color-accent)" strokeOpacity={0.35} />
                )}
                <text
                  x={h.x}
                  y={h.y + (below ? 26 : -22)}
                  dy="0.35em"
                  textAnchor="middle"
                  className="fill-current text-[14px] font-medium"
                  paintOrder="stroke"
                  stroke="var(--color-ink-950)"
                  strokeWidth={5}
                  style={{ color: active ? "var(--color-fg)" : "var(--color-muted)" }}
                >
                  {GROUP_SHORT[h.id]}
                </text>
              </g>
            );
          })}

          <text
            x={C}
            y={C - 6}
            textAnchor="middle"
            className="fill-current font-mono text-[11px] tracking-[0.2em]"
            style={{ color: "var(--color-subtle)" }}
          >
            STACK
          </text>
          <text
            x={C}
            y={C + 12}
            textAnchor="middle"
            className="fill-current font-mono text-[11px]"
            style={{ color: "var(--color-accent-soft)" }}
          >
            {placed.length} skills
          </text>
        </motion.svg>
      </div>

      {/* ── Panel: accessible controls + details ── */}
      <div className="min-w-0 lg:col-span-5">
        <div role="group" aria-label="Filter by proficiency" className="flex flex-wrap gap-2">
          {(
            [
              ["all", "All", null],
              ["confident", "Confident", "Core & working"],
              ["learning", "Learning", "Actively learning"],
            ] as const
          ).map(([id, label, hint]) => (
            <button
              key={id}
              type="button"
              aria-pressed={filter === id}
              onClick={() => (setFilter(id), setSkill(null))}
              className={cn(
                "inline-flex min-h-9 items-center gap-2 rounded-full border px-3 text-xs transition-colors",
                filter === id ? "border-accent/50 bg-accent/10 text-fg" : "border-line text-muted hover:text-fg",
              )}
            >
              {id === "learning" ? (
                <span aria-hidden className="size-2.5 rounded-full border border-dashed border-cyan" />
              ) : id === "confident" ? (
                <span aria-hidden className="size-2 rounded-full bg-accent-soft" />
              ) : null}
              {label}
              {hint && <span className="hidden text-subtle sm:inline">· {hint}</span>}
            </button>
          ))}
        </div>

        <div role="group" aria-label="Skill groups" className="no-scrollbar mt-5 flex gap-1.5 overflow-x-auto">
          {skillGroups.map((g) => (
            <button
              key={g.id}
              type="button"
              aria-pressed={group === g.id}
              onClick={() => (setGroup(g.id), setSkill(null))}
              className={cn(
                "shrink-0 rounded-full border px-3 py-1.5 text-xs whitespace-nowrap transition-colors",
                group === g.id ? "border-accent/50 bg-accent/10 text-fg" : "border-line text-muted hover:text-fg",
              )}
            >
              {GROUP_SHORT[g.id]}
            </button>
          ))}
        </div>

        <div className="surface mt-4 rounded-2xl p-5 sm:p-6">
          <h3 className="text-lg font-medium tracking-tight text-fg">{activeGroup.title}</h3>
          <p className="mt-1.5 text-sm leading-relaxed text-muted">{activeGroup.description}</p>

          <ul className="mt-5 flex flex-wrap gap-1.5">
            {activeGroup.skills.map((s) => {
              const dimmed = !matchesFilter(s.level, filter);
              return (
                <li key={s.name}>
                  <button
                    type="button"
                    aria-pressed={skill === s.name}
                    onClick={() => pick(s.name)}
                    onPointerEnter={() => setHover(s.name)}
                    onPointerLeave={() => setHover(null)}
                    className={cn(
                      "inline-flex min-h-9 items-center gap-2 rounded-full border px-3 text-[0.8rem] transition-[color,border-color,background-color,opacity] duration-300",
                      skill === s.name
                        ? "border-cyan/50 bg-cyan/10 text-fg"
                        : "border-line text-fg/85 hover:border-line-strong",
                      dimmed && "opacity-35",
                    )}
                  >
                    <LevelMark level={s.level} />
                    {s.name}
                    <span className="sr-only">, {s.level ? levelMeta[s.level].label : "practice area"}</span>
                  </button>
                </li>
              );
            })}
          </ul>

          <div className="mt-5 min-h-28 border-t border-line pt-4" aria-live="polite">
            {selected ? (
              <SkillDetail skill={selected} onPick={pick} />
            ) : (
              <p className="text-sm leading-relaxed text-subtle">
                Select a skill to see its level, what it connects to, and where it shows up on this site.
              </p>
            )}
          </div>
        </div>

        <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-xs text-subtle sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4">
          {(["core", "working", "growing"] as const).map((l) => (
            <div key={l} className="flex items-center gap-2">
              <dt>
                <LevelMark level={l} />
              </dt>
              <dd>{levelMeta[l].label}</dd>
            </div>
          ))}
          <div className="flex items-center gap-2">
            <dt>
              <LevelMark />
            </dt>
            <dd>Practice area</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}

function LevelMark({ level }: { level?: Level }) {
  if (level === "growing")
    return <span aria-hidden className="inline-block size-2.5 rounded-full border border-dashed border-cyan" />;
  if (level === "core") return <span aria-hidden className="inline-block size-2.5 rounded-full bg-accent-soft" />;
  if (level === "working") return <span aria-hidden className="inline-block size-2 rounded-full bg-violet" />;
  return <span aria-hidden className="inline-block size-2 rounded-full border border-muted" />;
}

function SkillDetail({ skill, onPick }: { skill: PlacedSkill; onPick: (name: string) => void }) {
  const evidence = evidenceFor(skill.name);
  const connects = LINKS.flatMap(([a, b]) => (a === skill.name ? [b] : b === skill.name ? [a] : []));
  return (
    <div className="text-sm">
      <p className="flex flex-wrap items-center gap-2">
        <span className="font-medium text-fg">{skill.name}</span>
        <span
          className={cn(
            "rounded-full border px-2 py-0.5 font-mono text-[0.65rem]",
            skill.level === "growing" ? "border-cyan/40 text-cyan" : "border-accent/30 text-accent-soft",
          )}
        >
          {skill.level
            ? `${levelMeta[skill.level].label} — ${levelMeta[skill.level].description.toLowerCase()}`
            : "Practice area"}
        </span>
      </p>
      {connects.length > 0 && (
        <p className="mt-3 text-muted">
          <span className="label-mono mr-2 text-subtle">Connects to</span>
          {connects.map((c, i) => (
            <span key={c}>
              <button
                type="button"
                onClick={() => onPick(c)}
                className="text-fg underline decoration-line-strong underline-offset-4 hover:decoration-cyan"
              >
                {c}
              </button>
              {i < connects.length - 1 && ", "}
            </span>
          ))}
        </p>
      )}
      <p className="mt-2 text-muted">
        <span className="label-mono mr-2 text-subtle">On this site</span>
        {evidence.length ? evidence.join(" · ") : "No dedicated project listed yet."}
      </p>
    </div>
  );
}
