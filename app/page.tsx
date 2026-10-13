import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { About } from "@/components/sections/about";
import { Contact } from "@/components/sections/contact";
import { Craft } from "@/components/sections/craft";
import { Experience } from "@/components/sections/experience";
import { Expertise } from "@/components/sections/expertise";
import { Hero } from "@/components/sections/hero";
import { Projects } from "@/components/sections/projects";
import { getResumeHref } from "@/lib/resume";

export default function HomePage() {
  const resumeHref = getResumeHref();

  return (
    <>
      <Header resumeHref={resumeHref} />
      <main id="main">
        <Hero resumeHref={resumeHref} />
        <About />
        <Expertise />
        <Projects />
        <Experience />
        <Craft />
        <Contact resumeHref={resumeHref} />
      </main>
      <Footer />
    </>
  );
}
