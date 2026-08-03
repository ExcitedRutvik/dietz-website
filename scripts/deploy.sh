#!/usr/bin/env bash
# Deploys happen through GitHub, not from this machine.
#
# Cloudflare Pages is connected to the repository and builds on every push to
# `main`. So publishing is:
#
#     git push origin main
#
# and Pages runs the build itself.
#
# This script used to rsync a local static export to /var/www/dietz.trayaam.com
# on this box. That path is dead: nginx here is no longer what serves the site,
# so the rsync appeared to succeed while the live site kept serving whatever
# Pages had last built. It cost real debugging time — the origin returned 200
# for pages Cloudflare was 404ing, because they were two different origins — so
# the script now refuses rather than lying about what it did.
set -euo pipefail

cat >&2 <<'MSG'
scripts/deploy.sh no longer deploys anything.

The site is built by Cloudflare Pages from the GitHub repository. To publish:

    git push origin main

Then watch for the build, e.g.:

    until curl -sf -o /dev/null https://dietz.trayaam.com/; do sleep 20; done

To verify a build locally before pushing:

    NEXT_EXPORT=1 NEXT_DIST_DIR=.next-prod npx next build
MSG
exit 1
