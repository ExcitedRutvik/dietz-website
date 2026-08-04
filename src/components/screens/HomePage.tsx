import dynamic from "next/dynamic";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import SmoothScrollProvider from "@/components/scroll/SmoothScrollProvider";
import ScrollProgress from "@/components/scroll/ScrollProgress";
import Hero from "@/components/sections/Hero";
import { videoManifest } from "@/lib/videoManifest";
import type { HomepageEntry } from "@/content/schema";

// Everything below the hero is split into its own chunk. All nine of these
// (plus Hero) used to live in one 641KB bundle that had to finish loading and
// executing before Hero could hydrate — and Hero's hydration is what flips it
// from the SSR poster fallback to the cinematic canvas, which is the page's
// LCP element. Still SSR'd (ssr defaults true), so content and SEO are
// unaffected; only the client JS graph Hero waits behind gets smaller.
const IndustryStrip = dynamic(() => import("@/components/sections/IndustryStrip"));
const Products = dynamic(() => import("@/components/sections/Products"));
const Services = dynamic(() => import("@/components/sections/Services"));
const Sustainability = dynamic(() => import("@/components/sections/Sustainability"));
const Company = dynamic(() => import("@/components/sections/Company"));
const News = dynamic(() => import("@/components/sections/News"));
const TermineMesse = dynamic(() => import("@/components/sections/TermineMesse"));
const Certifications = dynamic(() => import("@/components/sections/Certifications"));
const CtaBand = dynamic(() => import("@/components/sections/CtaBand"));

// `content.news`/`content.events` are DE-only on the live site — rendered
// purely on optional-field presence, no locale branch.
export default function HomePage({ content }: { content: HomepageEntry }) {
  return (
    <SmoothScrollProvider>
      {/* The hero canvas paints this poster until its first frame decodes, so
          it is the real LCP element — but it was only requested after
          hydration, from JS. React hoists this into <head>, which gets it into
          the preload scanner's first pass instead. */}
      <link
        rel="preload"
        as="image"
        href={videoManifest.hero.posterSrc}
        fetchPriority="high"
      />
      {/* The homepage owns the dark treatment; body is light for every other
          route. Section backgrounds sit on top of this. */}
      <div className="bg-zinc-950">
      <ScrollProgress />
      <Header locale={content.locale} currentPageId={content.id} />
      <main>
        <Hero content={content.hero} locale={content.locale} />
        <IndustryStrip intro={content.hero.industriesIntro} locale={content.locale} />
        <Products content={content.products} />
        <Services content={content.services} />
        <Sustainability content={content.sustainability} />
        <Company content={content.company} />
        {content.news && <News content={content.news} />}
        {content.events && <TermineMesse content={content.events} />}
        <Certifications content={content.certifications} />
        <CtaBand content={content.cta} locale={content.locale} />
      </main>
      <Footer locale={content.locale} />
      </div>
    </SmoothScrollProvider>
  );
}
