"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { FRAME_SOURCE_WIDTH, type FrameSequence } from "@/lib/videoManifest";
import { useDisplayMode } from "@/lib/useDisplayMode";
import { useFrameSequence } from "./useFrameSequence";
import { stepOpacity, activeStep, stepDrift } from "./stepOpacity";
import ProgressDots from "./ProgressDots";

gsap.registerPlugin(ScrollTrigger);

export type Align = "left" | "right";

// How the footage is kept readable under the copy.
//
// Nothing. That is the point.
//
// This went through three rounds: full-bleed linear gradients at 0.94 stacked
// four deep, then lighter ones, then an ellipse pinned to the copy's corner.
// Every version traded the same two things against each other, because any
// shape large enough to sit behind a paragraph is also large enough to see.
//
// The legibility now lives entirely in the copy panel (`.cine-glass` in
// globals.css): a clear glass surface that carries the text on its own
// backdrop. The frame itself is never dimmed, so the sky, the facade and the
// machinery all render at full brightness outside the panel.
//
// What is left below is structural only:
//   - the edge blends, which hide the horizontal seam where two pinned
//     sections cut from one clip straight into another;
//   - a short band under the fixed header, which the nav needs because it
//     scrolls over every frame in the sequence rather than one known corner.
const EDGE_TOP = "pointer-events-none absolute inset-x-0 top-0 -z-10 h-[6vh] bg-gradient-to-b from-zinc-950 to-transparent";
const EDGE_BOTTOM = "pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-[8vh] bg-gradient-to-t from-zinc-950 to-transparent";

interface Props {
  id: string;
  sequence: FrameSequence;
  /** Persistent section heading — stays put while the checkpoints cross-fade. */
  heading?: React.ReactNode;
  steps: React.ReactNode[];
  /**
   * Optional visual per checkpoint, placed on the opposite side of the copy and
   * animated on the same progress. Feathered into the footage rather than boxed,
   * so it reads as part of the shot instead of a card pasted over it.
   */
  stepMedia?: React.ReactNode[];
  /** Hero only — everything else waits until the reader is near it. */
  eager?: boolean;
  /** Viewport heights of scroll distance per checkpoint. */
  vhPerStep?: number;
  /** Zero-based position on the page; drives ScrollTrigger refresh ordering. */
  order?: number;
  /**
   * Which side the copy sits on. Alternating this down the page is what stops
   * five pinned video sections from reading as the same slide five times.
   */
  align?: Align;
  /** Hero only. The panel hugs its content and centres on the frame instead of
   * anchoring to a side and filling a column, so no dead space opens up
   * between the copy and the CTA. */
  barLayout?: boolean;
  showDots?: boolean;
  className?: string;
}

export default function ScrollVideoSection({
  id,
  sequence,
  heading,
  steps,
  stepMedia,
  eager = false,
  vhPerStep = 110,
  order = 0,
  align = "left",
  barLayout = false,
  showDots = false,
  className = "",
}: Props) {
  const { mode, resolved } = useDisplayMode();
  const cinematic = resolved && mode === "cinematic";

  const sectionRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stepRefs = useRef<(HTMLDivElement | null)[]>([]);
  const progressRef = useRef(0);

  const [near, setNear] = useState(eager);
  const [current, setCurrent] = useState(0);
  const hasMedia = (stepMedia?.length ?? 0) > 0;

  // Both hooks are called unconditionally - hooks cannot be conditional - but
  // only one is ever activated, so the idle one allocates nothing and fetches
  // nothing. Which source a section uses is a manifest entry, not a code path.
  const frames = useFrameSequence(
    sequence.framePrefix,
    sequence.frameCount,
    cinematic && near,
  );
  const { resolve, ensure, ready } = frames;

  const repaintRef = useRef<() => void>(() => {});
  const posterRef = useRef<ImageBitmap | null>(null);
  // Whether the scrub has come to rest. Drives sharp-single-frame vs cross-fade.
  const settledRef = useRef(true);

  // Decoded once per section and kept: it is what the canvas shows before the
  // first real frame arrives, and whenever a fast scrub outruns the decoder.
  useEffect(() => {
    if (!cinematic || !near) return;
    let cancelled = false;
    // The poster is what the canvas shows until the first real frame decodes,
    // so on the first section it is effectively the LCP element and must not
    // queue behind frame traffic.
    fetch(sequence.posterSrc, {
      priority: order === 0 ? "high" : "low",
    } as RequestInit)
      .then((r) => r.blob())
      .then((b) => createImageBitmap(b))
      .then((bmp) => {
        if (cancelled) {
          bmp.close();
          return;
        }
        posterRef.current = bmp;
        repaintRef.current();
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [cinematic, near, sequence.posterSrc, order]);

  // Start fetching a section's frames roughly one viewport before it arrives.
  useEffect(() => {
    if (!cinematic || eager || near) return;
    const el = sectionRef.current;
    if (!el) return;

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setNear(true);
          io.disconnect();
        }
      },
      { rootMargin: "100% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [cinematic, eager, near]);

  useEffect(() => {
    if (!cinematic) return;
    const section = sectionRef.current;
    const canvas = canvasRef.current;
    if (!section || !canvas) return;

    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    // Canvas has no object-fit, so centre-crop to cover manually.
    // Takes any CanvasImageSource: an ImageBitmap from the frame sequence, or
    // the <video> element itself when the section scrubs a video. A video
    // reports its pixels as videoWidth/videoHeight rather than width/height,
    // which are its CSS box - reading the wrong pair silently mis-crops.
    const sourceSize = (img: CanvasImageSource) =>
      img instanceof HTMLVideoElement
        ? { w: img.videoWidth, h: img.videoHeight }
        : { w: Number((img as ImageBitmap).width), h: Number((img as ImageBitmap).height) };

    const drawCover = (img: CanvasImageSource, alpha: number) => {
      const { width: cw, height: ch } = canvas;
      const { w: iw, h: ih } = sourceSize(img);
      if (!iw || !ih) return;
      const imgRatio = iw / ih;
      const boxRatio = cw / ch;
      let sx = 0;
      let sy = 0;
      let sw = iw;
      let sh = ih;
      if (imgRatio > boxRatio) {
        sw = ih * boxRatio;
        sx = (iw - sw) / 2;
      } else {
        sh = iw / boxRatio;
        sy = (ih - sh) / 2;
      }
      ctx.globalAlpha = alpha;
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, cw, ch);
      ctx.globalAlpha = 1;
    };

    // Two different jobs, so two different draws.
    //
    // While scrolling, the frames are sampled below the 60fps repaint rate, so
    // the next frame is dissolved in over the fractional part to keep motion
    // continuous. That cross-fade is exactly wrong once the scroll stops: coming
    // to rest halfway between two samples leaves a permanent 50/50 dissolve of
    // two different frames on screen, which reads as a blurred, out-of-focus,
    // slightly "stuck" image. That is the single biggest cause of a scrubbed
    // sequence looking unfinished when it settles.
    //
    // So at rest we snap to the nearest single frame and draw it alone, with the
    // expensive resampling turned on. One sharp frame, no ghosting.
    const paint = () => {
      const { width: cw, height: ch } = canvas;
      if (!cw || !ch) return;

      const exact = progressRef.current * (sequence.frameCount - 1);
      const settled = settledRef.current;
      const base = settled ? Math.round(exact) : Math.floor(exact);
      const blend = settled ? 0 : exact - base;

      // "high" resampling is only worth its cost when downscaling, where it has
      // real source detail to average. These draws are an upscale (see resize),
      // so "high" spent a lot of main-thread time producing a result
      // indistinguishable from "medium" — it was a measurable chunk of the
      // long-task time during scrub.
      ctx.imageSmoothingQuality = "medium";

      const frameA = resolve(base);
      if (!frameA) {
        // Nothing decoded yet. The context is opaque, so without this the
        // section is solid black until the first bitmap lands — the poster is
        // one small request and covers that window.
        if (posterRef.current) drawCover(posterRef.current, 1);
        return;
      }
      drawCover(frameA, 1);

      if (blend > 0.01) {
        const frameB = resolve(base + 1);
        if (frameB && frameB !== frameA) drawCover(frameB, blend);
      }
    };

    const resize = () => {
      // Size the backing store against the *source*, not the display.
      //
      // Going to a full 2x dpr here looks like it buys sharpness, but the
      // frames are FRAME_SOURCE_WIDTH px wide: on a 1920px viewport that made
      // the canvas 3840px and upscaled 2.4x, rasterising 7.6M pixels per draw
      // to present 1600px of actual detail. Upscaling cannot invent detail, so
      // that cost bought nothing and showed up directly as scroll jank.
      //
      // A little oversampling past 1:1 still helps, because the cover-crop
      // throws away width and the remainder gets stretched — hence the headroom
      // factor rather than a hard 1:1 clamp.
      const OVERSAMPLE = 1.35;
      const maxWidth = FRAME_SOURCE_WIDTH * OVERSAMPLE;
      const deviceDpr = Math.min(window.devicePixelRatio || 1, 2);
      const cssWidth = canvas.clientWidth || 1;
      const dpr = Math.max(1, Math.min(deviceDpr, maxWidth / cssWidth));
      canvas.width = Math.round(cssWidth * dpr);
      canvas.height = Math.round(canvas.clientHeight * dpr);
      // Resizing a canvas resets its context, so smoothing is re-enabled here.
      // The quality level itself is chosen per draw, in paint().
      ctx.imageSmoothingEnabled = true;
      paint();
    };

    const applySteps = () => {
      const p = progressRef.current;
      stepRefs.current.forEach((el, i) => {
        if (!el) return;
        const o = stepOpacity(p, i, steps.length);
        el.style.opacity = String(o);
        // Parallax is on the copy only. Panning the canvas would need it scaled
        // past the viewport to hide its edges, and that extra upscale would eat
        // into the frame sharpness the encode works to preserve — the footage is
        // already moving, so the copy just has to travel differently from it.
        el.style.transform = `translateY(${stepDrift(p, i, steps.length)}px)`;
        el.style.pointerEvents = o > 0.9 ? "auto" : "none";
        // Promote only what is currently moving. Leaving will-change on every
        // checkpoint would hold a compositor layer per step for the whole
        // section, which costs more than it saves.
        el.style.willChange = o > 0 && o < 1 ? "transform, opacity" : "auto";
      });
    };

    repaintRef.current = paint;

    // ScrollTrigger can fire onUpdate more than once between two presented
    // frames, so painting straight from it does redundant full-canvas work.
    // Coalescing onto one rAF means at most one paint per displayed frame.
    let rafId = 0;
    const schedule = () => {
      if (rafId) return;
      rafId = requestAnimationFrame(() => {
        rafId = 0;
        paint();
        applySteps();
      });
    };

    const gsapCtx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: section,
        start: "top top",
        end: () =>
          `+=${Math.round(
            (steps.length * vhPerStep * (section.clientHeight || window.innerHeight)) / 100,
          )}`,
        pin: true,
        // Deliberately short. Scrub is a catch-up delay, so a large value here
        // stacks on top of Lenis's own easing and the footage visibly trails the
        // cursor — which reads as lag, not as weight.
        scrub: 0.4,
        anticipatePin: 1,
        // A fast flick can otherwise leave the scrub still easing toward a
        // section the reader has already left, so the next section starts out of
        // sync. This settles it immediately instead.
        fastScrollEnd: true,
        // Pin distance is computed from window.innerHeight, so it has to be
        // recomputed on refresh rather than cached from first measurement.
        invalidateOnRefresh: true,
        // Higher refreshes earlier, so page order is descending. GSAP sorts by
        // `refreshPriority * -1e6` ascending (see ScrollTrigger.sort), which puts
        // the largest value first — note this is the opposite of what the
        // installed GreenSock skill's table claims.
        refreshPriority: -order,
        onScrubComplete: () => {
          // Land on the exact frame, make sure it is decoded, then redraw it
          // sharp and un-blended. Restoring the pane blur here (rather than on
          // a timer) ties it to the same "motion has stopped" signal.
          settledRef.current = true;
          section.removeAttribute("data-scrubbing");
          ensure(Math.round(progressRef.current * (sequence.frameCount - 1)));
          schedule();
        },
        onUpdate: (self) => {
          progressRef.current = self.progress;
          if (settledRef.current) section.setAttribute("data-scrubbing", "1");
          settledRef.current = false;
          // Tell the decoder where the playhead is *before* painting, so the
          // frames about to be needed are already queued. The video path seeks
          // from here too, rather than from the paint loop, so it moves once
          // per scroll update instead of once per draw — one call serves both,
          // and calling it twice would be a double-seek on the video path.
          ensure(
            Math.round(self.progress * (sequence.frameCount - 1)),
          );
          schedule();
          if (showDots) setCurrent(activeStep(self.progress, steps.length));
        },
      });
    }, section);

    resize();
    applySteps();

    let timer: ReturnType<typeof setTimeout>;
    const onResize = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        resize();
        ScrollTrigger.refresh();
      }, 150);
    };
    window.addEventListener("resize", onResize);

    return () => {
      clearTimeout(timer);
      if (rafId) cancelAnimationFrame(rafId);
      window.removeEventListener("resize", onResize);
      gsapCtx.revert();
    };
  }, [
    cinematic,
    resolve,
    ensure,
    sequence.frameCount,
    steps.length,
    vhPerStep,
    order,
    showDots,
  ]);

  // Prime the decoder as soon as the section is live. `ensure` is otherwise only
  // driven by scrub updates, so a section that is activated but not yet scrolled
  // through — the one under the viewport on load, or any section entered by a
  // jump rather than a wheel — would sit with nothing decoded and paint nothing.
  useEffect(() => {
    if (!cinematic || !near) return;
    ensure(
      Math.round(progressRef.current * (sequence.frameCount - 1)),
    );
  }, [cinematic, near, ensure, sequence.frameCount]);

  // The pin is set up before any frame has decoded, so paint once the first lands.
  useEffect(() => {
    if (!cinematic || !ready) return;
    repaintRef.current();
    ScrollTrigger.refresh();
  }, [cinematic, ready]);

  if (!cinematic) {
    // Phones and upright tablets. Not a stripped-back version of the scrub: the
    // poster becomes a real establishing image at the top of the section, and
    // each checkpoint becomes its own block with the card it would have had on
    // desktop. Stretching one poster behind the whole stack, as this did before,
    // meant a 16:9 still covering a section several screens tall, so almost all
    // of it was cropped away.
    return (
      <>
        {/* Holds the cinematic section's height for the one paint between the
            fallback being hidden by CSS and the canvas mounting. Collapses to
            nothing on viewports that actually use the fallback, because the
            reservation lives inside the same media query. */}
        <div data-hero-slot aria-hidden />
        <section
          id={id}
          data-hero-fallback
          className={`relative isolate bg-zinc-950 ${className}`}
        >
        <div className="relative">
          {/* Only the first section's poster is above the fold. The other four
              were being fetched eagerly too — ~1MB of stills on a phone, none
              of it visible — because an <img> with no `loading` defaults to
              eager. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={sequence.posterSrc}
            alt=""
            aria-hidden="true"
            loading={order === 0 ? "eager" : "lazy"}
            fetchPriority={order === 0 ? "high" : "low"}
            decoding="async"
            className="h-[38svh] min-h-[13rem] w-full object-cover sm:h-[46svh]"
          />
          <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-zinc-950/85 via-zinc-950/35 to-transparent" />
          {heading && (
            <div className="cine-halo absolute inset-x-0 bottom-6 mx-auto max-w-6xl px-5 sm:px-6">
              {heading}
            </div>
          )}
        </div>

        <div className="mx-auto max-w-6xl px-5 pb-16 pt-10 sm:px-6 sm:pb-20 sm:pt-12">
          <div className="flex flex-col gap-14 sm:gap-16">
            {steps.map((step, i) => (
              <div key={i} className="flex flex-col gap-5">
                {stepMedia?.[i] && (
                  <div className="w-full max-w-sm">{stepMedia[i]}</div>
                )}
                {step}
              </div>
            ))}
          </div>
        </div>
        </section>
      </>
    );
  }

  return (
    <section
      ref={sectionRef}
      id={id}
      className={`relative isolate h-[100svh] ${className}`}
    >
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        role="presentation"
        className="absolute inset-0 -z-10 h-full w-full bg-neutral-950"
      />
      <div className="absolute inset-x-0 top-0 -z-10 h-[11vh] bg-gradient-to-b from-zinc-950/38 to-transparent" />
      <div className={EDGE_TOP} />
      <div className={EDGE_BOTTOM} />

      {/* The wide breakpoints only apply to the copy-only sections. When a
          media card shares the row, the container is capped at 6xl: both
          elements top out at their own max widths, so letting the container
          keep growing past that just pushes them apart — 688px of empty
          footage between them at 1920, which reads as two unrelated objects
          rather than a pair. */}
      <div
        className={`relative mx-auto h-full px-6 ${
          hasMedia
            ? "max-w-6xl"
            : "max-w-6xl 2xl:max-w-7xl min-[1920px]:max-w-[102rem]"
        }`}
      >
        {heading && (
          <div
            className={`cine-halo absolute top-[18vh] ${align === "right" ? "right-6 text-right" : "left-6"}`}
          >
            {heading}
          </div>
        )}
        {steps.map((step, i) => (
          <div
            key={i}
            ref={(el) => {
              stepRefs.current[i] = el;
            }}
            // Two widths, because the two layouts have different jobs. With no
            // media card the copy owns the row and gets 52rem — the hero
            // headline needs ~745px to break onto two lines, and 46rem left it
            // 9px short so it wrapped to three. With a card beside it the copy
            // takes 58% minus the gutter, which is what keeps the pair from
            // overlapping at any viewport width.
            //
            // `overflow-hidden` is gone: the hero's CTA straddles the panel's
            // bottom edge, and clipping cut it in half.
            className={
              barLayout
                ? "absolute bottom-[max(9vh,env(safe-area-inset-bottom))] left-1/2 w-max max-w-[calc(100%-3rem)] -translate-x-1/2"
                : hasMedia
                  ? // One wide panel spanning the column, copy and image inside it.
                    "absolute bottom-[max(12vh,env(safe-area-inset-bottom))] left-6 right-6"
                  : `absolute bottom-[max(14vh,env(safe-area-inset-bottom))] max-w-[min(52rem,calc(100%-3rem))] ${
                      align === "right" ? "right-6" : "left-6"
                    }`
            }
            style={{ opacity: i === 0 ? 1 : 0 }}
          >
            <div
              className={`cine-glass ${
                barLayout
                  ? "px-7 py-6 sm:px-11 sm:py-7"
                  : hasMedia
                    ? "flex flex-col gap-8 px-8 py-8 sm:px-12 sm:py-10 xl:flex-row xl:items-center xl:gap-14"
                    : "px-8 py-8 sm:px-12 sm:py-10"
              }`}
            >
              {hasMedia ? (
                <>
                  {/* `order` rather than two branches: the copy and the image
                      swap sides with `align`, and DOM order stays copy-first
                      so it is read first. */}
                  <div className={`min-w-0 flex-1 ${align === "right" ? "xl:order-2" : ""}`}>
                    {step}
                  </div>
                  <div
                    aria-hidden="true"
                    className={`w-full shrink-0 xl:w-[20rem] ${align === "right" ? "xl:order-1" : ""}`}
                  >
                    {stepMedia?.[i]}
                  </div>
                </>
              ) : (
                step
              )}
            </div>
          </div>
        ))}
      </div>

      {showDots && <ProgressDots count={steps.length} current={current} />}
    </section>
  );
}
