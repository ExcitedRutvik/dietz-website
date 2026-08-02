import Image from "next/image";
import type { GalleryExample } from "@/content/schema";

/**
 * Application-example tiles, shared by the product-category pages and the
 * Branchen leaf pages. Both are the same thing: a photograph of a part, what
 * it is, and what it does in the customer's product. That is the evidence a
 * procurement reader came for, so the photo is flush to its frame and the
 * caption sits under it like a spec, not a mood board.
 *
 * Not every example has a photograph on the live site, and not every one has
 * its own page. Tiles degrade rather than break: no image means the text tile
 * carries a hairline instead, and no href means it is not a link.
 */
export default function ExampleGallery({ items }: { items: GalleryExample[] }) {
  if (items.length === 0) return null;

  return (
    <ul className="grid grid-cols-1 gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((example, i) => {
        const Tile = example.href ? "a" : "div";
        return (
          <li key={example.href ?? `${example.heading ?? ""}-${i}`} className="group">
            <Tile
              {...(example.href ? { href: example.href } : {})}
              className="block h-full"
            >
              {example.image ? (
                <div className="aspect-[4/3] overflow-hidden border border-line bg-surface">
                  <Image
                    src={example.image.src}
                    alt={example.image.alt}
                    width={640}
                    height={480}
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 360px"
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                  />
                </div>
              ) : (
                // Keeps the tile on the grid's baseline when a photo is
                // missing, instead of letting its neighbours ride up.
                <div className="aspect-[4/3] border border-dashed border-line bg-surface" />
              )}

              {example.heading && (
                <p className="mt-4 font-semibold leading-snug tracking-tight text-ink transition-colors group-hover:text-brand-ink">
                  {example.heading}
                </p>
              )}
              {example.caption && (
                <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">{example.caption}</p>
              )}
            </Tile>
          </li>
        );
      })}
    </ul>
  );
}
