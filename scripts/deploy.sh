#!/usr/bin/env bash
# Build and publish the homepage to https://dietz.trayaam.com
#
# The site is a static export served straight off disk by nginx — there is no
# app server to restart, so a deploy is just "build, then swap the files".
#
# NEXT_EXPORT and NEXT_DIST_DIR are both required: export mode is opt-in so that
# `next dev` keeps working normally, and the separate dist dir means building
# here never disturbs a dev server running out of .next.
#
# Note that with a custom distDir, Next writes the exported site into that
# directory itself rather than into ./out.

set -euo pipefail

HOST=dietz.trayaam.com
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DIST="$ROOT/.next-prod"
WEBROOT="/var/www/$HOST"

cd "$ROOT"

echo "==> building static export"
NEXT_EXPORT=1 NEXT_DIST_DIR=.next-prod npx next build

if [[ ! -f "$DIST/index.html" ]]; then
  echo "build produced no index.html in $DIST — aborting before touching the live site" >&2
  exit 1
fi

frames=$(find "$DIST/frames" -name '*.webp' 2>/dev/null | wc -l)
if (( frames < 500 )); then
  echo "only $frames frames in the export (expected ~595) — aborting" >&2
  exit 1
fi

echo "==> publishing to $WEBROOT ($(du -sm "$DIST" | cut -f1)MB, $frames frames)"
sudo rsync -a --delete "$DIST/" "$WEBROOT/"
sudo chown -R www-data:www-data "$WEBROOT"

echo "==> done: https://$HOST"
