import Image from "next/image";
import { LEGAL_NAV, MAIN_NAV, type NavItem } from "@/content/nav";
import { getPageById } from "@/content/pages";
import { DEFAULT_LOCALE, localeHref, type Locale } from "@/lib/locale";

// The terms/AGB link is a PDF, not a page — there has never been an HTML
// version. Two files were linked from the live site; this is the current one
// (entity "Dietz GmbH", "Stand: 31.05.2025"). The other, AGB_Dietz.pdf, is a
// 2003 document still naming the former "Federnfabrik Dietz GmbH" and should be
// retired. See CLIENT-QUESTIONS.md.
const TERMS_PDF = {
  href: "https://www.dietz.eu/wp-content/uploads/2024/01/Verkaufsbedingungen-Dietz-2025.pdf",
  label: { de: "AGB", en: "Terms & conditions" } as Record<string, string>,
};

const PHONE = "+49 (0) 9568 9442-0";
const EMAIL = "info@dietz.eu";

const SOCIAL = [
  { label: "Facebook", href: "https://www.facebook.com/" },
  { label: "Instagram", href: "https://www.instagram.com/" },
  { label: "YouTube", href: "https://www.youtube.com/" },
  { label: "LinkedIn", href: "https://www.linkedin.com/" },
];

const BADGES = [
  { src: "/images/badges/dekra-iso-9001.webp", alt: "DEKRA ISO 9001 certified" },
  { src: "/images/badges/dekra-iatf-16949.webp", alt: "DEKRA IATF 16949 certified" },
  { src: "/images/badges/ISO-14001-2015.webp", alt: "ISO 14001:2015 certified" },
  { src: "/images/badges/aeo.webp", alt: "Authorised Economic Operator" },
  { src: "/images/badges/medal.webp", alt: "EcoVadis Bronze medal" },
];

interface FooterCopy {
  hours: string;
  receiving: string;
  receivingHours: string;
  admin: string;
  adminHours: string;
  certifications: string;
  contactForm: string;
  followUs: string;
  developedBy: string;
}

// fr/es/cs have no content at all yet, so they fall back to DE (the default
// locale) rather than showing an untranslated English footer.
const COPY: Partial<Record<Locale, FooterCopy>> = {
  de: {
    hours: "Öffnungszeiten",
    receiving: "Wareneingang & Versand",
    receivingHours: "Mo-Do 06:00-15:00, Fr 06:00-14:00 · Pausen 08:45-09:00 und 12:00-12:30",
    admin: "Verwaltung",
    adminHours: "Mo-Do 08:00-16:00 (Mittag 12:00-13:00) · Fr 08:00-13:00",
    certifications: "Zertifizierungen",
    contactForm: "Kontaktformular",
    followUs: "Folgen Sie uns",
    developedBy: "Entwickelt von",
  },
  en: {
    hours: "Opening hours",
    receiving: "Receiving & shipping",
    receivingHours: "Mon-Thu 06:00-15:00, Fri 06:00-14:00 · Breaks 08:45-09:00 and 12:00-12:30",
    admin: "Administration",
    adminHours: "Mon-Thu 08:00-16:00 (lunch 12:00-13:00) · Fri 08:00-13:00",
    certifications: "Certifications",
    contactForm: "Contact form",
    followUs: "Follow us",
    developedBy: "Developed by",
  },
};

/** Resolve one nav ID (or group label) for this locale, or null if absent. */
function resolve(item: NavItem, locale: Locale) {
  const entry = item.id ? getPageById(item.id, locale) : undefined;
  const label =
    entry?.seo.navLabel ?? entry?.seo.title ?? item.label?.[locale] ?? item.label?.[DEFAULT_LOCALE];
  if (!label) return null;
  return { label, href: entry ? localeHref(locale, entry.slug) : undefined };
}

/** Flatten a top-level nav item to its leaf links — the mega-menu's grouping
 *  is useful in a 56rem panel, not in a narrow footer column. */
function leaves(item: NavItem, locale: Locale): { label: string; href: string }[] {
  const out: { label: string; href: string }[] = [];
  for (const child of item.children ?? []) {
    if (child.children?.length) {
      out.push(...leaves(child, locale));
    } else {
      const r = resolve(child, locale);
      if (r?.href) out.push({ label: r.label, href: r.href });
    }
  }
  return out;
}

export default function Footer({ locale }: { locale: Locale }) {
  const t = COPY[locale] ?? COPY.de!;

  // The full site structure, repeated at the bottom of every page. With ~350
  // article, glossary and product-example pages that sit outside the main nav
  // entirely, this is often a reader's only view of how the site is organised.
  const sitemap = MAIN_NAV.map((item) => {
    const head = resolve(item, locale);
    if (!head) return null;
    let links = leaves(item, locale);
    // Kontakt has no children, so it rendered as a bare heading over an empty
    // column. Give a childless entry the rows it actually has: the form, the
    // phone, the address.
    if (links.length === 0 && head.href) {
      links = [
        { label: t.contactForm, href: head.href },
        { label: PHONE, href: `tel:${PHONE.replace(/[^+\d]/g, "")}` },
        { label: EMAIL, href: `mailto:${EMAIL}` },
      ];
    }
    if (links.length === 0) return null;
    return { ...head, links };
  }).filter((s): s is NonNullable<typeof s> => s !== null);

  const legal = LEGAL_NAV.map((item) => {
    const r = resolve(item, locale);
    return r?.href ? { label: r.label, href: r.href } : null;
  }).filter((l): l is NonNullable<typeof l> => l !== null);

  return (
    <footer className="bg-[#0b1220] text-white/70">
      <div className="mx-auto max-w-[88rem] px-6 pb-10 pt-14">

        <div className="grid gap-x-10 gap-y-10 md:grid-cols-3">
          <div>
            <Image
              src="/logo/dietz-logo.png"
              alt="Dietz GmbH Logo"
              width={395}
              height={137}
              className="h-10 w-auto brightness-0 invert"
            />
            <address className="mt-5 text-sm not-italic leading-relaxed">
              Am Floßgraben 10
              <br />
              96465 Neustadt bei Coburg
              <br />
              <a
                href={`tel:${PHONE.replace(/[^+\d]/g, "")}`}
                className="mt-3 inline-block hover:text-white"
              >
                {PHONE}
              </a>
              <br />
              <a href={`mailto:${EMAIL}`} className="hover:text-white">
                {EMAIL}
              </a>
            </address>
          </div>

          <div className="text-sm leading-relaxed">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-white/45">
              {t.hours}
            </h2>
            <dl className="mt-4 space-y-3">
              <div>
                <dt className="font-medium text-white/90">{t.receiving}</dt>
                <dd className="text-white/60">{t.receivingHours}</dd>
              </div>
              <div>
                <dt className="font-medium text-white/90">{t.admin}</dt>
                <dd className="text-white/60">{t.adminHours}</dd>
              </div>
            </dl>
          </div>

          <div>
            <h2 className="text-xs font-semibold uppercase tracking-widest text-white/45">
              {t.certifications}
            </h2>
            <ul className="mt-4 flex flex-wrap items-center gap-2">
              {BADGES.map((badge) => (
                <li key={badge.src} className="bg-white/95 p-1.5">
                  <Image
                    src={badge.src}
                    alt={badge.alt}
                    width={120}
                    height={60}
                    className="h-7 w-auto object-contain"
                  />
                </li>
              ))}
            </ul>

            <h2 className="mt-6 text-xs font-semibold uppercase tracking-widest text-white/45">
              {t.followUs}
            </h2>
            <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm">
              {SOCIAL.map((item) => (
                <li key={item.label}>
                  <a href={item.href} className="hover:text-white">
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <nav
          aria-label="Sitemap"
          className="mt-12 grid gap-x-8 gap-y-8 border-t border-white/10 pt-10 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7"
        >
          {sitemap.map((col) => (
            <div key={col.label}>
              <h2 className="text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-white/45">
                {col.href ? (
                  <a href={col.href} className="transition-colors hover:text-white">
                    {col.label}
                  </a>
                ) : (
                  col.label
                )}
              </h2>
              {col.links.length > 0 && (
                <ul className="mt-3 space-y-1.5 text-sm">
                  {col.links.map((link) => (
                    <li key={link.href}>
                      <a
                        href={link.href}
                        className="leading-snug transition-colors hover:text-white"
                      >
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </nav>

        <div className="mt-10 flex flex-col gap-3 border-t border-white/10 pt-6 text-sm sm:flex-row sm:items-center sm:justify-between">
          <ul className="flex flex-wrap gap-x-6 gap-y-2">
            {legal.map((item) => (
              <li key={item.href}>
                <a href={item.href} className="text-white/60 hover:text-white">
                  {item.label}
                </a>
              </li>
            ))}
            <li>
              <a
                href={TERMS_PDF.href}
                target="_blank"
                rel="noreferrer"
                className="text-white/60 hover:text-white"
              >
                {TERMS_PDF.label[locale] ?? TERMS_PDF.label.de}
              </a>
            </li>
          </ul>
          <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-white/45">
            <span>© {new Date().getFullYear()} Dietz GmbH</span>
            <span aria-hidden="true" className="text-white/25">
              ·
            </span>
            <span>
              {t.developedBy}{" "}
              <a
                href="https://trayaam.com"
                target="_blank"
                rel="noreferrer"
                className="font-medium text-white/80 underline-offset-4 hover:text-white hover:underline"
              >
                Trayaam
              </a>
            </span>
          </p>
        </div>
      </div>
    </footer>
  );
}
