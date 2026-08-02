import type { CareerContent } from "@/content/schema";
import type { Locale } from "@/lib/locale";
import BlockRenderer from "./BlockRenderer";
import CtaRenderer from "./CtaRenderer";
import PageHeader from "./PageHeader";
import CardGrid from "./CardGrid";

// Richer than the plain Hub: a Werte (values) list, a benefits grid, and a
// named staff contact card — bespoke to Karriere, not shared with any other
// hub page on the site.
export default function CareerHub({
  h1,
  intro,
  blocks,
  cards,
  values,
  benefits,
  contact,
  cta,
  locale,
}: CareerContent & { locale: Locale }) {
  return (
    <main className="mx-auto max-w-[72rem] px-6 pb-28 pt-10">
      <PageHeader h1={h1} intro={intro} wide />

      {blocks && blocks.length > 0 && (
        <div className="mt-12">
          <BlockRenderer blocks={blocks} />
        </div>
      )}

      <div className="mt-14">
        <CardGrid cards={cards} />
      </div>

      {values && values.length > 0 && (
        <Section title="Werte">
          <ul className="grid grid-cols-1 gap-px border border-line bg-line sm:grid-cols-2">
            {values.map((v) => (
              <li key={v} className="bg-white px-5 py-4 text-sm leading-relaxed text-ink">
                {v}
              </li>
            ))}
          </ul>
        </Section>
      )}

      {benefits && benefits.length > 0 && (
        <Section title="Benefits">
          <ul className="grid grid-cols-1 gap-x-10 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
            {benefits.map((b) => (
              // A short brand rule instead of a box: at ~10 items a grid of
              // bordered cards reads as a table of nothing.
              <li key={b.title} className="border-t-2 border-brand pt-4">
                <p className="font-semibold text-ink">{b.title}</p>
                {b.body && (
                  <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">{b.body}</p>
                )}
              </li>
            ))}
          </ul>
        </Section>
      )}

      {contact && (
        <div className="mt-20 border-l-2 border-brand bg-surface p-8">
          <p className="text-lg font-semibold tracking-tight text-ink">{contact.name}</p>
          <p className="mt-0.5 text-sm text-ink-muted">{contact.role}</p>
          <div className="mt-4 flex flex-wrap gap-x-6 gap-y-1 text-sm">
            {contact.phone && (
              <a
                href={`tel:${contact.phone.replace(/[^+\d]/g, "")}`}
                className="text-brand-ink underline-offset-4 hover:underline"
              >
                {contact.phone}
              </a>
            )}
            {contact.email && (
              <a
                href={`mailto:${contact.email}`}
                className="text-brand-ink underline-offset-4 hover:underline"
              >
                {contact.email}
              </a>
            )}
          </div>
        </div>
      )}

      {cta && <CtaRenderer cta={cta} locale={locale} />}
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-20">
      <h2 className="mb-6 text-xs font-semibold uppercase tracking-[0.14em] text-ink-faint">
        {title}
      </h2>
      {children}
    </section>
  );
}
