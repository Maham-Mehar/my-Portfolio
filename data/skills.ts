/**
 * Proficiency levels — keep these honest.
 *  core     → used daily in professional work
 *  working  → used in real projects, comfortable
 *  growing  → actively learning and building with
 */
export type Level = "core" | "working" | "growing";

export const levelMeta: Record<Level, { label: string; description: string; dots: number }> = {
  core: { label: "Core", description: "Daily professional use", dots: 3 },
  working: { label: "Working", description: "Used in real projects", dots: 2 },
  growing: { label: "Growing", description: "Actively learning", dots: 1 },
};

export interface Skill {
  name: string;
  level?: Level;
}

export interface SkillGroup {
  id: string;
  title: string;
  description: string;
  icon: "frontend" | "backend" | "product" | "tools";
  skills: Skill[];
}

export const skillGroups: SkillGroup[] = [
  {
    id: "frontend",
    title: "Frontend Engineering",
    description: "My core discipline — component-driven interfaces that are fast, typed and responsive.",
    icon: "frontend",
    skills: [
      { name: "React.js", level: "core" },
      { name: "Next.js", level: "core" },
      { name: "TypeScript", level: "core" },
      { name: "JavaScript", level: "core" },
      { name: "HTML5 & CSS3", level: "core" },
      { name: "Tailwind CSS", level: "core" },
      { name: "Responsive Web Design", level: "core" },
      { name: "Component Architecture", level: "core" },
      { name: "Reusable UI Components", level: "core" },
      { name: "API Integration", level: "core" },
      { name: "UI Implementation from Figma", level: "core" },
      { name: "Redux Toolkit", level: "working" },
    ],
  },
  {
    id: "backend",
    title: "Backend & Data",
    description: "Enough backend to work across the stack — and deliberately growing with Python.",
    icon: "backend",
    skills: [
      { name: "PHP", level: "working" },
      { name: "REST API concepts", level: "working" },
      { name: "Authentication & authorization", level: "working" },
      { name: "Prisma", level: "working" },
      { name: "Supabase", level: "working" },
      { name: "Python", level: "growing" },
      { name: "FastAPI", level: "growing" },
      { name: "PostgreSQL", level: "growing" },
    ],
  },
  {
    id: "product",
    title: "Product & Application",
    description: "The kinds of interfaces I build and the details that make them feel finished.",
    icon: "product",
    skills: [
      { name: "SaaS Applications" },
      { name: "Dashboards & Admin Panels" },
      { name: "Marketplace Interfaces" },
      { name: "AI-Powered Application Interfaces" },
      { name: "Form Handling & Validation" },
      { name: "Loading, Error, Empty & Success States" },
      { name: "Performance & Accessibility" },
    ],
  },
  {
    id: "tools",
    title: "Tools & Workflow",
    description: "A lean, modern workflow from design hand-off to deployment.",
    icon: "tools",
    skills: [
      { name: "Git & GitHub" },
      { name: "VS Code" },
      { name: "Figma" },
      { name: "Vercel" },
      { name: "AI-assisted development tools" },
    ],
  },
];
