const FADE = 0.08;

/**
 * Opacity for checkpoint `i` of `n` at a given 0..1 section progress.
 *
 * Steps fade out fully before the next fades in — a symmetric cross-dissolve
 * would put two paragraphs at half opacity on top of each other, which is
 * unreadable over video.
 */
export function stepOpacity(progress: number, i: number, n: number): number {
  if (n <= 1) return 1;

  const band = 1 / n;
  const local = (progress - i * band) / band;

  // The first and last steps hold at full opacity against the section edges, so
  // arriving at or leaving the section never lands on blank copy.
  if (i === 0 && local < FADE) return 1;
  if (i === n - 1 && local > 1 - FADE) return 1;

  if (local <= 0 || local >= 1) return 0;
  if (local < FADE) return local / FADE;
  if (local > 1 - FADE) return (1 - local) / FADE;
  return 1;
}

export function activeStep(progress: number, n: number): number {
  return Math.max(0, Math.min(n - 1, Math.floor(progress * n)));
}

/**
 * Vertical parallax offset, in px, for checkpoint `i` at a given progress.
 *
 * Copy travels steadily upward across its band — entering from below, leaving
 * upward — rather than reversing direction halfway. Driving the offset from
 * opacity instead (the obvious shortcut) makes text sink back down as it fades
 * out, which reads as a glitch rather than as depth.
 *
 * The amplitude is deliberately small. The footage underneath is already moving,
 * so the copy only has to travel differently from it to separate into its own
 * plane; anything larger competes with the video instead of sitting over it.
 */
export function stepDrift(
  progress: number,
  i: number,
  n: number,
  amplitude = 28,
): number {
  const local = n <= 1 ? progress : (progress - i * (1 / n)) * n;
  const clamped = Math.max(0, Math.min(1, local));
  return (0.5 - clamped) * 2 * amplitude;
}
