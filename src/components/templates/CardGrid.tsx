import type { HubContent } from "@/content/schema";

type Card = HubContent["cards"][number];

/**
 * Shared by Hub and CareerHub. The whole tile is the hit target — a stretched
 * link over the card rather than a link on the title alone, which was a
 * ~200×20px target inside a 380px tile. The title still supplies the
 * accessible name, so nothing is lost to a screen reader.
 */
export default function CardGrid({ cards }: { cards: Card[] }) {
  return (
    <ul className="grid grid-cols-1 gap-px overflow-hidden border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
      {cards.map((card) => (
        <li
          key={card.href}
          className="group relative flex flex-col bg-white transition-colors duration-200 hover:bg-brand-wash"
        >
          {card.thumb && (
            <div className="aspect-[16/10] overflow-hidden bg-surface">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={card.thumb}
                alt=""
                loading="lazy"
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
              />
            </div>
          )}
          <div className="flex flex-1 flex-col p-6">
            <h3 className="text-[1.0625rem] font-semibold leading-snug tracking-tight text-ink">
              <a href={card.href} className="after:absolute after:inset-0">
                {card.title}
              </a>
            </h3>
            <p className="mt-2 flex-1 text-sm leading-relaxed text-ink-muted">{card.body}</p>
            <span
              aria-hidden
              className="mt-5 text-brand-ink transition-transform duration-200 group-hover:translate-x-1"
            >
              →
            </span>
          </div>
        </li>
      ))}
    </ul>
  );
}
