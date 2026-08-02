/**
 * The h1 + lede block every content template opens with. Shared so the type
 * ramp and the hairline that closes the header are identical on all of them —
 * they were five slightly different sizes before, which is the sort of drift
 * nobody points at but everybody feels.
 *
 * `eyebrow` carries a date/author line on articles; `wide` lets the card-grid
 * templates run the rule to the full container instead of the text measure.
 */
export default function PageHeader({
  h1,
  intro,
  eyebrow,
  wide = false,
}: {
  h1: string;
  intro?: string;
  eyebrow?: string;
  wide?: boolean;
}) {
  return (
    <header className={`border-b border-line pb-8 ${wide ? "" : "max-w-[46rem]"}`}>
      {eyebrow && (
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-brand-ink">
          {eyebrow}
        </p>
      )}
      <h1 className="max-w-[24ch] text-pretty text-[clamp(2rem,1.4rem+2.2vw,3.25rem)] font-semibold leading-[1.08] tracking-[-0.02em] text-ink">
        {h1}
      </h1>
      {intro && (
        <p className="mt-6 max-w-[62ch] text-pretty text-[1.125rem] leading-[1.65] text-ink-muted">
          {intro}
        </p>
      )}
    </header>
  );
}
