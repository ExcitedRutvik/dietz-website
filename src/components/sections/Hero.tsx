"use client";

import ScrollVideoSection from "@/components/scroll/ScrollVideoSection";
import ContactCta from "@/components/ui/ContactCta";
import { videoManifest } from "@/lib/videoManifest";
import type { HomepageContent } from "@/content/schema";
import type { Locale } from "@/lib/locale";

/**
 * A single bar across the foot of the frame: brand line, one-line headline,
 * lede, and the primary CTA beside them.
 *
 * The panel hugs its content rather than filling a column, so there is no gap
 * to explain between the copy and the button. The headline holds one line at
 * 30px; it wraps at 34, which is why the scale is set here rather than left to
 * a fluid clamp.
 */
export default function Hero({
  content,
  locale,
}: {
  content: HomepageContent["hero"];
  locale: Locale;
}) {
  // The company name is coloured, the descriptor is not, so the title has to
  // split. The separator is whatever dash the locale's copy actually uses.
  const [name, ...tail] = content.title.split(/\s+[-–—]\s+/);
  const descriptor = tail.join(" - ");

  return (
    <ScrollVideoSection
      id="top"
      sequence={videoManifest.hero}
      eager
      align="left"
      barLayout
      order={0}
      vhPerStep={165}
      steps={[
        <div
          key="hero"
          className="flex flex-col gap-6 text-white sm:flex-row sm:items-center sm:gap-14"
        >
          <div className="min-w-0">
            <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-brand-light">
              {content.kicker}
            </p>
            {/* `brand-light` rather than `brand`: a solid fill of #008BC5 reads
                bright, but the same hue in thin strokes on dark glass goes
                dull. The lighter tint is what actually matches the CTA. */}
            <h1 className="mt-2.5 text-[1.4rem] font-semibold leading-[1.15] tracking-tight min-[380px]:text-2xl sm:text-[1.75rem]">
              <span className="text-brand-light">{name}</span>
              {descriptor && <span> - {descriptor}</span>}
            </h1>
            <p className="mt-2 text-[0.9rem] leading-relaxed text-white/90 sm:text-base">
              {content.intro}
            </p>
          </div>

          <ContactCta
            locale={locale}
            className="min-h-12 shrink-0 gap-2 rounded-xl bg-brand px-7 text-sm font-semibold text-white transition-colors duration-150 hover:bg-brand-deep sm:min-h-[3.125rem]"
          />
        </div>,
      ]}
    />
  );
}
