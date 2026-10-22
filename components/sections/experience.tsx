import { Reveal } from "@/components/ui/reveal";
import { Accent, SectionHeading } from "@/components/ui/section-heading";
import { LetteredList } from "@/components/ui/lettered-list";
import { Tag } from "@/components/ui/tag";
import { TimelineNode, TimelineRail } from "@/components/ui/timeline";
import { experience } from "@/data/experience";

export function Experience() {
  return (
    <section id="experience" aria-labelledby="experience-title" className="relative py-24 sm:py-32">
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-line-strong to-transparent"
      />
      <div className="container-page">
        <SectionHeading
          index="05"
          eyebrow="Experience"
          id="experience-title"
          variant="timeline"
          meta={[`${experience.at(-1)?.start ?? ""} — ${experience[0]?.end ?? ""}`, `${experience.length} roles`]}
          title={
            <>
              Where I&apos;ve <Accent>worked</Accent>.
            </>
          }
        />

        <ol className="relative mt-14 md:pl-2.5">
          <TimelineRail className="top-2 bottom-2 left-[5px] md:left-[15px]" />
          {experience.map((job, i) => (
            <Reveal as="li" key={job.id} delay={i * 0.08} className="relative pb-14 pl-10 last:pb-0">
              <TimelineNode className="absolute top-1.5 left-0" />
              <article
                id={`exp-${job.id}`}
                data-anchor
                data-spotlight
                aria-labelledby={`exp-${job.id}-title`}
                className="spotlight surface -mt-4 rounded-2xl p-6 sm:p-8"
              >
                <p className="font-mono text-xs text-subtle">
                  <time dateTime={job.startISO}>{job.start}</time> —{" "}
                  {job.endISO ? (
                    <time dateTime={job.endISO}>{job.end}</time>
                  ) : (
                    <span className="text-accent-soft">{job.end}</span>
                  )}
                </p>
                <h3 id={`exp-${job.id}-title`} className="mt-3 text-2xl font-medium tracking-tight text-fg">
                  {job.role}
                  <span className="text-muted"> · {job.company}</span>
                </h3>
                <p className="mt-3 max-w-2xl leading-relaxed text-muted">{job.summary}</p>
                <LetteredList items={job.points} className="mt-5 max-w-2xl" />
                <div className="mt-5 flex flex-wrap gap-1.5">
                  {job.tags.map((tag) => (
                    <Tag key={tag}>{tag}</Tag>
                  ))}
                </div>
              </article>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}
