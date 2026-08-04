"use client";

import ScrollVideoSection from "@/components/scroll/ScrollVideoSection";
import { videoManifest } from "@/lib/videoManifest";
import type { HomepageContent } from "@/content/schema";

export default function Sustainability({
  content,
}: {
  content: HomepageContent["sustainability"];
}) {
  return (
    <ScrollVideoSection
      id="sustainability"
      sequence={videoManifest.sustainability}
      align="left"
      order={3}
      vhPerStep={140}
      steps={[
        <div key="sustainability" className="max-w-2xl text-white">
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            {content.subtitle}
          </h2>
          <p className="mt-5 text-pretty text-sm leading-relaxed font-medium text-white sm:text-base">
            {content.body}
          </p>
          <a
            href={content.href}
            className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-brand-light underline-offset-4 transition-colors hover:text-white hover:underline"
          >
            {content.linkLabel}
            <span aria-hidden="true">→</span>
          </a>
        </div>,
      ]}
    />
  );
}
