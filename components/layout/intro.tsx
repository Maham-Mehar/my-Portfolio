import { site } from "@/data/site";
import { initials } from "@/lib/utils";

/**
 * Inline <head> script: plays the intro only on the first visit of a session
 * and never for reduced-motion users. Runs before paint, so there's no flash.
 */
export const introScript = `(function(){try{var d=document.documentElement;if(matchMedia('(prefers-reduced-motion: reduce)').matches||sessionStorage.getItem('intro-seen'))return;sessionStorage.setItem('intro-seen','1');d.classList.add('intro-play');setTimeout(function(){d.classList.remove('intro-play')},2400)}catch(e){}})();`;

/**
 * Counter + split-curtain intro (≈2s). Entirely CSS-driven (globals.css),
 * hidden unless <html> carries `intro-play`.
 */
export function Intro() {
  return (
    <div id="intro" aria-hidden>
      <div className="intro-panel top" />
      <div className="intro-panel bottom" />
      <div className="intro-content">
        <span className="grid size-14 place-items-center rounded-2xl border border-line-strong bg-ink-800 font-mono text-sm font-semibold tracking-wider text-fg shadow-[0_0_60px_-10px_rgb(91_140_255/0.6)]">
          {initials(site.name)}
        </span>
        <div className="flex w-56 items-center justify-between font-mono text-[0.68rem] tracking-[0.14em] text-muted uppercase">
          <span>Initialising interface</span>
          <span className="intro-count tabular-nums text-fg" />
        </div>
        <div className="h-px w-56 overflow-hidden bg-line">
          <div className="intro-bar h-full w-full bg-gradient-to-r from-accent via-violet to-cyan" />
        </div>
      </div>
    </div>
  );
}
