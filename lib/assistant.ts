/**
 * Portfolio assistant — a local, deterministic answer engine.
 *
 * It matches a question against a small set of intents and composes the
 * answer from the same data files the page renders, so it can never say
 * anything the portfolio doesn't. No model, no network, no API key.
 */
import { experience } from "@/data/experience";
import { projects } from "@/data/projects";
import { site } from "@/data/site";
import { skillGroups } from "@/data/skills";
import { isPlaceholder } from "@/lib/utils";

export interface AnswerLink {
  label: string;
  href: string;
}

export interface Answer {
  text: string;
  links?: AnswerLink[];
  /** Follow-up suggestions. */
  next?: string[];
}

export const starterQuestions = [
  "What's your core stack?",
  "Show me your projects",
  "Where do you work now?",
  "Do you do backend work?",
  "How can I contact you?",
];

const list = (items: string[]) =>
  items.length <= 1 ? (items[0] ?? "") : `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;

const lowerFirst = (t: string) => t.charAt(0).toLowerCase() + t.slice(1);

const skillsAt = (level: "core" | "working" | "growing") =>
  skillGroups.flatMap((g) => g.skills.filter((s) => s.level === level).map((s) => s.name));

function contactAnswer(): Answer {
  const links: AnswerLink[] = [{ label: "Go to contact", href: "#contact" }];
  if (site.email) links.unshift({ label: `Email ${site.email}`, href: `mailto:${site.email}` });
  if (site.socials.linkedin) links.push({ label: "LinkedIn", href: site.socials.linkedin });
  return {
    text: site.email
      ? `The quickest way is email — ${site.email}. The contact section can also draft the message for you.`
      : "All contact options live in the contact section at the bottom of the page.",
    links,
    next: ["Show me your projects", "What's your core stack?"],
  };
}

function projectAnswer(id: string): Answer {
  const p = projects.find((x) => x.id === id)!;
  const links: AnswerLink[] = [{ label: `Read the ${p.title} case`, href: `#project-${p.id}` }];
  if (p.links.live) links.push({ label: "Live site", href: p.links.live });
  if (p.links.repo) links.push({ label: "Source code", href: p.links.repo });
  const stack = p.stack.length ? ` Built with ${list(p.stack)}.` : "";
  return {
    text: `${p.title} — ${p.summary}${stack} My part included: ${lowerFirst(p.contributions[0] ?? "").replace(/\.$/, "")}.`,
    links,
    next: projects.filter((x) => x.id !== id).map((x) => `Tell me about ${x.title}`),
  };
}

interface Intent {
  keywords: RegExp;
  answer: () => Answer;
}

const intents: Intent[] = [
  ...projects.map<Intent>((p) => ({
    keywords: new RegExp(p.title.split(" ")[0]!.toLowerCase().replace(/[^a-z]/g, ""), "i"),
    answer: () => projectAnswer(p.id),
  })),
  {
    keywords: /contact|email|reach|hire|hiring|talk|message|linkedin|connect/i,
    answer: contactAnswer,
  },
  {
    keywords: /resume|résumé|\bcv\b/i,
    answer: () => ({
      text: "The résumé button in the header and hero opens the PDF version once it's published on this site.",
      links: [{ label: "Go to contact", href: "#contact" }],
      next: ["Where do you work now?"],
    }),
  },
  {
    keywords: /backend|back-end|python|fastapi|postgres|php|database|server|full.?stack|prisma|supabase/i,
    answer: () => ({
      text: `Frontend is my core, but I work across the stack: I've used ${list(
        skillsAt("working").filter((s) => !skillGroups[0]!.skills.some((f) => f.name === s)),
      )} in real projects, and I'm actively building depth in ${list(skillsAt("growing"))}.${experience
        .filter((e) => e.interests.includes("backend"))
        .map((e) => ` Professionally: ${e.role} at ${e.company} (${e.start} – ${e.end}).`)
        .join("")}`,
      links: [
        { label: "See the skill breakdown", href: "#expertise" },
        { label: "Experience", href: "#experience" },
      ],
      next: ["What's your core stack?", "Where do you work now?"],
    }),
  },
  {
    keywords: /\bapis?\b|integrat|\brest\b/i,
    answer: () => {
      const matches = projects.filter((p) => p.interests.includes("api"));
      return {
        text: `API integration is part of my day-to-day frontend work — typed responses, sensible caching, and designed loading, error and empty states. It shows up in ${list(matches.map((p) => p.title))}.`,
        links: matches.map((p) => ({ label: p.title, href: `#project-${p.id}` })),
        next: ["Do you do backend work?", "What's your core stack?"],
      };
    },
  },
  {
    keywords: /\bai\b|artificial|llm|machine|intelligen/i,
    answer: () => ({
      text: "I build interfaces for AI-powered applications — the parts users touch: input flows, streaming and loading states, error handling and clear results. I also use AI-assisted tools in my own workflow. (This assistant, for the record, is a local answer engine, not a model.)",
      links: [{ label: "Expertise", href: "#expertise" }],
      next: ["Show me your projects", "What's your core stack?"],
    }),
  },
  {
    keywords: /experience|work(ing)? (now|at)|current|job|role|company|qubitars|its tech|intern|career|years/i,
    answer: () => {
      const [now, ...before] = experience;
      return {
        text: `I'm currently ${now!.role} at ${now!.company} (since ${now!.start}). ${before
          .map((e) => `Before that: ${e.role} at ${e.company}, ${e.start} – ${e.end}.`)
          .join(" ")}`,
        links: [{ label: "Full experience", href: "#experience" }],
        next: ["Tell me about Qubitars Technologies", "Do you do backend work?"],
      };
    },
  },
  {
    keywords: /project|work|portfolio|case|built|build|show/i,
    answer: () => ({
      text: `${projects.length} featured projects: ${list(projects.map((p) => `${p.title} (${p.category.split(" · ")[0]})`))}. Each one says exactly what I contributed.`,
      links: [{ label: "Browse projects", href: "#projects" }],
      next: projects.map((p) => `Tell me about ${p.title}`),
    }),
  },
  {
    keywords: /stack|skill|tech|react|next|typescript|tailwind|frontend|front-end|language|framework|know/i,
    answer: () => ({
      text: `Daily, professionally: ${list(skillsAt("core"))}. Also used in real projects: ${list(skillsAt("working"))}.`,
      links: [{ label: "See all skills", href: "#expertise" }],
      next: ["Do you do backend work?", "Show me your projects"],
    }),
  },
  {
    keywords: /availab|open to|remote|freelance|relocat|full.?time/i,
    answer: () => ({
      text: site.availability.enabled
        ? `${site.availability.label}. The contact section is the best next step.`
        : "Happy to talk about remote roles and suitable projects — the contact section is the best next step.",
      links: [{ label: "Go to contact", href: "#contact" }],
    }),
  },
  {
    keywords: /^(hi|hey|hello|salam|yo)\b/i,
    answer: () => ({
      text: "Hi! Ask me about projects, skills, experience or how to get in touch.",
      next: starterQuestions,
    }),
  },
];

export function answer(question: string): Answer {
  const q = question.trim();
  const hit = intents.find((intent) => intent.keywords.test(q));
  if (hit) return hit.answer();
  return {
    text: "I can only answer from what's on this portfolio — projects, skills, experience and contact details. Try one of these:",
    next: starterQuestions,
  };
}

/** Display name for the assistant header. */
export const ownerName = isPlaceholder(site.name) ? "this portfolio" : site.name.split(" ")[0];
