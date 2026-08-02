import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import SmoothScrollProvider from "@/components/scroll/SmoothScrollProvider";
import ScrollProgress from "@/components/scroll/ScrollProgress";
import Hero from "@/components/sections/Hero";
import IndustryStrip from "@/components/sections/IndustryStrip";
import Products from "@/components/sections/Products";
import Services from "@/components/sections/Services";
import Sustainability from "@/components/sections/Sustainability";
import Company from "@/components/sections/Company";
import News from "@/components/sections/News";
import TermineMesse from "@/components/sections/TermineMesse";
import Certifications from "@/components/sections/Certifications";
import CtaBand from "@/components/sections/CtaBand";
import type { HomepageEntry } from "@/content/schema";

// `content.news`/`content.events` are DE-only on the live site — rendered
// purely on optional-field presence, no locale branch.
export default function HomePage({ content }: { content: HomepageEntry }) {
  return (
    <SmoothScrollProvider>
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
