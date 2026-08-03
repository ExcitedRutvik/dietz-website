import type { ListingContent } from "@/content/schema";
import PageHeader from "./PageHeader";

const isDocument = (href?: string) => /\.(pdf|docx?|xlsx?|zip)$/i.test(href ?? "");

// Blog/Glossar/News/Downloads render as a single flat list (confirmed by the
// scrape — no pagination markup found). Mediathek is the one genuinely
// paginated listing; `pagination` is optional for exactly that split.
export default function Listing({ h1, intro, items, pagination }: ListingContent) {
  // Rows carry a `group` only on the listings that have an index (Glossar,
  // Blog, Downloads). News deliberately does not: it is chronological, and
  // alphabetising announcements would destroy its only ordering.
  const groups = groupRows(items);

  return (
    <main className="mx-auto max-w-[56rem] px-6 pt-10">
      <PageHeader h1={h1} intro={intro} wide />

      {groups && (
        // A jump bar, not a filter. 121 blog posts and 47 glossary terms are
        // looked things up in, and scrolling was previously the only way to
        // reach the second half of either.
        <nav aria-label="Index" className="mt-8 flex flex-wrap gap-1.5">
          {groups.map((g) => (
            <a
              key={g.key}
              href={`#group-${g.slug}`}
              className="min-h-9 border border-line px-3 py-1.5 text-sm font-medium text-ink-muted transition-colors hover:border-brand hover:text-brand-ink"
            >
              {g.key}
              <span className="ml-1.5 text-xs text-ink-faint">{g.rows.length}</span>
            </a>
          ))}
        </nav>
      )}

      {/* Glossar runs to ~150 entries. A row is the whole hit target, and the
          title sits on the type ramp's list step so a long scroll stays
          scannable rather than turning into a wall of links. */}
      {groups
        ? groups.map((g) => (
            <section key={g.key} id={`group-${g.slug}`} className="mt-10 scroll-mt-24">
              <h2 className="border-b border-line pb-2 text-sm font-semibold uppercase tracking-[0.14em] text-ink-faint">
                {g.key}
              </h2>
              <ul className="divide-y divide-line">{g.rows.map(row)}</ul>
            </section>
          ))
        : <ul className="mt-6 divide-y divide-line">{items.map(row)}</ul>}


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

/** One row. Shared by the flat and the grouped renderings so they cannot drift. */
function row(item: ListingContent["items"][number]) {
  return (
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
  );
}

interface Group { key: string; slug: string; rows: ListingContent["items"] }

/**
 * Rows bucketed by their `group`, in the order the groups first appear.
 *
 * Returns null when nothing carries a group, which is what keeps News — and any
 * listing added later — rendering as the plain list it should be.
 */
function groupRows(items: ListingContent["items"]): Group[] | null {
  if (!items.some((i) => i.group)) return null;
  const out: Group[] = [];
  const byKey = new Map<string, Group>();
  for (const item of items) {
    const key = item.group ?? "Weitere";
    let g = byKey.get(key);
    if (!g) {
      g = { key, slug: key.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "x", rows: [] };
      byKey.set(key, g);
      out.push(g);
    }
    g.rows.push(item);
  }
  // Letters sort; document types keep authored order, which is the order the
  // rules in group-listings.py define and therefore already meaningful.
  const alphabetical = out.every((g) => g.key.length === 1);
  return alphabetical ? out.sort((a, b) => a.key.localeCompare(b.key)) : out;
}
