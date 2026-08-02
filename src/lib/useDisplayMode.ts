"use client";

import { useEffect, useState } from "react";

export type DisplayMode = "cinematic" | "static";

/**
 * Two gates, both necessary.
 *
 * Width alone is not enough. The frames are 1.78-1.94:1 and the canvas covers
 * the viewport, so on a portrait or near-square screen the cover-crop keeps only
 * a narrow vertical slice of each frame and blows it up. An iPad held upright is
 * wide enough to pass a width test while being exactly the shape that destroys
 * the composition, so the aspect gate is what actually protects it.
 *
 * 5/4 rather than 4/3 so genuine 1280x1024 desktop monitors still qualify.
 *
 * Failing either gate means the static treatment: full-bleed poster and ordinary
 * scroll reveals. That is the intended experience on those devices rather than a
 * downgrade, and it means phones and upright tablets never download a frame
 * sequence they were never going to scrub.
 */
const QUERY =
  "(min-width: 1024px) and (min-aspect-ratio: 5/4) and (prefers-reduced-motion: no-preference)";

/**
 * Resolves to "static" until measured, so the server render and the first client
 * paint agree and no frame fetching starts on devices that will never scrub.
 */
export function useDisplayMode(): { mode: DisplayMode; resolved: boolean } {
  const [state, setState] = useState<{ mode: DisplayMode; resolved: boolean }>({
    mode: "static",
    resolved: false,
  });

  useEffect(() => {
    const mq = window.matchMedia(QUERY);
    const apply = () =>
      setState({ mode: mq.matches ? "cinematic" : "static", resolved: true });
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  return state;
}
