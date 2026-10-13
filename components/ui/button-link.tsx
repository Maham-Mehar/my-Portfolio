import { cn } from "@/lib/utils";

const base =
  "group relative inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-5 text-sm font-medium transition-[background-color,border-color,color,box-shadow,transform] duration-300 ease-out-quint focus-visible:outline-offset-4";

const variants = {
  primary:
    "bg-fg text-ink-950 shadow-[0_0_0_1px_rgb(255_255_255/0.1),0_8px_30px_-8px_rgb(91_140_255/0.55)] hover:bg-white hover:shadow-[0_0_0_1px_rgb(255_255_255/0.2),0_10px_40px_-6px_rgb(91_140_255/0.75)]",
  secondary: "border border-line-strong bg-white/[0.03] text-fg hover:border-accent/60 hover:bg-accent/10",
  ghost: "text-muted hover:text-fg",
} as const;

export type ButtonVariant = keyof typeof variants;

type ButtonLinkProps = React.ComponentProps<"a"> & {
  variant?: ButtonVariant;
};

export function ButtonLink({ variant = "primary", className, children, ...props }: ButtonLinkProps) {
  return (
    <a className={cn(base, variants[variant], className)} {...props}>
      {children}
    </a>
  );
}

interface PlaceholderPillProps {
  children: React.ReactNode;
  hint: string;
  className?: string;
}

/**
 * Stand-in for a link whose target hasn't been configured yet (résumé file,
 * email, social URL). Visibly dashed so it is never mistaken for a real link.
 */
export function PlaceholderPill({ children, hint, className }: PlaceholderPillProps) {
  return (
    <span
      title={hint}
      className={cn(
        "inline-flex min-h-11 cursor-not-allowed items-center gap-2 rounded-full border border-dashed border-line-strong px-5 text-sm text-subtle",
        className,
      )}
    >
      {children}
      <span className="sr-only"> — {hint}</span>
    </span>
  );
}
