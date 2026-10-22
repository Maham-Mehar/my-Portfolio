import { Reveal } from "@/components/ui/reveal";
import { Accent, SectionHeading } from "@/components/ui/section-heading";
import { cn } from "@/lib/utils";
import { AboutAnatomy } from "./about-anatomy";
import { Approach, StackFile } from "./about-profile";
import { AboutStatement } from "./about-statement";

/**
 * About — "the anatomy of an interface". Uses the shared SectionHeading, then a
 * walk through the four layers I build, a short statement, and two sub-rows
 * (stack, how I work) on the same 3 / 9 grid as the heading so everything aligns.
 */
export function About() {
  return (
    <section id="about" aria-labelledby="about-title" className="relative overflow-x-clip py-24 sm:py-32">
      <div className="container-page">
        <SectionHeading
          index="01"
          eyebrow="About"
          id="about-title"
          variant="editorial"
          title="I build the layers between"
          title2={
            <>
              an <Accent>idea</Accent> and the person using it.
            </>
          }
          intro="Frontend engineer working in React.js, Next.js and TypeScript, growing into backend and AI-powered interfaces."
        />

        <AboutAnatomy />

        <div className="mt-24 sm:mt-32">
          <AboutStatement />
        </div>

        <SubRow className="mt-20 sm:mt-24" label="Stack" note="What I ship with today, and what I'm learning next.">
          <StackFile />
        </SubRow>

        <SubRow className="mt-20 sm:mt-24" label="How I work" note="Three habits behind every interface.">
          <Approach />
        </SubRow>
      </div>
    </section>
  );
}

/** A labelled row on the section grid: label in the left rail, content in the main column. */
function SubRow({
  label,
  note,
  className,
  children,
}: {
  label: string;
  note: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("grid gap-6 border-t border-line pt-10 md:grid-cols-12 md:gap-10", className)}>
      <Reveal className="md:col-span-3">
        <h3 className="label-mono text-subtle">{label}</h3>
        <p className="mt-3 max-w-[16rem] text-sm leading-relaxed text-muted">{note}</p>
      </Reveal>
      <div className="min-w-0 md:col-span-9">{children}</div>
    </div>
  );
}
