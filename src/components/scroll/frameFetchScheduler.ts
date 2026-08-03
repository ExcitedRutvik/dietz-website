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
