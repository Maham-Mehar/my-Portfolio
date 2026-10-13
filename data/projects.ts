import type { InterestId } from "./interests";

export type Accent = "blue" | "violet" | "cyan";

/**
 * Project visuals. Use `image` for real screenshots (put files in
 * public/images/projects/). `placeholder` renders an illustrative wireframe
 * frame that is explicitly labelled as not being a product screenshot.
 */
export type ProjectMedia =
  | {
      kind: "image";
      src: string;
      alt: string;
      width: number;
      height: number;
    }
  | {
      kind: "placeholder";
      variant: "corporate" | "marketplace" | "travel" | "generic";
    };

export interface Project {
  id: string;
  title: string;
  category: string;
  /** One or two sentences. */
  summary: string;
  /** Clarifies team ownership vs. your personal contribution. */
  context?: string;
  /** What you personally did. Keep these verifiable. */
  contributions: string[];
  /** Key implementation details or product scope. */
  details: { label: string; text: string }[];
  /** Areas of focus, always shown. */
  focus: string[];
  /** Confirmed technologies. Hidden when empty. */
  stack: string[];
  /** Drives the "Explore my work" navigator. */
  interests: InterestId[];
  links: { live?: string; repo?: string };
  media: ProjectMedia;
  accent: Accent;
}

export const projects: Project[] = [
  {
    id: "qubitars",
    title: "Qubitars Technologies",
    category: "Professional · Company work",
    summary:
      "Frontend interfaces for a business and technology services company — responsive layouts and reusable components built as part of the in-house team.",
    context:
      "Team project. The platform belongs to Qubitars Technologies; this entry describes my frontend contributions only.",
    contributions: [
      "Build responsive page layouts that hold up from small phones to wide desktop screens.",
      "Develop reusable UI components that keep pages consistent and quicker to extend.",
      "Implement interfaces with React.js and Next.js where the project stack uses them.",
      "Integrate APIs and refine the surrounding user experience where applicable.",
    ],
    details: [
      {
        label: "Layout",
        text: "Mobile-first sections recomposed for each breakpoint rather than scaled down.",
      },
      {
        label: "Components",
        text: "Shared building blocks reused across pages to reduce duplicated markup.",
      },
      {
        label: "Integration",
        text: "Interfaces connected to APIs with attention to loading and error states.",
      },
    ],
    focus: ["Responsive UI", "Reusable components", "API integration"],
    stack: ["React.js", "Next.js"],
    interests: ["frontend", "api"],
    links: {},
    media: { kind: "placeholder", variant: "corporate" },
    accent: "blue",
  },
  {
    id: "pawmart",
    title: "PawMart",
    category: "Marketplace · Community platform",
    summary:
      "A pet-focused marketplace and community concept that brings buying, selling and adoption together around clear listings and approachable flows.",
    contributions: [
      "Design and build responsive marketplace interfaces — listing grids, product cards and detail views.",
      "Shape mobile layouts so browsing and listing feel natural on small screens.",
      "Structure pet and listing information so it stays scannable and consistent.",
    ],
    details: [
      {
        label: "Marketplace",
        text: "Buying, selling and adoption journeys within one platform.",
      },
      {
        label: "Profiles",
        text: "Pet-related profiles and structured information.",
      },
      {
        label: "Trust",
        text: "Seller verification concept to make listings more trustworthy.",
      },
      {
        label: "Communication",
        text: "Messaging, requests and notifications between users.",
      },
    ],
    focus: ["Marketplace UI", "Mobile layouts", "Community features"],
    stack: [],
    interests: ["frontend", "marketplace"],
    links: {},
    media: { kind: "placeholder", variant: "marketplace" },
    accent: "violet",
  },
  {
    id: "faraway-yachting",
    title: "Faraway Yachting",
    category: "Travel · Yacht platform",
    summary:
      "A travel-oriented website presenting yachts and destinations, where my work focused on responsive pages, reusable components and visual consistency.",
    contributions: [
      "Develop responsive pages for yacht and destination presentation.",
      "Build reusable UI components shared across the site.",
      "Connect content to APIs where implemented.",
      "Refine layout consistency, spacing and visual details across pages.",
    ],
    details: [
      {
        label: "Presentation",
        text: "Yacht and destination content laid out for browsing on any screen size.",
      },
      {
        label: "Consistency",
        text: "Shared components keep typography, spacing and cards aligned site-wide.",
      },
      {
        label: "Data",
        text: "API-connected content where the project required it.",
      },
    ],
    focus: ["Responsive pages", "Reusable components", "Visual refinement"],
    stack: [],
    interests: ["frontend", "api"],
    links: {},
    media: { kind: "placeholder", variant: "travel" },
    accent: "cyan",
  },

  /*
   * Project 04 — template. Copy this object into the array above to publish
   * another case study; the layout, navigator and links pick it up automatically.
   *
   * {
   *   id: "project-slug",
   *   title: "Project name",
   *   category: "Category · Type",
   *   summary: "One or two sentences on what it is and why it matters.",
   *   context: "Optional: team / ownership note.",
   *   contributions: ["What you personally built."],
   *   details: [{ label: "Area", text: "Key implementation detail." }],
   *   focus: ["Focus area"],
   *   stack: ["Next.js", "TypeScript"],
   *   interests: ["frontend"],
   *   links: { live: "https://…", repo: "https://github.com/…" },
   *   media: {
   *     kind: "image",
   *     src: "/images/projects/project-slug.png",
   *     alt: "Describe what the screenshot shows",
   *     width: 1600,
   *     height: 1000,
   *   },
   *   accent: "blue",
   * },
   */
];
