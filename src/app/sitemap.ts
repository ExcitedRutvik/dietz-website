import type { MetadataRoute } from "next";
import { allEntries } from "@/content/pages";
import { localeHref } from "@/lib/locale";
import { SITE, alternatesFor } from "@/lib/structuredData";
import type { PageEntry } from "@/content/schema";

// Generated from the same content registry that drives routing, so a page
// cannot exist without appearing here (or vice versa).
export const dynamic = "force-static";

// Crawl priority follows commercial value, not page count. The 550-odd blog
// and glossary posts sit at the bottom deliberately: they are the long tail,
// and letting them share a priority with the twelve product categories is how
// crawl budget gets spent on the wrong half of the site.
const PRIORITY: Partial<Record<PageEntry["type"], number>> = {
  homepage: 1.0,
  "product-category": 0.9,
  hub: 0.8,
  "career-hub": 0.7,
  contact: 0.7,
  listing: 0.6,
  post: 0.5,
  legal: 0.3,
};

function priorityFor(entry: PageEntry): number {
  // Product pages live under the products/ prefix but are typed `post` in the
  // registry, so the type table alone would file them with the blog.
  if (/^(produkte|products)\//.test(entry.slug)) return 0.9;
  return PRIORITY[entry.type] ?? 0.5;
}

export default function sitemap(): MetadataRoute.Sitemap {
  return allEntries().map((entry) => {
    // Only articles carrying a real publication date get `lastModified`. The
    // previous `new Date()` stamped every one of 576 URLs as modified on every
    // build, which is exactly how a site teaches Google to ignore the field.
    const date =
      entry.type === "post" && entry.postMeta?.date ? new Date(entry.postMeta.date) : undefined;

    return {
      url: `${SITE}${localeHref(entry.locale, entry.slug)}`,
      ...(date && !Number.isNaN(date.valueOf()) && { lastModified: date }),
      priority: priorityFor(entry),
      // hreflang in the sitemap as well as in <head>. The two must agree —
      // conflicting annotations make Google drop the pair — and they do here
      // because both are derived from the same `alternates()` registry lookup.
      alternates: { languages: alternatesFor(entry.id) },
    };
  });
}
