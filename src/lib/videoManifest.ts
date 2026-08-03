export type SectionId =
  | "hero"
  | "products"
  | "services"
  | "sustainability"
  | "company";

export interface FrameSequence {
  framePrefix: string;
  frameCount: number;
  posterSrc: string;
}

/**
 * Pixel width of every extracted frame on disk (scripts/video/03-optimize-frames.py
 * normalises all sections to this).
 *
 * The canvas needs it: a backing store wider than the source is upscaling, and
 * upscaling cannot invent detail — it only costs raster time. At a 1920px
 * viewport with dpr 2 the canvas was 3840px against a 1600px source, so every
 * painted frame rasterised 7.6M pixels to show 1600px of real information.
 */
export const FRAME_SOURCE_WIDTH = 1600;

// Counts must match what scripts/video/02-extract-section-frames.sh produced.
// Re-run that script and update these together — a count higher than the files
// on disk leaves the scrub resolving to the nearest neighbour near the end of a
// section, which reads as the footage freezing rather than as an error.
export const videoManifest: Record<SectionId, FrameSequence> = {
  // The 2024 drone header, 9.70-13.02s. Picked over the wider campus pull-back
  // because this is the only sustained run where the brand is actually legible:
  // the DIETZ wordmark large on the facade, the red spring sculpture in the
  // foreground, and the second sign on the left building. It sits inside the
  // cuts at 9.64 and 13.08, so it is a single unbroken take, and it is sampled
  // at the source's full 25fps — every native frame, no temporal loss at all.
  hero: {
    framePrefix: "/frames/hero/frame_",
    frameCount: 83,
    posterSrc: "/images/posters/hero-poster.jpg",
  },
  products: {
    framePrefix: "/frames/products/frame_",
    frameCount: 291,
    posterSrc: "/images/posters/products-poster.jpg",
  },
  services: {
    framePrefix: "/frames/services/frame_",
    frameCount: 230,
    posterSrc: "/images/posters/services-poster.jpg",
  },
  // Taken from the drone clip, not the film. The film's 56-60s aerial is
  // locked off — nothing moves in it but traffic on the road — so scrubbing it
  // looked like a frozen frame. This is a continuous pull-back over the campus
  // and the PV roofs, which suits the section and actually moves.
  sustainability: {
    framePrefix: "/frames/sustainability/frame_",
    frameCount: 100,
    posterSrc: "/images/posters/sustainability-poster.jpg",
  },
  company: {
    framePrefix: "/frames/company/frame_",
    frameCount: 120,
    posterSrc: "/images/posters/company-poster.jpg",
  },
};

export function frameUrl(prefix: string, index: number) {
  return `${prefix}${String(index + 1).padStart(4, "0")}.webp`;
}
