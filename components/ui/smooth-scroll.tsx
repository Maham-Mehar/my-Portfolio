"use client";

import Lenis from "lenis";
import { useEffect } from "react";

const HEADER_OFFSET = 88;

/**
 * Inertial wheel scrolling (Lenis) for mouse/trackpad users. Touch keeps
 * native scrolling, and nothing is installed under prefers-reduced-motion.
 * In-page anchor links are routed through Lenis so they glide too.
 */
export function SmoothScroll() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const lenis = new Lenis({ lerp: 0.09, wheelMultiplier: 0.9, syncTouch: false });
    let frame = requestAnimationFrame(function raf(time) {
      lenis.raf(time);
      frame = requestAnimationFrame(raf);
    });

    function onClick(e: MouseEvent) {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey) return;
      const link = (e.target as Element | null)?.closest<HTMLAnchorElement>('a[href^="#"]');
      const hash = link?.getAttribute("href");
      if (!link || !hash || hash === "#") return;
      const target = document.getElementById(decodeURIComponent(hash.slice(1)));
      if (!target) return;

      e.preventDefault();
      history.pushState(null, "", hash);
      lenis.scrollTo(target, {
        offset: -HEADER_OFFSET,
        duration: 1.2,
        onComplete: () => {
          // Move focus for keyboard and screen-reader users, without a second jump.
          if (!target.hasAttribute("tabindex")) target.setAttribute("tabindex", "-1");
          target.focus({ preventScroll: true });
        },
      });
    }

    document.addEventListener("click", onClick);
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener("click", onClick);
      lenis.destroy();
    };
  }, []);

  return null;
}
