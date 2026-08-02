import type { ContactContent } from "@/content/schema";
import { FormBody } from "./FormFields";

// Contact is one shared template for every locale — the scrape found EN and DE
// both use the same native form (the "EN falls back to Typeform" claim in an
// earlier draft was wrong; that was a real read of both pages). Any per-locale
// difference belongs in the content file's field labels/placeholders, not a
// template branch.
//
// Laid out as two columns rather than stacked. Contact is a short page with two
// separate jobs — "give me a number to ring" and "take my enquiry" — and
// stacking them put the form below the fold and the address above it, so
// whichever a visitor wanted, they scrolled. Side by side, the whole page is
// one screen and the two paths are visibly parallel rather than sequential.
export default function Contact({ h1, addressBlock, contactPersons, cta }: ContactContent) {
  return (
    <main className="mx-auto max-w-[72rem] px-6 pb-20 pt-8">
      <h1 className="text-[clamp(2rem,1.4rem+2.2vw,3rem)] font-semibold leading-[1.08] tracking-[-0.02em] text-ink">
        {h1}
      </h1>

      <div className="mt-10 grid gap-x-16 gap-y-12 border-t border-line pt-10 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)]">
        {/* Reachable-right-now details first in source order and first on the
            left: half of this page's visitors want a phone number, not a text
            box. */}
        <div className="lg:border-r lg:border-line lg:pr-16">
          <address className="not-italic">
            <p className="text-sm leading-[1.8] text-ink-muted">
              {addressBlock.street}
              <br />
              {addressBlock.city}
            </p>

            <dl className="mt-6 space-y-4 text-sm">
              {addressBlock.phone && (
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-ink-faint">
                    Telefon
                  </dt>
                  <dd className="mt-1">
                    <a
                      href={`tel:${addressBlock.phone.replace(/\s+/g, "")}`}
                      className="text-[1.0625rem] font-medium text-brand-ink underline-offset-4 hover:underline"
                    >
                      {addressBlock.phone}
                    </a>
                  </dd>
                </div>
              )}
              {addressBlock.email && (
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-ink-faint">
                    E-Mail
                  </dt>
                  <dd className="mt-1">
                    <a
                      href={`mailto:${addressBlock.email}`}
                      className="break-words text-[1.0625rem] font-medium text-brand-ink underline-offset-4 hover:underline"
                    >
                      {addressBlock.email}
                    </a>
                  </dd>
                </div>
              )}
            </dl>
          </address>

          {contactPersons && contactPersons.length > 0 && (
            <ul className="mt-8 space-y-3 border-t border-line pt-6 text-sm">
              {contactPersons.map((p) => (
                <li key={p.email}>
                  <span className="block font-medium text-ink">{p.label}</span>
                  <a
                    href={`mailto:${p.email}`}
                    className="break-words text-brand-ink underline-offset-4 hover:underline"
                  >
                    {p.email}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Two form columns on desktop so five fields do not become five rows
            of scroll. The consent checkbox and the submit button span both. */}
        <FormBody
          fields={cta.fields}
          submitLabel={cta.submitLabel}
          className="sm:grid sm:grid-cols-2 sm:gap-x-6 sm:gap-y-5 sm:space-y-0 [&>button]:sm:col-span-2 [&>button]:sm:justify-self-start [&>div:has(label>input[type=checkbox])]:sm:col-span-2 [&>div:has(textarea)]:sm:col-span-2"
        />
      </div>
    </main>
  );
}
