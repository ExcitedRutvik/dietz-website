import type { HubContent } from "@/content/schema";
import { gridPlan, GRID_COLS, GRID_SPAN, GRID_SPAN_SM } from "@/lib/gridPlan";

type Card = HubContent["cards"][number];

/**
 * Shared by Hub and CareerHub. The whole tile is the hit target — a stretched
 * link over the card rather than a link on the title alone, which was a
 * ~200×20px target inside a 380px tile. The title still supplies the
 * accessible name, so nothing is lost to a screen reader.
 *
 * Column count comes from `gridPlan`, which guarantees the last row is full.
 * The grid draws its rules by showing `bg-line` through `gap-px`, so an unfilled
 * cell is a grey rectangle rather than empty space.
 */
export default function CardGrid({ cards }: { cards: Card[] }) {
  const plan = gridPlan(cards.map((c) => c.span));

  return (
    <ul
      className={`grid grid-cols-1 gap-px overflow-hidden border border-line bg-line ${GRID_COLS[plan.cols]}`}
    >
      {cards.map((card, i) => {
        // A widened card is not the same tile stretched: its 16:10 thumb would
        // double in height and throw the row out. It becomes a side-by-side
        // feature instead, which is what the extra width is for.
        const wide = plan.spans[i] >= 2;
        return (
          <li
            key={card.href}
            className={`group relative flex flex-col bg-white transition-colors duration-200 hover:bg-brand-wash ${GRID_SPAN_SM[plan.smSpans[i]]} ${GRID_SPAN[plan.spans[i]]} ${wide ? "lg:flex-row" : ""}`}
          >
            {card.thumb && (
              <div
                className={`overflow-hidden bg-surface ${wide ? "aspect-[16/10] lg:aspect-auto lg:w-1/2 lg:shrink-0" : "aspect-[16/10]"}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={card.thumb}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                />
              </div>
            )}
            <div
              className={`flex flex-1 flex-col p-6 ${wide ? "lg:justify-center lg:p-10" : ""}`}
            >
              <h3
                className={`font-semibold leading-snug tracking-tight text-ink ${wide ? "text-xl sm:text-2xl" : "text-[1.0625rem]"}`}
              >
                <a href={card.href} className="after:absolute after:inset-0">
                  {card.title}
                </a>
              </h3>
              <p
                className={`mt-2 flex-1 leading-relaxed text-ink-muted ${wide ? "text-[0.9375rem] lg:flex-none" : "text-sm"}`}
              >
                {card.body}
              </p>
              <span
                aria-hidden
                className="mt-5 text-brand-ink transition-transform duration-200 group-hover:translate-x-1"
              >
                →
              </span>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
