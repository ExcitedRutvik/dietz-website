import Image from "next/image";

/**
 * The product still inside a section panel.
 *
 * It carries no glass of its own any more. The copy and the image now share
 * one panel, so a `cine-glass` surface here would be glass inside glass: two
 * tints, two rims and two contact shadows stacked in the same rectangle.
 * What is left is the image well, its ring, and the caption row.
 */
export default function GlassCard({
  src,
  label,
  index,
  total,
}: {
  src: string;
  label: string;
  index: number;
  total: number;
}) {
  return (
    <figure className="relative w-full">
      <div className="relative">
        <div className="relative overflow-hidden rounded-[1rem] ring-1 ring-white/10">
          <Image
            src={src}
            alt=""
            width={760}
            height={608}
            sizes="(max-width: 1279px) 24rem, 22rem"
            className="h-48 w-full object-cover sm:h-56 xl:h-52"
          />
          {/* Settles the white studio sweep to the pane's own brightness. */}
          <div className="absolute inset-0 bg-zinc-950/10" />
        </div>
        <figcaption className="flex items-baseline justify-between gap-3 pt-3">
          <span className="text-sm font-medium tracking-tight text-white">
            {label}
          </span>
          <span className="font-mono text-[11px] tabular-nums text-white/45">
            {String(index + 1).padStart(2, "0")}/{String(total).padStart(2, "0")}
          </span>
        </figcaption>
      </div>
    </figure>
  );
}
