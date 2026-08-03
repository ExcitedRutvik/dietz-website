import type { Block } from "@/content/schema";

/**
 * Anchor id for a heading.
 *
 * Umlauts are folded the same way the content scripts fold them (ä→ae, ß→ss),
 * so an id generated here matches one generated at build time rather than
 * differing by a stripped character.
 */
export function slugifyHeading(text: string): string {
  return text
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export interface Outline {
  id: string;
  text: string;
  level: 2 | 3;
}

/** Below this many top-level sections, an H2-only contents list is too thin. */
const MIN_H2_SPINE = 3;

/**
 * An id for every heading on the page, in document order.
 *
 * Ids are assigned to *all* headings, regardless of which ones the contents
 * list ends up showing, so an anchor stays stable even if a page later gains a
 * heading and the list switches which level it draws from.
 *
 * Exported so `BlockRenderer` and `PageSummary` derive their ids from one
 * function: if the two computed them separately, a duplicate heading would
 * shift one and not the other, and the contents list would start pointing at
 * the wrong section.
 */
export function headingIds(blocks: Block[] | undefined): Outline[] {
  if (!blocks) return [];
  const seen = new Map<string, number>();
  const out: Outline[] = [];
  for (const b of blocks) {
    if (b.kind !== "heading") continue;
    const base = slugifyHeading(b.text) || "abschnitt";
    const n = (seen.get(base) ?? 0) + 1;
    seen.set(base, n);
    out.push({
      id: n === 1 ? base : `${base}-${n}`,
      text: b.text,
      level: b.level,
    });
  }
  return out;
}

/**
 * The headings worth listing as a table of contents.
 *
 * Prefers the H2 spine. But a page can be long and well-structured while using
 * only one H2 — the company page carries a single H2 and three H3s — and an
 * H2-only rule hides the contents list on exactly the content-rich pages it is
 * most useful on. So when the H2 spine is too thin to navigate by, the sub-
 * headings are used instead.
 */
export function headingOutline(blocks: Block[] | undefined): Outline[] {
  const all = headingIds(blocks);
  const h2 = all.filter((h) => h.level === 2);
  return h2.length >= MIN_H2_SPINE ? h2 : all;
}
