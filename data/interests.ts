/**
 * "Explore my work" navigator. Each interest maps to relevant technologies
 * and a short statement; matching projects and roles are derived from their
 * own `interests` arrays, so there is a single source of truth.
 */
export type InterestId = "frontend" | "dashboards" | "api" | "marketplace" | "backend";

export interface Interest {
  id: InterestId;
  label: string;
  statement: string;
  technologies: string[];
  /** Shown when no published project matches yet. */
  emptyNote?: string;
}

export const interests: Interest[] = [
  {
    id: "frontend",
    label: "Frontend Engineering",
    statement:
      "My strongest area: responsive, component-driven interfaces with React.js and Next.js, built to be reused and extended.",
    technologies: ["React.js", "Next.js", "TypeScript", "Tailwind CSS", "Component Architecture"],
  },
  {
    id: "dashboards",
    label: "SaaS Dashboards",
    statement:
      "Dashboard and admin interfaces with dense data, a clear hierarchy, and every loading, error and empty state handled.",
    technologies: ["React.js", "Next.js", "TypeScript", "Redux Toolkit", "Form Validation"],
    emptyNote:
      "There's no dedicated dashboard case study published here yet — happy to walk through relevant work in a conversation.",
  },
  {
    id: "api",
    label: "API Integration",
    statement:
      "Connecting interfaces to real data — typed responses, sensible caching, and loading, error and empty states designed rather than forgotten.",
    technologies: ["REST APIs", "TypeScript", "Next.js data fetching", "Supabase", "Prisma"],
  },
  {
    id: "marketplace",
    label: "Marketplace Development",
    statement:
      "Listing-heavy interfaces where scannability, trust signals and mobile browsing decide whether people stay.",
    technologies: ["React.js", "Responsive UI", "Product cards & listings", "Mobile layouts"],
  },
  {
    id: "backend",
    label: "Backend Learning",
    statement:
      "Hands-on PHP backend experience from my internship, and a deliberate move toward Python, FastAPI and PostgreSQL.",
    technologies: ["PHP", "CRUD", "Python", "FastAPI", "PostgreSQL"],
  },
];
