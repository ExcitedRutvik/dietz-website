import { getPageById } from "@/content/pages";
import { localeHref, DEFAULT_LOCALE, type Locale } from "@/lib/locale";

// One label per intent, site-wide. There were four ("Anfrage stellen",
// "Jetzt unverbindlich Kontakt aufnehmen", "Contact us now", "Request a
// quote") for the same action, on the same page in two cases.
const LABEL: Partial<Record<Locale, string>> = {
  de: "Anfrage stellen",
  en: "Request a quote",
};

/**
 * The site's primary call to action.
 *
 * This replaces a Typeform popup. Every one of these buttons used to mount
 * `@typeform/embed` on the client and open a modal over the page; they now go
 * to the real contact page, which already carries the full enquiry form.
 * That drops a client dependency, makes the CTA a normal link (middle-click,
 * open-in-new-tab, crawlable, works without JS), and gives the contact page
 * the inbound links it should have had.
 */
export default function ContactCta({
  locale,
  className = "",
  label,
}: {
  locale: Locale;
  className?: string;
  /** Override only where the surrounding copy demands it. Prefer the default. */
  label?: string;
}) {
  const contact = getPageById("contact.kontakt", locale);
  if (!contact) return null;

  // `inline-flex` + centring is baked in, not left to each caller. An <a> is
  // inline by default, so the `min-h-12` the call sites set did nothing and the
  // label sat off-centre in its own button. Callers can still override the box
  // via className; they no longer have to remember to make it a flex container.
  return (
    <a
      href={localeHref(locale, contact.slug)}
      className={`inline-flex items-center justify-center text-center ${className}`}
    >
      {label ?? LABEL[locale] ?? LABEL[DEFAULT_LOCALE]}
    </a>
  );
}
