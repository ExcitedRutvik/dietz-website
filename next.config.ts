import type { NextConfig } from "next";

// The site has no server-side rendering needs — no API routes, no request-time
// data — so production is a static export that nginx serves directly. That keeps
// the ~87MB of frame sequences on plain static file serving with long cache
// lifetimes, and leaves no Node process to keep alive.
//
// Export and the alternate dist dir are both opt-in via env so that running a
// production build never disturbs a `next dev` server working out of `.next`.
const nextConfig: NextConfig = {
  ...(process.env.NEXT_EXPORT ? { output: "export" as const } : {}),
  distDir: process.env.NEXT_DIST_DIR || ".next",
  // Required for export, and set unconditionally so dev renders images the same
  // way production does. Everything next/image touches here (logo, cert badges,
  // service thumbnails) is already sized for the slot it sits in.
  images: { unoptimized: true },
  // Browsers only fetch a .map file when DevTools is open, so this costs real
  // visitors nothing — but without it, every minified first-party chunk is a
  // dead end for anyone (Lighthouse included) trying to trace a forced reflow
  // or a runtime error back to a component.
  productionBrowserSourceMaps: true,
  // Every existing internal href (Header/Footer nav, in-content links) ends in
  // a trailing slash, matching the live WordPress site's URL convention.
  // Static export writes `slug/index.html` either way, but without this the
  // exported route for a bare `slug` (no trailing slash) won't match those
  // hrefs when nginx serves the files directly.
  trailingSlash: true,
  // The floating "N" badge (Route / Turbopack / Route Info / Preferences) is
  // Next's own dev overlay. It is injected by `next dev` only and has never
  // been in the exported build, so it was never going to ship — it is off here
  // purely so it stops sitting on top of the design during review.
  devIndicators: false,
};

export default nextConfig;
