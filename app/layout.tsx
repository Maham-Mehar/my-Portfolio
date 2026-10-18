import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Instrument_Serif } from "next/font/google";
import Script from "next/script";
import { Intro, introScript } from "@/components/layout/intro";
import { MotionProvider } from "@/components/ui/motion-provider";
import { PointerEffects } from "@/components/ui/pointer-effects";
import { ScrollProgress } from "@/components/ui/scroll-progress";
import { SmoothScroll } from "@/components/ui/smooth-scroll";
import { seo, site } from "@/data/site";
import { isPlaceholder } from "@/lib/utils";
import "./globals.css";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist", display: "swap" });
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono", display: "swap" });
const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-instrument-serif",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: seo.title,
  description: seo.description,
  applicationName: site.name,
  authors: [{ name: site.name }],
  keywords: [
    "AI-Powered Frontend Engineer",
    "Frontend Developer",
    "React Developer",
    "Next.js Developer",
    "TypeScript",
    "Tailwind CSS",
    "Python",
    "FastAPI",
    "Remote",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: "/",
    title: seo.title,
    description: seo.description,
    siteName: site.name,
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: seo.title,
    description: seo.description,
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#06080e",
  colorScheme: "dark",
};

const sameAs = [site.socials.github, site.socials.linkedin].filter((v): v is string => Boolean(v));

const personJsonLd = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: isPlaceholder(site.name) ? undefined : site.name,
  jobTitle: "Frontend Engineer",
  url: site.url,
  ...(site.email ? { email: `mailto:${site.email}` } : {}),
  ...(sameAs.length ? { sameAs } : {}),
  knowsAbout: ["React.js", "Next.js", "TypeScript", "Tailwind CSS", "Python", "FastAPI", "PostgreSQL"],
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    // The intro script and Lenis add classes to <html> before hydration.
    <html
      lang="en"
      suppressHydrationWarning
      data-scroll-behavior="smooth"
      className={`${geist.variable} ${geistMono.variable} ${instrumentSerif.variable}`}
    >
      <body>
        {/* beforeInteractive is server-rendered into <head> and runs before paint. */}
        <Script id="intro-gate" strategy="beforeInteractive">
          {introScript}
        </Script>
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[300] focus:rounded-md focus:bg-fg focus:px-4 focus:py-2 focus:text-ink-950"
        >
          Skip to content
        </a>
        <Intro />
        <div aria-hidden className="grain pointer-events-none fixed inset-0 z-[90]" />
        <MotionProvider>
          <ScrollProgress />
          {children}
          <PointerEffects />
        </MotionProvider>
        <SmoothScroll />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd).replace(/</g, "\\u003c") }}
        />
      </body>
    </html>
  );
}
