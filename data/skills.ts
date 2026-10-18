/**
 * Proficiency levels — keep these honest.
 *  core     → used daily in professional work
 *  working  → used in real projects, comfortable
 *  growing  → actively learning and building with
 * Skills without a level are practice areas, not graded tools.
 */
export type Level = "core" | "working" | "growing";

export const levelMeta: Record<Level, { label: string; description: string; dots: number }> = {
  core: { label: "Core", description: "Daily professional use", dots: 3 },
  working: { label: "Working", description: "Used in real projects", dots: 2 },
  growing: { label: "Learning", description: "Actively learning and building with", dots: 1 },
};

export interface Skill {
  name: string;
  level?: Level;
}

export type SkillGroupId = "frontend" | "architecture" | "backend" | "ai" | "tools";

export interface SkillGroup {
  id: SkillGroupId;
  title: string;
  description: string;
  skills: Skill[];
}

export const skillGroups: SkillGroup[] = [
  {
    id: "frontend",
    title: "Frontend engineering",
    description: "My core discipline — component-driven interfaces that are fast, typed and responsive.",
    skills: [
      { name: "React.js", level: "core" },
      { name: "Next.js", level: "core" },
      { name: "TypeScript", level: "core" },
      { name: "JavaScript", level: "core" },
      { name: "Tailwind CSS", level: "core" },
      { name: "HTML5 & CSS3", level: "core" },
      { name: "Responsive UI Development", level: "core" },
      { name: "Performance optimization" },
      { name: "SEO" },
    ],
  },
  {
    id: "architecture",
    title: "UI architecture & state",
    description: "How interfaces stay consistent and easy to extend as they grow.",
    skills: [
      { name: "Reusable component architecture", level: "core" },
      { name: "Figma-to-code implementation", level: "core" },
      { name: "Redux Toolkit", level: "working" },
      { name: "Form handling & validation" },
      { name: "Loading, error, empty & success states" },
    ],
  },
  {
    id: "backend",
    title: "APIs & backend",
    description: "Enough backend to work across the stack — and deliberately growing with Python.",
    skills: [
      { name: "API Integration", level: "core" },
      { name: "REST API concepts", level: "working" },
      { name: "PHP", level: "working" },
      { name: "Authentication & authorization", level: "working" },
      { name: "Python", level: "growing" },
      { name: "FastAPI", level: "growing" },
    ],
  },
  {
    id: "ai",
    title: "AI & LLM integrations",
    description: "Interfaces for AI-powered products, and learning to wire LLMs in safely on the server.",
    skills: [
      { name: "AI-powered application interfaces" },
      { name: "LLM API integration", level: "growing" },
      { name: "AI-assisted development tools" },
    ],
  },
  {
    id: "tools",
    title: "Databases & tools",
    description: "Data layers I've worked with and a lean workflow from design hand-off to deployment.",
    skills: [
      { name: "Prisma", level: "working" },
      { name: "Supabase", level: "working" },
      { name: "PostgreSQL", level: "growing" },
      { name: "Git & GitHub" },
      { name: "VS Code" },
      { name: "Figma" },
      { name: "Vercel" },
    ],
  },
];
