import { MAIN_NAV, type NavItem } from "@/content/nav";
import { getPageById } from "@/content/pages";
import { localeHref } from "@/lib/locale";
import { leadImage, cardBody } from "@/lib/leadImage";
import CardGrid from "./CardGrid";
import type { PageEntry, HubCard } from "@/content/schema";

const HEADING: Record<string, string> = {
  de: "Bereiche",
  en: "Sections",
};

/**
 * The real child pages of a section landing page, as a card grid.
 *
 * A section landing page — Unternehmen, Produkte, Karriere — previously ended
 * with nothing but `RelatedLinks`, a small two-column list of 15px text derived
 * from keyword overlap. On /unternehmen/ that list happened to approximate the
 * section's children, which made it look like navigation while not actually
 * being navigation: it was assembled by matching slug tokens, so it could
 * silently include a page that is not a child and omit one that is.
 *
 * The menu already knows the true answer. Reading `MAIN_NAV` means this can
 * never disagree with the header, and it needs no content edits at all — every
 * section landing page gains a proper child grid from the same data.
 */
export default function ChildPages({ entry }: { entry: PageEntry }) {
  const cards = childCards(entry);
  if (cards.length === 0) return null;

  return (
    // A rule and real space above the heading. This sits directly under the
    // end of the body copy, and with no separation "Sections" read as another
    // paragraph heading belonging to the text above it rather than as the start
    // of a distinct block of navigation.
    <section className="mx-auto mt-16 max-w-[72rem] px-6">
      <div className="border-t border-line pt-12">
        <h2 className="text-xl font-semibold tracking-tight text-ink">
          {HEADING[entry.locale] ?? HEADING.de}
        </h2>
        <div className="mt-6">
          <CardGrid cards={cards} />
        </div>
      </div>
    </section>
  );
}

/** The hrefs ChildPages renders, so RelatedLinks can avoid repeating them. */
export function childHrefs(entry: PageEntry): Set<string> {
  return new Set(childCards(entry).map((c) => c.href));
}

function childCards(entry: PageEntry): HubCard[] {
  // Hub and career-hub already render their own authored card grid, and those
  // cards *are* the children — adding a second grid below would list the same
  // pages twice, with worse copy, since the authored cards carry a written
  // summary while these fall back to whatever paragraph the child opens with.
  if (entry.type === "hub" || entry.type === "career-hub") return [];

  const node = findNode(MAIN_NAV, entry.id);
  if (!node?.children?.length) return [];

  const out: HubCard[] = [];
  for (const child of leaves(node.children)) {
    if (!child.id) continue;
    const page = getPageById(child.id, entry.locale);
    // A child with no page in this locale drops out, exactly as it does in the
    // menu — absence is the signal, there is no placeholder.
    if (!page || page.id === entry.id) continue;
    out.push({
      // The homepage variant has no h1, hence the guard rather than `page.h1`.
      title:
        page.seo.navLabel ??
        ("h1" in page ? page.h1 : undefined) ??
        page.seo.title,
      href: localeHref(page.locale, page.slug),
      body: cardBody(page),
      thumb: leadImage(page) ?? null,
    });
  }
  return out;
}

/** Mega-menu column headings are not pages, so flatten through them. */
function leaves(items: NavItem[]): NavItem[] {
  return items.flatMap((i) => (i.id ? [i] : leaves(i.children ?? [])));
}

function findNode(items: NavItem[], id: string): NavItem | undefined {
  for (const item of items) {
    if (item.id === id) return item;
    const hit = item.children && findNode(item.children, id);
    if (hit) return hit;
  }
  return undefined;
}
