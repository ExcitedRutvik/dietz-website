import type { PostContent } from "@/content/schema";
import type { Locale } from "@/lib/locale";
import BlockRenderer from "./BlockRenderer";
import CtaRenderer from "./CtaRenderer";
import PageHeader from "./PageHeader";
import ExampleGallery from "./ExampleGallery";
import PageSummary from "./PageSummary";
import type { SectionNav } from "@/lib/sectionNav";

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
export default function Post({ h1, intro, blocks, gallery, keyTakeaways, summary, cta, postMeta, locale, section }: PostContent & { locale: Locale; section?: SectionNav | null }) {
  const eyebrow = postMeta?.date
    ? `${postMeta.author ? `${postMeta.author} · ` : ""}${postMeta.date}`
    : undefined;

  return (
    // From xl the reading column keeps its exact 46rem measure and the summary
    // rail moves into the gutter beside it — space the page was already
    // wasting. Below xl there is no gutter to take, so the layout is unchanged.
    <div className="mx-auto max-w-[46rem] px-6 xl:grid xl:max-w-[70rem] xl:grid-cols-[minmax(0,46rem)_minmax(0,1fr)] xl:gap-12">
    <main className="min-w-0 pt-10">
      <PageHeader h1={h1} intro={intro} eyebrow={eyebrow} wide />

      {/* On narrow screens a contents list is a scroll tax, so only the
          takeaways appear, and inline rather than in a rail. */}
      <PageSummary
        blocks={blocks}
        keyTakeaways={keyTakeaways}
        summary={summary}
        locale={locale}
        variant="inline"
        className="mt-8 xl:hidden"
      />

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

      <aside className="hidden xl:block">
        {/* `sticky` lives on this wrapper, not on the card. `.glass-panel` sets
            `position: relative` for its bevel layer, and because that class is
            defined after Tailwind it beat the `sticky` utility — so the rail
            silently sat still while the page scrolled past it. Separating the
            two means neither has to know about the other.

            Sticky inside a grid cell stops at the cell's bottom, and the cell
            stretches to the row height, so the rail travels with the reader and
            comes to rest exactly at the end of the body copy. */}
        <div className="sticky top-24 mt-10">
          <PageSummary
            blocks={blocks}
            keyTakeaways={keyTakeaways}
            summary={summary}
            section={section}
            locale={locale}
            variant="rail"
          />
        </div>
      </aside>
    </div>
  );
}
