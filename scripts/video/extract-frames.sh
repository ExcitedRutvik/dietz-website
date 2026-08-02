#!/usr/bin/env bash
# Regenerates public/frames/* and public/images/posters/* from the source film.
# Ranges and encode settings are documented in shot-list.json — keep the two in sync.
set -euo pipefail

VIDEO="${1:?usage: extract-frames.sh /path/to/DIETZ-firmenvideo.mp4}"
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
FRAMES="$ROOT/public/frames"
POSTERS="$ROOT/public/images/posters"

# The film is 2.33:1 content letterboxed inside a 1920x1080 container; without
# this crop the bars would be baked into every frame. Verified with cropdetect
# at five points across the runtime — constant throughout.
CROP="crop=1920:824:0:128"

# name start end fps quality
SHOTS=(
  "hero 40.4 54.9 9 60"
  "products 654.0 673.4 7.5 62"
  "services 787.3 812.8 5.5 62"
  "sustainability 56.2 59.8 14 58"
  "company 16.5 24.0 10 42"
)

for shot in "${SHOTS[@]}"; do
  read -r name start end fps quality <<< "$shot"
  mkdir -p "$FRAMES/$name" "$POSTERS"
  rm -f "$FRAMES/$name"/*.webp

  ffmpeg -y -v error -ss "$start" -to "$end" -i "$VIDEO" \
    -vf "fps=$fps,$CROP,scale=1600:-2:flags=lanczos" \
    -c:v libwebp -quality "$quality" -compression_level 6 \
    "$FRAMES/$name/frame_%04d.webp"

  mid=$(awk -v a="$start" -v b="$end" 'BEGIN{printf "%.2f",(a+b)/2}')
  ffmpeg -y -v error -ss "$mid" -i "$VIDEO" -frames:v 1 \
    -vf "$CROP,scale=1920:-2:flags=lanczos" -q:v 3 "$POSTERS/$name-poster.jpg"

  echo "$name: $(find "$FRAMES/$name" -name '*.webp' | wc -l) frames"
done

echo "Update frameCount in src/lib/videoManifest.ts if any count changed."
