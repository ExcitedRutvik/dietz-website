import { MAIN_NAV, type NavItem } from "@/content/nav";
import { getPageById } from "@/content/pages";
import { listingParent } from "@/content/parents";
import { localeHref, type Locale } from "@/lib/locale";
import type { PageEntry } from "@/content/schema";

export interface SectionLink {
  label: string;
  href: string;
  /** The page being viewed, so the rail can mark where you are. */
  current?: boolean;
  /** Set when the target is in another language, e.g. the English careers page
   * pointing at German vacancy pages. Rendered as a visible marker: sending a
   * reader to a language they did not choose without saying so is a trap. */
  lang?: Locale;
}

export interface SectionNav {
  /** The section this page belongs to, e.g. "Industries". */
  title: string;
  links: SectionLink[];
}

const IN_SECTION: Partial<Record<Locale, string>> = {
  de: "In diesem Bereich",
  en: "In this section",
};

/**
 * The other pages alongside this one in its section of the menu.
 *
 * On a leaf page — one industry, one service — a contents list of the page's
 * own two headings is not navigation worth showing. What a reader actually
 * wants there is the rest of the set: the other industries, the other services.
 * That comes from the menu, so it cannot drift from it, and it costs no
 * authoring on any of the pages it appears on.
 */
export function sectionNav(entry: PageEntry): SectionNav | null {
  const parent = findParent(MAIN_NAV, entry.id);
  if (!parent) return listingSiblings(entry);

  const parentPage = parent.id ? getPageById(parent.id, entry.locale) : undefined;
  const title =
    parentPage?.seo.navLabel ??
    parent.label?.[entry.locale] ??
    parent.label?.de ??
    IN_SECTION[entry.locale] ??
    IN_SECTION.de!;

  const links: SectionLink[] = [];
  for (const child of leaves(parent.children ?? [])) {
    if (!child.id) continue;
    const page = getPageById(child.id, entry.locale);
    if (!page) continue;
    links.push({
      label: page.seo.navLabel ?? page.seo.title,
      href: localeHref(page.locale, page.slug),
      current: page.id === entry.id,
    });
  }

  // One sibling is not a set; showing it as "the section" overstates it.
  return links.length >= 2 ? { title, links } : null;
}

/** How many siblings to offer on a long-tail article page. */
const MAX_SIBLINGS = 8;

/**
 * For a page the menu does not know about — a glossary term, a blog post, a
 * download — the other entries filed alongside it in its index.
 *
 * These ~250 pages sit on flat root slugs (`/federkraft/`) with no parent
 * segment, so until now a reader arriving from search had no route onward
 * except the browser's back button. Their real parent is whichever listing
 * enumerates them, and within that listing the `group` assigned by
 * scripts/content/group-listings.py is the set they belong to: the other terms
 * on the same subject, rather than eight arbitrary neighbours.
 */
function listingSiblings(entry: PageEntry): SectionNav | null {
  const listing = listingParent(entry);
  if (!listing || listing.type !== "listing") return null;

  const href = localeHref(entry.locale, entry.slug);
  const self = listing.items.find((i) => i.href === href);
  const pool = self?.group
    ? listing.items.filter((i) => i.group === self.group)
    : listing.items;

  const links: SectionLink[] = pool
    .filter((i) => i.href)
    .slice(0, MAX_SIBLINGS)
    .map((i) => ({
      // Listing titles carry the "Glossar: … einfach erklärt" wrapper, which is
      // noise once you are already inside the glossary.
      label: trimListingTitle(i.title),
      href: i.href!,
      current: i.href === href,
    }));

  if (links.length < 2) return null;
  return {
    title: self?.group ?? listing.seo.navLabel ?? listing.h1,
    links,
  };
}

function trimListingTitle(title: string): string {
  return title
    .replace(/^Glossar:\s*/i, "")
    .replace(/^Glossary:\s*/i, "")
    .replace(/\s*einfach erklärt\b.*$/i, "")
    .replace(/\s*explained simply\b.*$/i, "")
    .trim();
}

/** Mega-menu column headings are not pages, so flatten through them. */
function leaves(items: NavItem[]): NavItem[] {
  return items.flatMap((i) => (i.id ? [i] : leaves(i.children ?? [])));
}

/** The nav node whose children include `id`, at any depth. */
function findParent(items: NavItem[], id: string): NavItem | undefined {
  for (const item of items) {
    const kids = leaves(item.children ?? []);
    if (kids.some((k) => k.id === id)) return item;
    const deeper = item.children && findParent(item.children, id);
    if (deeper) return deeper;
  }
  return undefined;
}
