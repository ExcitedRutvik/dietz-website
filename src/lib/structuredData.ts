import { allEntries, getPage } from "@/content/pages";
import { listingParent } from "@/content/parents";
import { DEFAULT_LOCALE, localeHref, type Locale } from "@/lib/locale";
import type { PageEntry } from "@/content/schema";

export const SITE = "https://www.dietz.eu";
const ORG_ID = `${SITE}/#organization`;

export function abs(locale: Locale, slug: string): string {
  return `${SITE}${localeHref(locale, slug)}`;
}

// The organization node is emitted once per page under a stable @id, and every
// other node references it by that @id rather than repeating the address. That
// is what lets Google merge the publisher across the whole site instead of
// reading 576 unrelated companies.
//
// NAP is taken from the Kontakt page's own addressBlock, not duplicated here —
// an inconsistent NAP between the visible page and the markup is worse than no
// markup at all.
export function organization() {
  const contact = getPage(DEFAULT_LOCALE, ["kontakt"]);
  const addr = contact?.type === "contact" ? contact.addressBlock : undefined;
  return {
    "@type": "Organization",
    "@id": ORG_ID,
    name: "Dietz GmbH",
    url: SITE,
    logo: { "@type": "ImageObject", url: `${SITE}/logo/dietz-logo.png` },
    ...(addr && {
      address: {
        "@type": "PostalAddress",
        streetAddress: addr.street,
        // `city` holds "96465 Neustadt bei Coburg" as one string on the
        // contact page; split so postalCode and locality are separate fields
        // rather than smuggled into addressLocality together.
        postalCode: addr.city.match(/^\d{5}/)?.[0],
        addressLocality: addr.city.replace(/^\d{5}\s*/, ""),
        addressCountry: "DE",
      },
      ...(addr.phone && {
        contactPoint: {
          "@type": "ContactPoint",
          telephone: addr.phone,
          email: addr.email,
          contactType: "sales",
          availableLanguage: ["de", "en"],
        },
      }),
    }),
    // `sameAs` is deliberately absent: the footer's social hrefs are still
    // placeholder root domains (facebook.com, linkedin.com), and asserting
    // those as this company's profiles would be a false identity claim.
  };
}

// Mirrors Breadcrumbs.tsx exactly — same slug-segment walk, same listing-parent
// fallback. Markup that disagrees with the visible trail is a mismatch Google
// penalises, so both read the same two functions rather than each deriving a
// trail of their own.
function breadcrumbTrail(entry: PageEntry) {
  const parts = entry.slug.split("/");
  let trail = parts.slice(0, -1).flatMap((_, i) => {
    const ancestor = getPage(entry.locale, parts.slice(0, i + 1));
    return ancestor ? [ancestor] : [];
  });
  if (trail.length === 0) {
    const parent = listingParent(entry);
    if (parent) trail = [parent];
  }
  return trail;
}

function label(entry: PageEntry): string {
  return entry.seo.navLabel ?? entry.seo.title.split("|")[0].trim();
}

export function breadcrumbList(entry: PageEntry) {
  if (!entry.slug) return undefined;
  const home = { name: entry.locale === "de" ? "Startseite" : "Home", url: abs(entry.locale, "") };
  const items = [
    home,
    ...breadcrumbTrail(entry).map((a) => ({ name: label(a), url: abs(a.locale, a.slug) })),
    { name: label(entry), url: abs(entry.locale, entry.slug) },
  ];
  return {
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: it.url,
    })),
  };
}

/** Slugs under products/produkte are what a buyer can actually request a quote
 * for. They get Product markup; an article about spring theory does not. */
function isProductPage(entry: PageEntry): boolean {
  return /^(produkte|products)\//.test(entry.slug);
}

function bodyText(entry: PageEntry): string {
  const blocks = "blocks" in entry && entry.blocks ? entry.blocks : [];
  return blocks
    .flatMap((b) => (b.kind === "paragraph" ? [b.text] : b.kind === "list" ? b.items : []))
    .join(" ");
}

function product(entry: PageEntry) {
  return {
    "@type": "Product",
    name: "h1" in entry ? entry.h1 : entry.seo.title,
    description: entry.seo.description,
    url: abs(entry.locale, entry.slug),
    brand: { "@id": ORG_ID },
    manufacturer: { "@id": ORG_ID },
    // No `offers`: these are made-to-order industrial parts quoted per drawing.
    // Inventing a price or availability to satisfy a rich-result warning would
    // be a false claim about the business.
    additionalProperty: {
      "@type": "PropertyValue",
      name: entry.locale === "de" ? "Fertigung" : "Manufacturing",
      value: entry.locale === "de" ? "Sonderanfertigung nach Zeichnung" : "Custom-manufactured to drawing",
    },
  };
}

function article(entry: PageEntry) {
  const meta = entry.type === "post" ? entry.postMeta : undefined;
  return {
    "@type": "Article",
    headline: ("h1" in entry ? entry.h1 : entry.seo.title).slice(0, 110),
    description: entry.seo.description,
    url: abs(entry.locale, entry.slug),
    inLanguage: entry.locale,
    publisher: { "@id": ORG_ID },
    // Author falls back to the company: these are unsigned corporate articles,
    // and an Organization author is accurate where a fabricated person is not.
    author: meta?.author ? { "@type": "Person", name: meta.author } : { "@id": ORG_ID },
    ...(meta?.date && { datePublished: meta.date }),
    wordCount: bodyText(entry).split(/\s+/).filter(Boolean).length,
  };
}

/** Every node for one page, as a single @graph. One script tag, one parse, and
 * cross-references by @id resolve inside it. */
export function graphFor(entry: PageEntry) {
  const nodes: object[] = [organization()];

  if (entry.type === "homepage") {
    nodes.push({
      "@type": "WebSite",
      "@id": `${SITE}/#website`,
      url: SITE,
      name: "Dietz GmbH",
      inLanguage: entry.locale,
      publisher: { "@id": ORG_ID },
    });
  }

  const crumbs = breadcrumbList(entry);
  if (crumbs) nodes.push(crumbs);

  if (entry.type === "career-hub" && entry.jobs?.length) {
    for (const job of entry.jobs) nodes.push(jobPosting(entry, job));
  }

  if (isProductPage(entry)) nodes.push(product(entry));
  else if (entry.type === "post" && entry.slug) nodes.push(article(entry));

  return { "@context": "https://schema.org", "@graph": nodes };
}

/**
 * A vacancy, marked up so it is eligible for Google Jobs.
 *
 * `datePosted` is deliberately absent: the live site publishes no posting date
 * for these roles, and Google treats a fabricated one as a reason to distrust
 * the whole feed. `employmentType` is mapped only where the German is
 * unambiguous — an apprenticeship is not a fixed-term contract, and guessing
 * would misrepresent the offer.
 */
function jobPosting(
  entry: Extract<PageEntry, { type: "career-hub" }>,
  job: NonNullable<Extract<PageEntry, { type: "career-hub" }>["jobs"]>[number],
) {
  const hours = (job.hours ?? "").toLowerCase();
  const types: string[] = [];
  if (hours.includes("vollzeit")) types.push("FULL_TIME");
  if (hours.includes("teilzeit")) types.push("PART_TIME");
  if (job.kind === "Ausbildung") types.push("INTERN");

  return {
    "@type": "JobPosting",
    "@id": `${SITE}${job.href}#job`,
    title: job.title,
    url: `${SITE}${job.href}`,
    description: job.title,
    ...(types.length && { employmentType: types }),
    hiringOrganization: { "@id": ORG_ID },
    jobLocation: {
      "@type": "Place",
      address: {
        "@type": "PostalAddress",
        streetAddress: "Am Floßgraben 10",
        postalCode: "96465",
        addressLocality: "Neustadt bei Coburg",
        addressCountry: "DE",
      },
    },
    inLanguage: entry.locale,
  };
}

/**
 * Locale variants of one page, as `hreflang` alternates for the sitemap.
 *
 * Includes `x-default` pointing at DE, matching what `buildMetadata` emits in
 * `<head>`. The two annotations must agree — Google drops any pair the HTML
 * and the sitemap disagree about — so both derive from the same registry.
 */
export function alternatesFor(id: string): Record<string, string> {
  const out: Record<string, string> = {};
  let fallback: string | undefined;
  for (const e of allEntries()) {
    if (e.id !== id) continue;
    out[e.locale] = abs(e.locale, e.slug);
    if (e.locale === DEFAULT_LOCALE) fallback = out[e.locale];
  }
  if (fallback) out["x-default"] = fallback;
  return out;
}
