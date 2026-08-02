import type { PostContent } from "@/content/schema";
import type { Locale } from "@/lib/locale";
import BlockRenderer from "./BlockRenderer";
import CtaRenderer from "./CtaRenderer";
import PageHeader from "./PageHeader";
import ExampleGallery from "./ExampleGallery";

/**
 * One template for long-form articles, product-category pages and the short
 * glossary/product-example stubs. The live site treats them the same way; the
 * only real difference is body length and whether WordPress blog chrome
 * (author / share / prev-next) is present, which is carried in `postMeta`.
 *
 * The column is wider than the text measure on purpose: prose self-limits to
 * ~68ch inside BlockRenderer while images use the full column, which gives the
 * page a two-tier rhythm without needing a second layout.
 */
export default function Post({ h1, intro, blocks, gallery, cta, postMeta, locale }: PostContent & { locale: Locale }) {
  const eyebrow = postMeta?.date
    ? `${postMeta.author ? `${postMeta.author} · ` : ""}${postMeta.date}`
    : undefined;

  return (
    <main className="mx-auto max-w-[46rem] px-6 pb-28 pt-10">
      <PageHeader h1={h1} intro={intro} eyebrow={eyebrow} wide />

      {blocks.length > 0 && (
        <div className="mt-12">
          <BlockRenderer blocks={blocks} />
        </div>
      )}

      {gallery && gallery.length > 0 && (
        <section className="mt-16 border-t border-line pt-12">
          <ExampleGallery items={gallery} />
        </section>
      )}

      {cta && (
        <div className="mt-20 border-t border-line pt-10">
          <CtaRenderer cta={cta} locale={locale} />
        </div>
      )}

      {(postMeta?.prev || postMeta?.next) && (
        <nav
          aria-label="Pagination"
          className="mt-20 grid gap-4 border-t border-line pt-8 text-sm sm:grid-cols-2"
        >
          {postMeta.prev ? (
            <a href={postMeta.prev.href} className="group">
              <span aria-hidden className="text-ink-faint">←</span>
              <span className="mt-1 block font-medium text-ink transition-colors group-hover:text-brand-ink">
                {postMeta.prev.title}
              </span>
            </a>
          ) : (
            <span />
          )}
          {postMeta.next && (
            <a href={postMeta.next.href} className="group sm:text-right">
              <span aria-hidden className="text-ink-faint">→</span>
              <span className="mt-1 block font-medium text-ink transition-colors group-hover:text-brand-ink">
                {postMeta.next.title}
              </span>
            </a>
          )}
        </nav>
      )}
    </main>
  );
}
