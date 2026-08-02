import type { Locale } from "@/lib/locale";

export type { Locale };

// ---------------------------------------------------------------------------
// Shared primitives
// ---------------------------------------------------------------------------

export interface SeoMeta {
  title: string;
  description: string;
  /** Short label for nav/breadcrumb chrome when `seo.title` is too long to sit
   * in a menu. Falls back to `seo.title` when absent. */
  navLabel?: string;
}

export interface ContactField {
  name: string;
  label: string;
  type: "text" | "email" | "tel" | "textarea" | "checkbox" | "file";
  required?: boolean;
  placeholder?: string;
}

// CTA is a discriminated union, not a boolean "has a form or not" — the site
// actually has 5 distinct CTA mechanisms found in the scrape: a Typeform popup
// (the dominant pattern), a native contact form, a native quote-request form
// with a file upload, a native job-application form with a résumé upload, and
// one external-portal link (the whistleblower page). Collapsing these into one
// shape would either lose real fields (no room for file upload) or force every
// consumer to guess which optional fields apply.
export type CTA =
  | { kind: "typeform"; typeformId: string; label: string }
  | { kind: "contact-form"; fields: ContactField[]; submitLabel: string }
  | { kind: "quote-request-form"; fields: ContactField[]; submitLabel: string }
  | { kind: "job-application-form"; fields: ContactField[]; submitLabel: string }
  | { kind: "external-link"; href: string; label: string };

// Rich-text body content for Post/Legal pages. A typed block list rather than
// a markdown string: keeps these fully typed with no new markdown-rendering
// dependency, and it's mechanical enough for a scripted migration pass to
// produce directly from the scrape's `## H2:` / `### H3:` / paragraph shape.
export type Block =
  | { kind: "paragraph"; text: string }
  | { kind: "heading"; level: 2 | 3; text: string }
  | { kind: "list"; ordered?: boolean; items: string[] }
  // A wall of partner/membership marks. Distinct from a run of `image`
  // blocks: these are small, wildly inconsistent in aspect ratio, and each is
  // a link out. Rendered as a grid on a shared baseline rather than stacked
  // full-width, which is what the scrape's loose images produced.
  | { kind: "logos"; items: { src: string; alt: string; href?: string }[] }
  | {
      kind: "image";
      src: string;
      alt: string;
      caption?: string;
      /** Intrinsic pixel size, recorded at generation time from the file on
       * disk. Without it every image renders at full column width, which blew
       * 284x284 icons up to 820px and made them dominate the page. */
      width?: number;
      height?: number;
    };

export interface PageMeta {
  /** Canonical cross-locale identifier, e.g. "product.precision-springs".
   * Shared across every locale's entry for "the same page" — this is what the
   * slug map (src/content/pages/index.ts) joins on, not the slug. */
  id: string;
  locale: Locale;
  /** No leading/trailing slash; "" only for a homepage. */
  slug: string;
  seo: SeoMeta;
}

// ---------------------------------------------------------------------------
// Homepage
// ---------------------------------------------------------------------------

export interface HomepageContent {
  type: "homepage";
  hero: {
    kicker: string;
    title: string;
    intro: string;
    industries: string[];
    /** Intro line for the IndustryStrip band below the hero. */
    industriesIntro: string;
  };
  products: {
    title: string;
    /** e.g. "Explore" (EN) / "Mehr über" (DE) — prefixes each item's link text. */
    exploreLabel: string;
    items: { title: string; href: string; body: string }[];
  };
  services: {
    title: string;
    /** e.g. "More on" (EN) / "Mehr über" (DE) — prefixes each item's link text. */
    moreLabel: string;
    items: { title: string; href: string; thumb: string | null; body: string }[];
  };
  sustainability: {
    title: string;
    subtitle: string;
    href: string;
    body: string;
    linkLabel: string;
  };
  company: {
    title: string;
    subtitle: string;
    href: string;
    body: string;
    stats: { value: string; label: string }[];
    linkLabel: string;
  };
  /** DE-only on the live site — no EN equivalent exists. Optional-field
   * presence is how that asymmetry is modelled, not a locale branch. */
  news?: { title: string; items: { title: string; href?: string; excerpt?: string }[] };
  /** DE-only "Termine & Messen" (events/trade-fair dates). Same as `news`. */
  events?: { title: string; items: { title: string; href?: string; date?: string }[] };
  certifications: {
    heading: string;
    intro: string;
    items: { src: string; name: string; note: string }[];
    downloadsHref: string;
    downloadsLabel: string;
  };
  cta: {
    heading: string;
    body: string;
    button: Extract<CTA, { kind: "typeform" }>;
  };
}

// ---------------------------------------------------------------------------
// Hub / Career hub
// ---------------------------------------------------------------------------

export interface HubCard {
  title: string;
  href: string;
  body: string;
  thumb?: string | null;
}

export interface HubContent {
  type: "hub";
  h1: string;
  intro?: string;
  /** Body copy below the intro. The live hub pages carry several hundred words
   * of real prose alongside their card grid; the original card-only shape had
   * nowhere to put it, so it was silently dropped. */
  blocks?: Block[];
  cards: HubCard[];
  cta?: CTA;
}

// Karriere is materially richer than the other hub pages (Werte/values list,
// benefits grid, a named staff contact card) — modelled as its own type rather
// than optional fields bolted onto HubContent, since nothing else uses them.
export interface CareerContent {
  type: "career-hub";
  h1: string;
  intro: string;
  /** See HubContent.blocks. */
  blocks?: Block[];
  cards: HubCard[];
  values?: string[];
  benefits?: { title: string; body?: string }[];
  contact?: { name: string; role: string; phone?: string; email?: string };
  cta?: CTA;
}

// ---------------------------------------------------------------------------
// Listing / archive
// ---------------------------------------------------------------------------

export interface ListingItem {
  title: string;
  /** Optional: a handful of index rows name a page whose slug was taken by
   * another page (the Präzisionsfedern glossary term lost `/praezisionsfedern/`
   * to the product category). Those render as plain text rather than as a link
   * to somewhere wrong. */
  href?: string;
  excerpt?: string;
  date?: string;
  thumb?: string;
}

export interface ListingContent {
  type: "listing";
  h1: string;
  intro?: string;
  items: ListingItem[];
  /** Present for Mediathek (genuinely paginated); absent for Blog/Glossar/
   * News/Downloads, which the scrape confirmed render as a single flat list. */
  pagination?: { currentPage: number; totalPages: number; basePath: string };
}

// ---------------------------------------------------------------------------
// Post (long-form article + glossary stub — same type, different optional
// fields, not separate templates)
// ---------------------------------------------------------------------------

export interface PostMeta {
  author?: string;
  date?: string;
  showShareLinks?: boolean;
  showComments?: boolean;
  prev?: { title: string; href: string };
  next?: { title: string; href: string };
}

export interface PostContent {
  type: "post";
  /** Application-example tiles. The Branchen leaf pages (automotive,
   * medizintechnik, ...) are galleries of parts, not articles; the scrape
   * flattened them into prose plus a clump of loose images. */
  gallery?: GalleryExample[];
  h1: string;
  intro?: string;
  blocks: Block[];
  /** Typeform for most articles; external-link for the whistleblower page
   * (dietz.integrityline.com) — no 9th template needed for that one page. */
  cta?: CTA;
  /** WordPress blog-post chrome (author/share/comments/prev-next) that
   * glossary stubs tend to carry and long-form articles tend not to. Presence/
   * absence, not page length, is the real signal between the two. */
  postMeta?: PostMeta;
}

// ---------------------------------------------------------------------------
// Product / service category page
// ---------------------------------------------------------------------------

export interface GalleryExample {
  heading?: string;
  caption: string;
  /** Optional: a handful of examples are described on the category page but
   * have no photograph of their own on the live site. */
  image?: { src: string; alt: string };
  /** Optional: most examples have a dedicated page. Where one exists the tile
   * links to it, which is how the ~44 product-example pages are reached. */
  href?: string;
}

export interface ProductCategoryContent {
  type: "product-category";
  h1: string;
  /** Single lede paragraph. Longer body prose belongs in `blocks` — folding
   * multiple paragraphs in here collapses them into one wall of text, since
   * newlines carry no meaning in HTML. */
  intro: string;
  /** Body copy below the lede. Most of these pages carry substantial prose
   * beyond the intro (the "… von Dietz" closing sections). */
  blocks?: Block[];
  gallery: GalleryExample[];
  // Typed as the full CTA union, not narrowed to quote-request-form: the
  // scrape found 4 DE pages with a native quote-request form (incl. file
  // upload) and zero EN equivalents — EN's real content here is a typeform,
  // and narrowing the type would make that fail to type-check.
  cta: CTA;
}

// ---------------------------------------------------------------------------
// Contact — one shared template, both locales use the same native form. The
// EN/DE difference found in the scrape was untranslated placeholder text, a
// content bug to fix during migration, not a template variant.
// ---------------------------------------------------------------------------

export interface ContactContent {
  type: "contact";
  h1: string;
  addressBlock: {
    street: string;
    city: string;
    phone?: string;
    fax?: string;
    email?: string;
  };
  contactPersons?: { label: string; email: string }[];
  cta: Extract<CTA, { kind: "contact-form" }>;
}

// ---------------------------------------------------------------------------
// Legal (Impressum / Datenschutz / Cookie policy / AGB)
// ---------------------------------------------------------------------------

export interface LegalContent {
  type: "legal";
  h1: string;
  blocks: Block[];
}

export type PageBody =
  | HomepageContent
  | HubContent
  | CareerContent
  | ListingContent
  | PostContent
  | ProductCategoryContent
  | ContactContent
  | LegalContent;

export type PageEntry = PageMeta & PageBody;

// Convenience aliases for modules that author one specific page type and want
// precise field access (e.g. `homepageEn.hero`) without re-narrowing a union
// at every call site — assigning a `type: "homepage"` literal to a `PageEntry`-
// typed const does NOT narrow that const's own static type on later access,
// only a discriminant check at the usage site would.
export type HomepageEntry = PageMeta & HomepageContent;
