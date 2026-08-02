// Transcribed from reference/pages/en/contact.md.
//
// FIXES A LIVE-SITE BUG: the real EN contact form still ships German field
// placeholders ("Vorname Nachname", "Firmenname") and a German submit button
// ("Anfrage absenden") — logged as content bug #1 in reference/design-notes.md.
// Per the plan, known bugs get fixed during migration rather than reproduced,
// so these are the English equivalents. EN does have the message textarea that
// DE's form lacks; that difference is real and preserved.
import type { PageEntry } from "@/content/schema";

export const contactEn: PageEntry = {
  id: "contact.kontakt",
  locale: "en",
  slug: "contact",
  seo: {
    title: "Contact | Dietz GmbH",
    description:
      "Get in touch with Dietz GmbH in Neustadt bei Coburg — by form, phone or email.",
    navLabel: "Contact",
  },
  type: "contact",
  h1: "Contact",
  addressBlock: {
    street: "Am Floßgraben 10",
    city: "96465 Neustadt bei Coburg",
    phone: "+49 (0) 9568 9442-0",
    email: "info@dietz.eu",
  },
  cta: {
    kind: "contact-form",
    fields: [
      { name: "name", label: "Name", type: "text", required: true, placeholder: "First name Last name" },
      { name: "company", label: "Company", type: "text", placeholder: "Company name" },
      { name: "email", label: "Email", type: "email", required: true, placeholder: "Your email address" },
      { name: "phone", label: "Phone", type: "tel", placeholder: "Your phone number" },
      {
        name: "message",
        label: "Message",
        type: "textarea",
        placeholder: "Further information about your enquiry",
      },
      {
        name: "consent",
        label: "I have read and accept the privacy policy.",
        type: "checkbox",
        required: true,
      }
    ],
    submitLabel: "Send enquiry",
  },
};
