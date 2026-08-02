"use client";

import GlassCard from "@/components/ui/GlassCard";
import ScrollVideoSection from "@/components/scroll/ScrollVideoSection";
import { videoManifest } from "@/lib/videoManifest";
import type { HomepageContent } from "@/content/schema";

// Same treatment as Products, so the two sections read as one system.
//
// "material" is a still lifted from the company film at 713.6s (wire stock on
// its dereeler) rather than a marketing photo, because the live site has no
// image for this item at all. The obvious substitute — the bent-wire-parts
// product shot — was wrong twice over: it shows a finished part rather than raw
// material, and it duplicates an image already used in the Products section.
const MEDIA = ["production", "material", "quality", "logistics"];

export default function Services({
  content,
}: {
  content: HomepageContent["services"];
}) {
  return (
    <ScrollVideoSection
      id="services"
      sequence={videoManifest.services}
      align="right"
      order={2}
      vhPerStep={125}
      showDots
      stepMedia={content.items.map((item, i) => (
        <GlassCard
          key={item.title}
          src={`/images/services/${MEDIA[i]}.jpg`}
          label={item.title}
          index={i}
          total={content.items.length}
        />
      ))}
      steps={content.items.map((item, i) => (
        <article
          key={item.title}
          className="max-w-2xl text-white"
        >
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-brand-light">
              {String(i + 1).padStart(2, "0")} /{" "}
              {String(content.items.length).padStart(2, "0")}
            </p>
            <h3 className="mt-3 text-2xl font-semibold tracking-tight min-[380px]:text-[1.75rem] sm:mt-4 sm:text-4xl">
              {item.title}
            </h3>
            <p className="mt-3 text-pretty text-[0.9rem] leading-relaxed font-medium text-white sm:mt-4 sm:text-base">
              {item.body}
            </p>
            <a
              href={item.href}
              className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-brand-light underline-offset-4 transition-colors hover:text-white hover:underline"
            >
              {content.moreLabel} {item.title}
              <span aria-hidden="true">→</span>
            </a>
          </div>
        </article>
      ))}
    />
  );
}
