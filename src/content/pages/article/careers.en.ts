// Authored, not migrated: the live site has no English careers page.
//
// Deliberately a landing page rather than a translation of the German careers
// tree. The vacancies are production and commercial roles at the Neustadt bei
// Coburg plant, advertised in German and requiring German; machine-translating
// twenty pages of HR and contractual copy on a project with a documented
// mistranslation record ("Roller Shutter Leather" for Rollofeder) would be
// worse than not shipping them. This gives an English-speaking visitor the
// facts, the contact, and a route into the real listings. Flagged to Dietz as
// a decision to confirm.
import type { PageEntry } from "@/content/schema";

export const careersEN: PageEntry = {
  id: "post.karriere",
  locale: "en",
  slug: "careers",
  seo: {
    navLabel: "Careers",
    title: "Careers at Dietz GmbH | Neustadt bei Coburg",
    description:
      "Jobs, apprenticeships and dual study places at Dietz GmbH, a family-owned precision spring manufacturer near Coburg, Germany. Vacancies are advertised in German.",
  },
  type: "post",
  h1: "Careers at Dietz",
  intro:
    "A family-owned precision spring manufacturer in Neustadt bei Coburg, Germany, making springs, stamped and formed parts and hybrid assemblies for the automotive, electrical, appliance and medical industries since 1928.",
  sectionLinks: {
    title: "Careers sections",
    links: [
      { label: "Skilled professionals", href: "/karriere/fachkraefte/", lang: "de" },
      { label: "Apprenticeships", href: "/karriere/ausbildung/", lang: "de" },
      { label: "Dual study programme", href: "/karriere/duales-studium/", lang: "de" },
      { label: "Student work placement", href: "/karriere/praktikum/", lang: "de" },
      { label: "Speculative application", href: "/karriere/initativbewerbung/", lang: "de" },
      { label: "All current vacancies", href: "/karriere/", lang: "de" },
    ],
  },
  blocks: [
    { kind: "image", src: "/images/stills/kollegen-fertigung.jpg", alt: "Two colleagues in conversation on the shop floor", width: 1280, height: 549 },
    { kind: "heading", level: 2, text: "Working at Dietz" },
    { kind: "paragraph", text: "We train 15 to 20 apprentices at any one time in our own training workshop. The company is still owner-managed, which keeps hierarchies flat and decisions short. Benefits include flexible working hours, permanent contracts, a company pension scheme (the Dietz Zukunftsplan), company health insurance, a Jobrad cycle scheme and regular training." },
    { kind: "paragraph", text: "We also support apprentices who want to complete a work placement abroad through Erasmus+." },
    { kind: "heading", level: 2, text: "Vacancies are advertised in German" },
    { kind: "paragraph", text: "All current openings (skilled positions, apprenticeships, dual study places and internships) are listed on our German careers pages. The roles are based at our Neustadt bei Coburg site and working German is required, which is why the listings are not translated." },
    { kind: "paragraph", text: "You are welcome to apply in English. If you would like to discuss a role before applying, please contact our head of human resources, Andrea Dietz, on +49 9568 9442 119 or at karriere@dietz.eu." },
  ],
  cta: {
    kind: "external-link",
    label: "See current vacancies (German)",
    href: "/karriere/",
  },
};
