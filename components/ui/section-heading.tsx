import { cn } from "@/lib/utils";
import { Reveal } from "./reveal";

interface SectionHeadingProps {
  index: string;
  eyebrow: string;
  title: React.ReactNode;
  intro?: React.ReactNode;
  id?: string;
  className?: string;
}

export function SectionHeading({ index, eyebrow, title, intro, id, className }: SectionHeadingProps) {
  return (
    <Reveal className={cn("grid gap-6 md:grid-cols-12 md:gap-10", className)}>
      <div className="flex items-center gap-3 md:col-span-3 md:items-start md:pt-3">
        <span className="label-mono text-accent-soft">{index}</span>
        <span aria-hidden className="h-px w-8 bg-line-strong md:hidden" />
        <span className="label-mono text-subtle">{eyebrow}</span>
      </div>
      <div className="md:col-span-9">
        <h2
          id={id}
          className="max-w-3xl text-balance text-[2rem] leading-[1.08] font-medium tracking-[-0.03em] text-fg sm:text-5xl"
        >
          {title}
        </h2>
        {intro ? <p className="mt-5 max-w-2xl text-pretty text-base leading-relaxed text-muted sm:text-lg">{intro}</p> : null}
      </div>
    </Reveal>
  );
}

/** Italic serif accent used inside headings. */
export function Accent({ children }: { children: React.ReactNode }) {
  return <em className="font-serif font-normal italic tracking-[-0.01em] text-accent-soft">{children}</em>;
}
