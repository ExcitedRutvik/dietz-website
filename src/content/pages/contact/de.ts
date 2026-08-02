// Transcribed from reference/pages/de/kontakt.md. Fields match what's on the
// live form; DE's own scrape did not surface a message/textarea field (EN's
// did) — that asymmetry is preserved rather than invented-symmetric.
import type { PageEntry } from "@/content/schema";

export const contactDe: PageEntry = {
  id: "contact.kontakt",
  locale: "de",
  slug: "kontakt",
  seo: {
    title: "Kontakt | Dietz GmbH",
    description:
      "Kontaktieren Sie die Dietz GmbH in Neustadt bei Coburg — per Formular, Telefon oder E-Mail.",
    navLabel: "Kontakt",
  },
  type: "contact",
  h1: "Kontakt",
  addressBlock: {
    street: "Am Floßgraben 10",
    city: "96465 Neustadt bei Coburg",
    phone: "+49 (0) 9568 9442-0",
    email: "info@dietz.eu",
  },
  cta: {
    kind: "contact-form",
    fields: [
      { name: "name", label: "Name", type: "text", required: true, placeholder: "Vorname Nachname" },
      { name: "company", label: "Firma", type: "text", placeholder: "Firmenname" },
      { name: "email", label: "E-Mail", type: "email", required: true, placeholder: "Ihre E-Mail-Adresse" },
      { name: "phone", label: "Telefon", type: "tel", placeholder: "Ihre Telefonnummer" },
      {
        name: "consent",
        label: "Ich habe die Datenschutzerklärung gelesen und akzeptiere sie.",
        type: "checkbox",
        required: true,
      }
    ],
    submitLabel: "Anfrage absenden",
  },
};
