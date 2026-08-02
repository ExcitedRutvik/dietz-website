"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useDisplayMode } from "@/lib/useDisplayMode";

gsap.registerPlugin(ScrollTrigger);

/**
 * Page-level read position.
 *
 * Worth having here specifically because the pinned sections break the usual
 * cue: the scrollbar barely moves while a section is pinned, so without this
 * there is no signal that scrolling is doing anything during the long
 * checkpoint runs.
 *
 * Driven straight off ScrollTrigger rather than a scroll listener so it shares
 * the Lenis-synced tick — a separate listener would settle a frame late and
 * visibly lag the footage.
 */
export default function ScrollProgress() {
  const barRef = useRef<HTMLDivElement>(null);
  const { resolved } = useDisplayMode();

  useEffect(() => {
    if (!resolved) return;
    const bar = barRef.current;
    if (!bar) return;

    const st = ScrollTrigger.create({
      start: 0,
      end: () =>
        Math.max(1, document.documentElement.scrollHeight - window.innerHeight),
      onUpdate: (self) => {
        bar.style.transform = `scaleX(${self.progress})`;
      },
    });

    return () => st.kill();
  }, [resolved]);

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-[3px]"
    >
      <div
        ref={barRef}
        className="h-full origin-left scale-x-0 bg-[#e3051b]"
        style={{ willChange: "transform" }}
      />
    </div>
  );
}
