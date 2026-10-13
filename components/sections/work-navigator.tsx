"use client";

import { ArrowDownRight, ArrowRight, Compass } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { Reveal } from "@/components/ui/reveal";
import { Tag } from "@/components/ui/tag";
import { experience } from "@/data/experience";
import { interests, type InterestId } from "@/data/interests";
import { projects } from "@/data/projects";
import { cn } from "@/lib/utils";

interface WorkNavigatorProps {
  value: InterestId | null;
  onChange: (value: InterestId | null) => void;
}

/**
 * "Explore my work": a local, deterministic filter. Picking an interest
 * surfaces matching projects, roles and technologies — no AI model involved.
 */
export function WorkNavigator({ value, onChange }: WorkNavigatorProps) {
  const selected = interests.find((i) => i.id === value) ?? null;
  const matchedProjects = selected ? projects.filter((p) => p.interests.includes(selected.id)) : [];
  const matchedRoles = selected ? experience.filter((e) => e.interests.includes(selected.id)) : [];

  return (
    <Reveal className="mt-14">
      <div className="surface relative overflow-hidden rounded-2xl">
        <div aria-hidden className="bg-grid absolute inset-0 opacity-50 [mask-image:linear-gradient(to_bottom,#000,transparent)]" />

        <div className="relative grid lg:grid-cols-12">
          {/* Choices */}
          <div className="border-b border-line p-6 sm:p-8 lg:col-span-5 lg:border-r lg:border-b-0">
            <div className="flex items-center gap-2.5">
              <Compass className="size-4 text-accent-soft" aria-hidden />
              <h3 id="navigator-title" className="label-mono text-fg">
                Explore my work
              </h3>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              What are you hiring for? Pick an area to see the projects, roles and technologies that relate to it.
            </p>

            <div role="group" aria-labelledby="navigator-title" className="mt-6 flex flex-wrap gap-2">
              <Choice pressed={value === null} onClick={() => onChange(null)}>
                Everything
              </Choice>
              {interests.map((interest) => (
                <Choice
                  key={interest.id}
                  pressed={value === interest.id}
                  onClick={() => onChange(value === interest.id ? null : interest.id)}
                >
                  {interest.label}
                </Choice>
              ))}
            </div>

            <p className="mt-6 font-mono text-[0.65rem] text-subtle">Runs locally · a curated filter, not an AI model</p>
          </div>

          {/* Result */}
          <div className="min-h-[300px] p-6 sm:p-8 lg:col-span-7" aria-live="polite">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={selected?.id ?? "all"}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              >
                {selected ? (
                  <>
                    <p className="label-mono text-accent-soft">{selected.label}</p>
                    <p className="mt-3 max-w-xl text-lg leading-snug text-pretty text-fg">{selected.statement}</p>

                    <div className="mt-6 flex flex-wrap gap-1.5">
                      {selected.technologies.map((t) => (
                        <Tag key={t}>{t}</Tag>
                      ))}
                    </div>

                    <h4 className="label-mono mt-8 text-subtle">Related work</h4>
                    {matchedProjects.length === 0 && matchedRoles.length === 0 ? null : (
                      <ul className="mt-3 divide-y divide-line border-y border-line">
                        {matchedProjects.map((p) => (
                          <ResultLink key={p.id} href={`#project-${p.id}`} kind="Project" title={p.title} meta={p.category} />
                        ))}
                        {matchedRoles.map((r) => (
                          <ResultLink key={r.id} href={`#exp-${r.id}`} kind="Role" title={`${r.role}, ${r.company}`} meta={`${r.start} – ${r.end}`} />
                        ))}
                      </ul>
                    )}
                    {matchedProjects.length === 0 && selected.emptyNote && (
                      <p className="mt-3 rounded-lg border border-dashed border-line-strong p-4 text-sm leading-relaxed text-muted">
                        {selected.emptyNote}{" "}
                        <a href="#contact" className="text-fg underline decoration-line-strong underline-offset-4 hover:decoration-accent">
                          Get in touch
                        </a>
                        .
                      </p>
                    )}
                  </>
                ) : (
                  <>
                    <p className="label-mono text-accent-soft">Overview</p>
                    <p className="mt-3 max-w-xl text-lg leading-snug text-pretty text-fg">
                      {projects.length} featured projects and {experience.length} roles — frontend-first, with growing
                      backend depth.
                    </p>
                    <ul className="mt-6 grid gap-2 sm:grid-cols-2">
                      {interests.map((interest) => (
                        <li key={interest.id}>
                          <button
                            type="button"
                            onClick={() => onChange(interest.id)}
                            className="group flex min-h-11 w-full items-center justify-between rounded-lg border border-line px-3.5 py-3 text-left text-sm text-muted transition-colors hover:border-line-strong hover:text-fg"
                          >
                            {interest.label}
                            <ArrowRight
                              className="size-4 text-subtle transition-[color,transform] group-hover:translate-x-0.5 group-hover:text-accent-soft"
                              aria-hidden
                            />
                          </button>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </Reveal>
  );
}

function Choice({ pressed, onClick, children }: { pressed: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={cn(
        "min-h-10 rounded-full border px-3.5 text-[0.8125rem] transition-colors",
        pressed
          ? "border-accent/60 bg-accent/15 text-fg shadow-[0_0_24px_-8px_rgb(91_140_255/0.7)]"
          : "border-line text-muted hover:border-line-strong hover:text-fg",
      )}
    >
      {children}
    </button>
  );
}

function ResultLink({ href, kind, title, meta }: { href: string; kind: string; title: string; meta: string }) {
  return (
    <li>
      <a href={href} className="group flex items-center gap-4 py-3 text-sm">
        <span className="w-14 shrink-0 font-mono text-[0.65rem] text-subtle uppercase">{kind}</span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-fg">{title}</span>
          <span className="block truncate text-xs text-subtle">{meta}</span>
        </span>
        <ArrowDownRight
          className="size-4 shrink-0 text-subtle transition-[color,transform] group-hover:translate-y-0.5 group-hover:text-accent-soft"
          aria-hidden
        />
      </a>
    </li>
  );
}
