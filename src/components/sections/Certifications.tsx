import Image from "next/image";
import type { HomepageContent } from "@/content/schema";

/**
 * The badges were previously buried in the footer as a silent logo row, which is
 * where certifications go to be ignored. For an IATF-certified supplier they are
 * a qualifying credential, so a procurement reader is actively looking for them.
 *
 * Each badge gets what it actually needs to be useful: the standard, and a plain
 * line saying what the standard covers. The marks themselves are dark-on-white
 * artwork, so they sit on light plates rather than being knocked out over the
 * dark background.
 */
export default function Certifications({
  content,
}: {
  content: HomepageContent["certifications"];
}) {
  return (
    <section id="certifications" className="relative z-10 bg-zinc-950 py-20 sm:py-24">
      {/* Picks up the solid the pinned section above ends on, so there is no
          seam where one becomes the other. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/40 to-transparent"
      />
      <div className="relative mx-auto max-w-6xl 2xl:max-w-7xl min-[1920px]:max-w-[102rem] px-6">
        <h2 className="max-w-2xl text-3xl font-semibold tracking-tight text-white sm:text-4xl">
          {content.heading}
        </h2>
        <p className="mt-5 max-w-xl text-base leading-relaxed text-white/80">
          {content.intro}
        </p>

        <ul className="mt-14 grid grid-cols-1 gap-px overflow-hidden bg-white/10 sm:grid-cols-2 lg:grid-cols-4">
          {content.items.map((c) => (
            <li key={c.name} className="flex flex-col bg-zinc-950 p-6">
              {/* Fixed-height plate so the row's geometry is final before the
                  marks decode. These are the last thing on a very long scroll,
                  so they were previously fetched late and popped in against an
                  empty box. */}
              <div className="flex h-20 w-fit items-center justify-center bg-white px-4">
                {/* Deliberately still lazy: preloading four below-the-fold
                    marks would compete with the hero. These are 8 files
                    totalling 64KB — they were never slow, they were starved
                    behind the frame queue, which the fetch scheduler now caps. */}
                <Image
                  src={c.src}
                  alt={`${c.name} certification mark`}
                  width={160}
                  height={80}
                  sizes="128px"
                  fetchPriority="low"
                  decoding="async"
                  className="h-12 w-auto object-contain"
                />
              </div>
              <p className="mt-5 text-sm font-medium tracking-tight text-white">
                {c.name}
              </p>
              <p className="mt-1.5 text-sm leading-relaxed text-white/50">
                {c.note}
              </p>
            </li>
          ))}
        </ul>

        <a
          href={content.downloadsHref}
          className="mt-10 inline-flex items-center gap-2 text-sm font-semibold text-white underline-offset-4 hover:underline"
        >
          {content.downloadsLabel}
          <span aria-hidden="true">→</span>
        </a>
      </div>
    </section>
  );
}
