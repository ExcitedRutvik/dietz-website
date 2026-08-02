import type { ListingContent } from "@/content/schema";
import PageHeader from "./PageHeader";

const isDocument = (href?: string) => /\.(pdf|docx?|xlsx?|zip)$/i.test(href ?? "");

// Blog/Glossar/News/Downloads render as a single flat list (confirmed by the
// scrape — no pagination markup found). Mediathek is the one genuinely
// paginated listing; `pagination` is optional for exactly that split.
export default function Listing({ h1, intro, items, pagination }: ListingContent) {
  return (
    <main className="mx-auto max-w-[56rem] px-6 pb-28 pt-10">
      <PageHeader h1={h1} intro={intro} wide />

      {/* Glossar runs to ~150 entries. A row is the whole hit target, and the
          title sits on the type ramp's list step so a long scroll stays
          scannable rather than turning into a wall of links. */}
      <ul className="mt-6 divide-y divide-line">
        {items.map((item) => (
          <li
            key={item.href ?? item.title}
            className="group relative flex gap-5 py-5"
          >
            {/* News and blog rows carry their article's lead image. Fixed box
                so a row without one still lines up with its neighbours. */}
            {item.thumb && (
              <div className="hidden h-20 w-28 shrink-0 overflow-hidden border border-line bg-surface sm:block">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.thumb}
                  alt=""
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                />
              </div>
            )}
            <div className="min-w-0 flex-1">
            {item.date && (
              <p className="text-xs uppercase tracking-[0.12em] text-ink-faint">
                <time>{item.date}</time>
              </p>
            )}
            {/* A few rows name a page whose slug another page owns. They stay
                as text — an <a> with no href looks like a link and does
                nothing, which is worse than plainly not being one. */}
            <h2 className="mt-1 flex items-start gap-2 text-[1.0625rem] font-semibold leading-snug tracking-tight text-ink transition-colors group-hover:text-brand-ink">
              {item.href ? (
                <a
                  href={item.href}
                  // Downloads are PDFs on another host. Saying so in the markup
                  // is what turns "a link that behaved oddly" into "a document",
                  // and it is what a screen reader announces.
                  {...(isDocument(item.href)
                    ? { target: "_blank", rel: "noreferrer", download: true }
                    : {})}
                  className="after:absolute after:inset-0"
                >
                  {item.title}
                </a>
              ) : (
                item.title
              )}
              {isDocument(item.href) && (
                <span className="mt-0.5 shrink-0 border border-line px-1.5 py-0.5 text-[0.625rem] font-semibold uppercase tracking-wider text-ink-faint">
                  PDF
                </span>
              )}
            </h2>
            {item.excerpt && (
              <p className="mt-1.5 max-w-[68ch] text-sm leading-relaxed text-ink-muted">
                {item.excerpt}
              </p>
            )}
            </div>
          </li>
        ))}
      </ul>

      {pagination && (
        <nav
          aria-label="Pagination"
          className="mt-12 flex flex-wrap items-center justify-center gap-1 text-sm"
        >
          {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((p) => (
            <a
              key={p}
              href={p === 1 ? pagination.basePath : `${pagination.basePath}page/${p}/`}
              aria-current={p === pagination.currentPage ? "page" : undefined}
              className={`grid h-11 min-w-11 place-items-center px-2 transition-colors ${
                p === pagination.currentPage
                  ? "bg-brand font-semibold text-white"
                  : "text-ink-muted hover:bg-brand-wash hover:text-brand-deep"
              }`}
            >
              {p}
            </a>
          ))}
        </nav>
      )}
    </main>
  );
}
