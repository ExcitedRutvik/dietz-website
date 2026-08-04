/**
 * One fetch budget for every frame sequence on the page.
 *
 * Each `useFrameSequence` used to own its own pool of 8 fetch workers and queue
 * *every* frame in its section. The homepage runs five sequences, so once the
 * reader had passed them all, 824 requests and ~67MB were in flight or retained
 * — and the blobs were never released. Anything the document itself wanted
 * afterwards queued behind that. The visible symptom was the certification
 * marks at the foot of the homepage taking seconds to appear despite being
 * 8 files totalling 64KB: they were not slow, they were starved.
 *
 * The fix is to take the fetching away from the sections and give it to one
 * scheduler with a fixed budget, which asks each producer what it wants *now*.
 * `next()` being a function rather than a queue is the whole trick: when the
 * playhead moves, the answer changes on its own, so a bounded window that
 * follows the reader falls out with no cancellation logic anywhere.
 */

// Six is roughly what a browser would concede to one origin on HTTP/1.1 in any
// case, and on h2 it leaves the document's own lazy images room to land.
const MAX_INFLIGHT = 6;
// Never let the section being scrubbed hold every slot. Without this, entering
// a new section means starting it cold, because the one you are leaving is
// still saturating the budget.
const RESERVED = 1;

/**
 * Nothing is fetched until the reader actually moves.
 *
 * The budget above bounds *concurrency*, not *when*. The hero registers as soon
 * as it mounts and its window starts at frame 0, so a page that was never
 * scrolled still pulled its whole leading window: a Lighthouse run, which never
 * scrolls, measured 83 frames / 7.31MB against 30 requests / 1.29MB for the
 * entire rest of the document. Frames were ~85% of the page's weight and every
 * byte of it landed before the reader had asked for a single one — starving the
 * hero's own `<h1>` (the LCP element) of bandwidth in the process.
 *
 * Deferring costs nothing visually: `ScrollVideoSection` paints its poster on
 * the canvas until the first real frame decodes, so a still-unscrolled hero
 * looks exactly the same either way. On first movement the gate opens, `ensure()`
 * marks the section priority 0, and the window fills at high priority from
 * frame 0 — which is precisely where a reader entering a pinned hero needs it.
 *
 * Deliberately *not* opened on a timer or `requestIdleCallback`: either would
 * hand the bytes back to any measurement that waits for the network to settle,
 * which is the whole thing being fixed. A reader who never scrolls never needs
 * a frame.
 */
let unlocked = false;
let armed = false;

// `wheel`/`touchstart`/`keydown` are belt-and-braces: Lenis virtualises window
// scroll so native `scroll` does fire, but these precede it by a frame or two
// and cost nothing to listen for.
const UNLOCK_EVENTS = [
  "scroll",
  "wheel",
  "touchstart",
  "pointerdown",
  "keydown",
] as const;

let unlockListeners: AbortController | null = null;

function unlock() {
  if (unlocked) return;
  unlocked = true;
  unlockListeners?.abort();
  unlockListeners = null;
  pump();
}

/** Idempotent, and safe to reach during SSR (where it simply does nothing). */
function arm() {
  if (armed || typeof window === "undefined") return;
  armed = true;

  // Restored scroll position, an anchor link, or a browser that reloaded
  // mid-page: the reader is already past the top, so there is nothing to wait
  // for. Checked once here rather than relying on a `scroll` event that may
  // never fire.
  if (window.scrollY > 0) {
    unlocked = true;
    return;
  }

  unlockListeners = new AbortController();
  for (const type of UNLOCK_EVENTS) {
    window.addEventListener(type, unlock, {
      passive: true,
      signal: unlockListeners.signal,
    });
  }
}

export interface FrameProducer {
  id: string;
  /** 0 = being scrubbed right now, 1 = approaching, 2 = idle backfill. */
  priority(): number;
  /** The frame this producer most wants next, or null if it wants nothing. */
  next(): { index: number; url: string } | null;
  deliver(index: number, blob: Blob | null): void;
}

const producers = new Set<FrameProducer>();
let inflight = 0;

export function register(p: FrameProducer) {
  producers.add(p);
  arm();
  pump();
}

export function unregister(p: FrameProducer) {
  producers.delete(p);
}

/** Called by a producer whenever its want-set may have changed. */
export function poke() {
  pump();
}

function pump() {
  if (!unlocked) return;
  while (inflight < MAX_INFLIGHT) {
    // Recomputed each pass: priorities are time-dependent, so a ranking taken
    // once at the top of the loop would already be stale by the second slot.
    const ranked = [...producers].sort((a, b) => a.priority() - b.priority());

    // Once we are down to the last reserved slot, only a section actually being
    // scrubbed may take it.
    const maxPriority = inflight >= MAX_INFLIGHT - RESERVED ? 0 : 2;

    let picked: FrameProducer | null = null;
    let job: { index: number; url: string } | null = null;
    for (const p of ranked) {
      if (p.priority() > maxPriority) continue;
      const candidate = p.next();
      if (candidate) {
        picked = p;
        job = candidate;
        break;
      }
    }
    if (!picked || !job) return;

    const { index, url } = job;
    const target = picked;
    inflight += 1;
    fetch(url, {
      // `priority` is a recent RequestInit field; harmless where unsupported.
      priority: target.priority() === 0 ? "high" : "low",
    } as RequestInit)
      .then((r) => (r.ok ? r.blob() : null))
      .catch(() => null)
      .then((blob) => {
        // A dropped frame degrades to its neighbour; not worth failing over.
        target.deliver(index, blob);
      })
      .finally(() => {
        inflight -= 1;
        pump();
      });
  }
}
