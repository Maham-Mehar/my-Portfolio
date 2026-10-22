import { skillGroups } from "@/data/skills";

const items = skillGroups
  .filter((g) => g.id === "frontend" || g.id === "backend")
  .flatMap((g) => g.skills.map((s) => s.name));

/**
 * A slim stack ticker between the hero and About. It sits on the page grid (same
 * edges as the content above and below) with a fixed label, so it reads as a
 * divider rather than a second headline. Pauses on hover; static under reduced motion.
 */
export function TechMarquee() {
  return (
    <div aria-label="Technologies I work with" role="region" className="relative border-y border-line">
      <div className="container-page flex items-center gap-6 py-4 sm:py-5">
        <p className="label-mono hidden shrink-0 items-center gap-3 text-subtle sm:flex">
          Stack
          <span aria-hidden className="h-px w-8 bg-gradient-to-r from-accent to-cyan" />
        </p>

        <ul className="sr-only">
          {items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>

        <div
          aria-hidden
          className="marquee relative min-w-0 flex-1 overflow-hidden [mask-image:linear-gradient(to_right,transparent,#000_8%,#000_92%,transparent)]"
        >
          <div className="marquee-track flex w-max" style={{ "--marquee-duration": "60s" } as React.CSSProperties}>
            {[0, 1].map((copy) => (
              <div key={copy} className="flex shrink-0 items-center">
                {items.map((item) => (
                  <span key={item} className="flex items-center">
                    <span className="px-5 text-sm font-medium tracking-tight whitespace-nowrap text-muted transition-colors duration-300 hover:text-fg sm:px-6 sm:text-base">
                      {item}
                    </span>
                    <span className="size-1 rounded-full bg-accent-soft/50" />
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
