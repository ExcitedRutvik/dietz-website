"use client";

import ScrollVideoSection from "@/components/scroll/ScrollVideoSection";
import { videoManifest } from "@/lib/videoManifest";
import GlassCard from "@/components/ui/GlassCard";
import type { HomepageContent } from "@/content/schema";

// Slugs match the files staged into public/images/products from the reference
// crawl, in the same order the products appear.
const MEDIA = [
  "hybrid-assemblies",
  "stamped-formed-parts",
  "precision-springs",
  "bent-wire-parts",
  "prototype-construction",
  "plastics-technology",
  "special-packaging",
];

export default function Products({
  content,
}: {
  content: HomepageContent["products"];
}) {
  return (
    <ScrollVideoSection
      id="products"
      sequence={videoManifest.products}
      align="left"
      order={1}
      vhPerStep={108}
      showDots
      stepMedia={content.items.map((item, i) => (
        <GlassCard
          key={item.title}
          src={`/images/products/${MEDIA[i]}.jpg`}
          label={item.title}
          index={i}
          total={content.items.length}
        />
      ))}
      steps={content.items.map((item, i) => (
        <article key={item.title} className="max-w-2xl text-white">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-brand-light">
            {String(i + 1).padStart(2, "0")} /{" "}
            {String(content.items.length).padStart(2, "0")}
          </p>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight min-[380px]:text-[1.75rem] sm:mt-4 sm:text-4xl">
            {item.title}
          </h2>
          <p className="mt-3 text-pretty text-[0.9rem] leading-relaxed font-medium text-white sm:mt-4 sm:text-base">
            {item.body}
          </p>
          <a
            href={item.href}
            className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-brand-light underline-offset-4 transition-colors hover:text-white hover:underline"
          >
            {content.exploreLabel} {item.title}
            <span aria-hidden="true">→</span>
          </a>
        </article>
      ))}
    />
  );
}
