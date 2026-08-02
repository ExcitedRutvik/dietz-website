import Image from "next/image";
import { MAIN_NAV } from "@/content/nav";
import { getPageById } from "@/content/pages";
import { localeHref, type Locale } from "@/lib/locale";

/**
 * A deliberate break in the page's rhythm.
 *
 * Five consecutive pinned, full-bleed, dark video sections read as the same
 * slide five times over however good each one is individually. This band is
 * short, light, and scrolls normally, so it works as a breath between the hero
 * and the products run.
 *
 * Two things changed here. The industries were **inert text** - a numbered list
 * of four words that named the site's most valuable landing pages and linked to
 * none of them. They are now real links, read from the Branchen branch of the
 * nav rather than from a hand-listed `industries` array, so the homepage and
 * the menu cannot drift apart. That also recovers "Weitere Branchen", which the
 * array had dropped.
 *
 * The other change is the layout: a lead tile at twice the size with the rest
 * paired beside it, rather than four equal cells. Four identical boxes in a row
 * is the shape that says nobody decided anything.
 */

// Lead photograph per industry, keyed by canonical page id - same pattern the
// Products section uses. These are the images the Branchen pages themselves
// open with, so a tile and its destination agree.
const MEDIA: Record<string, string> = {
  "post.branchen-automotive": "/images/live/DTZ_anpressfeder.jpg",
  "post.branchen-elektrotechnik": "/images/live/dietz-elektrotechnik.jpg",
  "post.branchen-medizintechnik": "/images/live/dietz-medizintechnik-2.jpg",
  "post.branchen-weisse-ware": "/images/live/DTZ-spulenkoerper.jpg",
  "post.branchen-weitere-branchen": "/images/live/dietz-branchen-2.jpg",
};

export default function IndustryStrip({
  intro,
  locale,
}: {
  intro: string;
  locale: Locale;
}) {
  const branchen = MAIN_NAV.find((i) => i.id === "post.branchen");
  const hub = getPageById("post.branchen", locale);

  const items = (branchen?.children ?? []).flatMap((child) => {
    const page = child.id ? getPageById(child.id, locale) : undefined;
    if (!page || !child.id) return [];
    return [
      {
        id: child.id,
        label: page.seo.navLabel ?? page.seo.title,
        href: localeHref(locale, page.slug),
        src: MEDIA[child.id],
      },
    ];
  });

  if (items.length === 0) return null;

  return (
    <section id="industries" className="relative z-10 bg-surface py-20 sm:py-24">
      {/* Emerges from the dark rather than starting on a ruled line: the section
          above ends on solid zinc-950, so this picks the same tone up and lets
          it fall away. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-ink/12 to-transparent"
      />

      <div className="relative mx-auto max-w-[88rem] px-6">
        <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
          <p className="max-w-xl text-balance text-2xl leading-[1.3] tracking-tight text-ink sm:text-[1.75rem]">
            {intro}
          </p>
          {hub && (
            <a
              href={localeHref(locale, hub.slug)}
              className="group inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-brand-ink"
            >
              {hub.seo.navLabel ?? hub.seo.title}
              <span
                aria-hidden
                className="transition-transform duration-200 group-hover:translate-x-1"
              >
                →
              </span>
            </a>
          )}
        </div>

        {/* Five equal tiles across five columns.
            The previous 2x2 lead tile forced tall grid rows that the four
            small tiles' fixed 16/9 boxes could not fill, so each of them sat
            on a band of white. Equal cells remove the mismatch outright, and
            five columns means five items land with no empty cell. Under 1024px
            it drops to two columns with the last tile spanning both, so there
            is still no orphan. */}
        <ul className="mt-12 grid grid-cols-1 gap-px overflow-hidden border border-line bg-line sm:grid-cols-2 lg:grid-cols-5">
          {items.map((item, i) => (
            <li
              key={item.id}
              className={`group relative bg-white ${
                i === items.length - 1 ? "sm:col-span-2 lg:col-span-1" : ""
              }`}
            >
              <a href={item.href} className="block">
                <div className="relative aspect-[4/3] overflow-hidden bg-surface sm:aspect-[3/2] lg:aspect-[3/4]">
                  {item.src && (
                    <Image
                      src={item.src}
                      alt=""
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 20vw"
                      className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                    />
                  )}
                  {/* Scrim, so the label is legible over any of these photos
                      and not only over the two that happen to be dark. */}
                  <div
                    aria-hidden
                    className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/30 to-transparent"
                  />
                  <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-5">
                    <span className="text-lg font-semibold leading-tight tracking-tight text-white">
                      {item.label}
                    </span>
                    <span
                      aria-hidden
                      className="shrink-0 text-white/70 transition-transform duration-200 group-hover:translate-x-1 group-hover:text-white"
                    >
                      →
                    </span>
                  </div>
                </div>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
