import type { InterestId } from "./interests";

export interface ExperienceEntry {
  id: string;
  company: string;
  role: string;
  start: string;
  end: string;
  /** ISO-ish dates for the <time> element. */
  startISO: string;
  endISO?: string;
  summary: string;
  points: string[];
  tags: string[];
  interests: InterestId[];
}

export const experience: ExperienceEntry[] = [
  {
    id: "qubitars-role",
    company: "Qubitars Technologies",
    role: "Frontend Developer",
    start: "Sep 2024",
    end: "Present",
    startISO: "2024-09",
    summary:
      "Frontend development within the company team, working on company and client-facing web interfaces.",
    points: [
      "Build responsive interfaces and reusable components with React.js and Next.js.",
      "Translate designs into consistent, production-ready UI.",
      "Integrate APIs and handle the loading, error and empty states around them.",
      "Contribute to team-owned projects alongside designers and other developers.",
    ],
    tags: ["React.js", "Next.js", "Responsive UI", "API integration"],
    interests: ["frontend", "api"],
  },
  {
    id: "its-tech-world",
    company: "ITS Tech World",
    role: "Backend Development Intern",
    start: "Apr 2024",
    end: "Aug 2024",
    startISO: "2024-04",
    endISO: "2024-08",
    summary:
      "Backend development practice with PHP, focused on data handling for business modules.",
    points: [
      "Practised PHP backend development in a professional environment.",
      "Implemented CRUD functionality backed by a relational database.",
      "Worked on Sales & Purchase modules.",
      "Managed database records and structure for internal features.",
    ],
    tags: ["PHP", "CRUD", "Databases", "Sales & Purchase"],
    interests: ["backend"],
  },
];
