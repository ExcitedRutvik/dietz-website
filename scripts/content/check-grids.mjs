/**
 * Asserts that no hub page's card grid leaves an empty cell.
 *
 * The grids draw their rules by showing the container's background through a
 * 1px gap, so an unfilled cell renders as a grey rectangle, not as whitespace.
 * `gridPlan` is supposed to make that impossible; this checks it actually does,
 * for the real card counts on disk, and reports what each page will render.
 *
 * Run after adding or reordering hub cards:
 *   node scripts/content/check-grids.mjs
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const CANDIDATES = [3, 2];

function planTwoUp(count) {
  const out = new Array(count).fill(1);
  if (count % 2 === 1) out[count - 1] = 2;
  return out;
}

function gridPlan(authored) {
  if (authored.length === 0)
    return { cols: CANDIDATES[0], spans: [], smSpans: [] };
  const spans = authored.map((s) => Math.min(3, Math.max(1, s ?? 1)));
  const total = spans.reduce((a, b) => a + b, 0);
  const exact = CANDIDATES.find((c) => total % c === 0);
  if (exact) {
    return {
      cols: exact,
      spans,
      smSpans: exact === 2 ? spans : planTwoUp(spans.length),
    };
  }
  const cols = CANDIDATES[0];
  const out = [...spans];
  out[out.length - 1] = Math.min(cols, out[out.length - 1] + (cols - (total % cols)));
  return { cols, spans: out, smSpans: planTwoUp(spans.length) };
}

const DIR = "src/content/pages/article";
let failures = 0;
const rows = [];

for (const file of readdirSync(DIR).sort()) {
  if (!file.endsWith(".ts")) continue;
  const src = readFileSync(join(DIR, file), "utf8");
  if (!/type:\s*"(hub|career-hub)"/.test(src)) continue;

  // Each card is one object literal on one line in these generated files.
  const cardLines = src
    .split("\n")
    .filter((l) => /^\s*\{\s*title:/.test(l) && /href:/.test(l));
  if (cardLines.length === 0) continue;

  const spans = cardLines.map((l) => {
    const m = l.match(/\bspan:\s*(\d)/);
    return m ? Number(m[1]) : 1;
  });
  const plan = gridPlan(spans);
  const total = plan.spans.reduce((a, b) => a + b, 0);
  const smTotal = plan.smSpans.reduce((a, b) => a + b, 0);
  // Both breakpoints matter: the grid is two columns from `sm` and three from
  // `lg`, and an odd card count orphans the last tile at two columns even when
  // three columns tile perfectly.
  const deadLg = total % plan.cols === 0 ? 0 : plan.cols - (total % plan.cols);
  const deadSm = smTotal % 2 === 0 ? 0 : 1;
  const dead = deadLg + deadSm;

  const noThumb = cardLines.filter((l) => !/thumb:\s*"/.test(l)).length;
  rows.push({
    file,
    cards: cardLines.length,
    cols: plan.cols,
    spans: plan.spans.join(","),
    dead,
    noThumb,
  });
  if (dead > 0) failures += 1;
}

const w = Math.max(...rows.map((r) => r.file.length));
for (const r of rows) {
  const flag = r.dead > 0 ? " <-- DEAD CELLS" : "";
  const thumbs = r.noThumb > 0 ? `  ${r.noThumb} card(s) without thumb` : "";
  console.log(
    `${r.file.padEnd(w)}  ${String(r.cards).padStart(2)} cards  ${r.cols} cols  spans[${r.spans}]${thumbs}${flag}`,
  );
}

console.log(
  failures === 0
    ? `\nOK - ${rows.length} hub grids, no empty cells`
    : `\nFAIL - ${failures} of ${rows.length} hub grids leave an empty cell`,
);
process.exit(failures === 0 ? 0 : 1);
