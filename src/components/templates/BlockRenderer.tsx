import Image from "next/image";
import type { Block } from "@/content/schema";

/**
 * Body copy for Post / Legal / Hub / ProductCategory.
 *
 * Two things drive the layout. Text is capped near 68ch because these are long
 * technical articles and a full-width measure is unreadable at desktop widths.
 * Images deliberately break OUT of that measure: an image constrained to the
 * text column reads as an afterthought, and these are product photographs that
 * are the reason a procurement reader is on the page at all.
 *
 * Heading rhythm is set by space rather than by size alone. H2 gets a hairline
 * rule above it so sections are scannable without shouting; H3 sits closer to
 * the paragraph it introduces than to the one it follows, which is what makes
 * a long page feel structured instead of continuous.
 */
export default function BlockRenderer({ blocks }: { blocks: Block[] }) {
  return (
    <div className="space-y-6">
      {blocks.map((block, i) => {
        switch (block.kind) {
          case "paragraph":
            return (
              <p key={i} className="max-w-[68ch] text-[1.0625rem] leading-[1.75] text-ink-muted">
                {block.text}
              </p>
            );

          case "heading":
            return block.level === 2 ? (
              <h2
                key={i}
                className="mt-14 border-t border-line pt-8 text-2xl font-semibold tracking-tight text-ink sm:text-[1.75rem]"
              >
                {block.text}
              </h2>
            ) : (
              <h3
                key={i}
                className="mt-10 mb-[-0.25rem] text-lg font-semibold tracking-tight text-ink"
              >
                {block.text}
              </h3>
            );

          case "list":
            return block.ordered ? (
              <ol key={i} className="max-w-[68ch] list-decimal space-y-2 pl-5 text-[1.0625rem] leading-[1.75] text-ink-muted marker:text-brand">
                {block.items.map((it, j) => <li key={j} className="pl-1">{it}</li>)}
              </ol>
            ) : (
              <ul key={i} className="max-w-[68ch] list-disc space-y-2 pl-5 text-[1.0625rem] leading-[1.75] text-ink-muted marker:text-brand">
                {block.items.map((it, j) => <li key={j} className="pl-1">{it}</li>)}
              </ul>
            );

          case "logos":
            // Each mark sits with the organisation's name, because a logo wall
            // on its own is a guessing game: the page used to print the eleven
            // names as a paragraph list and the eleven marks as a separate
            // grid, so neither told you which was which.
            //
            // Wrapping flex rather than a fixed column count: eleven items in
            // any n-column grid leaves a dead cell, which is what the last row
            // showed. Fixed-width tiles that wrap simply end where they end.
            return (
              <ul key={i} className="my-10 flex flex-wrap gap-x-4 gap-y-8">
                {block.items.map((logo) => {
                  const Cell = logo.href ? "a" : "div";
                  return (
                    <li key={logo.src} className="w-[calc(50%-0.5rem)] sm:w-[13.5rem]">
                      <Cell
                        {...(logo.href
                          ? { href: logo.href, target: "_blank", rel: "noreferrer" }
                          : {})}
                        className="group block"
                      >
                        {/* One row height for every mark, object-contain
                            inside it, so a 600x237 wordmark and a 115x115
                            roundel share an optical baseline. */}
                        <div className="flex h-24 items-center justify-center border border-line bg-white p-5 transition-colors duration-200 group-hover:border-brand">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={logo.src}
                            alt=""
                            loading="lazy"
                            className="max-h-full max-w-full object-contain opacity-85 transition-opacity duration-200 group-hover:opacity-100"
                          />
                        </div>
                        <p className="mt-2.5 text-[0.8125rem] leading-snug text-ink-muted transition-colors group-hover:text-brand-ink">
                          {logo.alt}
                        </p>
                      </Cell>
                    </li>
                  );
                })}
              </ul>
            );

          case "image": {
            // Not every image is a photograph. These pages mix wide product
            // and facility shots with small square pictograms (the nine
            // sustainability objective icons are 284x284). Rendering both at
            // full column width blew the icons up to ~820px, where they
            // dominated the page and read as a mistake. Intrinsic size decides
            // the treatment: near-square and small is an icon, everything else
            // is a photo.
            const w = block.width ?? 1280;
            const h = block.height ?? 860;
            const ratio = w / h;
            const isIcon = w <= 420 && ratio > 0.7 && ratio < 1.45;

            if (isIcon) {
              return (
                <figure key={i} className="my-6 flex items-center gap-4">
                  <Image
                    src={block.src}
                    alt={block.alt}
                    width={w}
                    height={h}
                    sizes="72px"
                    className="h-16 w-16 shrink-0 object-contain"
                  />
                  {block.caption && (
                    <figcaption className="text-sm text-ink-faint">{block.caption}</figcaption>
                  )}
                </figure>
              );
            }

            return (
              <figure key={i} className="my-10">
                <div className="overflow-hidden bg-surface border border-line">
                  <Image
                    src={block.src}
                    alt={block.alt}
                    width={w}
                    height={h}
                    sizes="(max-width: 768px) 100vw, 820px"
                    className="h-auto w-full object-cover"
                  />
                </div>
                {block.caption && (
                  <figcaption className="mt-3 max-w-[68ch] text-sm text-ink-faint">
                    {block.caption}
                  </figcaption>
                )}
              </figure>
            );
          }
        }
      })}
    </div>
  );
}
