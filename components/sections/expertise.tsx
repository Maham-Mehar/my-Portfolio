"use client";

import { Code2, Database, LayoutDashboard, Wrench, type LucideIcon } from "lucide-react";
import { useState } from "react";
import { Accent, SectionHeading } from "@/components/ui/section-heading";
import { Reveal } from "@/components/ui/reveal";
import { levelMeta, skillGroups, type Level, type SkillGroup } from "@/data/skills";
import { cn } from "@/lib/utils";

const icons: Record<SkillGroup["icon"], LucideIcon> = {
  frontend: Code2,
  backend: Database,
  product: LayoutDashboard,
  tools: Wrench,
};

const spans = ["lg:col-span-7", "lg:col-span-5", "lg:col-span-5", "lg:col-span-7"];
const levels = Object.keys(levelMeta) as Level[];

export function Expertise() {
  const [focus, setFocus] = useState<Level | null>(null);

  return (
    <section id="expertise" aria-labelledby="expertise-title" className="relative py-24 sm:py-32">
      <div aria-hidden className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-line-strong to-transparent" />
      <div className="container-page">
        <SectionHeading
          index="02"
          eyebrow="Expertise"
          id="expertise-title"
          title={
            <>
              A frontend core, with the <Accent>full stack</Accent> in view.
            </>
          }
          intro="Grouped by how I actually use each skill. Proficiency is marked honestly — what I use daily, what I've used in real projects, and what I'm actively learning."
        />

        {/* Legend doubles as a filter */}
        <Reveal className="mt-12 flex flex-wrap items-center gap-2 md:ml-[25%] md:pl-2.5">
          <span className="label-mono mr-2 text-subtle">Highlight</span>
          {levels.map((level) => {
            const meta = levelMeta[level];
            const pressed = focus === level;
            return (
              <button
                key={level}
                type="button"
                aria-pressed={pressed}
                onClick={() => setFocus(pressed ? null : level)}
                className={cn(
                  "inline-flex min-h-9 items-center gap-2.5 rounded-full border px-3 text-xs transition-colors",
                  pressed ? "border-accent/50 bg-accent/10 text-fg" : "border-line text-muted hover:text-fg",
                )}
              >
                <Dots count={meta.dots} />
                {meta.label}
                <span className="hidden text-subtle sm:inline">— {meta.description}</span>
              </button>
            );
          })}
        </Reveal>

        <div className="mt-8 grid gap-4 lg:grid-cols-12">
          {skillGroups.map((group, gi) => {
            const Icon = icons[group.icon];
            const leveled = group.skills.some((s) => s.level);
            return (
              <Reveal
                as="article"
                key={group.id}
                delay={gi * 0.05}
                className={cn("surface group relative overflow-hidden rounded-2xl p-6 sm:p-8", spans[gi])}
              >
                <div
                  aria-hidden
                  className="absolute -top-24 -right-24 size-56 rounded-full bg-accent/10 opacity-0 blur-3xl transition-opacity duration-700 group-hover:opacity-100"
                />
                <header className="flex items-start justify-between gap-6">
                  <div>
                    <span className="font-mono text-[0.7rem] text-subtle">0{gi + 1}</span>
                    <h3 className="mt-2 text-xl font-medium tracking-tight text-fg sm:text-2xl">{group.title}</h3>
                    <p className="mt-2 max-w-md text-sm leading-relaxed text-muted">{group.description}</p>
                  </div>
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl border border-line bg-ink-800 text-accent-soft">
                    <Icon className="size-[18px]" aria-hidden />
                  </span>
                </header>

                <ul
                  className={cn(
                    "mt-7 grid gap-x-8 border-t border-line",
                    group.skills.length > 8 ? "sm:grid-cols-2" : "",
                  )}
                >
                  {group.skills.map((skill) => {
                    const dimmed = focus !== null && (!skill.level || skill.level !== focus);
                    return (
                      <li
                        key={skill.name}
                        className={cn(
                          "flex min-h-11 items-center justify-between gap-4 border-b border-line py-2.5 text-sm transition-opacity duration-300",
                          dimmed ? "opacity-25" : "opacity-100",
                        )}
                      >
                        <span className="flex items-center gap-2.5 text-fg/90">
                          {!leveled && <span aria-hidden className="size-1 rounded-full bg-accent/70" />}
                          {skill.name}
                        </span>
                        {skill.level && (
                          <span className="flex items-center gap-2">
                            <span className="sr-only">{levelMeta[skill.level].label}</span>
                            <Dots count={levelMeta[skill.level].dots} />
                          </span>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function Dots({ count }: { count: number }) {
  return (
    <span aria-hidden className="flex gap-1">
      {[1, 2, 3].map((n) => (
        <span key={n} className={cn("size-1.5 rounded-full", n <= count ? "bg-accent-soft" : "bg-white/12")} />
      ))}
    </span>
  );
}
