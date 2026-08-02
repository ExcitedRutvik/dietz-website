"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Scrubs an all-intra video and hands the canvas something to draw.
 *
 * Deliberately exposes the same shape as `useFrameSequence` (`resolve`,
 * `ensure`, `ready`) so the paint loop, the cover-crop and the poster fallback
 * in ScrollVideoSection carry over untouched. The two are interchangeable per
 * section, which is what lets this be adopted one section at a time.
 *
 * Why this can work at all: the encode sets `-g 1`, so every frame is a
 * keyframe and a `currentTime` seek lands on the frame asked for without
 * decoding back to a previous one. With a normal GOP the same code would
 * stutter, because seeks would snap to keyframes seconds apart.
 *
 * What it does NOT do is the frame-sequence hook's cross-fade. A video decoder
 * holds one presented frame, not two, so there is no B frame to blend toward.
 * That is acceptable here because the sections worth converting are sampled
 * densely enough that the step between frames is already below the blend's
 * threshold; on a sparsely sampled section it would show, and that section
 * should stay on frames.
 */
export function useVideoScrub(src: string, frameCount: number, active: boolean) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [ready, setReady] = useState(false);
  const wantRef = useRef(0);
  const seekingRef = useRef(false);
  const pendingRef = useRef<number | null>(null);

  useEffect(() => {
    if (!active) return;
    const v = document.createElement("video");
    v.src = src;
    v.preload = "auto";
    v.muted = true;
    v.playsInline = true;
    // Never plays. It exists to be seeked, and letting it autoplay would fight
    // the scrub for control of currentTime.
    v.pause();
    videoRef.current = v;

    const onReady = () => setReady(true);
    // `loadeddata` fires once one frame is decodable, which is all a scrub
    // needs; waiting for canplaythrough holds the poster up for no reason.
    v.addEventListener("loadeddata", onReady);

    // A seek issued while one is in flight is dropped by the browser, so the
    // last requested position is held and re-issued when the current one lands.
    // Without this a fast scrub ends on a stale frame.
    const onSeeked = () => {
      seekingRef.current = false;
      const queued = pendingRef.current;
      pendingRef.current = null;
      if (queued !== null) seek(queued);
    };
    v.addEventListener("seeked", onSeeked);

    v.load();
    return () => {
      v.removeEventListener("loadeddata", onReady);
      v.removeEventListener("seeked", onSeeked);
      v.removeAttribute("src");
      v.load();
      videoRef.current = null;
      setReady(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src, active]);

  const seek = useCallback(
    (index: number) => {
      const v = videoRef.current;
      if (!v || !Number.isFinite(v.duration) || v.duration <= 0) return;
      const i = Math.max(0, Math.min(frameCount - 1, index));
      // Aim at the middle of the frame's window rather than its edge, so
      // rounding never lands the seek on the neighbouring frame.
      const t = ((i + 0.5) / frameCount) * v.duration;
      if (Math.abs(v.currentTime - t) < v.duration / frameCount / 2) return;
      if (seekingRef.current) {
        pendingRef.current = i;
        return;
      }
      seekingRef.current = true;
      v.currentTime = t;
    },
    [frameCount],
  );

  /** The element itself is the drawable; canvas `drawImage` accepts it.
   *  Read-only on purpose: no seeking here. */
  const resolve = useCallback((): CanvasImageSource | null => {
    const v = videoRef.current;
    return v && v.readyState >= 2 ? v : null;
  }, []);

  const ensure = useCallback(
    (index: number) => {
      if (index === wantRef.current) return;
      wantRef.current = index;
      seek(index);
    },
    [seek],
  );

  return { resolve, ensure, ready };
}
