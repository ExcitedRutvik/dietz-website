import type { ProductCategoryContent } from "@/content/schema";
import type { Locale } from "@/lib/locale";
import BlockRenderer from "./BlockRenderer";
import CtaRenderer from "./CtaRenderer";
import PageHeader from "./PageHeader";
import ExampleGallery from "./ExampleGallery";

// Intro + example gallery + CTA. `cta` is the full CTA union (not narrowed to
// quote-request-form) because EN's real content here is a Typeform — the
// scrape found the native quote-request-form-with-file-upload only exists on
// 4 DE pages, with zero EN equivalent.
export default function ProductCategory({
  h1,
  intro,
  blocks,
  gallery,
  cta,
  locale,
}: ProductCategoryContent & { locale: Locale }) {
  return (
    <main className="mx-auto max-w-[72rem] px-6 pb-28 pt-10">
      <PageHeader h1={h1} intro={intro} wide />

      {blocks && blocks.length > 0 && (
        <div className="mt-12">
          <BlockRenderer blocks={blocks} />
        </div>
      )}

      {gallery.length > 0 && (
        <section className="mt-16 border-t border-line pt-12">
          {/* No section label here. It was an eyebrow repeating the h1
              verbatim, which named nothing the reader did not already know.
              The rule is a hairline; the content identifies itself. */}
          <ExampleGallery items={gallery} />
        </section>
      )}

      <div className="mt-20 border-t border-line pt-10">
        <CtaRenderer cta={cta} locale={locale} />
      </div>
    </main>
  );
}
