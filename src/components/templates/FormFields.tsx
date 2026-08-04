import type { ContactField } from "@/content/schema";

/**
 * The whole form. Contact and CtaRenderer each carried their own copy of this
 * label-plus-field loop and submit button, which had already drifted apart;
 * they now share one.
 *
 * Static export has no backend behind these yet — the markup is faithful but
 * submission wiring (an endpoint, or a service) is still open.
 */
export function FormBody({
  fields,
  submitLabel,
  className = "",
}: {
  fields: ContactField[];
  submitLabel: string;
  className?: string;
}) {
  return (
    <form className={`space-y-5 ${className}`}>
      {fields.map((field) => (
        <div key={field.name}>
          {field.type !== "checkbox" && (
            <label htmlFor={field.name} className="mb-1.5 block text-sm font-medium text-ink">
              {field.label}
              {field.required && (
                <span className="text-brand-ink" aria-hidden>
                  {" *"}
                </span>
              )}
            </label>
          )}
          <FieldInput field={field} />
        </div>
      ))}
      <button
        type="submit"
        className="min-h-11 bg-brand px-8 text-sm font-semibold text-white transition-colors duration-150 hover:bg-brand-deep"
      >
        {submitLabel}
      </button>
    </form>
  );
}

// Shared by Contact and any inline form CTA (quote-request-form,
// job-application-form) — same field-kind handling either place.
export default function FieldInput({ field }: { field: ContactField }) {
  // 44px minimum height on every control: these forms are filled in on phones
  // by people standing on a shop floor, and the old 38px rows missed the touch
  // target guideline.
  const base =
    "w-full min-h-11 border border-line bg-white px-4 py-2.5 text-sm text-ink transition-colors placeholder:text-ink-faint hover:border-ink-faint focus:border-brand focus:outline-none";

  if (field.type === "textarea") {
    return (
      <textarea
        id={field.name}
        name={field.name}
        placeholder={field.placeholder}
        required={field.required}
        rows={5}
        className={base}
      />
    );
  }
  if (field.type === "checkbox") {
    return (
      <label className="flex items-start gap-3 py-1.5 text-sm leading-relaxed text-ink-muted">
        <input
          type="checkbox"
          name={field.name}
          required={field.required}
          className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--color-brand)]"
        />
        <span>{field.label}</span>
      </label>
    );
  }
  if (field.type === "file") {
    return (
      <input
        id={field.name}
        type="file"
        name={field.name}
        required={field.required}
        className="w-full border border-dashed border-line px-4 py-2.5 text-sm text-ink-muted file:mr-3 file:border-0 file:bg-brand-ink file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white"
      />
    );
  }
  return (
    <input
      id={field.name}
      type={field.type}
      name={field.name}
      placeholder={field.placeholder}
      required={field.required}
      className={base}
    />
  );
}
