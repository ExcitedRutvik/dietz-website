# Dietz GmbH — website rebuild

Next.js rebuild of dietz.eu. Currently: the English homepage, designed as a
scroll-driven film.

```bash
npm run dev     # http://localhost:3000
npm run build && npm start
```

## Layout

- `reference/` — verified scrape of the live site (429 pages, images, nav/footer,
  design notes). Content source of truth; not part of the build.
- `src/content/homepage.en.ts` — homepage copy, transcribed verbatim from
  `reference/pages/en/index.md`. This was the approved wording; as of
  2026-07-30 a keyword-optimized rewrite of page copy is explicitly sanctioned
  (see `reference/seo/audit-2026-07-30.md`, finding E), so "don't paraphrase"
  no longer holds. Body copy has not been rewritten yet — only metadata.
- `reference/seo/` — keyword map, hand-written metadata for the 34 commercial
  pages, and the SEO audit. `seo.title`/`seo.description` across all 576 pages
  were generated from these; edit the source files there, not page-by-page.
- `src/components/scroll/` — the scroll-video machinery.
- `scripts/video/` — frame extraction from the company film.
- `public/frames/<section>/` — extracted WebP frame sequences (~26 MB total).

## How the scroll video works

Each section pins to the viewport and scrubs an image sequence on a `<canvas>`
as you scroll, rather than seeking a `<video>` element. Video codecs decode
forward, so `currentTime` scrubbing stutters badly when the reader scrolls *up*;
drawing pre-decoded stills does not.

Frames come from the company film
(`https://www.dietz.eu/wp-content/uploads/2023/12/DIETZ-firmenvideo.mp4`, 380 MB,
not committed). It's an interview-led documentary, so usable B-roll ranges are
narrow — `scripts/video/shot-list.json` records each chosen range, why it starts
and ends where it does, and which interview cuts bound it. To re-extract:

```bash
./scripts/video/extract-frames.sh /path/to/DIETZ-firmenvideo.mp4
```

Then update `frameCount` in `src/lib/videoManifest.ts` if any count changed.

Two details worth knowing before touching the pipeline:

- The film is 2.33:1 content letterboxed inside 1080p. The `crop=1920:824:0:128`
  filter removes the bars — without it they're baked into every frame.
- Frames are 1600px wide because the canvas cover-crop discards ~30% of the width
  (2.33:1 source into a ~1.6:1 viewport) and then upscales what's left.

## Degradation

Below 1024px, or under `prefers-reduced-motion: reduce`, sections render a static
poster with normally-flowing copy — no canvas, no pinning, and **no frame
sequences are fetched at all**. That branch is decided in JS before any request,
so phones never pay for the frames. Lenis doesn't instantiate under reduced
motion either.

All copy lives in ordinary DOM text and is server-rendered in both modes; the
canvas is `aria-hidden` decoration.

## Still to do

- German homepage (`reference/pages/de/index.md`), plus the FR/ES/CS locales the
  language switcher points at.
- Every route linked from the header and footer is currently a dead href.
- News and "Termine & Messen" sections — these exist only on the German homepage.
- `reference/design-notes.md` lists content bugs found on the live site worth
  fixing rather than reproducing (untranslated EN contact form, a duplicated
  paragraph, 8 dead product images, an unpaginated 120-post blog archive).
