"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import ContactCta from "@/components/ui/ContactCta";
import { MAIN_NAV, type NavItem } from "@/content/nav";
import { alternates, getPageById, homepageLocales } from "@/content/pages";
import { LOCALES, DEFAULT_LOCALE, localeHref, type Locale } from "@/lib/locale";

const LOCALE_CODE: Record<Locale, string> = {
  de: "DE",
  en: "EN",
  fr: "FR",
  es: "ES",
  cs: "CS",
};

interface ResolvedNavItem {
  label: string;
  href?: string;
  children: ResolvedNavItem[];
  /** This item's own page id plus every descendant's, so a top-level item can
   * tell whether the page being viewed lives anywhere beneath it. Without this
   * the menu could only highlight an exact match, and /branchen/automotive/
   * would leave Branchen looking unvisited. */
  ids: string[];
}

// Explicit return type is required: this is recursive, so TS can't infer it.
function resolveNavItem(item: NavItem, locale: Locale): ResolvedNavItem | null {
  const entry = item.id ? getPageById(item.id, locale) : undefined;
  const children = (item.children ?? [])
    .map((child) => resolveNavItem(child, locale))
    .filter((c): c is ResolvedNavItem => c !== null);

  // A group heading ("Federn") has a label but no page. It survives only if
  // something under it resolved — an empty column is worse than no column.
  const label = entry?.seo.navLabel ?? entry?.seo.title ?? item.label?.[locale] ?? item.label?.[DEFAULT_LOCALE];
  if (!label) return null;
  if (!entry && children.length === 0) return null; // nothing to link to yet in this locale

  return {
    label,
    href: entry ? localeHref(locale, entry.slug) : undefined,
    children,
    ids: [...(item.id ? [item.id] : []), ...children.flatMap((c) => c.ids)],
  };
}

/** Panel contents for one top-level item. Grouped (Produkte's four columns)
 *  when its children are themselves groups, a single list otherwise. */
function DropdownPanel({ item }: { item: ResolvedNavItem }) {
  const grouped = item.children.some((c) => c.children.length > 0);

  return (
    <div
      className={
        grouped
          ? "grid grid-cols-4 gap-x-8 gap-y-6 p-6"
          : "flex flex-col p-2"
      }
    >
      {grouped
        ? item.children.map((group) => (
            <div key={group.label}>
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-ink-faint">
                {group.label}
              </p>
              <ul className="space-y-0.5">
                {group.children.map((leaf) => (
                  <li key={leaf.label}>
                    <a
                      href={leaf.href}
                      className="-mx-2 block px-2 py-1.5 text-sm leading-snug text-ink transition-colors duration-150 hover:bg-brand-wash hover:text-brand-deep"
                    >
                      {leaf.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))
        : item.children.map((leaf) => (
            <a
              key={leaf.label}
              href={leaf.href}
              className="px-3 py-2 text-sm leading-snug text-ink transition-colors duration-150 hover:bg-brand-wash hover:text-brand-deep"
            >
              {leaf.label}
            </a>
          ))}
    </div>
  );
}

/** Same availability logic (exact page / homepage fallback / not yet
 *  translated) drives both the desktop bar and the mobile drawer, so a
 *  locale can't be reachable from one and not the other. */
function LanguageLinks({
  alts,
  localesWithHomepage,
  locale,
  className,
  linkClassName,
}: {
  alts: Partial<Record<Locale, string>>;
  localesWithHomepage: Locale[];
  locale: Locale;
  className: string;
  linkClassName: (state: "current" | "available" | "fallback" | "unavailable") => string;
}) {
  return (
    <ul className={className}>
      {LOCALES.map((l) => {
        const slug = alts[l];
        // Four states. A locale can have (a) this exact page — current or
        // just translated, (b) no translation of it but a homepage to fall
        // back to, or (c) no content at all — fr/es/cs today. Case (c) must
        // render as plain text, not a link: pointing it at `/fr/` produced a
        // 404, since that homepage doesn't exist yet either.
        const hasPage = slug !== undefined;
        const hasLocale = localesWithHomepage.includes(l);
        const href = hasPage ? localeHref(l, slug) : localeHref(l, "");
        if (!hasPage && !hasLocale) {
          return (
            <li key={l}>
              <span
                data-unavailable="true"
                title="Not available yet"
                className={linkClassName("unavailable")}
              >
                {LOCALE_CODE[l]}
              </span>
            </li>
          );
        }
        return (
          <li key={l}>
            <a
              href={href}
              aria-current={l === locale ? "page" : undefined}
              data-unavailable={!hasPage || undefined}
              className={linkClassName(l === locale ? "current" : hasPage ? "available" : "fallback")}
            >
              {LOCALE_CODE[l]}
            </a>
          </li>
        );
      })}
    </ul>
  );
}

export default function Header({
  locale,
  currentPageId,
  forceSolid = false,
}: {
  locale: Locale;
  currentPageId: string;
  /** Generic content pages (Hub/Post/Contact/...) are plain white, not the
   * homepage's dark cinematic hero — they want the solid header state from
   * the first frame, not the transparent-then-solid scroll transition. */
  forceSolid?: boolean;
}) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const solid = forceSolid || scrolled;

  useEffect(() => {
    if (forceSolid) return;
    const onScroll = () => setScrolled(window.scrollY > window.innerHeight * 0.6);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [forceSolid]);

  const nav = MAIN_NAV.map((item) => resolveNavItem(item, locale)).filter(
    (n): n is NonNullable<typeof n> => n !== null,
  );

  const alts = alternates(currentPageId);
  const localesWithHomepage = homepageLocales();

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-300 ${
        solid
          ? "bg-white/95 text-ink shadow-[0_1px_0_0_var(--color-line)] backdrop-blur-md"
          : "bg-gradient-to-b from-black/45 to-transparent text-white"
      }`}
    >
      <div className="mx-auto flex max-w-[88rem] items-center gap-6 px-6 py-3.5">
        <a href={localeHref(locale, "")} className="shrink-0" aria-label="Dietz GmbH">
          <Image
            src="/logo/dietz-logo.webp"
            alt="Dietz GmbH Logo"
            width={230}
            height={80}
            priority
            className={`h-9 w-auto transition ${solid ? "" : "brightness-0 invert"}`}
          />
        </a>

        <nav aria-label="Main" className="ml-auto hidden xl:block">
          <ul className="flex items-center gap-1">
            {nav.map((item) => {
              // True for the section the reader is in, not only for an exact
              // page match — so Branchen stays lit on /branchen/automotive/.
              const active = item.ids.includes(currentPageId);
              return (
              // Opens on hover AND on focus-within. focus-within is what makes
              // this keyboard-operable with no JS: tabbing onto the trigger
              // reveals the panel, which only then becomes focusable, so the
              // next Tab lands inside it. A hover-only menu hid every child
              // link from keyboard and touch users entirely.
              <li key={item.label} className="group relative">
                {item.href ? (
                  <a
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={`inline-flex items-center gap-1 px-3 py-2 text-[0.9375rem] font-medium transition-opacity duration-150 hover:opacity-70 ${
                      active ? "text-brand-ink" : ""
                    }`}
                  >
                    {item.label}
                    {item.children.length > 0 && <Chevron />}
                  </a>
                ) : (
                  <span
                    className={`inline-flex cursor-default items-center gap-1 px-3 py-2 text-[0.9375rem] font-medium ${
                      active ? "text-brand-ink" : ""
                    }`}
                  >
                    {item.label}
                    {item.children.length > 0 && <Chevron />}
                  </span>
                )}

                {item.children.length > 0 && (
                  <div
                    className={`invisible absolute top-full pt-3 opacity-0 transition-opacity duration-150 group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100 ${
                      item.children.some((c) => c.children.length > 0)
                        ? // Offset right rather than centred on the trigger.
                          // Products is the leftmost item, so a 56rem panel
                          // centred on it (-50%) ran to the page edge and read
                          // as overflowing rather than as a menu. -35% shifts
                          // it right by 15% of its own width, which clears the
                          // gutter while still sitting under its trigger.
                          "left-1/2 w-[56rem] max-w-[calc(100vw-3rem)] -translate-x-[35%]"
                        : "left-0 w-64"
                    }`}
                  >
                    <div className="border border-line bg-white text-ink shadow-[0_16px_48px_-12px_rgba(11,18,32,0.18)]">
                      <DropdownPanel item={item} />
                    </div>
                  </div>
                )}
              </li>
              );
            })}
          </ul>
        </nav>

        <LanguageLinks
          alts={alts}
          localesWithHomepage={localesWithHomepage}
          locale={locale}
          className="hidden items-center gap-2 text-xs font-semibold xl:flex"
          linkClassName={(state) =>
            state === "unavailable"
              ? "cursor-default opacity-25"
              : `transition ${
                  state === "current"
                    ? "opacity-100"
                    : state === "available"
                      ? "opacity-50 hover:opacity-90"
                      : "opacity-30 hover:opacity-60"
                }`
          }
        />

        <ContactCta
          locale={locale}
          className={`hidden min-h-11 shrink-0 px-5 text-sm font-semibold transition-colors duration-150 xl:inline-flex ${
            solid
              ? "bg-brand-ink text-white hover:bg-brand-deep"
              : "bg-white text-ink hover:bg-white/85"
          }`}
        />

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label="Toggle menu"
          className="ml-auto grid h-11 w-11 shrink-0 place-items-center xl:hidden"
        >
          <span className="sr-only">Menu</span>
          <span aria-hidden className="block h-0.5 w-6 bg-current" />
          <span aria-hidden className="mt-1.5 block h-0.5 w-6 bg-current" />
          <span aria-hidden className="mt-1.5 block h-0.5 w-6 bg-current" />
        </button>
      </div>

      {open && (
        // The old mobile menu rendered top-level items only, so every product
        // category, industry and career page was unreachable on a phone.
        // <details> gives real disclosure — keyboard, screen reader and Find
        // in Page all work — for no JS.
        <nav
          aria-label="Main"
          className="max-h-[calc(100dvh-4.5rem)] overflow-y-auto border-t border-line bg-white text-ink xl:hidden"
        >
          <ul className="mx-auto max-w-[88rem] divide-y divide-line px-6">
            {nav.map((item) => {
              const active = item.ids.includes(currentPageId);
              return (
              <li key={item.label}>
                {item.children.length === 0 ? (
                  <a
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={`block py-3.5 text-[0.9375rem] font-medium ${active ? "text-brand-ink" : ""}`}
                  >
                    {item.label}
                  </a>
                ) : (
                  // The section containing the current page is opened by
                  // default, so the menu shows where you already are rather
                  // than making you hunt for it.
                  <details className="group" open={active}>
                    <summary
                      className={`flex cursor-pointer list-none items-center justify-between py-3.5 text-[0.9375rem] font-medium [&::-webkit-details-marker]:hidden ${
                        active ? "text-brand-ink" : ""
                      }`}
                    >
                      {item.label}
                      <Chevron className="transition-transform duration-200 group-open:rotate-180" />
                    </summary>
                    <ul className="pb-3 pl-3">
                      {item.children.map((child) =>
                        child.children.length > 0 ? (
                          <li key={child.label} className="mt-3">
                            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-ink-faint">
                              {child.label}
                            </p>
                            <ul>
                              {child.children.map((leaf) => (
                                <li key={leaf.label}>
                                  <a href={leaf.href} className="block py-2 text-sm text-ink-muted">
                                    {leaf.label}
                                  </a>
                                </li>
                              ))}
                            </ul>
                          </li>
                        ) : (
                          <li key={child.label}>
                            <a href={child.href} className="block py-2 text-sm text-ink-muted">
                              {child.label}
                            </a>
                          </li>
                        ),
                      )}
                      {item.href && (
                        <li>
                          <a
                            href={item.href}
                            className="block py-2 text-sm font-medium text-brand-ink"
                          >
                            {item.label} →
                          </a>
                        </li>
                      )}
                    </ul>
                  </details>
                )}
              </li>
              );
            })}
          </ul>
          <div className="mx-auto max-w-[88rem] border-t border-line px-6 py-5">
            <LanguageLinks
              alts={alts}
              localesWithHomepage={localesWithHomepage}
              locale={locale}
              className="mb-4 flex items-center gap-1 text-sm font-semibold"
              linkClassName={(state) =>
                state === "unavailable"
                  ? "grid h-11 w-11 cursor-default place-items-center opacity-25"
                  : `grid h-11 w-11 place-items-center transition ${
                      state === "current"
                        ? "text-brand-ink opacity-100"
                        : state === "available"
                          ? "opacity-50 hover:opacity-90"
                          : "opacity-30 hover:opacity-60"
                    }`
              }
            />
            <ContactCta
              locale={locale}
              className="min-h-12 w-full bg-brand-ink px-5 text-sm font-semibold text-white"
            />
          </div>
        </nav>
      )}
    </header>
  );
}

function Chevron({ className = "" }: { className?: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 12 12"
      className={`h-3 w-3 shrink-0 ${className}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 4.5 6 7.5 9 4.5" />
    </svg>
  );
}
