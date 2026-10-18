/**
 * Engineering journal. Notes describe real decisions in this codebase; the
 * roadmap is explicitly future work. Add entries as you learn and build —
 * never list something as done before it is.
 */

export interface JournalNote {
  id: string;
  date: string; // "YYYY-MM"
  title: string;
  body: string;
  tags: string[];
}

export const journal: JournalNote[] = [
  {
    id: "grounding",
    date: "2026-10",
    title: "Grounding an LLM without a vector database",
    body: "All of the portfolio's content fits comfortably in one prompt, so the assistant receives it in full with strict rules: answer only from the data, describe learning skills as learning, and say when something isn't listed. A vector store would add moving parts with no benefit at this size.",
    tags: ["LLM", "Prompting", "FastAPI"],
  },
  {
    id: "streaming",
    date: "2026-10",
    title: "Streaming answers without losing error handling",
    body: "Once a streaming response sends its 200 header, you can't change the status code. The chat endpoint waits for the provider's first token before responding, so timeouts and auth failures still return real 5xx codes — and a marker covers anything that fails mid-stream.",
    tags: ["FastAPI", "Streaming", "HTTP"],
  },
  {
    id: "validated-output",
    date: "2026-10",
    title: "Never render model output as code",
    body: "Prompt → UI asks the model for JSON, validates it against a Pydantic schema with strict enums and length limits, and retries once on failure. The browser maps each section type to a fixed React component, so a creative or malicious response can only ever produce text.",
    tags: ["Security", "Pydantic", "React"],
  },
  {
    id: "single-source",
    date: "2026-10",
    title: "One source of truth across TypeScript and Python",
    body: "Portfolio content lives in typed data files used by the Next.js pages. A small Node script exports them to JSON for the Python service (Node strips the TypeScript types natively), so the site and the API can't drift apart.",
    tags: ["Architecture", "TypeScript", "Python"],
  },
];

/** Planned, not done. */
export const roadmap: string[] = [
  "Deploy the FastAPI service and connect it to the live site",
  "Add PostgreSQL only where persistence is genuinely needed (e.g. contact inquiries)",
  "Show verified public repositories through the GitHub API",
  "Component tests for the assistant and Lab interactions",
];
