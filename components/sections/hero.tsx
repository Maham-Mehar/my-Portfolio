import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { ButtonLink, PlaceholderPill } from "@/components/ui/button-link";
import { Reveal } from "@/components/ui/reveal";
import { site } from "@/data/site";
import { HeroVisual } from "./hero-visual";

const eyebrow = ["Frontend Engineering", "Modern Web", "AI-Ready Experiences"];
const stack = ["React.js", "Next.js", "TypeScript", "Full-Stack Development"];

const facts = [
  { label: "Currently", value: "Frontend Developer at Qubitars Technologies" },
  { label: "Core focus", value: "React.js, Next.js, TypeScript, modern UI architecture" },
  { label: "Expanding into", value: "Python, FastAPI & PostgreSQL" },
];

export function Hero({ resumeHref }: { resumeHref: string | null }) {
  return (
    <section id="home" aria-labelledby="hero-title" className="relative isolate overflow-hidden pt-28 pb-16 sm:pt-36 lg:pb-24">
      {/* Atmosphere: engineering grid + a single restrained light source */}
      <div aria-hidden className="bg-grid mask-fade absolute inset-0 -z-10" />
      <div
        aria-hidden
        className="absolute -top-40 right-[-10%] -z-10 h-[620px] w-[760px] rounded-full bg-[radial-gradient(closest-side,rgb(91_140_255/0.16),rgb(157_140_255/0.07)_55%,transparent)]"
      />
      <div aria-hidden className="absolute inset-x-0 top-16 -z-10 h-px bg-gradient-to-r from-transparent via-accent/25 to-transparent" />

      <div className="container-page">
        <Reveal className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <p className="label-mono flex flex-wrap gap-x-2 text-muted">
            {eyebrow.map((item, i) => (
              <span key={item} className="whitespace-nowrap">
                {item}
                {i < eyebrow.length - 1 && <span aria-hidden className="ml-2 text-subtle">·</span>}
              </span>
            ))}
          </p>
          {site.availability.enabled && (
            <p className="inline-flex items-center gap-2 rounded-full border border-ok/25 bg-ok/5 px-2.5 py-1 text-xs text-ok">
              <span className="size-1.5 rounded-full bg-ok [animation:pulse-dot_2.4s_ease-in-out_infinite]" />
              {site.availability.label}
            </p>
          )}
        </Reveal>

        {/* Not animated: this is the LCP element */}
        <h1
          id="hero-title"
          className="mt-6 max-w-5xl text-balance text-[clamp(2.5rem,7.2vw,5.75rem)] leading-[0.98] font-medium tracking-[-0.045em] text-fg"
        >
          Turning complex ideas into <em className="font-serif font-normal tracking-[-0.02em] text-gradient">exceptional</em>{" "}
          digital experiences.
        </h1>

        <div className="mt-12 grid gap-14 lg:mt-16 lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-5 lg:pt-14">
            <Reveal delay={0.05}>
              <p className="flex flex-wrap items-center gap-x-2.5 gap-y-1 font-mono text-[0.8rem] text-accent-soft">
                {stack.map((item, i) => (
                  <span key={item} className="whitespace-nowrap">
                    {item}
                    {i < stack.length - 1 && <span aria-hidden className="ml-2.5 text-subtle">·</span>}
                  </span>
                ))}
              </p>
            </Reveal>

            <Reveal delay={0.1}>
              <p className="mt-6 max-w-xl text-pretty text-base leading-relaxed text-muted sm:text-[1.0625rem]">
                I build responsive, scalable web experiences—from polished user interfaces and SaaS dashboards to
                API-integrated applications. I also work with backend technologies and continue to expand my
                capabilities with Python, FastAPI, and PostgreSQL.
              </p>
            </Reveal>

            <Reveal delay={0.15} className="mt-9 flex flex-wrap items-center gap-3">
              <ButtonLink href="#projects">
                Explore My Work
                <ArrowDownRight className="size-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:translate-y-0.5" aria-hidden />
              </ButtonLink>
              <ButtonLink href="#contact" variant="secondary">
                Let&apos;s Connect
              </ButtonLink>
              {resumeHref ? (
                <ButtonLink href={resumeHref} target="_blank" rel="noopener" variant="ghost" className="px-3">
                  View Resume
                  <ArrowUpRight className="size-4 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden />
                </ButtonLink>
              ) : (
                <PlaceholderPill hint="Add your résumé at public/resume.pdf">View Resume</PlaceholderPill>
              )}
            </Reveal>
          </div>

          <Reveal delay={0.2} className="lg:col-span-7">
            <HeroVisual />
          </Reveal>
        </div>

        <Reveal delay={0.1}>
          <dl className="mt-16 grid border-t border-line sm:grid-cols-3 lg:mt-20">
            {facts.map((fact) => (
              <div key={fact.label} className="border-b border-line py-5 sm:border-b-0 sm:pr-6 sm:[&+&]:border-l sm:[&+&]:pl-6">
                <dt className="label-mono text-subtle">{fact.label}</dt>
                <dd className="mt-2 text-sm text-fg/90">{fact.value}</dd>
              </div>
            ))}
          </dl>
        </Reveal>
      </div>
    </section>
  );
}
