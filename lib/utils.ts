/** Joins class names, skipping falsy values. */
export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

/** "[Your Name]" → "YN", "Ada Lovelace" → "AL". */
export function initials(name: string): string {
  const parts = name.replace(/[^\p{L}\s]/gu, "").trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? "") : "";
  return (first + last).toUpperCase() || "—";
}

/** True while a config value is still a bracketed placeholder such as "[Your Name]". */
export function isPlaceholder(value: string | null | undefined): boolean {
  return !value || /^\[.*\]$/.test(value.trim());
}
