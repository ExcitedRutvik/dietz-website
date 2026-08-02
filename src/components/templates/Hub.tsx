import type { HubContent } from "@/content/schema";
import type { Locale } from "@/lib/locale";
import BlockRenderer from "./BlockRenderer";
import CtaRenderer from "./CtaRenderer";
import PageHeader from "./PageHeader";
import CardGrid from "./CardGrid";

// Card-grid-to-subpages template (Produkte, Branchen, Unternehmen). Karriere
// uses CareerHub instead — it carries a Werte list, benefits grid, and a named
// staff contact card that nothing else on the site has.
export default function Hub({ h1, intro, blocks, cards, cta, locale }: HubContent & { locale: Locale }) {
  return (
    <main className="mx-auto max-w-[72rem] px-6 pb-28 pt-10">
      <PageHeader h1={h1} intro={intro} wide />

      {blocks && blocks.length > 0 && (
        <div className="mt-12">
          <BlockRenderer blocks={blocks} />
        </div>
      )}

      <div className="mt-14">
        <CardGrid cards={cards} />
      </div>

      {cta && <CtaRenderer cta={cta} locale={locale} />}
    </main>
  );
}
