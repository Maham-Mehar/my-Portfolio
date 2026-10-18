import { Accent, SectionHeading } from "@/components/ui/section-heading";
import { Reveal } from "@/components/ui/reveal";
import { ScrollLitText } from "@/components/ui/scroll-lit-text";

const principles = [
  { title: "Clean architecture", text: "Clear boundaries and components that are easy to change later." },
  { title: "Practical problem-solving", text: "The simplest approach that fully solves the real problem." },
  { title: "Continuous learning", text: "Currently going deeper on Python, FastAPI and PostgreSQL." },
  { title: "Collaboration", text: "Working closely with designers, developers and product teams." },
];

const statement =
  "I build responsive, polished and scalable web applications — turning designs, data and APIs into interfaces people genuinely enjoy using, with React.js, Next.js and TypeScript at the core.";

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
          <ScrollLitText
            text={statement}
            highlight={["React.js", "Next.js", "TypeScript"]}
            className="text-[clamp(1.5rem,3.2vw,2.4rem)] leading-[1.22] font-medium tracking-[-0.025em] text-pretty text-fg md:col-span-9 md:col-start-4"
          />

          <Reveal className="space-y-5 text-base leading-relaxed text-pretty text-muted sm:text-lg md:col-span-7 md:col-start-4">
            <p>
              My core strength is <span className="text-fg">frontend engineering</span> with React.js, Next.js,
              TypeScript, and modern UI development. I enjoy translating designs into polished interfaces, creating
              reusable components, integrating APIs, and improving the usability of complex applications.
            </p>
            <p>
              I also have backend development knowledge and am building further expertise with{" "}
              <span className="text-fg">Python, FastAPI, and PostgreSQL</span>. I value clean architecture, practical
              problem-solving, continuous learning, and collaboration with teams building useful digital products.
            </p>
          </Reveal>
        </div>

        <ul className="mt-16 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {principles.map((p, i) => (
            <Reveal as="li" key={p.title} delay={i * 0.06}>
              <div data-spotlight className="spotlight surface h-full rounded-2xl p-6">
                <span className="font-mono text-[0.7rem] text-accent-soft">0{i + 1}</span>
                <h3 className="mt-6 text-base font-medium text-fg">{p.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{p.text}</p>
              </div>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}
