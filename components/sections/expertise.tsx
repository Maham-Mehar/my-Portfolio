import { Accent, SectionHeading } from "@/components/ui/section-heading";
import { skillGroups } from "@/data/skills";
import { SkillsNetwork } from "./skills-network";

const skillCount = skillGroups.reduce((n, g) => n + g.skills.length, 0);

export function Expertise() {
  return (
    <section id="expertise" aria-labelledby="expertise-title" className="relative py-24 sm:py-32">
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-line-strong to-transparent"
      />
      <div className="container-page">
        <SectionHeading
          index="02"
          eyebrow="Expertise"
          variant="spec"
          meta={[`${skillCount} skills`, `${skillGroups.length} groups`]}
          id="expertise-title"
          title={
            <>
              A frontend core, with the <Accent>full stack</Accent> in view.
            </>
          }
          intro="An honest map of how my skills connect. Solid nodes are tools I use with confidence; dashed rings are what I'm actively learning — no percentages, no inflated ratings."
        />
        <SkillsNetwork />
      </div>
    </section>
  );
}
