import type { PageEntry } from "@/content/schema";

/**
 * The first photograph a page leads with, if it has one.
 *
 * The runtime twin of `lead_image()` in scripts/content/fill-thumbs.py — same
 * rule, same order — so a card built at render time shows the same picture the
 * build-time scripts would have baked into it.
 */
export function leadImage(entry: PageEntry): string | undefined {
  const blocks = "blocks" in entry ? entry.blocks : undefined;
  const image = blocks?.find((b) => b.kind === "image");
  if (image && image.kind === "image") return image.src;

  const gallery = "gallery" in entry ? entry.gallery : undefined;
  const first = gallery?.find((g) => g.image);
  return first?.image?.src;
}

/** A sentence describing a page, for use as a card body. */
export function cardBody(entry: PageEntry): string {
  const intro = "intro" in entry ? entry.intro : undefined;
  if (intro) return intro;

  const blocks = "blocks" in entry ? entry.blocks : undefined;
  const para = blocks?.find((b) => b.kind === "paragraph");
  const prose = para && para.kind === "paragraph" ? para.text : "";

  // Many migrated pages have an seo.description that merely restates the title
  // ("Partner von Dietz Federn"), which tells a reader nothing a card's own
  // heading has not already said. Real body copy wins when the description is
  // that thin.
  const description = entry.seo.description ?? "";
  if (description.length >= 60) return description;
  return prose || description;
}
