import { ArrowUp } from "lucide-react";
import { Monogram } from "@/components/ui/monogram";
import { site } from "@/data/site";

export function Footer() {
  return (
    <footer className="border-t border-line">
      <div className="container-page flex flex-col gap-6 py-10 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Monogram />
          <div>
            <p className="text-sm font-medium text-fg">{site.name}</p>
            <p className="text-xs text-subtle">{site.role}</p>
          </div>
        </div>
        <p className="font-mono text-[0.7rem] text-subtle">
          © {new Date().getFullYear()} · Built with Next.js, TypeScript &amp; Tailwind CSS
        </p>
        <a
          href="#home"
          className="inline-flex items-center gap-2 self-start rounded-full text-sm text-muted transition-colors hover:text-fg sm:self-auto"
        >
          Back to top <ArrowUp className="size-3.5" aria-hidden />
        </a>
      </div>
    </footer>
  );
}
