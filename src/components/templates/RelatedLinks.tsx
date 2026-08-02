import { relatedLinks, RELATED_HEADING } from "@/lib/relatedLinks";
import { DEFAULT_LOCALE } from "@/lib/locale";
import type { PageEntry } from "@/content/schema";

/**
 * Contextual internal links, rendered from the keyword map at build time. This
 * exists because the audit found 553 of 576 pages carrying no in-content
 * internal link whatsoever — a site-wide link graph that dead-ends on arrival.
 *
 * The first link is the cluster's money page and is weighted accordingly: its
 * anchor is the head term, and it reads first. The rest are siblings.
 */
export default function RelatedLinks({ entry }: { entry: PageEntry }) {
  const links = relatedLinks(entry);
  if (links.length === 0) return null;

  return (
    <nav
      aria-labelledby="related-heading"
      className="mt-16 border-t border-line pt-8"
    >
      <h2 id="related-heading" className="text-sm font-semibold tracking-tight text-ink">
        {RELATED_HEADING[entry.locale] ?? RELATED_HEADING[DEFAULT_LOCALE]}
      </h2>
      <ul className="mt-4 grid gap-x-8 gap-y-2 sm:grid-cols-2">
        {links.map((l) => (
          <li key={l.href}>
            <a
              href={l.href}
              className={`text-[0.9375rem] leading-relaxed transition-colors hover:text-brand-ink ${
                l.primary ? "font-medium text-ink" : "text-ink-muted"
              }`}
            >
              {l.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
