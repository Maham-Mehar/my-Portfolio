/**
 * Central personal configuration.
 *
 * Everything that identifies you lives here. Values left as `null` are shown
 * as clearly marked placeholders on the page until you fill them in.
 */

export interface SiteConfig {
  /** Your full name. The bracketed placeholder is intentional until replaced. */
  name: string;
  /** Short role line used in metadata and the footer. */
  role: string;
  /** Public contact email, e.g. "name@domain.com". */
  email: string | null;
  /**
   * Path (inside /public) to your résumé. The Resume buttons become active
   * automatically once this file exists, e.g. public/resume.pdf.
   */
  resumePath: string;
  socials: {
    github: string | null;
    linkedin: string | null;
  };
  /** Only switch this on when it is accurate. */
  availability: {
    enabled: boolean;
    label: string;
  };
  /** Canonical site URL; set NEXT_PUBLIC_SITE_URL in production. */
  url: string;
}

export const site: SiteConfig = {
  name: "[Your Name]",
  role: "Frontend Developer · React.js & Next.js",
  email: null,
  resumePath: "/resume.pdf",
  socials: {
    github: null,
    linkedin: null,
  },
  availability: {
    enabled: false,
    label: "Open to remote frontend & full-stack roles",
  },
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
};

export const seo = {
  title: `${site.name} — Frontend Developer · React.js, Next.js, TypeScript`,
  description:
    "Frontend developer building responsive, production-ready web applications with React.js, Next.js and TypeScript, with backend experience and growing skills in Python, FastAPI and PostgreSQL.",
};
