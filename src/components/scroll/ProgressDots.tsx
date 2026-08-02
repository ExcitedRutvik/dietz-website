export default function ProgressDots({
  count,
  current,
}: {
  count: number;
  current: number;
}) {
  return (
    <div
      aria-hidden="true"
      className="absolute right-6 top-1/2 hidden -translate-y-1/2 flex-col gap-3 lg:flex"
    >
      {Array.from({ length: count }, (_, i) => (
        <span
          key={i}
          // The active dot is brand rather than white: at 8px, "slightly
          // bigger and equally white" was not a readable difference against
          // moving footage. Colour carries it where scale could not.
          className={`h-2 w-2 rounded-full transition-all duration-300 ${
            i === current ? "scale-150 bg-brand-light" : "bg-white/35"
          }`}
        />
      ))}
    </div>
  );
}
