"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { frameUrl } from "@/lib/videoManifest";

const FETCH_CONCURRENCY = 8;
const DECODE_CONCURRENCY = 3;

// Asymmetric on purpose. Reading forward is the common case, but scrolling back
// up must not fall off a cliff — an all-forward window makes reverse scrolling
// permanently miss, which is the single worst thing this can do.
const WINDOW_BACK = 16;
const WINDOW_AHEAD = 24;
// Hysteresis, so drifting back and forth across the boundary does not thrash
// decode/close on the same few frames.
const EVICT_SLACK = 10;
// Bounded so a miss costs a short scan rather than walking the whole sequence.
const NEAREST_RADIUS = 60;

/**
 * Streams a section's frames and keeps a *bounded* set of them decoded.
 *
 * The distinction matters more than it looks. Holding every frame as a decoded
 * bitmap is what makes long sequences stutter: at ~4MB decoded per frame, a few
 * hundred frames is well past what a browser will keep, so it silently discards
 * them and re-decodes on demand — synchronously, mid-scrub. Eagerly decoding
 * everything up front (via `img.decode()` on load) trades that for one enormous
 * blocking burst instead, which is worse.
 *
 * So: fetch every frame as a compressed Blob, which is cheap to hold, and decode
 * only a window around the playhead. `createImageBitmap` decodes off the main
 * thread, and `close()` releases that memory deterministically rather than
 * leaving it to the browser's heuristics.
 */
export function useFrameSequence(
  framePrefix: string,
  frameCount: number,
  active: boolean,
) {
  const blobs = useRef<(Blob | null)[]>([]);
  const bitmaps = useRef(new Map<number, ImageBitmap>());
  const inFlight = useRef(new Set<number>());
  const centre = useRef(0);
  const decoding = useRef(0);
  const readyRef = useRef(false);
  const countRef = useRef(frameCount);
  // Mirrored into a ref via an effect rather than assigned during render, so the
  // stable callbacks below can read the current count without taking it as a
  // dependency — which would rebuild them, and the ScrollTriggers holding them.
  useEffect(() => {
    countRef.current = frameCount;
  }, [frameCount]);

  // `pump` reschedules itself after each decode completes. Routing that through
  // a ref keeps the self-reference legal without the callback depending on
  // itself, which would make its identity unstable.
  const pumpRef = useRef<() => void>(() => {});

  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!active) return;

    blobs.current = new Array(frameCount).fill(null);
    let cancelled = false;

    // Sparse pass first, so the whole range has *some* coverage almost at once
    // and an early scrub never lands on an empty canvas, then backfill.
    const queue: number[] = [];
    for (let i = 0; i < frameCount; i += 4) queue.push(i);
    for (let i = 0; i < frameCount; i += 1) if (i % 4) queue.push(i);

    const worker = async () => {
      while (!cancelled) {
        const i = queue.shift();
        if (i === undefined) return;
        try {
          const res = await fetch(frameUrl(framePrefix, i));
          if (!res.ok || cancelled) continue;
          blobs.current[i] = await res.blob();
        } catch {
          /* a dropped frame degrades to its neighbour; not worth failing over */
        }
      }
    };
    void Promise.all(
      Array.from({ length: Math.min(FETCH_CONCURRENCY, queue.length) }, worker),
    );

    // Captured now: refs may point elsewhere by the time cleanup runs.
    const live = bitmaps.current;
    const pending = inFlight.current;
    return () => {
      cancelled = true;
      live.forEach((b) => b.close());
      live.clear();
      pending.clear();
      decoding.current = 0;
    };
  }, [active, framePrefix, frameCount]);

  /** Decode the not-yet-decoded frame nearest the playhead. */
  const pump = useCallback(() => {
    if (decoding.current >= DECODE_CONCURRENCY) return;

    const c = centre.current;
    const lo = Math.max(0, c - WINDOW_BACK);
    const hi = Math.min(countRef.current - 1, c + WINDOW_AHEAD);

    let target = -1;
    let best = Infinity;
    for (let i = lo; i <= hi; i += 1) {
      if (bitmaps.current.has(i) || inFlight.current.has(i)) continue;
      if (!blobs.current[i]) continue;
      const d = Math.abs(i - c);
      if (d < best) {
        best = d;
        target = i;
      }
    }
    if (target < 0) return;

    const blob = blobs.current[target];
    if (!blob) return;

    inFlight.current.add(target);
    decoding.current += 1;
    createImageBitmap(blob)
      .then((bmp) => {
        bitmaps.current.set(target, bmp);
        if (!readyRef.current) {
          readyRef.current = true;
          setReady(true);
        }
      })
      .catch(() => {})
      .finally(() => {
        inFlight.current.delete(target);
        decoding.current -= 1;
        pumpRef.current();
      });
  }, []);

  useEffect(() => {
    pumpRef.current = pump;
  }, [pump]);

  /**
   * Move the playhead: evict what has fallen outside the window and top the
   * decode queue back up. Called on every scrub update.
   */
  const ensure = useCallback(
    (index: number) => {
      centre.current = index;

      const lo = Math.max(0, index - WINDOW_BACK - EVICT_SLACK);
      const hi = Math.min(
        countRef.current - 1,
        index + WINDOW_AHEAD + EVICT_SLACK,
      );
      bitmaps.current.forEach((bmp, i) => {
        if (i < lo || i > hi) {
          bmp.close();
          bitmaps.current.delete(i);
        }
      });

      for (let n = 0; n < DECODE_CONCURRENCY; n += 1) pump();
    },
    [pump],
  );

  /** Nearest decoded frame, so a fast scrub degrades in detail, never to blank. */
  const resolve = useCallback((index: number): ImageBitmap | null => {
    const m = bitmaps.current;
    const exact = m.get(index);
    if (exact) return exact;
    for (let step = 1; step <= NEAREST_RADIUS; step += 1) {
      const before = m.get(index - step);
      if (before) return before;
      const after = m.get(index + step);
      if (after) return after;
    }
    return null;
  }, []);

  return { resolve, ensure, ready };
}
