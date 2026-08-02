import ContactCta from "@/components/ui/ContactCta";
import { FormBody } from "./FormFields";
import type { CTA } from "@/content/schema";
import type { Locale } from "@/lib/locale";

// Renders whichever of the 5 CTA variants a Post/ProductCategory page carries.
// Contact itself doesn't use this — it always has a contact-form and renders
// that form inline as the page's main content, not as a trailing CTA block.
export default function CtaRenderer({ cta, locale }: { cta: CTA; locale: Locale }) {
  switch (cta.kind) {
    case "typeform":
      return (
        <ContactCta
          locale={locale}
          label={cta.label}
          className="mt-8 min-h-12 gap-2 bg-brand px-8 text-sm font-semibold text-white transition-colors duration-150 hover:bg-brand-deep"
        />
      );
    case "external-link":
      return (
        <a
          href={cta.href}
          target="_blank"
          rel="noreferrer"
          className="mt-8 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-brand-ink underline-offset-4 hover:underline"
        >
          {cta.label}
          <span aria-hidden="true">→</span>
        </a>
      );
    case "contact-form":
    case "quote-request-form":
    case "job-application-form":
      return (
        <FormBody
          fields={cta.fields}
          submitLabel={cta.submitLabel}
          className="mt-8 max-w-xl border-l-2 border-brand bg-surface p-8"
        />
      );
  }
}
