export type Locale = "de" | "en" | "fr" | "es" | "cs";

// DE is unprefixed because it's WPML's actual default on the live site, not
// because it's first alphabetically. `/en/`, `/fr/`, `/es/`, `/cs/` are the
// prefixed alternates. Static export has no request-time locale negotiation,
// so whichever locale renders at bare `/` has to be fixed at build time — this
// is that choice, made once, here.
export const DEFAULT_LOCALE: Locale = "de";

export const LOCALES: Locale[] = ["de", "en", "fr", "es", "cs"];

/** Builds a site-relative href for a slug in a given locale. `slug` has no
 * leading/trailing slash (e.g. "products/precision-springs"); "" means the
 * homepage. */
export function localeHref(locale: Locale, slug: string): string {
  const path = slug ? `/${slug}/` : "/";
  return locale === DEFAULT_LOCALE ? path : `/${locale}${path}`;
}
