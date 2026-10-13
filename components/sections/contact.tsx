import { ArrowUpRight, FileText, Mail } from "lucide-react";
import { GitHubIcon, LinkedInIcon } from "@/components/ui/brand-icons";
import { ButtonLink, PlaceholderPill } from "@/components/ui/button-link";
import { Reveal } from "@/components/ui/reveal";
import { site } from "@/data/site";

interface Channel {
  label: string;
  value: string | null;
  href: string | null;
  icon: React.ReactNode;
  hint: string;
  external?: boolean;
}

export function Contact({ resumeHref }: { resumeHref: string | null }) {
  const channels: Channel[] = [
    {
      label: "Email",
      value: site.email,
      href: site.email ? `mailto:${site.email}` : null,
      icon: <Mail className="size-4" aria-hidden />,
      hint: "Set `email` in data/site.ts",
    },
    {
      label: "LinkedIn",
      value: site.socials.linkedin?.replace(/^https?:\/\/(www\.)?/, "") ?? null,
      href: site.socials.linkedin,
      icon: <LinkedInIcon className="size-4" />,
      hint: "Set `socials.linkedin` in data/site.ts",
      external: true,
    },
    {
      label: "GitHub",
      value: site.socials.github?.replace(/^https?:\/\/(www\.)?/, "") ?? null,
      href: site.socials.github,
      icon: <GitHubIcon className="size-4" />,
      hint: "Set `socials.github` in data/site.ts",
      external: true,
    },
    {
      label: "Résumé",
      value: resumeHref ? "View PDF" : null,
      href: resumeHref,
      icon: <FileText className="size-4" aria-hidden />,
      hint: "Add your résumé at public/resume.pdf",
      external: true,
    },
  ];

  return (
    <section id="contact" aria-labelledby="contact-title" className="relative isolate overflow-hidden py-24 sm:py-36">
      <div aria-hidden className="bg-grid mask-fade absolute inset-0 -z-10 opacity-70" />
      <div
        aria-hidden
        className="absolute bottom-[-30%] left-1/2 -z-10 h-[560px] w-[900px] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgb(91_140_255/0.14),rgb(157_140_255/0.06)_60%,transparent)]"
      />

      <div className="container-page">
        <Reveal className="flex items-center gap-3">
          <span className="label-mono text-accent-soft">06</span>
          <span aria-hidden className="h-px w-8 bg-line-strong" />
          <span className="label-mono text-subtle">Contact</span>
        </Reveal>

        <Reveal delay={0.05}>
          <h2
            id="contact-title"
            className="mt-8 max-w-4xl text-balance text-[clamp(2.4rem,6.5vw,5rem)] leading-[1] font-medium tracking-[-0.045em] text-fg"
          >
            Have a product to build? <em className="font-serif font-normal tracking-[-0.02em] text-gradient">Let&apos;s make it happen.</em>
          </h2>
        </Reveal>

        <div className="mt-12 grid gap-12 lg:grid-cols-12 lg:gap-10">
          <Reveal delay={0.1} className="lg:col-span-5">
            <p className="max-w-md text-pretty text-lg leading-relaxed text-muted">
              I&apos;m interested in collaborating on thoughtful web products and connecting with teams looking for
              frontend or suitable full-stack development support.
            </p>
            <div className="mt-8">
              {site.email ? (
                <ButtonLink href={`mailto:${site.email}`}>
                  <Mail className="size-4" aria-hidden />
                  Email me
                </ButtonLink>
              ) : (
                <PlaceholderPill hint="Set `email` in data/site.ts">
                  <Mail className="size-4" aria-hidden />
                  Email (not yet configured)
                </PlaceholderPill>
              )}
            </div>
          </Reveal>

          <Reveal delay={0.15} className="lg:col-span-7">
            <ul className="border-t border-line">
              {channels.map((c) => (
                <li key={c.label} className="border-b border-line">
                  {c.href ? (
                    <a
                      href={c.href}
                      {...(c.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                      className="group flex min-h-16 items-center gap-4 py-4 transition-colors"
                    >
                      <span className="grid size-10 place-items-center rounded-xl border border-line bg-ink-800 text-muted transition-colors group-hover:border-accent/40 group-hover:text-accent-soft">
                        {c.icon}
                      </span>
                      <span className="label-mono w-20 text-subtle">{c.label}</span>
                      <span className="min-w-0 flex-1 truncate text-fg transition-colors group-hover:text-white">{c.value}</span>
                      <ArrowUpRight
                        className="size-5 shrink-0 text-subtle transition-[color,transform] duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-accent-soft"
                        aria-hidden
                      />
                      {c.external && <span className="sr-only">(opens in a new tab)</span>}
                    </a>
                  ) : (
                    <div className="flex min-h-16 items-center gap-4 py-4" title={c.hint}>
                      <span className="grid size-10 place-items-center rounded-xl border border-dashed border-line-strong text-subtle">
                        {c.icon}
                      </span>
                      <span className="label-mono w-20 text-subtle">{c.label}</span>
                      <span className="min-w-0 flex-1 truncate text-sm text-subtle">Not yet added</span>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
