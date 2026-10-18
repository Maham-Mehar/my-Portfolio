"use client";

import { ArrowUpRight, Menu, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { PlaceholderPill } from "@/components/ui/button-link";
import { Monogram } from "@/components/ui/monogram";
import { RollText } from "@/components/ui/roll-text";
import { navItems } from "@/data/navigation";
import { site } from "@/data/site";
import { useActiveSection } from "@/lib/use-active-section";
import { cn, isPlaceholder } from "@/lib/utils";

const sectionIds = navItems.map((item) => item.id);
const resumeHint = "Add your résumé at public/resume.pdf";

export function Header({ resumeHref }: { resumeHref: string | null }) {
  const active = useActiveSection(sectionIds);
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [open, setOpen] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);

  // Tuck the bar away while reading downward; bring it back on any upward scroll.
  useEffect(() => {
    let last = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 12);
      if (Math.abs(y - last) > 6) {
        setHidden(y > last && y > 240);
        last = y;
      }
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Mobile menu: lock scroll, close on Escape and when resizing to desktop.
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        toggleRef.current?.focus();
      }
    };
    const mq = window.matchMedia("(min-width: 768px)");
    const onChange = () => {
      if (mq.matches) setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    mq.addEventListener("change", onChange);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
      mq.removeEventListener("change", onChange);
    };
  }, [open]);

  const nameLabel = isPlaceholder(site.name) ? site.name : site.name.split(" ")[0];

  return (
    <motion.header
      animate={{ y: hidden && !open ? "-110%" : "0%" }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      // Keyboard users tabbing into the bar always get it back.
      onFocusCapture={() => setHidden(false)}
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-[background-color,border-color] duration-500",
        open
          ? "border-b border-line bg-ink-950"
          : scrolled
            ? "border-b border-line bg-ink-950/80 backdrop-blur-xl"
            : "border-b border-transparent bg-transparent",
      )}
    >
      <div className="container-page flex h-16 items-center gap-6">
        <a href="#home" className="flex items-center gap-3 rounded-lg" aria-label={`${site.name}, back to top`}>
          <Monogram />
          <span className="hidden text-sm font-medium tracking-tight text-fg sm:block">{nameLabel}</span>
        </a>

        <nav aria-label="Primary" className="ml-auto hidden md:block">
          <ul className="flex items-center gap-1 rounded-full border border-line bg-ink-900/60 p-1 backdrop-blur-md">
            {navItems.map((item) => {
              const isActive = active === item.id;
              return (
                <li key={item.id} className="relative">
                  {isActive && (
                    <motion.span
                      layoutId="nav-pill"
                      className="absolute inset-0 rounded-full bg-white/[0.07] shadow-[inset_0_1px_0_rgb(255_255_255/0.06)]"
                      transition={{ type: "spring", stiffness: 380, damping: 32 }}
                    />
                  )}
                  <a
                    href={`#${item.id}`}
                    aria-current={isActive ? "true" : undefined}
                    className={cn(
                      "group relative block rounded-full px-3.5 py-1.5 text-[0.8125rem] transition-colors",
                      isActive ? "text-fg" : "text-muted hover:text-fg",
                    )}
                  >
                    <RollText>{item.label}</RollText>
                  </a>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="ml-auto flex items-center gap-2 md:ml-0">
          {resumeHref ? (
            <a
              href={resumeHref}
              target="_blank"
              rel="noopener"
              className="inline-flex min-h-9 items-center gap-1.5 rounded-full bg-fg px-4 text-[0.8125rem] font-medium text-ink-950 transition-colors hover:bg-white"
            >
              Resume
              <ArrowUpRight className="size-3.5" aria-hidden />
            </a>
          ) : (
            <PlaceholderPill hint={resumeHint} className="min-h-9 px-4 text-[0.8125rem]">
              Resume
            </PlaceholderPill>
          )}

          <button
            ref={toggleRef}
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? "Close menu" : "Open menu"}
            className="grid size-11 place-items-center rounded-full border border-line bg-ink-900/60 text-fg md:hidden"
          >
            {open ? <X className="size-5" aria-hidden /> : <Menu className="size-5" aria-hidden />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.nav
            id="mobile-menu"
            aria-label="Mobile"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "calc(100dvh - 4rem)" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-y-auto md:hidden"
          >
            <ul className="container-page flex flex-col pt-4 pb-10">
              {navItems.map((item, i) => (
                <motion.li
                  key={item.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 + i * 0.035 }}
                  className="border-b border-line"
                >
                  <a
                    href={`#${item.id}`}
                    onClick={() => setOpen(false)}
                    aria-current={active === item.id ? "true" : undefined}
                    className="flex items-baseline justify-between py-4 text-2xl font-medium tracking-tight text-fg"
                  >
                    {item.label}
                    <span className="font-mono text-xs text-subtle">0{i + 1}</span>
                  </a>
                </motion.li>
              ))}
              <li className="pt-6">
                {resumeHref ? (
                  <a
                    href={resumeHref}
                    target="_blank"
                    rel="noopener"
                    className="flex min-h-12 items-center justify-center gap-2 rounded-full bg-fg font-medium text-ink-950"
                  >
                    View Resume <ArrowUpRight className="size-4" aria-hidden />
                  </a>
                ) : (
                  <PlaceholderPill hint={resumeHint} className="w-full justify-center">
                    Resume (not yet added)
                  </PlaceholderPill>
                )}
              </li>
            </ul>
          </motion.nav>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
