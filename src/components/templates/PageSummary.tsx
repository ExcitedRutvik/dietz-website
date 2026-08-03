"use client";

import { useEffect, useState } from "react";
import { headingOutline } from "@/lib/slugifyHeading";
import type { Block } from "@/content/schema";
import type { Locale } from "@/lib/locale";
import type { SectionNav } from "@/lib/sectionNav";

const TOC_HEADING: Partial<Record<Locale, string>> = {
  de: "Auf dieser Seite",
  en: "On this page",
};
const TAKEAWAYS_HEADING: Partial<Record<Locale, string>> = {
  de: "Das Wichtigste in Kürze",
  en: "Key takeaways",
};
const SUMMARY_HEADING: Partial<Record<Locale, string>> = {
  de: "Zusammenfassung",
  en: "Summary",
};

/** Below three sections a contents list is noise, not navigation. */
const MIN_SECTIONS = 3;

/**
 * The summary rail: what this page covers, and what it says.
 *
 * Two jobs in one card. The contents list is derived from the page's own H2
 * spine, so it costs no authoring and cannot go stale. The takeaways are
 * authored, and only on the pages where they earn their place — they are the
 * part an answer engine is most likely to lift verbatim, so a generated
 * approximation would be worse than none at all.
 *
 * On desktop it occupies the empty gutter beside the 46rem reading column,
 * which is space the page was wasting. Below that width the contents list is a
 * scroll tax rather than a help, so only the takeaways render, inline.
 */
export default function PageSummary({
  blocks,
  keyTakeaways,
  summary,
  section,
  locale,
  variant,
  className = "",
}: {
  blocks?: Block[];
  keyTakeaways?: string[];
  /** Short abstract of the page, shown under the takeaways. */
  summary?: string;
  /** Sibling pages in this part of the menu — the navigation a leaf page needs. */
  section?: SectionNav | null;
  locale: Locale;
  variant: "rail" | "inline";
  className?: string;
}) {
  const outline = headingOutline(blocks);
  const showToc = variant === "rail" && outline.length >= MIN_SECTIONS;
  const showTakeaways = (keyTakeaways?.length ?? 0) > 0;
  const showSummary = Boolean(summary);
  const showSection = variant === "rail" && (section?.links.length ?? 0) >= 2;
  const active = useActiveHeading(showToc ? outline.map((o) => o.id) : []);

  // Both variants are in the DOM at once — one is hidden by breakpoint, not
  // unmounted — so their heading ids have to differ, or the page ships
  // duplicate ids and each aria-labelledby resolves to whichever came first.
  const takeawaysId = `takeaways-heading-${variant}`;
  const tocId = `toc-heading-${variant}`;
  const sectionId = `section-heading-${variant}`;
  const summaryId = `summary-heading-${variant}`;
  const mixedLevels = outline.some((o) => o.level === 3);

  if (!showToc && !showTakeaways && !showSummary && !showSection) return null;

  return (
    <div className={`glass-panel p-6 ${className}`}>
      {showTakeaways && (
        <section aria-labelledby={takeawaysId}>
          <h2
            id={takeawaysId}
            className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-faint"
          >
            {TAKEAWAYS_HEADING[locale] ?? TAKEAWAYS_HEADING.de}
          </h2>
          <ul className="mt-3 space-y-2">
            {keyTakeaways!.map((t) => (
              <li
                key={t}
                className="border-l-2 border-brand pl-3 text-sm leading-relaxed text-ink"
              >
                {t}
              </li>
            ))}
          </ul>
        </section>
      )}

      {showSummary && (
        <section
          aria-labelledby={summaryId}
          className={showTakeaways ? "mt-6 border-t border-line pt-5" : ""}
        >
          <h2
            id={summaryId}
            className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-faint"
          >
            {SUMMARY_HEADING[locale] ?? SUMMARY_HEADING.de}
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-ink-muted">{summary}</p>
        </section>
      )}

      {showToc && (
        <nav
          aria-labelledby={tocId}
          className={showTakeaways || showSummary ? "mt-6 border-t border-line pt-5" : ""}
        >
          <h2
            id={tocId}
            className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-faint"
          >
            {TOC_HEADING[locale] ?? TOC_HEADING.de}
          </h2>
          <ol className="mt-3 space-y-1">
            {outline.map((o) => (
              <li key={o.id}>
                <a
                  href={`#${o.id}`}
                  aria-current={active === o.id ? "true" : undefined}
                  // Sub-headings are indented only when the list mixes levels,
                  // which happens on pages whose spine is H3s.
                  className={`block border-l-2 py-1 text-sm leading-snug transition-colors ${
                    mixedLevels && o.level === 3 ? "pl-6" : "pl-3"
                  } ${
                    active === o.id
                      ? "border-brand font-medium text-ink"
                      : "border-transparent text-ink-muted hover:text-brand-ink"
                  }`}
                >
                  {o.text}
                </a>
              </li>
            ))}
          </ol>
        </nav>
      )}

      {showSection && (
        <nav
          aria-labelledby={sectionId}
          className={
            showTakeaways || showSummary || showToc
              ? "mt-6 border-t border-line pt-5"
              : ""
          }
        >
          <h2
            id={sectionId}
            className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-faint"
          >
            {section!.title}
          </h2>
          <ul className="mt-3 space-y-1">
            {section!.links.map((l) => (
              <li key={l.href}>
                <a
                  href={l.href}
                  aria-current={l.current ? "page" : undefined}
                  className={`block border-l-2 py-1 pl-3 text-sm leading-snug transition-colors ${
                    l.current
                      ? "border-brand font-medium text-ink"
                      : "border-transparent text-ink-muted hover:text-brand-ink"
                  }`}
                >
                  {l.label}
                  {l.lang && (
                    // Says so before the click rather than after it.
                    <span className="ml-1.5 text-xs uppercase text-ink-faint">
                      {l.lang}
                    </span>
                  )}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </div>
  );
}

/** Which section the reader is currently in. */
function useActiveHeading(ids: string[]): string | null {
  const [active, setActive] = useState<string | null>(null);
  const key = ids.join("|");

  useEffect(() => {
    if (!key) return;
    const targets = key
      .split("|")
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);
    if (targets.length === 0) return;

    // The bottom margin keeps the "current" section from flipping to the next
    // one the instant its heading clears the top of the viewport: a heading
    // only becomes current once it is in the upper third of the screen.
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: "-96px 0px -70% 0px" },
    );
    targets.forEach((t) => io.observe(t));
    return () => io.disconnect();
  }, [key]);

  return active;
}
