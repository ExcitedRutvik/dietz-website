"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { frameUrl } from "@/lib/videoManifest";
import {
  poke,
  register,
  unregister,
  type FrameProducer,
} from "./frameFetchScheduler";

const DECODE_CONCURRENCY = 3;

// Blob window around the playhead. Blobs are compressed and cheap to hold, but
// "cheap" is not "free": at 47-177KB a frame, retaining all five sections meant
// ~67MB resident for the lifetime of the page. Holding a window instead costs
// 6-23MB for the section actually being read and near zero for the rest.
const BLOB_BACK = 40;
const BLOB_AHEAD = 90;
// Hysteresis, so drifting across the boundary does not re-fetch the same frames.
const BLOB_EVICT_SLACK = 40;

// A permanent coarse skeleton: every 16th frame, fetched at idle priority and
// never evicted. ~52 frames / ~4MB across all five sections, and it is what
// makes a *jump* — an anchor link, a restored scroll position, a fast flick —
// land on real footage. The decode window is -16/+24, so a stride of 16
// guarantees at least one spine frame is always inside it, wherever the
// playhead lands. A decoded spine would be unaffordable (5.3MB per bitmap); a
// blob spine is not.
const SPINE_STRIDE = 16;

// Any `ensure()` this recently means the reader is scrubbing this section.
const ACTIVE_WINDOW_MS = 1200;

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
  const pendingFetch = useRef(new Set<number>());
  const lastEnsureAt = useRef(0);
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
    const n = frameCount;

    /** Nearest wanted frame in `[lo, hi]`, forward-biased, or -1. */
    const nearestMissing = (lo: number, hi: number, c: number) => {
      let best = -1;
      let bestD = Infinity;
      for (let i = lo; i <= hi; i += 1) {
        if (blobs.current[i] || pendingFetch.current.has(i)) continue;
        // Reading forward is the common case, but reverse must not be excluded
        // outright — an all-forward window makes scrolling back up permanently
        // miss, which is the worst thing this can do.
        const d = i >= c ? i - c : (c - i) * 1.6;
        if (d < bestD) {
          bestD = d;
          best = i;
        }
      }
      return best;
    };

    const producer: FrameProducer = {
      id: framePrefix,
      priority() {
        const idle =
          performance.now() - lastEnsureAt.current > ACTIVE_WINDOW_MS;
        if (!idle) return 0;
        // Window work while merely approaching still beats spine backfill.
        const c = centre.current;
        const lo = Math.max(0, c - BLOB_BACK);
        const hi = Math.min(n - 1, c + BLOB_AHEAD);
        return nearestMissing(lo, hi, c) >= 0 ? 1 : 2;
      },
      next() {
        const c = centre.current;
        const lo = Math.max(0, c - BLOB_BACK);
        const hi = Math.min(n - 1, c + BLOB_AHEAD);

        const inWindow = nearestMissing(lo, hi, c);
        if (inWindow >= 0) {
          pendingFetch.current.add(inWindow);
          return { index: inWindow, url: frameUrl(framePrefix, inWindow) };
        }

        // Window satisfied — backfill the spine, nearest to the playhead first.
        let best = -1;
        let bestD = Infinity;
        for (let i = 0; i < n; i += SPINE_STRIDE) {
          if (blobs.current[i] || pendingFetch.current.has(i)) continue;
          const d = Math.abs(i - c);
          if (d < bestD) {
            bestD = d;
            best = i;
          }
        }
        if (best >= 0) {
          pendingFetch.current.add(best);
          return { index: best, url: frameUrl(framePrefix, best) };
        }
        return null;
      },
      deliver(index, blob) {
        pendingFetch.current.delete(index);
        if (!blob) return;
        blobs.current[index] = blob;
        pumpRef.current();
      },
    };

    register(producer);

    // Captured now: refs may point elsewhere by the time cleanup runs.
    const live = bitmaps.current;
    const pending = inFlight.current;
    const pendingF = pendingFetch.current;
    return () => {
      unregister(producer);
      blobs.current = [];
      live.forEach((b) => b.close());
      live.clear();
      pending.clear();
      pendingF.clear();
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
      // Doubles as the "is this section being read right now" signal the fetch
      // scheduler ranks on, so it needs no props and causes no re-render.
      lastEnsureAt.current = performance.now();

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

      // Release blobs that have fallen out of the window. The spine is exempt:
      // it is the coarse skeleton that makes a jump land on something.
      const bLo = Math.max(0, index - BLOB_BACK - BLOB_EVICT_SLACK);
      const bHi = Math.min(
        countRef.current - 1,
        index + BLOB_AHEAD + BLOB_EVICT_SLACK,
      );
      for (let i = 0; i < blobs.current.length; i += 1) {
        if (i % SPINE_STRIDE === 0) continue;
        if (i < bLo || i > bHi) blobs.current[i] = null;
      }

      for (let n = 0; n < DECODE_CONCURRENCY; n += 1) pump();
      poke();
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
