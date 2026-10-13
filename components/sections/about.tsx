import { Accent, SectionHeading } from "@/components/ui/section-heading";
import { Reveal } from "@/components/ui/reveal";

const principles = [
  { title: "Clean architecture", text: "Clear boundaries and components that are easy to change later." },
  { title: "Practical problem-solving", text: "The simplest approach that fully solves the real problem." },
  { title: "Continuous learning", text: "Currently going deeper on Python, FastAPI and PostgreSQL." },
  { title: "Collaboration", text: "Working closely with designers, developers and product teams." },
];

export function About() {
  return (
    <section id="about" aria-labelledby="about-title" className="py-24 sm:py-32">
      <div className="container-page">
        <SectionHeading
          index="01"
          eyebrow="About"
          id="about-title"
          title={
            <>
              Thoughtful, responsive and <Accent>maintainable</Accent> — in that order of care.
            </>
          }
        />

        <div className="mt-14 grid gap-12 md:grid-cols-12 md:gap-10">
          <Reveal className="space-y-5 text-pretty text-base leading-relaxed text-muted sm:text-lg md:col-span-7 md:col-start-4">
            <p>
              I&apos;m a developer focused on building thoughtful, responsive, and maintainable web applications. My
              core strength is <span className="text-fg">frontend engineering</span> with React.js, Next.js, TypeScript,
              and modern UI development.
            </p>
            <p>
              I enjoy translating designs into polished interfaces, creating reusable components, integrating APIs, and
              improving the usability of complex applications. I also have backend development knowledge and am building
              further expertise with <span className="text-fg">Python, FastAPI, and PostgreSQL</span>.
            </p>
            <p>
              I value clean architecture, practical problem-solving, continuous learning, and collaboration with teams
              building useful digital products.
            </p>
          </Reveal>
        </div>

        <ul className="mt-16 grid border-t border-line sm:grid-cols-2 lg:grid-cols-4">
          {principles.map((p, i) => (
            <Reveal
              as="li"
              key={p.title}
              delay={i * 0.06}
              className="border-b border-line py-6 sm:odd:pr-6 sm:even:border-l sm:even:pl-6 lg:border-b-0 lg:pr-6 lg:[&:not(:first-child)]:border-l lg:[&:not(:first-child)]:pl-6"
            >
              <span className="font-mono text-[0.7rem] text-accent-soft">0{i + 1}</span>
              <h3 className="mt-3 text-base font-medium text-fg">{p.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{p.text}</p>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}
