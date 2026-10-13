import Image from "next/image";
import type { Accent, ProjectMedia as Media } from "@/data/projects";
import { cn } from "@/lib/utils";

export const accentHex: Record<Accent, string> = {
  blue: "#5b8cff",
  violet: "#9d8cff",
  cyan: "#7ee3f5",
};

interface ProjectMediaProps {
  media: Media;
  title: string;
  accent: Accent;
  priority?: boolean;
}

/**
 * Browser-framed project visual. Real screenshots render through next/image;
 * placeholders render an abstract wireframe and say so on the frame.
 */
export function ProjectMedia({ media, title, accent, priority }: ProjectMediaProps) {
  const style = { "--a": accentHex[accent] } as React.CSSProperties;

  return (
    <figure
      style={style}
      className="group/media relative overflow-hidden rounded-2xl border border-line-strong bg-ink-900 shadow-[0_40px_80px_-40px_rgb(0_0_0/0.8)]"
    >
      {/* Window chrome */}
      <div className="flex items-center gap-3 border-b border-line px-4 py-2.5">
        <div aria-hidden className="flex gap-1.5">
          <span className="size-2 rounded-full bg-white/15" />
          <span className="size-2 rounded-full bg-white/15" />
          <span className="size-2 rounded-full bg-white/15" />
        </div>
        <div className="mx-auto flex h-5 w-1/2 max-w-56 items-center justify-center rounded-md bg-white/[0.04] font-mono text-[0.6rem] text-subtle">
          {media.kind === "image" ? title : "preview"}
        </div>
        <span aria-hidden className="w-9" />
      </div>

      <div className="relative aspect-[16/10] overflow-hidden">
        {media.kind === "image" ? (
          <Image
            src={media.src}
            alt={media.alt}
            width={media.width}
            height={media.height}
            priority={priority}
            sizes="(min-width: 1024px) 680px, 100vw"
            className="size-full object-cover object-top transition-transform duration-700 ease-out-quint group-hover/media:scale-[1.02]"
          />
        ) : (
          <>
            <div
              aria-hidden
              className="absolute inset-0 transition-transform duration-700 ease-out-quint group-hover/media:scale-[1.025]"
            >
              <div className="absolute inset-0 bg-[radial-gradient(120%_80%_at_80%_0%,color-mix(in_oklab,var(--a)_18%,transparent),transparent_60%)]" />
              {media.variant === "corporate" && <CorporateWire />}
              {media.variant === "marketplace" && <MarketplaceWire />}
              {media.variant === "travel" && <TravelWire />}
              {media.variant === "generic" && <GenericWire />}
            </div>
            <figcaption className="absolute bottom-3 left-3 rounded-md border border-line bg-ink-950/80 px-2 py-1 font-mono text-[0.6rem] tracking-wide text-muted backdrop-blur-sm">
              Illustrative layout · not a product screenshot
            </figcaption>
          </>
        )}
      </div>
    </figure>
  );
}

/* ───────────── Wireframe primitives ───────────── */

function Bar({ className }: { className?: string }) {
  return <div className={cn("h-1.5 rounded-full bg-white/10", className)} />;
}

function Block({ className, children }: { className?: string; children?: React.ReactNode }) {
  return <div className={cn("rounded-lg border border-white/[0.06] bg-white/[0.03]", className)}>{children}</div>;
}

function WireNav() {
  return (
    <div className="flex items-center gap-3">
      <div className="size-3.5 rounded bg-(--a)/70" />
      <div className="hidden gap-2 sm:flex">
        <Bar className="w-8" />
        <Bar className="w-10" />
        <Bar className="w-7" />
        <Bar className="w-9" />
      </div>
      <div className="ml-auto h-4 w-14 rounded-full bg-(--a)/30" />
    </div>
  );
}

function CorporateWire() {
  return (
    <div className="absolute inset-0 flex flex-col gap-[6%] p-[5%]">
      <WireNav />
      <div className="grid flex-1 grid-cols-5 items-center gap-[5%]">
        <div className="col-span-3 space-y-2.5">
          <div className="h-1 w-12 rounded-full bg-(--a)/60" />
          <div className="h-3.5 w-11/12 rounded bg-white/20" />
          <div className="h-3.5 w-3/4 rounded bg-white/20" />
          <Bar className="mt-3 w-5/6" />
          <Bar className="w-2/3" />
          <div className="flex gap-2 pt-2">
            <div className="h-4 w-16 rounded-full bg-(--a)/60" />
            <div className="h-4 w-14 rounded-full border border-white/15" />
          </div>
        </div>
        <div className="relative col-span-2 aspect-square">
          <div className="absolute inset-0 rounded-full border border-(--a)/30" />
          <div className="absolute inset-[18%] rounded-full border border-(--a)/40" />
          <div className="absolute inset-[36%] rounded-full bg-(--a)/30 blur-[2px]" />
          <div className="absolute top-[12%] right-0 h-5 w-14 rounded-md border border-white/10 bg-ink-800/80" />
          <div className="absolute bottom-[10%] left-0 h-5 w-16 rounded-md border border-white/10 bg-ink-800/80" />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-[3%]">
        {[0, 1, 2].map((i) => (
          <Block key={i} className="space-y-2 p-[8%]">
            <div className="size-3.5 rounded bg-(--a)/40" />
            <Bar className="w-3/4 bg-white/15" />
            <Bar className="w-full" />
          </Block>
        ))}
      </div>
    </div>
  );
}

function MarketplaceWire() {
  return (
    <div className="absolute inset-0 flex flex-col gap-[5%] p-[5%]">
      <div className="flex items-center gap-3">
        <div className="size-3.5 rounded-full bg-(--a)/70" />
        <div className="h-4 flex-1 rounded-full border border-white/10 bg-white/[0.03]" />
        <div className="size-4 rounded-full bg-white/10" />
      </div>
      <div className="grid flex-1 grid-cols-4 gap-[3%]">
        <div className="hidden space-y-2.5 sm:block">
          <Bar className="w-2/3 bg-white/15" />
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center gap-1.5">
              <div className={cn("size-2 rounded-sm border border-white/20", i === 1 && "bg-(--a)/70")} />
              <Bar className="flex-1" />
            </div>
          ))}
          <Bar className="mt-4 w-1/2 bg-white/15" />
          <div className="h-1 rounded-full bg-gradient-to-r from-(--a)/70 to-white/10" />
        </div>
        <div className="col-span-4 grid grid-cols-3 gap-[4%] sm:col-span-3">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <Block key={i} className="flex flex-col p-[6%]">
              <div
                className="aspect-[4/3] rounded-md"
                style={{
                  background: `linear-gradient(${120 + i * 30}deg, color-mix(in oklab, var(--a) ${18 + (i % 3) * 8}%, transparent), rgb(255 255 255 / 0.03))`,
                }}
              />
              <Bar className="mt-2 w-4/5 bg-white/15" />
              <div className="mt-1.5 flex items-center justify-between">
                <Bar className="w-1/3" />
                <div className="h-2 w-6 rounded-full bg-(--a)/50" />
              </div>
            </Block>
          ))}
        </div>
      </div>
      {/* Mobile frame */}
      <div className="absolute right-[4%] bottom-[6%] hidden w-[22%] rounded-[14px] border border-white/15 bg-ink-850 p-[1.2%] shadow-2xl md:block">
        <div className="mx-auto mb-1.5 h-1 w-1/3 rounded-full bg-white/15" />
        <div className="aspect-square rounded-lg bg-[linear-gradient(140deg,color-mix(in_oklab,var(--a)_35%,transparent),transparent)]" />
        <div className="space-y-1.5 p-[6%]">
          <Bar className="w-3/4 bg-white/20" />
          <Bar className="w-1/2" />
          <div className="mt-2 h-3 rounded-full bg-(--a)/60" />
        </div>
      </div>
    </div>
  );
}

function TravelWire() {
  return (
    <div className="absolute inset-0 flex flex-col gap-[5%] p-[5%]">
      <WireNav />
      <div className="relative flex-[1.4] overflow-hidden rounded-xl border border-white/[0.06]">
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgb(18_26_48)_0%,rgb(34_46_84)_52%,color-mix(in_oklab,var(--a)_30%,rgb(10_14_24))_52%,rgb(10_14_24)_100%)]" />
        <div className="absolute top-[22%] left-[62%] size-[14%] rounded-full bg-(--a)/50 blur-[1px]" />
        <div className="absolute top-[52%] right-0 left-0 h-px bg-(--a)/60" />
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="absolute h-px bg-white/15"
            style={{ top: `${62 + i * 9}%`, left: `${10 + i * 12}%`, right: `${18 - i * 4}%` }}
          />
        ))}
        <div className="absolute top-[18%] left-[6%] space-y-2">
          <div className="h-3 w-32 rounded bg-white/25" />
          <div className="h-3 w-24 rounded bg-white/25" />
        </div>
        <div className="absolute right-[5%] bottom-[10%] left-[5%] flex items-center gap-2 rounded-lg border border-white/10 bg-ink-950/70 p-1.5 backdrop-blur-sm">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex-1 space-y-1 px-1">
              <Bar className="h-1 w-1/2" />
              <Bar className="w-4/5 bg-white/20" />
            </div>
          ))}
          <div className="h-5 w-12 rounded-md bg-(--a)/70" />
        </div>
      </div>
      <div className="grid flex-1 grid-cols-3 gap-[3%]">
        {[0, 1, 2].map((i) => (
          <Block key={i} className="flex flex-col overflow-hidden">
            <div
              className="flex-1"
              style={{
                background: `linear-gradient(180deg, rgb(34 46 84 / 0.8), color-mix(in oklab, var(--a) ${14 + i * 8}%, rgb(10 14 24)))`,
              }}
            />
            <div className="space-y-1.5 p-[8%]">
              <Bar className="w-2/3 bg-white/15" />
              <Bar className="w-1/3" />
            </div>
          </Block>
        ))}
      </div>
    </div>
  );
}

function GenericWire() {
  return (
    <div className="absolute inset-0 flex flex-col gap-[6%] p-[6%]">
      <WireNav />
      <div className="grid flex-1 grid-cols-3 gap-[4%]">
        <Block className="col-span-2" />
        <div className="grid gap-[8%]">
          <Block />
          <Block />
        </div>
      </div>
    </div>
  );
}
