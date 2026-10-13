export interface CraftNote {
  id: string;
  title: string;
  summary: string;
  points: string[];
  filename: string;
  code: string;
}

export const craftNotes: CraftNote[] = [
  {
    id: "states",
    title: "Every state is designed",
    summary:
      "Loading, error, empty and success aren't afterthoughts. Modelling them as one union makes it impossible to forget one.",
    points: ["Discriminated unions over boolean flags", "Empty states that guide the next action"],
    filename: "project-list.tsx",
    code: `type Status<T> =
  | { state: "loading" }
  | { state: "error"; message: string }
  | { state: "success"; data: T[] };

function ProjectList({ status }: { status: Status<Project> }) {
  switch (status.state) {
    case "loading":
      return <ListSkeleton rows={3} />;
    case "error":
      return <ErrorNotice message={status.message} />;
    case "success":
      if (status.data.length === 0) return <EmptyState />;
      return <Grid items={status.data} />;
  }
}`,
  },
  {
    id: "api",
    title: "Typed API boundaries",
    summary:
      "Data is validated where it enters the app, so components can trust their props instead of defensively checking everything.",
    points: ["One typed fetch helper", "Errors surface with context, not silently"],
    filename: "lib/api.ts",
    code: `export async function getJSON<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const res = await fetch(\`\${API_URL}\${path}\`, init);

  if (!res.ok) {
    throw new Error(\`\${res.status} on \${path}\`);
  }
  return (await res.json()) as T;
}

// Server Component — fetched and cached on the server
const projects = await getJSON<Project[]>("/projects", {
  next: { revalidate: 3600 },
});`,
  },
  {
    id: "components",
    title: "Components that compose",
    summary:
      "Small, typed primitives with variants scale better than one-off markup — consistent UI and fewer places for bugs to hide.",
    points: ["Variants instead of copy-paste", "Native element props passed through"],
    filename: "components/ui/button.tsx",
    code: `const variants = {
  primary: "bg-accent text-white hover:bg-accent/90",
  ghost: "border border-line hover:bg-white/5",
} as const;

type ButtonProps = React.ComponentProps<"button"> & {
  variant?: keyof typeof variants;
};

export function Button({ variant = "primary", className, ...props }: ButtonProps) {
  return (
    <button
      className={cn(base, variants[variant], className)}
      {...props}
    />
  );
}`,
  },
  {
    id: "a11y",
    title: "Responsive & accessible by default",
    summary:
      "Layouts are recomposed for each screen, motion respects user preferences, and everything works with a keyboard.",
    points: ["Semantic HTML first", "prefers-reduced-motion respected"],
    filename: "components/reveal.tsx",
    code: `export function Reveal({ children }: { children: React.ReactNode }) {
  const reduce = useReducedMotion();

  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-10% 0px" }}
    >
      {children}
    </motion.div>
  );
}`,
  },
];
