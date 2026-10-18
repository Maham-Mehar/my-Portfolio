# Portfolio

Personal portfolio built with Next.js (App Router), React, TypeScript (strict), Tailwind CSS v4, Motion, Lenis, Three.js and Lucide icons — plus a small **FastAPI** service (`backend/`) that powers the AI features.

## Architecture

```
Browser ──► Next.js site (this repo)
              │  NEXT_PUBLIC_API_URL
              ▼
           FastAPI service (backend/) ──► LLM provider (OpenAI-compatible or Gemini)
              Pydantic validation · rate limits · CORS · key stays server-side
```

The site works fully without the backend: the assistant answers from a local index and the AI Lab shows a labelled setup state. Nothing ever pretends an LLM is connected when it isn't.

## Getting started

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # production build
npm run lint       # ESLint
npm run typecheck  # tsc --noEmit
npm run export:portfolio  # regenerate backend/app/data/portfolio.json after editing data/
```

To run the AI features locally, start the backend (see [backend/README.md](backend/README.md)) and add to `.env.local`:

```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### Environment variables

| Variable | Where | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | site | Canonical URL for metadata, sitemap, OG |
| `NEXT_PUBLIC_API_URL` | site | URL of the FastAPI service (public — contains no secrets) |
| `LLM_PROVIDER`, `LLM_API_KEY`, `LLM_MODEL`, `OPENAI_BASE_URL` | backend only | LLM configuration |
| `ALLOWED_ORIGINS` | backend only | CORS allow-list — set to your site URL |
| `RATE_LIMIT_PER_MINUTE`, `RATE_LIMIT_PER_DAY`, `LLM_TIMEOUT_SECONDS`, `LLM_MAX_OUTPUT_TOKENS` | backend only | Usage controls |

### Deploying

1. Deploy `backend/` to a Python host (Render, Railway, Fly.io…): build `pip install -r requirements.txt`, start `uvicorn app.main:app --host 0.0.0.0 --port $PORT`, and set the backend variables.
2. Deploy the site (e.g. Vercel) with `NEXT_PUBLIC_API_URL` pointing at the backend.

## Make it yours

All content lives in `data/`. You shouldn't need to touch components to update the site.

| What | Where |
| --- | --- |
| Name, email, GitHub, LinkedIn, availability badge | `data/site.ts` |
| Résumé | Drop a PDF at `public/resume.pdf`. Every Resume button activates automatically. |
| Projects (and the template for adding more) | `data/projects.ts` |
| Experience | `data/experience.ts` |
| Skills, proficiency levels and the skills network | `data/skills.ts` (connections in `components/sections/skills-network.tsx`) |
| Engineering journal and roadmap | `data/journal.ts` |
| "Explore my work" navigator | `data/interests.ts` |
| Engineering craft snippets | `data/craft.ts` |
| Production URL (canonical, OG, sitemap) | `NEXT_PUBLIC_SITE_URL` env var (see `.env.example`) |

Until they're filled in, missing values show up on the page as dashed "not yet added" placeholders. They are never rendered as fake links.

### Project screenshots

Projects currently use illustrative wireframe frames that are labelled "not a product screenshot". To use a real screenshot, put the image in `public/images/projects/` and change the project's `media` to:

```ts
media: {
  kind: "image",
  src: "/images/projects/pawmart.png",
  alt: "PawMart listing grid showing pet product cards",
  width: 1600,
  height: 1000,
},
```

### Adding a project

Copy the commented "Project 04" template at the bottom of `data/projects.ts` into the array. The layout, numbering and navigator pick it up automatically.

## Motion system

One easing curve (`--ease-out-quint` / `lib/motion.ts`) and three durations drive everything. All of it collapses to static under `prefers-reduced-motion`, and pointer effects only run on mouse/trackpad devices.

| Effect | Where | Implementation |
| --- | --- | --- |
| Intro (counter + split curtain), once per session | Page load | `components/layout/intro.tsx` — pure CSS, gated by an inline head script |
| Masked word-rise headline | Hero `h1` | CSS (`.word-rise`), so the LCP element never waits for JS |
| Masked word reveal on scroll | Section headings, project titles | `components/ui/split-text.tsx` |
| Neural intelligence core — WebGL (Three.js) on desktop, Canvas 2D fallback on mobile / no WebGL / reduced motion | Hero | `components/sections/intelligence-core.tsx`, `core/webgl.ts`, `core/canvas2d.ts`, shared model in `core/network.ts` |
| Interactive skills network (radial map, cross-skill links, evidence from projects & roles) | Expertise | `components/sections/skills-network.tsx` |
| Scramble-decode eyebrow | Hero | `components/ui/scramble-text.tsx` |
| Magnetic CTAs + rolling-letter hover | Buttons, nav | `magnetic.tsx`, `roll-text.tsx` |
| Cursor follower + pointer spotlights | Whole page (`data-spotlight`, `data-cursor`) | `components/ui/pointer-effects.tsx` |
| Smooth wheel scrolling (touch stays native) | Whole page | `components/ui/smooth-scroll.tsx` (Lenis) |
| Scroll-lit statement | About | `scroll-lit-text.tsx` |
| Clip-path reveal, parallax, 3D tilt | Project visuals | `media-reveal.tsx`, `parallax.tsx` |
| Self-drawing timeline | Experience | `timeline.tsx` |
| Tech marquee, scroll progress, hide-on-scroll header | Global | `tech-marquee.tsx`, `scroll-progress.tsx`, `header.tsx` |

## Ask My Portfolio (assistant)

The button at the bottom right (or ⌘K / Ctrl+K) opens the assistant. Project cards can open it with a question too ("Ask the assistant about this project").

- **Live mode** — when the backend has an LLM configured, answers stream from `POST /api/assistant/chat`, grounded in the portfolio data with strict honesty rules (learning skills are described as learning; nothing is invented). Includes stop, retry and clear error states.
- **Offline mode** — otherwise, the local deterministic engine (`lib/assistant.ts`) answers, and the UI labels every answer "local answer · not AI-generated".

## AI Lab

Two working experiments in `components/lab/`:

- **Prompt → UI** — an interface idea becomes a JSON spec validated by Pydantic, rendered from whitelisted React components (no generated code is executed). Shows a clearly labelled sample when the backend isn't configured.
- **Behind the interface** — a live explorer for the FastAPI endpoints, with presets that demonstrate validation (422) and not-found (404) responses, plus a link to the Swagger docs.

## Contact form

Once `email` is set in `data/site.ts`, the contact section shows a validated form that **drafts an email in the visitor's own mail app** (`mailto:`). Nothing is sent or stored by the site. To send from the server instead, add a provider (Resend, Formspree, etc.) and its key.

## Structure

```
app/                  layout, metadata, page, sitemap, robots, icon, OG image
components/layout/    header (active-section nav, mobile menu), footer
components/sections/  hero, about, expertise, projects, work navigator, experience, craft, contact
components/ui/        motion primitives, buttons, tags, project media frames, code block, icons
components/assistant/ portfolio assistant UI (live + offline modes)
components/lab/       AI Lab experiments
components/sections/core/  neural core: shared model, WebGL and Canvas 2D renderers
backend/              FastAPI service, Pydantic schemas, LLM client, tests
scripts/              export-portfolio.mjs (data/*.ts → backend JSON)
data/                 all content
lib/                  utilities, hooks, motion tokens, API client, local assistant engine
```
