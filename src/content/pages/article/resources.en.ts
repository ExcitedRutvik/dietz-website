// Authored, not migrated — see wissen.de.ts. English has no News page, so this
// carries three cards rather than four; the card hrefs are literal, so the
// asymmetry is simply one fewer entry.
import type { PageEntry } from "@/content/schema";

export const resourcesEN: PageEntry = {
  id: "post.wissen",
  locale: "en",
  slug: "resources",
  seo: {
    navLabel: "Resources",
    title: "Resources: Spring Technology, Downloads and Glossary | Dietz",
    description:
      "Spring engineering resources from Dietz: a glossary of spring terminology, a blog of application examples, and downloads including IATF 16949 and ISO certificates.",
  },
  type: "hub",
  h1: "Resources",
  intro:
    "Technical reference, application examples and documents, collected in one place.",
  blocks: [
    { kind: "image", src: "/images/stills/produktionshalle-weit.jpg", alt: "Dietz GmbH production hall with overhead crane and manufacturing cells", width: 1280, height: 549 },
    { kind: "paragraph", text: "Specifying a spring is detail work: material, wire diameter, number of coils and surface finish all depend on one another, and the right combination decides service life and function in the assembly. Our glossary explains the terms and standards that appear in drawings and enquiries. The blog shows, on real components, how a requirement becomes a finished spring." },
    { kind: "paragraph", text: "The download area holds our current certificates (IATF 16949, ISO 9001 and ISO 14001), along with data sheets and forms available directly as PDFs." },
  ],
  cards: [
    { title: "Glossary", href: "/en/glossary/", body: "Spring engineering terms from A to Z: spring rate, spring standards, materials, testing methods and manufacturing terminology, explained for reference." },
    { title: "Blog", href: "/en/blog/", body: "Application examples, materials knowledge and background from spring manufacturing, written for design engineers and buyers." },
    { title: "Downloads", href: "/en/downloads/", body: "Certificates, data sheets, terms of sale and forms, available as PDFs." },
  ],
};
