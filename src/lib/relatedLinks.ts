import { allEntries } from "@/content/pages";
import { listingParent } from "@/content/parents";
import { localeHref, type Locale } from "@/lib/locale";
import type { PageEntry } from "@/content/schema";
import keywords from "../../reference/seo/keywords.json";

export interface RelatedLink {
  href: string;
  label: string;
  /** Set on the one link that points at the cluster's money page, so the
   * template can weight it visually. */
  primary?: boolean;
}

interface Cluster {
  id: string;
  locale: string;
  primary: string;
  secondary: string[];
  money: string;
  cluster: string[];
}
const CLUSTERS = keywords.clusters as Cluster[];

// slug -> the cluster it belongs to. Built once at module load; the registry is
// static, so there is nothing to invalidate.
const clusterOf = new Map<string, Cluster>();
for (const c of CLUSTERS) {
  if (c.money) clusterOf.set(`${c.locale}|${c.money}`, c);
  for (const s of c.cluster) clusterOf.set(`${c.locale}|${s}`, c);
}

const bySlug = new Map<string, PageEntry>();
for (const e of allEntries()) bySlug.set(`${e.locale}|${e.slug}`, e);

function label(entry: PageEntry): string {
  return entry.seo.navLabel ?? entry.seo.title.replace(/\s*\|\s*Dietz GmbH$/, "").trim();
}

function link(locale: Locale, slug: string, primary?: boolean): RelatedLink | undefined {
  const entry = bySlug.get(`${locale}|${slug}`);
  return entry ? { href: localeHref(locale, entry.slug), label: label(entry), primary } : undefined;
}

/** Words worth matching on: drops the German and English function words that
 * would otherwise make every page "related" to every other. */
const STOP = new Set(
  ("der die das den dem des ein eine einer und oder fuer für mit von aus bei im in zu zur zum auf ist sind wie was alles sie ihr ihre wissen muessen müssen the a an and or for with from of in on to is are what how you your all about".split(" ")),
);
const tokens = (slug: string) =>
  slug.split(/[/-]/).filter((t) => t.length > 3 && !STOP.has(t));

/**
 * Contextual internal links for a page, derived from the keyword map rather
 * than hand-placed in 576 content files.
 *
 * The audit found 553 of 576 pages with no in-content internal link at all,
 * which is what leaves the twelve product categories with almost no internal
 * PageRank and the long-tail articles orphaned. The shape of the fix follows
 * the cannibalization the same map records: every article about compression
 * springs links up to the one compression-springs page that is allowed to rank
 * for the head term, using that term as the anchor.
 */
export function relatedLinks(entry: PageEntry, max = 4): RelatedLink[] {
  const locale = entry.locale;
  const out: RelatedLink[] = [];
  // Seeded with this page's own href, not its slug: `push` dedupes on href, so
  // seeding the slug let a page list itself among its own related links.
  const seen = new Set<string>([localeHref(locale, entry.slug)]);

  const push = (l?: RelatedLink) => {
    if (l && !seen.has(l.href) && out.length < max) {
      seen.add(l.href);
      out.push(l);
    }
  };

  const cluster = clusterOf.get(`${locale}|${entry.slug}`);

  if (cluster) {
    const isMoney = cluster.money === entry.slug;
    // Cluster page: the money page first, with the head term as anchor text.
    if (!isMoney && cluster.money) {
      const l = link(locale, cluster.money, true);
      if (l) push({ ...l, label: cluster.primary });
    }
    // Then siblings — for a money page these are its supporting articles, and
    // for a cluster page its nearest neighbours in the same cluster.
    for (const s of cluster.cluster) push(link(locale, s));
  }

  // Unmapped pages (news, careers, glossary) and any cluster that ran short:
  // fall back to the listing that enumerates this page, then to pages sharing
  // meaningful slug tokens.
  if (out.length < max) {
    const parent = listingParent(entry);
    if (parent) push(link(locale, parent.slug));
  }
  if (out.length < max) {
    const mine = new Set(tokens(entry.slug));
    if (mine.size) {
      const scored = [...bySlug.values()]
        .filter((e) => e.locale === locale && e.slug && e.slug !== entry.slug)
        .map((e) => ({ e, score: tokens(e.slug).filter((t) => mine.has(t)).length }))
        .filter((x) => x.score > 0)
        .sort((a, b) => b.score - a.score || a.e.slug.length - b.e.slug.length);
      for (const { e } of scored) push(link(locale, e.slug));
    }
  }

  return out;
}

export const RELATED_HEADING: Partial<Record<Locale, string>> = {
  de: "Passend dazu",
  en: "Related pages",
};
