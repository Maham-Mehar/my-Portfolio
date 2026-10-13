import { site } from "@/data/site";
import { cn, initials } from "@/lib/utils";

export function Monogram({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "relative grid size-9 place-items-center rounded-[10px] border border-line-strong bg-ink-800 font-mono text-[0.72rem] font-semibold tracking-wider text-fg",
        "shadow-[inset_0_1px_0_rgb(255_255_255/0.06)]",
        className,
      )}
    >
      {initials(site.name)}
      <span className="absolute -right-px -bottom-px size-1.5 rounded-full bg-accent" />
    </span>
  );
}
