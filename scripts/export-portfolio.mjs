/**
 * Exports the portfolio content in data/*.ts to JSON for the FastAPI backend,
 * so the TypeScript files stay the single source of truth.
 *
 *   npm run export:portfolio
 *
 * Node ≥ 22.18 strips TypeScript types natively; the data files only use
 * erasable syntax (interfaces, `import type`), so they load as-is.
 */
import { writeFileSync } from "node:fs";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const load = (file) => import(new URL(`../data/${file}`, import.meta.url).href);

const { site } = await load("site.ts");
const { skillGroups, levelMeta } = await load("skills.ts");
const { projects } = await load("projects.ts");
const { experience } = await load("experience.ts");
const { interests } = await load("interests.ts");

const placeholder = (v) => !v || /^\[.*\]$/.test(String(v).trim());

const portfolio = {
  owner: {
    name: placeholder(site.name) ? null : site.name,
    role: site.role,
    pronouns: site.pronouns,
    email: site.email,
    socials: site.socials,
    availability: site.availability.enabled ? site.availability.label : null,
    resume_available: existsSync(path.join(root, "public", site.resumePath.replace(/^\//, ""))),
  },
  levels: levelMeta,
  skill_groups: skillGroups,
  // Visual-only fields (media, accent) stay in the frontend.
  projects: projects.map((p) => ({
    id: p.id,
    title: p.title,
    category: p.category,
    summary: p.summary,
    context: p.context ?? null,
    contributions: p.contributions,
    details: p.details,
    focus: p.focus,
    stack: p.stack,
    interests: p.interests,
    links: p.links,
    has_screenshot: p.media.kind === "image",
  })),
  experience: experience.map(({ startISO, endISO, ...e }) => ({ ...e, start_iso: startISO, end_iso: endISO ?? null })),
  interests,
};

const out = path.join(root, "backend", "app", "data", "portfolio.json");
writeFileSync(out, JSON.stringify(portfolio, null, 2) + "\n");
console.log(`Wrote ${path.relative(root, out)} — ${projects.length} projects, ${experience.length} roles, ${skillGroups.length} skill groups.`);
