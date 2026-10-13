import { ButtonLink } from "@/components/ui/button-link";

export default function NotFound() {
  return (
    <main id="main" className="container-page grid min-h-dvh place-content-center gap-6 text-center">
      <p className="label-mono text-accent-soft">404</p>
      <h1 className="text-4xl font-medium tracking-tight text-fg">This page doesn&apos;t exist.</h1>
      <div>
        <ButtonLink href="/">Back to the portfolio</ButtonLink>
      </div>
    </main>
  );
}
