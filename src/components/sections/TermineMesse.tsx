import type { HomepageContent } from "@/content/schema";

/**
 * DE-only "Termine & Messen" (events/trade fairs) — same pattern as News, kept
 * as a separate component since the two sections carry different fields
 * (date vs. excerpt) and read as distinct content types on the live site.
 */
export default function TermineMesse({
  content,
}: {
  content: NonNullable<HomepageContent["events"]>;
}) {
  return (
    <section id="events" className="relative z-10 bg-surface py-16 sm:py-20">
      <div className="mx-auto max-w-6xl 2xl:max-w-7xl min-[1920px]:max-w-[102rem] px-6">
        <h2 className="text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
          {content.title}
        </h2>
        <ul className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-3">
          {content.items.map((item) => (
            <li key={item.title} className="border-t border-line pt-5">
              {item.date && (
                <p className="font-mono text-xs uppercase tracking-widest text-ink-faint">
                  {item.date}
                </p>
              )}
              {item.href ? (
                <a
                  href={item.href}
                  className="mt-2 block text-sm font-medium tracking-tight text-ink underline-offset-4 hover:underline"
                >
                  {item.title}
                </a>
              ) : (
                <p className="mt-2 text-sm font-medium tracking-tight text-ink">
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
