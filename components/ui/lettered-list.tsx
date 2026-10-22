import { cn } from "@/lib/utils";

/** A, B, … Z, AA … — the same lettering as the About editor's gutter. */
export function letterFor(i: number): string {
  return i < 26 ? String.fromCharCode(65 + i) : letterFor(Math.floor(i / 26) - 1) + letterFor(i % 26);
}

/**
 * A list "gutter-lettered" like the About editor (A, B, C …), so detail lists
 * across the site share the editor's signature. Letters are decorative; the
 * list stays a plain semantic <ul>.
 */
export function LetteredList({ items, className }: { items: string[]; className?: string }) {
  return (
    <ul className={cn("space-y-2.5", className)}>
      {items.map((item, i) => (
        <li key={item} className="group flex gap-4 text-[0.9375rem] leading-relaxed text-fg/85">
          <span
            aria-hidden
            className="w-4 shrink-0 pt-px text-right font-mono text-xs leading-[1.6rem] text-subtle/70 transition-colors duration-300 group-hover:text-cyan"
          >
            {letterFor(i)}
          </span>
          {item}
        </li>
      ))}
    </ul>
  );
}
