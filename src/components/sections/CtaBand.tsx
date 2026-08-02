import ContactCta from "@/components/ui/ContactCta";
import type { HomepageContent } from "@/content/schema";
import type { Locale } from "@/lib/locale";

export default function CtaBand({
  content,
  locale,
}: {
  content: HomepageContent["cta"];
  locale: Locale;
}) {
  return (
    <section id="contact" className="bg-white text-ink">
      <div className="mx-auto flex max-w-5xl flex-col items-start gap-8 px-6 py-24 sm:py-28 md:flex-row md:items-center md:justify-between">
        <div className="max-w-2xl">
          <h2 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
            {content.heading}
          </h2>
          <p className="mt-4 text-pretty text-base leading-relaxed text-ink-muted">
            {content.body}
          </p>
        </div>
        <ContactCta
          locale={locale}
          className="min-h-12 shrink-0 bg-brand px-8 text-sm font-semibold text-white transition-colors duration-150 hover:bg-brand-deep"
        />
      </div>
    </section>
  );
}
