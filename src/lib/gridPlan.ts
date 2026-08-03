/**
 * Chooses a column count that leaves no empty cell, and widens the last card if
 * nothing divides cleanly.
 *
 * The card grids paint their gaps by showing the container's `bg-line` through
 * a 1px `gap-px`, with each tile's own `bg-white` masking the rest. It is a good
 * technique — one element draws every rule — but it has a sharp edge: a cell
 * with no tile in it is not whitespace, it is a visible grey rectangle. Five
 * industry cards in a 3-column grid left one; four service cards left two.
 *
 * `IndustryStrip` had already solved its own instance of this by hand. This is
 * that trick generalised, so it holds for card counts nobody has thought of yet.
 */

// Largest first. Four is excluded on purpose: the hub container is
// max-w-[72rem], so four columns is an ~18rem card — too narrow for a 16:10
// thumbnail plus three lines of body copy. Three gives ~24rem.
const CANDIDATES = [3, 2] as const;

export type Cols = (typeof CANDIDATES)[number];

export interface GridPlan {
  cols: Cols;
  /** Span per card at `lg` and up: authored spans honoured, last card widened. */
  spans: number[];
  /** Span per card at `sm`, where the grid is always two columns. Authored
   * spans do not apply there — two columns is too narrow to feature anything —
   * so this only ever widens a trailing odd card. */
  smSpans: number[];
}

/** Two columns from `sm` up, so an odd card count orphans the last one. */
function planTwoUp(count: number): number[] {
  const out = new Array(count).fill(1);
  if (count % 2 === 1) out[count - 1] = 2;
  return out;
}

export function gridPlan(authored: (number | undefined)[]): GridPlan {
  if (authored.length === 0)
    return { cols: CANDIDATES[0], spans: [], smSpans: [] };

  const spans = authored.map((s) => Math.min(3, Math.max(1, s ?? 1)));
  const total = spans.reduce((a, b) => a + b, 0);

  const exact = CANDIDATES.find((c) => total % c === 0);
  if (exact) {
    // A two-column plan is the same grid at `sm` and at `lg`, so the spans that
    // tile it already tile the small breakpoint.
    const smSpans = exact === 2 ? spans : planTwoUp(spans.length);
    return { cols: exact, spans, smSpans };
  }

  // Nothing divides cleanly, so take the widest and give the remainder to the
  // last card. A widened closing tile reads as deliberate; a hole reads as a bug.
  const cols = CANDIDATES[0];
  const out = [...spans];
  const gap = cols - (total % cols);
  out[out.length - 1] = Math.min(cols, out[out.length - 1] + gap);
  return { cols, spans: out, smSpans: planTwoUp(spans.length) };
}

// Tailwind only emits classes it can find as literal strings, so these cannot
// be built by interpolation. The span domain is 1-3 by schema constraint, which
// makes a total map short enough to be honest about.
export const GRID_COLS: Record<Cols, string> = {
  2: "sm:grid-cols-2",
  3: "sm:grid-cols-2 lg:grid-cols-3",
};

// `lg:col-span-1` is emitted explicitly rather than left blank: a card widened
// at `sm` needs something to reset it once three columns arrive.
export const GRID_SPAN: Record<number, string> = {
  1: "lg:col-span-1",
  2: "lg:col-span-2",
  3: "lg:col-span-3",
};

export const GRID_SPAN_SM: Record<number, string> = {
  1: "",
  2: "sm:col-span-2",
};
