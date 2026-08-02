import { getPage } from "@/content/pages";
import { listingParent } from "@/content/parents";
import { DEFAULT_LOCALE, localeHref, type Locale } from "@/lib/locale";
import type { PageEntry } from "@/content/schema";

const HOME: Partial<Record<Locale, string>> = { de: "Startseite", en: "Home" };

// The trail has to start on the same gutter as the page body under it, so it
// mirrors each template's container width. Reading templates are narrow;
// card-grid ones are wide. Keep in sync with the templates themselves.
const MEASURE: Partial<Record<PageEntry["type"], string>> = {
  post: "max-w-[46rem]",
  legal: "max-w-[46rem]",
};

/** Menu-length label: strip the "| Dietz GmbH" tail these SEO titles carry. */
function short(entry: PageEntry): string {
  return entry.seo.navLabel ?? entry.seo.title.split("|")[0].trim();
}

/**
 * Trail derived from the slug's own path segments, each looked up in the
 * registry — `produkte/druckfedern` resolves its parent because a page really
 * does live at `produkte/`.
 *
 * Flat SEO slugs (`federkraft`) have no ancestor segment at all, so they fall
 * back to whichever index page links to them. Both routes read the site's own
 * data; neither invents a hierarchy that could drift from the URLs.
 */
export default function Breadcrumbs({ entry }: { entry: PageEntry }) {
  const { locale, slug } = entry;
  if (!slug) return null;

  const parts = slug.split("/");
  let trail = parts.slice(0, -1).flatMap((_, i) => {
    const ancestor = getPage(locale, parts.slice(0, i + 1));
    return ancestor ? [{ label: short(ancestor), href: localeHref(locale, ancestor.slug) }] : [];
  });

  if (trail.length === 0) {
    const parent = listingParent(entry);
    if (parent) trail = [{ label: short(parent), href: localeHref(locale, parent.slug) }];
  }

  const current = short(entry);

  return (
    <nav
      aria-label="Breadcrumb"
      className={`mx-auto px-6 pt-28 text-sm sm:pt-32 ${MEASURE[entry.type] ?? "max-w-[72rem]"}`}
    >
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-ink-faint">
        <li>
          <a href={localeHref(locale, "")} className="transition-colors hover:text-brand-ink">
            {HOME[locale] ?? HOME[DEFAULT_LOCALE]}
          </a>
        </li>
        {trail.map((crumb) => (
          <li key={crumb.href} className="flex items-center gap-2">
            <Sep />
            <a href={crumb.href} className="transition-colors hover:text-brand-ink">
              {crumb.label}
            </a>
          </li>
        ))}
        <li className="flex min-w-0 items-center gap-2">
          <Sep />
          <span aria-current="page" className="truncate text-ink-muted">
            {current}
          </span>
        </li>
      </ol>
    </nav>
  );
}

function Sep() {
  return (
    <span aria-hidden className="select-none text-line">
      /
    </span>
  );
}
