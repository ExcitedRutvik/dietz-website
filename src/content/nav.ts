import type { Locale } from "@/lib/locale";

// Nav is referenced by canonical page ID, not literal hrefs — Header/Footer
// resolve each ID through the content registry for the current locale and drop
// any item that has no page there. That is what keeps EN from rendering a
// "News" link when no English news page exists.
//
// IDs are the ones the live-content generator assigns (canonical German URL,
// prefixed by type). Keep them in sync with `scripts/migrate/gen-from-live.py`.
//
// An item may carry `label` instead of `id`: those are mega-menu column
// headings ("Federn", "Biegeteile"), which group the twelve product categories
// rather than linking anywhere. There is no page behind them, so the label has
// to live here.
export interface NavItem {
  id?: string;
  label?: Partial<Record<Locale, string>>;
  children?: NavItem[];
}

export const MAIN_NAV: NavItem[] = [
  // Produkte is the deepest branch — twelve categories, which is far too many
  // for one flat 13-row dropdown. They are grouped by what the part actually
  // is, so a procurement reader scans four short columns instead of one long
  // list. Branchen used to live in here; industries are not a product line and
  // are now their own top-level item.
  {
    id: "post.produkte",
    children: [
      {
        label: { de: "Federn", en: "Springs" },
        children: [
          { id: "product.produkte-druckfedern" },
          { id: "product.produkte-zugfedern" },
          { id: "product.produkte-schenkelfedern" },
          { id: "product.produkte-wellenfedern" },
          { id: "product.praezisionsfedern" },
        ],
      },
      {
        label: { de: "Stanz- & Biegeteile", en: "Stamped & Bent Parts" },
        children: [
          { id: "product.produkte-drahtbiegeteile" },
          { id: "product.produkte-bandbiegeteile" },
          { id: "product.stanz-umformteile" },
        ],
      },
      {
        label: { de: "Baugruppen & Kunststoff", en: "Assemblies & Plastics" },
        children: [
          { id: "product.produkte-hybride-baugruppen" },
          { id: "product.kunststofftechnik" },
          { id: "product.produkte-sonderverpackungen" },
        ],
      },
      {
        label: { de: "Entwicklung", en: "Development" },
        children: [{ id: "product.produkte-prototypen-und-musterbau" }],
      },
    ],
  },

  // Promoted out of the Produkte dropdown. A buyer arriving from an industry
  // ("we make dishwashers") navigates by their own sector, not by part type,
  // so this is a peer of Produkte, not a child of it.
  {
    id: "post.branchen",
    children: [
      { id: "post.branchen-automotive" },
      { id: "post.branchen-elektrotechnik" },
      { id: "post.branchen-medizintechnik" },
      { id: "post.branchen-weisse-ware" },
      { id: "post.branchen-weitere-branchen" },
    ],
  },

  // Promoted out of Unternehmen. Leistungen is a four-page tree in its own
  // right; nesting it flat inside Unternehmen produced an eight-item dropdown
  // that mixed "who we are" with "what we can do for you" — two different
  // questions, asked by two different visitors.
  {
    id: "post.unternehmen-leistungen",
    children: [
      { id: "post.unternehmen-leistungen-produktion" },
      { id: "post.unternehmen-leistungen-qualitaet" },
      { id: "post.unternehmen-leistungen-materialauswahl" },
      { id: "post.unternehmen-leistungen-logistik" },
    ],
  },

  {
    id: "post.unternehmen",
    children: [
      { id: "post.unternehmen-unsere-unternehmenspolitik" },
      { id: "post.unternehmen-qualitaet-umwelt" },
      { id: "post.unternehmen-unsere-partner-und-mitgliedschaften" },
    ],
  },

  {
    id: "post.karriere",
    children: [
      { id: "post.karriere-fachkraefte" },
      { id: "post.karriere-ausbildung" },
      { id: "post.karriere-duales-studium" },
      { id: "post.karriere-praktikum" },
      { id: "post.karriere-initativbewerbung" },
    ],
  },

  // News, Blog and Downloads were three separate top-level items, and Glossar
  // — ~150 pages of it — was reachable from nothing at all. They are one
  // cluster: material you read rather than buy.
  {
    id: "post.wissen",
    // `label` is kept as the fallback for any locale that has no /wissen/ page:
    // resolveNavItem prefers the resolved page's navLabel when one exists, so
    // the two coexist and the item still renders (as a label) rather than
    // vanishing.
    label: { de: "Wissen", en: "Resources" },
    children: [
      { id: "post.news" }, // DE-only; drops out for en
      { id: "post.blog" },
      { id: "post.glossar" },
      { id: "post.downloads" },
    ],
  },

  { id: "contact.kontakt" },
];

// No `agb` entry: the terms are a PDF, not a page, and the Footer links it
// directly.
export const LEGAL_NAV: NavItem[] = [
  { id: "post.impressum" },
  { id: "post.datenschutzerklaerung" },
  { id: "post.cookie-richtlinie-eu" },
  { id: "post.hinweisgebersystem" },
];
