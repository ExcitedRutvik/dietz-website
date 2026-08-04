"use client";

import ScrollVideoSection from "@/components/scroll/ScrollVideoSection";
import { videoManifest } from "@/lib/videoManifest";
import type { HomepageContent } from "@/content/schema";

export default function Company({
  content,
}: {
  content: HomepageContent["company"];
}) {
  return (
    <ScrollVideoSection
      id="company"
      sequence={videoManifest.company}
      align="right"
      order={4}
      vhPerStep={150}
      steps={[
        <div key="company" className="max-w-3xl text-white">
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            {content.subtitle}
          </h2>
          <p className="mt-5 text-pretty text-sm leading-relaxed font-medium text-white sm:text-base">
            {content.body}
          </p>

          <dl className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-3">
            {content.stats.map((stat) => (
              <div key={stat.value} className="border-l-2 border-brand-light pl-4">
                <dt className="sr-only">{stat.label}</dt>
                <dd>
                  <span className="block text-2xl font-semibold tracking-tight sm:text-3xl">
                    {stat.value}
                  </span>
                  <span className="mt-1 block text-xs leading-snug text-white/70">
                    {stat.label}
                  </span>
                </dd>
              </div>
            ))}
          </dl>

          <a
            href={content.href}
            className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-brand-light underline-offset-4 transition-colors hover:text-white hover:underline"
          >
            {content.linkLabel}
            <span aria-hidden="true">→</span>
          </a>
        </div>,
      ]}
    />
  );
}
