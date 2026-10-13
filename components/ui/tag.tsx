import { cn } from "@/lib/utils";

export function Tag({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border border-line bg-white/[0.025] px-2 py-1 font-mono text-[0.6875rem] leading-none tracking-wide text-muted",
        className,
      )}
    >
      {children}
    </span>
  );
}
