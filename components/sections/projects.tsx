"use client";

import { ArrowUpRight, Info } from "lucide-react";
import { useState } from "react";
import { GitHubIcon } from "@/components/ui/brand-icons";
import { ProjectMedia } from "@/components/ui/project-media";
import { Reveal } from "@/components/ui/reveal";
import { Accent, SectionHeading } from "@/components/ui/section-heading";
import { Tag } from "@/components/ui/tag";
import type { InterestId } from "@/data/interests";
import { projects, type Project } from "@/data/projects";
import { cn } from "@/lib/utils";
import { WorkNavigator } from "./work-navigator";

export function Projects() {
  const [interest, setInterest] = useState<InterestId | null>(null);

  return (
    <section id="projects" aria-labelledby="projects-title" className="relative py-24 sm:py-32">
      <div aria-hidden className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-line-strong to-transparent" />
      <div className="container-page">
        <SectionHeading
          index="03"
          eyebrow="Selected work"
          id="projects-title"
          title={
            <>
              Projects, and <Accent>exactly</Accent> what I contributed to them.
            </>
          }
          intro="Company and product work across business services, marketplaces and travel. Where a project belongs to a wider team, I say so — and describe my part."
        />

        <WorkNavigator value={interest} onChange={setInterest} />

        <ol className="mt-20 space-y-24 sm:space-y-32">
          {projects.map((project, i) => (
            <ProjectEntry
              key={project.id}
              project={project}
              index={i}
              state={interest === null ? "neutral" : project.interests.includes(interest) ? "match" : "muted"}
            />
          ))}
        </ol>
      </div>
    </section>
  );
}

interface ProjectEntryProps {
  project: Project;
  index: number;
  state: "neutral" | "match" | "muted";
}

function ProjectEntry({ project, index, state }: ProjectEntryProps) {
  const flipped = index % 2 === 1;
  const number = String(index + 1).padStart(2, "0");

  return (
    <li
      id={`project-${project.id}`}
      data-anchor
      className={cn(
        "transition-[opacity,filter] duration-500",
        state === "muted" && "opacity-35 saturate-50",
      )}
    >
      <article aria-labelledby={`project-${project.id}-title`}>
        <Reveal className="mb-8 flex flex-wrap items-center gap-x-4 gap-y-3">
          <span className="font-serif text-4xl leading-none text-fg/90 italic sm:text-5xl">{number}</span>
          <span aria-hidden className="h-px min-w-8 flex-1 bg-line" />
          {state === "match" && (
            <span className="rounded-full border border-accent/40 bg-accent/10 px-2.5 py-1 font-mono text-[0.65rem] text-accent-soft">
              Relevant
            </span>
          )}
          <span className="label-mono w-full text-subtle sm:w-auto">{project.category}</span>
        </Reveal>

        <div className="grid gap-10 lg:grid-cols-12 lg:gap-14">
          <Reveal className={cn("lg:col-span-7", flipped && "lg:order-2")}>
            <ProjectMedia media={project.media} title={project.title} accent={project.accent} />
          </Reveal>

          <Reveal delay={0.08} className={cn("lg:col-span-5", flipped && "lg:order-1")}>
            <h3
              id={`project-${project.id}-title`}
              className="text-3xl font-medium tracking-[-0.03em] text-fg sm:text-4xl"
            >
              {project.title}
            </h3>
            <p className="mt-4 text-pretty leading-relaxed text-muted">{project.summary}</p>

            {project.context && (
              <p className="mt-5 flex gap-2.5 rounded-lg border border-line bg-white/[0.02] p-3 text-[0.8125rem] leading-relaxed text-muted">
                <Info className="mt-0.5 size-4 shrink-0 text-accent-soft" aria-hidden />
                {project.context}
              </p>
            )}

            <h4 className="label-mono mt-8 text-subtle">My contribution</h4>
            <ul className="mt-3 space-y-2.5">
              {project.contributions.map((c) => (
                <li key={c} className="flex gap-3 text-[0.9375rem] leading-relaxed text-fg/85">
                  <span aria-hidden className="mt-[0.6rem] h-px w-3 shrink-0 bg-accent" />
                  {c}
                </li>
              ))}
            </ul>

            <div className="mt-8 flex flex-wrap gap-1.5">
              {project.stack.map((s) => (
                <Tag key={s} className="border-accent/25 text-accent-soft">
                  {s}
                </Tag>
              ))}
              {project.focus.map((f) => (
                <Tag key={f}>{f}</Tag>
              ))}
            </div>

            <ProjectLinks project={project} />
          </Reveal>
        </div>

        <Reveal delay={0.1}>
          <dl
            className={cn(
              "mt-10 grid gap-px overflow-hidden rounded-xl border border-line bg-line",
              project.details.length === 4 ? "sm:grid-cols-2 lg:grid-cols-4" : "sm:grid-cols-3",
            )}
          >
            {project.details.map((d) => (
              <div key={d.label} className="bg-ink-950 p-5 transition-colors duration-300 hover:bg-ink-900">
                <dt className="label-mono text-accent-soft">{d.label}</dt>
                <dd className="mt-2 text-sm leading-relaxed text-muted">{d.text}</dd>
              </div>
            ))}
          </dl>
        </Reveal>
      </article>
    </li>
  );
}

function ProjectLinks({ project }: { project: Project }) {
  const { live, repo } = project.links;
  if (!live && !repo) return null;

  return (
    <div className="mt-8 flex flex-wrap gap-5">
      {live && (
        <a
          href={live}
          target="_blank"
          rel="noopener noreferrer"
          className="group inline-flex items-center gap-1.5 text-sm font-medium text-fg underline decoration-line-strong underline-offset-[6px] transition-colors hover:decoration-accent"
        >
          Live site
          <ArrowUpRight className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden />
          <span className="sr-only">for {project.title} (opens in a new tab)</span>
        </a>
      )}
      {repo && (
        <a
          href={repo}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-sm font-medium text-muted transition-colors hover:text-fg"
        >
          <GitHubIcon className="size-4" />
          Source code
          <span className="sr-only">for {project.title} (opens in a new tab)</span>
        </a>
      )}
    </div>
  );
}
