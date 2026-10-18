import { ArrowDownRight, ArrowRight } from "lucide-react";
import { ButtonLink } from "@/components/ui/button-link";
import { Magnetic } from "@/components/ui/magnetic";
import { Parallax } from "@/components/ui/parallax";
import { RollText } from "@/components/ui/roll-text";
import { ScrambleText } from "@/components/ui/scramble-text";
import { experience } from "@/data/experience";
import { projects } from "@/data/projects";
import { site } from "@/data/site";
import { levelMeta, skillGroups } from "@/data/skills";
import { IntelligenceCore, type Capability } from "./intelligence-core";

const stack = ["React.js", "Next.js", "TypeScript", "Tailwind CSS", "Python", "FastAPI"];

/** Capabilities mapped onto the core — built from the real skills and project data. */
const capabilities: Capability[] = stack.flatMap((name) => {
  const group = skillGroups.find((g) => g.skills.some((s) => s.name === name));
  const skill = group?.skills.find((s) => s.name === name);
  if (!group || !skill?.level) return [];
  return [
    {
      name,
      group: group.title,
      level: levelMeta[skill.level].label,
      levelNote: levelMeta[skill.level].description,
      projects: projects.filter((p) => p.stack.includes(name)).map((p) => p.title),
    },
  ];
});

/** Two editorial lines; words rise in sequence (CSS — the LCP element never waits for JS). */
const lines: Array<Array<{ text: string; accent?: boolean }>> = [
  [{ text: "Building" }, { text: "Intelligent", accent: true }],
  [{ text: "Experiences." }],
  [{ text: "Engineering" }, { text: "What’s", accent: true }, { text: "Next.", accent: true }],
];

function stage(d: number) {
  return { "--d": `${d}s` } as React.CSSProperties;
}

export function Hero() {
  const current = experience[0];
  let wordIndex = 0;

  return (
    <section
      id="home"
      data-spotlight
      aria-labelledby="hero-title"
      className="relative isolate flex min-h-[100svh] flex-col overflow-hidden pt-24 pb-10 sm:pt-28 lg:pb-12"
    >
      {/* ── Atmosphere ── */}
      <div aria-hidden className="stage-in absolute inset-0 -z-10" style={stage(-0.3)}>
        <div className="bg-grid absolute inset-0 [mask-image:radial-gradient(ellipse_60%_55%_at_68%_48%,#000_20%,transparent_75%)]" />
        <div className="bg-grid absolute inset-0 hidden [background-image:linear-gradient(to_right,rgb(143_176_255/0.2)_1px,transparent_1px),linear-gradient(to_bottom,rgb(143_176_255/0.2)_1px,transparent_1px)] [mask-image:radial-gradient(240px_circle_at_var(--mx,-100%)_var(--my,-100%),#000,transparent)] md:block" />
        <div className="aurora absolute top-[8%] right-[-12%] h-[760px] w-[900px] rounded-full bg-[radial-gradient(closest-side,rgb(91_140_255/0.18),rgb(157_140_255/0.07)_55%,transparent)]" />
        <div className="aurora absolute bottom-[-20%] left-[-18%] h-[560px] w-[680px] rounded-full bg-[radial-gradient(closest-side,rgb(126_227_245/0.07),transparent)] [animation-delay:-11s]" />
        {/* Horizon hairline that ties the text column to the core */}
        <div className="absolute inset-x-0 top-[58%] h-px bg-gradient-to-r from-transparent via-accent/20 to-transparent max-lg:hidden" />
      </div>

      <div className="container-page grid flex-1 items-center gap-y-14 lg:grid-cols-12 lg:gap-x-6">
        {/* ── Identity ── */}
        <div className="relative z-10 min-w-0 lg:col-span-7">
          <div className="stage-in flex flex-wrap items-center gap-3" style={stage(0.15)}>
            <p className="inline-flex max-w-full items-center gap-2.5 rounded-full border border-accent/25 bg-ink-900/60 px-3 py-1.5 backdrop-blur-md">
              <span aria-hidden className="relative flex size-2">
                <span className="absolute inset-0 rounded-full bg-cyan/60 [animation:pulse-dot_2.4s_ease-in-out_infinite] blur-[3px]" />
                <span className="relative size-2 rounded-full bg-cyan" />
              </span>
              <ScrambleText
                text="Frontend Engineer • AI-Powered Web Experiences"
                delay={0.2}
                className="label-mono text-[0.56rem] tracking-[0.1em] text-fg/90 sm:text-[0.6875rem] sm:tracking-[0.14em]"
              />
            </p>
            {site.availability.enabled && (
              <p className="inline-flex items-center gap-2 rounded-full border border-ok/25 bg-ok/5 px-2.5 py-1 text-xs text-ok">
                <span className="size-1.5 rounded-full bg-ok [animation:pulse-dot_2.4s_ease-in-out_infinite]" />
                {site.availability.label}
              </p>
            )}
          </div>

          <h1
            id="hero-title"
            className="mt-7 text-[clamp(2.1rem,8.4vw,4.25rem)] leading-[1] font-medium tracking-[-0.05em] text-fg lg:text-[clamp(3rem,4.4vw,4.75rem)]"
          >
            {lines.map((line, li) => (
              <span key={li} className="block sm:whitespace-nowrap">
                {line.map((word, wi) => (
                  <span key={word.text}>
                    <span className="word-mask">
                      <span
                        className={
                          word.accent
                            ? "word-rise pr-[0.05em] font-serif font-normal tracking-[-0.02em] italic text-gradient"
                            : "word-rise"
                        }
                        style={{ "--i": 4 + wordIndex++ } as React.CSSProperties}
                      >
                        {word.text}
                      </span>
                    </span>
                    {wi < line.length - 1 && " "}
                  </span>
                ))}
              </span>
            ))}
          </h1>

          <p
            className="stage-in mt-7 max-w-xl text-base leading-relaxed text-pretty text-muted sm:text-lg"
            style={stage(0.95)}
          >
            I create modern digital experiences with <span className="text-fg">React and Next.js</span>, and explore
            AI-powered applications using <span className="text-fg">Python, FastAPI and LLM integrations</span>.
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-3">
            <div className="stage-in" style={stage(1.1)}>
              <Magnetic>
                <ButtonLink href="#projects">
                  <RollText>Explore My Work</RollText>
                  <ArrowDownRight
                    className="size-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:translate-y-0.5"
                    aria-hidden
                  />
                </ButtonLink>
              </Magnetic>
            </div>
            <div className="stage-in" style={stage(1.18)}>
              <Magnetic>
                <ButtonLink href="#contact" variant="secondary">
                  <RollText>Let’s Connect</RollText>
                  <ArrowRight
                    className="size-4 transition-transform duration-300 group-hover:translate-x-0.5"
                    aria-hidden
                  />
                </ButtonLink>
              </Magnetic>
            </div>
          </div>

          {/* Stack indicator — a signal runs along the hairline toward the core */}
          <div className="stage-in mt-12 max-w-xl" style={stage(1.3)}>
            <div className="flex items-center gap-3">
              <span className="label-mono text-subtle">Stack</span>
              <span aria-hidden className="signal-line relative h-px flex-1 bg-line" />
            </div>
            <ul
              aria-label="Core stack"
              className="mt-3 flex flex-wrap gap-x-1 gap-y-1 font-mono text-[0.75rem] text-accent-soft"
            >
              {stack.map((tech, i) => (
                <li key={tech} className="flex items-center">
                  {tech}
                  {i < stack.length - 1 && (
                    <span aria-hidden className="px-2 text-subtle">
                      /
                    </span>
                  )}
                </li>
              ))}
            </ul>
            {current && (
              <p className="mt-4 text-xs text-subtle">
                Currently <span className="text-muted">{current.role}</span> at{" "}
                <span className="text-muted">{current.company}</span>
              </p>
            )}
          </div>
        </div>

        {/* ── AI centerpiece ── */}
        <div className="materialize relative min-w-0 lg:col-span-5 lg:-mr-6 lg:-ml-4 xl:-mr-12" style={stage(0.05)}>
          <Parallax origin="top" distance={90}>
            <IntelligenceCore capabilities={capabilities} />
          </Parallax>
        </div>
      </div>

      {/* Scroll cue */}
      <div className="container-page stage-in mt-10 hidden items-center justify-between md:flex" style={stage(1.6)}>
        <a
          href="#about"
          className="group inline-flex items-center gap-3 rounded-full text-subtle transition-colors hover:text-fg"
        >
          <span className="relative h-10 w-px overflow-hidden bg-line">
            <span className="scroll-cue absolute inset-0 bg-gradient-to-b from-cyan to-violet" />
          </span>
          <span className="label-mono">Scroll to explore</span>
        </a>
        <span className="label-mono text-subtle">01 / About</span>
      </div>
    </section>
  );
}
