/**
 * Shared motion language. Every JS-driven animation pulls its timing from
 * here so reveals, hovers and transitions feel like one system.
 * (CSS-driven animations use the matching --ease-out-quint token.)
 */
export const ease = [0.22, 1, 0.36, 1] as const;

export const duration = {
  /** Hover / feedback. */
  fast: 0.3,
  /** Scroll reveals. */
  base: 0.7,
  /** Headline choreography. */
  slow: 1.05,
} as const;

/** Stagger between sibling words / items. */
export const stagger = 0.055;

/** Shared in-view trigger: fire once, slightly before the element is fully in. */
export const inView = { once: true, margin: "0px 0px -10% 0px" } as const;

/** True on devices with a precise, hover-capable pointer (mouse / trackpad). */
export function isFinePointer(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(hover: hover) and (pointer: fine)").matches;
}
