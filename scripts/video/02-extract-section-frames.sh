#!/usr/bin/env bash
# Extracts one WebP frame sequence per homepage section from the company film.
#
# Two things about the crop are deliberate and easy to get wrong if this is
# re-run with different numbers:
#
#   crop=1600:824:160:128
#
#   * 824 is the full height of the actual image. The film is 2.33:1 content
#     letterboxed inside a 1080p container, so 128px of black is trimmed off the
#     top. Vertical resolution is what governs sharpness on screen — the canvas
#     cover-crop uses the frame's full height and throws away width — so this
#     must never be downscaled.
#   * 1600 is a centre crop of the 1920 width, not a downscale. On a 16:10
#     viewport the cover-crop only ever draws the middle ~1318px, and on 16:9
#     ~1465px, so storing the full 1920 spends ~17% of every byte on pixels that
#     are never displayed. 1600 covers up to a 1.94:1 viewport with margin.
#
# Nothing is scaled at any point: these are native sensor pixels.
#
# Quality is not uniform. Dense, high-frequency shots (rooftop aerials, cluttered
# warehouse) cost 2-3x per frame at the same quality setting as the smooth,
# shallow-depth-of-field machinery shots, so the expensive sections are dialled
# back to keep the page within its payload budget. See shot-list.json.

set -euo pipefail

VIDEO="${1:-}"
if [[ -z "$VIDEO" || ! -f "$VIDEO" ]]; then
  echo "usage: $0 /path/to/DIETZ-firmenvideo.mp4" >&2
  exit 1
fi

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
STAGE="$ROOT/public/frames_new"
POSTERS="$ROOT/public/images/posters"
CROP="crop=1600:824:160:128"

rm -rf "$STAGE"
mkdir -p "$STAGE" "$POSTERS"

# The hero is 365-373s (6:05-6:13), chosen by the client. Note that it is not a
# single take: a cross-dissolve sits at roughly 368.5s, taking an aerial of the
# plant into an interior of someone walking out onto the warehouse floor. The
# scene-cut detector does not flag it because a dissolve changes gradually and
# never crosses the threshold a hard cut does. Scrubbing through it reads fine —
# it is a designed transition — but the second half is dark and back-lit, which
# is why the hero scrim is heavier than the other sections.
#
# Everything is extracted at native resolution again. Frame size used to be
# capped to protect scroll smoothness, but that is now handled properly by the
# bounded decode window in useFrameSequence: raster cost scales with canvas DPR
# rather than with source resolution, and decoding happens off the main thread,
# so extra source pixels cost bytes and little else.

# NOTE: the hero is NOT produced here. It comes from the 2024 drone header
# (dietz_webseite2024header_drohne_ultra_web.mp4), 9.70-13.02s at 25fps q92,
# extracted separately because it is a different source file and needs no crop.
#
# name  start  duration  fps   quality
# Frame rates are up substantially and quality is down a notch from 93. That is
# a deliberate reallocation, not a regression: these frames get upscaled ~2.2x on
# screen (the film holds only 824 lines), so past roughly q88 the extra bytes buy
# compression cleanliness the upscale hides, while extra frames buy motion the
# eye reads immediately. Bytes moved from quantisation to temporal density.
#
# Sustainability is no longer taken from here at all: 56-60s is a locked-off
# aerial where nothing moves but traffic, which read as a frozen frame. It now
# comes from the drone clip, which actually pans.
SHOTS=(
  "products       654.0   19.4   15    88"
  "services       787.3   25.5    9    88"
  "company         16.5    7.5   16    88"
)

for row in "${SHOTS[@]}"; do
  read -r name start dur fps quality <<<"$row"
  src="$VIDEO"
  filter="$CROP,fps=$fps"
  posterfilter="$CROP"
  out="$STAGE/$name"
  mkdir -p "$out"

  ffmpeg -v error -ss "$start" -i "$src" -t "$dur" \
    -vf "$filter" \
    -c:v libwebp -quality "$quality" -compression_level 6 -preset photo \
    "$out/frame_%04d.webp"

  # Poster doubles as the reduced-motion/mobile still and the LCP paint.
  ffmpeg -v error -ss "$start" -i "$src" -frames:v 1 \
    -vf "$posterfilter" -q:v 3 -y "$POSTERS/$name-poster.jpg"

  count=$(find "$out" -name '*.webp' | wc -l)
  size=$(du -sm "$out" | cut -f1)
  printf '%-16s %4d frames  %4d MB  (q%s @ %sfps)\n' "$name" "$count" "$size" "$quality" "$fps"
done

echo "---"
echo "total: $(du -sm "$STAGE" | cut -f1) MB staged in $STAGE"
