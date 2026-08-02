#!/usr/bin/env bash
# Encode the five scroll-video sections from the original masters.
#
# Replaces the WebP frame sequences. Two things make this worth doing:
#
#   1. The frames on disk went through a lossy intermediate before the q78
#      optimise pass, so they are a second-generation encode. These come
#      straight off the masters.
#   2. Measured on the products range, all-intra h264 at crf 22 scores SSIM
#      0.9837 in 14.97 MB against the shipped frames' 0.9801 in 16.39 MB.
#      Better picture, smaller file. (An earlier test suggested the opposite;
#      it was encoding from the already-compressed frames, which is why.)
#
# `-g 1` makes every frame a keyframe. That is what scroll scrubbing needs:
# `currentTime` seeks land exactly, with no decode back to the last keyframe.
# It costs roughly 35% over a normal GOP and is not optional here.
#
# TWO masters, not one. The shot-list claims all five come from the company
# film; that is stale. The three 1600x824 sections do, and take the film's
# letterbox crop. Hero and Sustainability are 1600x900 and come from the drone
# clip, which is full-frame 16:9 and is scaled rather than cropped. Ranges
# below were recovered by matching the shipped frames against both masters.
set -euo pipefail

FILM="${FILM:-/tmp/claude-1001/firmenvideo.mp4}"
DRONE="${DRONE:-/tmp/claude-1001/drone.mp4}"
OUT="${OUT:-public/video}"
CRF="${CRF:-22}"

# The film is 1080p letterboxed to 2.33:1: 128 lines of black off the top, then
# the middle 1600 of the 1920 width. No scaling at any stage - the canvas
# cover-crop discards width, so storing the full 1920 spends bytes on pixels
# that are never drawn.
CROP='crop=1600:824:160:128'
# The drone clip is full-frame 16:9 with no bars, so it scales instead.
SCALE='scale=1600:900:flags=lanczos'

mkdir -p "$OUT"

enc() {
  local name=$1 src=$2 start=$3 frames=$4 fps=$5 vf=$6
  # `-frames:v` rather than `-t`: duration arithmetic lands a frame short or a
  # frame long depending on rounding, and the count has to match the sequence
  # it replaces exactly or the scrub mapping drifts.
  ffmpeg -hide_banner -loglevel error -ss "$start" -i "$src" \
    -vf "${vf},fps=${fps}" -frames:v "$frames" \
    -c:v libx264 -crf "$CRF" -g 1 -pix_fmt yuv420p \
    -movflags +faststart -an -y "$OUT/${name}.mp4"
  local got
  got=$(ffprobe -v error -count_frames -show_entries stream=nb_read_frames \
        -of csv=p=0 "$OUT/${name}.mp4" | head -1)
  printf "  %-15s %3s frames (want %3s)  %6.2f MB\n" \
    "$name" "$got" "$frames" "$(echo "$(stat -c%s "$OUT/${name}.mp4")/1048576" | bc -l)"
}

#   name            master   start     frames fps  filter
enc hero            "$DRONE"    9.70     83   25  "$SCALE"
enc sustainability  "$DRONE"   15.56    100   16  "$SCALE"
enc products        "$FILM"   654.00    291   15  "$CROP"
enc services        "$FILM"   787.36    230    9  "$CROP"
enc company         "$FILM"    16.52    120   16  "$CROP"

printf "\n  total %.2f MB\n" "$(echo "$(du -cb "$OUT"/*.mp4 | tail -1 | cut -f1)/1048576" | bc -l)"
