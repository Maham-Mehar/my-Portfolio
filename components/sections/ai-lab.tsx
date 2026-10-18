import { Plus } from "lucide-react";
import { Reveal } from "@/components/ui/reveal";
import { Accent, SectionHeading } from "@/components/ui/section-heading";
import { journal, roadmap } from "@/data/journal";
import { LabExperiments } from "./lab";

export function AiLab() {
  return (
    <section id="lab" aria-labelledby="lab-title" className="relative overflow-x-clip py-24 sm:py-32">
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-line-strong to-transparent"
      />
      <div
        aria-hidden
        className="absolute top-40 left-1/2 -z-10 h-[520px] w-[900px] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgb(91_140_255/0.08),transparent)]"
      />
      <div className="container-page">
        <SectionHeading
          index="04"
          eyebrow="AI Lab"
          id="lab-title"
          title={
            <>
              Where the interface meets the <Accent>model</Accent>.
            </>
          }
          intro="Two small, working experiments that show how I connect frontend craft to backend services and LLMs — with validation, limits and honest fallbacks built in."
        />

        <LabExperiments />

        {/* Build log */}
        <div className="mt-20 grid gap-10 lg:grid-cols-12">
          <Reveal className="min-w-0 lg:col-span-7">
            <div className="flex items-baseline justify-between gap-4">
              <h3 className="text-xl font-medium tracking-tight text-fg">Engineering journal</h3>
              <span className="label-mono text-subtle">Notes from building this site</span>
            </div>
            <ul className="mt-5 border-t border-line">
              {journal.map((note) => (
                <li key={note.id} className="border-b border-line">
                  <details className="group py-1">
                    <summary className="flex min-h-14 cursor-pointer list-none items-center gap-4 py-3 [&::-webkit-details-marker]:hidden">
                      <time dateTime={note.date} className="w-16 shrink-0 font-mono text-[0.68rem] text-subtle">
                        {note.date}
                      </time>
                      <span className="flex-1 text-[0.95rem] text-fg transition-colors group-hover:text-white">
                        {note.title}
                      </span>
                      <Plus
                        className="size-4 shrink-0 text-subtle transition-transform duration-300 group-open:rotate-45"
                        aria-hidden
                      />
                    </summary>
                    <div className="pb-5 pl-20 max-sm:pl-0">
                      <p className="text-sm leading-relaxed text-muted">{note.body}</p>
                      <p className="mt-3 flex flex-wrap gap-1.5">
                        {note.tags.map((t) => (
                          <span
                            key={t}
                            className="rounded border border-line px-1.5 py-0.5 font-mono text-[0.62rem] text-subtle"
                          >
                            {t}
                          </span>
                        ))}
                      </p>
                    </div>
                  </details>
                </li>
              ))}
            </ul>
          </Reveal>

          <Reveal delay={0.1} className="min-w-0 lg:col-span-5">
            <div className="rounded-2xl border border-dashed border-line-strong p-6">
              <p className="label-mono text-accent-soft">Roadmap · planned, not done</p>
              <ul className="mt-4 space-y-3">
                {roadmap.map((item) => (
                  <li key={item} className="flex gap-3 text-sm leading-relaxed text-muted">
                    <span
                      aria-hidden
                      className="mt-1.5 size-3 shrink-0 rounded-sm border border-dashed border-subtle"
                    />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
