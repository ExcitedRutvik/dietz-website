import type { Metadata } from "next";
import { alternates } from "@/content/pages";
import { localeHref, type Locale } from "@/lib/locale";
import type { PageEntry } from "@/content/schema";

/** Poster used as the OG image where a page has no image of its own. Product
 * pages get the products poster, everything else the company one. */
function ogImage(entry: PageEntry): string {
  if (/^(produkte|products)\//.test(entry.slug)) return "/images/posters/products-poster.jpg";
  const firstImage =
    "blocks" in entry && entry.blocks?.find((b) => b.kind === "image");
  return firstImage && firstImage.kind === "image"
    ? firstImage.src
    : "/images/posters/company-poster.jpg";
}

/**
 * One metadata builder for all four route files. They previously each emitted
 * `alternates.languages` and nothing else, which left the whole site without
 * canonicals — and per Google's own rule a canonical URL absent from the
 * hreflang set invalidates the entire cluster, so the hreflang was doing
 * nothing either.
 *
 * The canonical is always the page's own URL in its own locale. Never
 * cross-locale: pointing `/en/…` at the German page suppresses the English
 * page's indexing outright.
 */
/**
 * Pages that are byte-for-byte another page's content under a second URL, and
 * the URL that should own the ranking. Kept to confirmed duplicates only.
 *
 * The registry holds 33 slugs ending in a WordPress `-N` suffix whose base slug
 * also exists, which looks like 33 duplicates. Comparing the bodies showed only
 * this one actually is: the other 32 are distinct articles that inherited a
 * wrong slug stem ("umweltpakt-bayern-2-2-2-2-4" is an article about a cycling
 * initiative). Canonicalising those to their base slug would deindex 32 real
 * pages, so they are left alone and flagged for a URL decision instead.
 */
const DUPLICATE_OF: Record<string, string> = {
  "en|spring-material-2": "spring-material",
};

export function buildMetadata(entry: PageEntry): Metadata {
  const alts = alternates(entry.id);
  const languages: Record<string, string> = Object.fromEntries(
    Object.entries(alts).map(([l, s]) => [l, localeHref(l as Locale, s as string)]),
  );
  // DE is WPML's real default, not EN — x-default points there. It belongs
  // inside `languages`, not beside it; Next only emits keys found in there.
  if (alts.de !== undefined) languages["x-default"] = localeHref("de", alts.de);

  const duplicateOf = DUPLICATE_OF[`${entry.locale}|${entry.slug}`];
  const self = localeHref(entry.locale, duplicateOf ?? entry.slug);
  const title = entry.seo.title;
  const description = entry.seo.description;
  const image = ogImage(entry);

  return {
    title,
    description,
    alternates: { canonical: self, languages },
    openGraph: {
      title,
      description,
      url: self,
      siteName: "Dietz GmbH",
      locale: entry.locale,
      images: [image],
      // Product categories are typed `post` in the registry but are not
      // articles — the slug prefix is what distinguishes them.
      type: entry.type === "post" && entry.slug && !/^(produkte|products)\//.test(entry.slug)
        ? "article"
        : "website",
    },
    twitter: { card: "summary_large_image", title, description, images: [image] },
  };
}
