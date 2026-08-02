import type { HomepageContent } from "@/content/schema";

/**
 * DE-only — the live site has no English News section. Modeled on
 * IndustryStrip's plain-scrolling pattern rather than ScrollVideoSection:
 * there's no footage shot for this content, and a teaser list doesn't want a
 * pinned full-bleed treatment anyway.
 */
export default function News({
  content,
}: {
  content: NonNullable<HomepageContent["news"]>;
}) {
  return (
    <section id="news" className="relative z-10 bg-white py-16 sm:py-20">
      <div className="mx-auto max-w-6xl 2xl:max-w-7xl min-[1920px]:max-w-[102rem] px-6">
        <h2 className="text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
          {content.title}
        </h2>
        <ul className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-3">
          {content.items.map((item) => (
            <li key={item.title} className="border-t border-line pt-5">
              {item.excerpt && (
                <p className="line-clamp-3 text-sm leading-relaxed text-ink-muted">
                  {item.excerpt}
                </p>
              )}
              {item.href ? (
                <a
                  href={item.href}
                  className="mt-3 block text-sm font-medium tracking-tight text-ink underline-offset-4 hover:underline"
                >
                  {item.title}
                </a>
              ) : (
                <p className="mt-3 text-sm font-medium tracking-tight text-ink">
                  {item.title}
                </p>
              )}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
