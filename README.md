# Portfolio

Personal portfolio built with Next.js (App Router), React, TypeScript (strict), Tailwind CSS v4, Motion and Lucide icons.

## Getting started

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # production build
npm run lint       # ESLint
npm run typecheck  # tsc --noEmit
```

## Make it yours

All content lives in `data/`. You shouldn't need to touch components to update the site.

| What | Where |
| --- | --- |
| Name, email, GitHub, LinkedIn, availability badge | `data/site.ts` |
| Résumé | Drop a PDF at `public/resume.pdf`. Every Resume button activates automatically. |
| Projects (and the template for adding more) | `data/projects.ts` |
| Experience | `data/experience.ts` |
| Skills and proficiency levels | `data/skills.ts` |
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

## Structure

```
app/                  layout, metadata, page, sitemap, robots, icon, OG image
components/layout/    header (active-section nav, mobile menu), footer
components/sections/  hero, about, expertise, projects, work navigator, experience, craft, contact
components/ui/        buttons, tags, reveal animation, project media frames, code block, icons
data/                 all content
lib/                  small utilities and hooks
```
