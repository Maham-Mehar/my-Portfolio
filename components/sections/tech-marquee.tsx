import { skillGroups } from "@/data/skills";

const items = skillGroups
  .filter((g) => g.id === "frontend" || g.id === "backend")
  .flatMap((g) => g.skills.map((s) => s.name));

/** Slow, endless band of the stack. Pauses on hover; static under reduced motion. */
export function TechMarquee() {
  return (
    <div
      aria-label="Technologies I work with"
      role="region"
      className="marquee relative overflow-hidden border-y border-line bg-ink-900/40 py-5 [mask-image:linear-gradient(to_right,transparent,#000_12%,#000_88%,transparent)]"
    >
      <ul className="sr-only">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
      <div aria-hidden className="marquee-track flex w-max" style={{ "--marquee-duration": "55s" } as React.CSSProperties}>
        {[0, 1].map((copy) => (
          <div key={copy} className="flex shrink-0 items-center">
            {items.map((item) => (
              <span key={item} className="flex items-center">
                <span className="px-6 text-2xl font-medium tracking-tight whitespace-nowrap text-fg/80 sm:px-8 sm:text-3xl">
                  {item}
                </span>
                <span className="font-serif text-xl text-accent-soft/70 italic">✦</span>
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
