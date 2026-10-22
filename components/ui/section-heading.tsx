import { cn } from "@/lib/utils";
import { DecodeText } from "./decode-text";
import { Reveal } from "./reveal";
import { SplitText } from "./split-text";

/**
 * One heading system, several compositions. Every variant shares the same
 * vocabulary — a numbered index, mono annotations, hairline rules, masked word
 * reveals and the serif <Accent> — but arranges it to suit its section:
 *
 *  editorial  About       oversized outlined index, staggered two-line title
 *  spec       Expertise   framed spec sheet with an annotation bar and corner ticks
 *  showcase   Projects    asymmetric two-line title that leads into the work
 *  lab        AI Lab      decoded command prompt over a faint dot field
 *  timeline   Experience  the heading is the first node of the timeline below
 *  manifesto  Philosophy  a quoted statement with an attribution-style intro
 */
export type HeadingVariant = "editorial" | "spec" | "showcase" | "lab" | "timeline" | "manifesto";

interface SectionHeadingProps {
  index: string;
  eyebrow: string;
  title: React.ReactNode;
  /** Optional second line, composed separately by variants that stagger lines. */
  title2?: React.ReactNode;
  intro?: React.ReactNode;
  /** Short factual annotations (e.g. counts) shown as technical labels. */
  meta?: string[];
  id?: string;
  className?: string;
  variant?: HeadingVariant;
}

const TITLE = "font-medium text-balance text-fg";

/** Title as one heading for assistive tech, even when it's visually split into lines. */
function Title({
  id,
  title,
  title2,
  className,
  line2Class,
}: {
  id?: string;
  title: React.ReactNode;
  title2?: React.ReactNode;
  className?: string;
  line2Class?: string;
}) {
  if (!title2)
    return (
      <SplitText id={id} className={cn(TITLE, className)}>
        {title}
      </SplitText>
    );
  return (
    <h2 id={id} className={cn(TITLE, className)}>
      <SplitText as="span" className="block">
        {title}
      </SplitText>{" "}
      <SplitText as="span" className={cn("block", line2Class)}>
        {title2}
      </SplitText>
    </h2>
  );
}

export function SectionHeading({
  index,
  eyebrow,
  title,
  title2,
  intro,
  meta = [],
  id,
  className,
  variant = "editorial",
}: SectionHeadingProps) {
  switch (variant) {
    /* ── About: editorial ── */
    case "editorial":
      return (
        <div className={cn("relative", className)}>
          <span
            aria-hidden
            className="text-outline pointer-events-none absolute -top-10 right-0 text-[clamp(5.5rem,15vw,13rem)] leading-none font-medium tracking-[-0.07em] select-none sm:-top-14"
          >
            {index}
          </span>
          <Reveal className="relative flex items-center gap-3">
            <span className="label-mono text-accent-soft">{index}</span>
            <span aria-hidden className="h-px w-8 bg-gradient-to-r from-accent to-cyan" />
            <span className="label-mono text-subtle">{eyebrow}</span>
          </Reveal>
          <Title
            id={id}
            title={title}
            title2={title2}
            className="relative mt-6 text-[clamp(2.05rem,4.4vw,3.85rem)] leading-[1.04] tracking-[-0.042em]"
            line2Class="sm:pl-[10%]"
          />
          {intro && (
            <Reveal delay={0.2} className="relative mt-7 grid lg:grid-cols-12">
              <p className="flex max-w-md gap-4 text-base leading-relaxed text-pretty text-muted sm:text-[1.0625rem] lg:col-span-5 lg:col-start-7">
                <span aria-hidden className="mt-3.5 h-px w-10 shrink-0 bg-accent-soft/60" />
                {intro}
              </p>
            </Reveal>
          )}
        </div>
      );

    /* ── Expertise: technical spec sheet ── */
    case "spec":
      return (
        <div className={cn("relative border-y border-line", className)}>
          {/* Corner ticks */}
          {[
            "-top-[7px] -left-[3px]",
            "-top-[7px] -right-[3px]",
            "-bottom-[7px] -left-[3px]",
            "-bottom-[7px] -right-[3px]",
          ].map((pos) => (
            <span
              key={pos}
              aria-hidden
              className={cn("absolute font-mono text-xs leading-none text-accent-soft/70", pos)}
            >
              +
            </span>
          ))}
          <Reveal className="grid grid-cols-2 border-b border-line font-mono text-[0.65rem] tracking-[0.14em] text-subtle uppercase sm:grid-cols-4">
            {[index, eyebrow, ...meta].slice(0, 4).map((cell, i) => (
              <span
                key={cell}
                className={cn(
                  "border-line px-3 py-2.5 sm:border-r sm:last:border-r-0",
                  i % 2 === 0 && "border-r",
                  i === 0 && "text-accent-soft",
                  i > 1 && "border-t sm:border-t-0",
                )}
              >
                {i === 0 ? `[${cell}]` : cell}
              </span>
            ))}
          </Reveal>
          <div className="grid lg:grid-cols-12">
            <Title
              id={id}
              title={title}
              title2={title2}
              className="py-8 text-[clamp(2rem,4.2vw,3.5rem)] leading-[1.05] tracking-[-0.035em] sm:py-10 lg:col-span-7 lg:border-r lg:border-line lg:pr-10"
            />
            {intro && (
              <Reveal delay={0.15} className="flex items-end pb-8 lg:col-span-5 lg:py-10 lg:pl-10">
                <p className="max-w-md text-base leading-relaxed text-pretty text-muted sm:text-lg">{intro}</p>
              </Reveal>
            )}
          </div>
        </div>
      );

    /* ── Projects: curated showcase ── */
    case "showcase":
      return (
        <div className={className}>
          <Reveal className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-b border-line pb-4">
            <span className="flex items-center gap-3">
              <span className="label-mono text-accent-soft">{index}</span>
              <span aria-hidden className="h-px w-8 bg-gradient-to-r from-accent to-cyan" />
              <span className="label-mono text-subtle">{eyebrow}</span>
            </span>
            {meta.length > 0 && <span className="label-mono text-subtle">{meta.join("  ·  ")}</span>}
          </Reveal>
          <div className="mt-10 grid gap-8 lg:grid-cols-12 lg:items-end">
            <Title
              id={id}
              title={title}
              title2={title2}
              className="text-[clamp(2.4rem,6vw,5.25rem)] leading-[0.98] tracking-[-0.05em] lg:col-span-12"
              line2Class="lg:text-right"
            />
            {intro && (
              <Reveal delay={0.2} className="lg:col-span-4 lg:-mt-14 xl:-mt-20">
                <p className="max-w-sm text-base leading-relaxed text-pretty text-muted">{intro}</p>
                <p aria-hidden className="label-mono mt-6 flex items-center gap-3 text-accent-soft">
                  <span className="h-px w-6 bg-accent-soft/60" />
                  Index of work ↓
                </p>
              </Reveal>
            )}
          </div>
        </div>
      );

    /* ── AI Lab: experimental ── */
    case "lab":
      return (
        <div className={cn("relative", className)}>
          <div
            aria-hidden
            className="pointer-events-none absolute -inset-x-4 -inset-y-10 -z-10 bg-[radial-gradient(rgb(143_176_255/0.22)_1px,transparent_1px)] [background-size:18px_18px] [mask-image:radial-gradient(ellipse_55%_70%_at_30%_50%,#000,transparent)]"
          />
          <Reveal className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 font-mono text-xs">
            <span className="flex items-center gap-2 text-fg/90">
              <span className="text-cyan">❯</span>
              <DecodeText text={`lab.run("${index}")`} />
              <span
                aria-hidden
                className="inline-block h-[1.05em] w-[2px] translate-y-[1px] bg-cyan [animation:pulse-dot_1.2s_steps(2)_infinite]"
              />
            </span>
            <span className="label-mono flex items-center gap-2 text-subtle">
              <span
                aria-hidden
                className="size-1.5 rounded-full bg-ok [animation:pulse-dot_2.4s_ease-in-out_infinite]"
              />
              <DecodeText text={[eyebrow, ...meta].join(" · ")} duration={1.2} />
            </span>
          </Reveal>
          <Title
            id={id}
            title={title}
            title2={title2}
            className="mt-8 max-w-4xl text-[clamp(2.2rem,5vw,4.25rem)] leading-[1.03] tracking-[-0.04em]"
          />
          {intro && (
            <Reveal delay={0.15}>
              <p className="mt-7 max-w-2xl text-base leading-relaxed text-pretty text-muted sm:text-lg">
                <span aria-hidden className="font-mono text-subtle">
                  {"// "}
                </span>
                {intro}
              </p>
            </Reveal>
          )}
        </div>
      );

    /* ── Experience: the timeline's first node ── */
    case "timeline":
      return (
        <div className={cn("relative md:pl-2.5", className)}>
          <div className="relative pl-10">
            <span
              aria-hidden
              className="absolute top-1 left-0 size-[11px] rounded-full border-2 border-accent bg-ink-950 shadow-[0_0_14px_rgb(91_140_255/0.6)]"
            />
            {/* Rail drops from the heading into the timeline below */}
            <span
              aria-hidden
              className="absolute top-4 -bottom-14 left-[5px] w-px bg-gradient-to-b from-accent/70 via-line-strong to-line"
            />
            <Reveal className="flex flex-wrap items-center gap-x-4 gap-y-1">
              <span className="label-mono text-accent-soft">{index}</span>
              <span className="label-mono text-subtle">{eyebrow}</span>
              {meta.length > 0 && (
                <span className="font-mono text-xs text-subtle">
                  <span aria-hidden className="mr-3 text-line-strong">
                    /
                  </span>
                  {meta.join(" · ")}
                </span>
              )}
            </Reveal>
            <Title
              id={id}
              title={title}
              title2={title2}
              className="mt-5 text-[clamp(2.3rem,5.2vw,4.4rem)] leading-[1.02] tracking-[-0.045em]"
            />
            {intro && (
              <Reveal delay={0.15}>
                <p className="mt-6 max-w-2xl text-base leading-relaxed text-pretty text-muted sm:text-lg">{intro}</p>
              </Reveal>
            )}
          </div>
        </div>
      );

    /* ── Philosophy: manifesto ── */
    case "manifesto":
      return (
        <div className={cn("grid gap-4 lg:grid-cols-12 lg:gap-10", className)}>
          <Reveal className="lg:col-span-2">
            <span
              aria-hidden
              className="block font-serif text-[clamp(5rem,10vw,9rem)] leading-[0.7] text-accent-soft/40 italic select-none"
            >
              &ldquo;
            </span>
          </Reveal>
          <div className="lg:col-span-10">
            <Reveal className="flex items-center gap-3">
              <span className="label-mono text-accent-soft">{index}</span>
              <span aria-hidden className="h-px w-8 bg-gradient-to-r from-accent to-cyan" />
              <span className="label-mono text-subtle">{eyebrow}</span>
            </Reveal>
            <Title
              id={id}
              title={title}
              title2={title2}
              className="mt-6 max-w-4xl text-[clamp(2.1rem,4.8vw,4rem)] leading-[1.06] tracking-[-0.04em]"
            />
            {intro && (
              <Reveal delay={0.15}>
                <p className="mt-7 flex max-w-2xl gap-4 text-base leading-relaxed text-pretty text-muted italic sm:text-lg">
                  <span aria-hidden className="not-italic text-accent-soft">
                    —
                  </span>
                  {intro}
                </p>
              </Reveal>
            )}
          </div>
        </div>
      );
  }
}

/** Italic serif accent used inside headings. */
export function Accent({ children }: { children: React.ReactNode }) {
  return <em className="font-serif font-normal italic tracking-[-0.01em] text-accent-soft">{children}</em>;
}
