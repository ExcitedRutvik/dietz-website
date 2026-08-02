"use client";

import { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import { useDisplayMode } from "@/lib/useDisplayMode";

gsap.registerPlugin(ScrollTrigger);

if (process.env.NODE_ENV === "development" && typeof window !== "undefined") {
  (window as unknown as { ScrollTrigger: typeof ScrollTrigger }).ScrollTrigger =
    ScrollTrigger;
}

export default function SmoothScrollProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { mode, resolved } = useDisplayMode();

  useEffect(() => {
    if (!resolved || mode !== "cinematic") return;

    // Lenis virtualises window scroll, so ScrollTrigger's default scroller keeps
    // working and no scrollerProxy is needed.
    const lenis = new Lenis({
      // Kept modest on purpose. This easing composes with each section's scrub
      // catch-up, so the two smoothers multiply rather than add: a long glide
      // here plus a long scrub there is what made the footage trail the cursor
      // and read as lag. Smoothness comes from painting every frame on time,
      // not from easing the input harder.
      duration: 1.05,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      wheelMultiplier: 1,
      smoothWheel: true,
    });
    lenis.on("scroll", ScrollTrigger.update);

    const raf = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);

    // Late-loading fonts and images are the usual cause of mismeasured pins.
    void document.fonts?.ready.then(() => ScrollTrigger.refresh());

    return () => {
      gsap.ticker.remove(raf);
      lenis.destroy();
    };
  }, [mode, resolved]);

  return <>{children}</>;
}
