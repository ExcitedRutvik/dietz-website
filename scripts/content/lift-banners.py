#!/usr/bin/env python3
"""Move a page's banner image from the foot of the page to the top.

The migration appended each page's wide establishing shot after the body copy,
so an industry page ran heading, prose, prose, prose — and only then the
photograph, immediately before the gallery of parts. A banner read last is not a
banner; it is a loose image the reader has already scrolled past.

**Only banners move.** The rule is the shape of the image, because that is what
actually distinguishes the two cases on these pages:

  - A banner is panoramic — 1024x320, 1600x500, 1280x400, all about 3.2:1.
    It is scene-setting, and it belongs directly under the H1.
  - A portrait or product shot is not. The ten job-posting pages end with
    Andrea Dietz's photograph (773x640) as a contact sign-off, and several
    product pages end with the part itself (1400x1120). Both are correctly
    placed where they are, and hoisting them would be a regression.

Dimensions are read from the file on disk when the block does not record them,
so the decision is never guessed.

Idempotent: an image already leading the page is left alone.
"""
import glob
import os
import re
import sys

ROOT = "src/content/pages"
PUBLIC = "public"

# Width/height ratio at or above which an image is treated as a banner. The
# real population is bimodal — banners cluster at ~3.2, everything else at
# ~1.25 — so anything in between is unambiguous either way.
BANNER_RATIO = 2.5

IMAGE_BLOCK = re.compile(r'^    \{ kind: "image", src: "([^"]+)".*?\},?\n', re.M)


def dims(src, block):
    m = re.search(r"width: (\d+), height: (\d+)", block)
    if m:
        return int(m.group(1)), int(m.group(2))
    try:
        from PIL import Image

        with Image.open(os.path.join(PUBLIC, src.lstrip("/"))) as im:
            return im.size
    except Exception:
        return None


def main():
    moved = []
    skipped = []

    for f in sorted(glob.glob(f"{ROOT}/**/*.ts", recursive=True)):
        if f.endswith("index.ts"):
            continue
        s = open(f).read()
        m = re.search(r"(\n  blocks: \[\n)(.*?)(\n  \],)", s, re.S)
        if not m:
            continue
        body = m.group(2)

        images = list(IMAGE_BLOCK.finditer(body + "\n"))
        if not images:
            continue
        # Already leading with an image: nothing to do.
        if body.lstrip().startswith('{ kind: "image"'):
            continue

        last = images[-1]
        src = last.group(1)
        size = dims(src, last.group(0))
        if not size:
            continue
        w, h = size
        ratio = w / h if h else 0
        if ratio < BANNER_RATIO:
            skipped.append((f.split("/")[-1], src, f"{w}x{h}", round(ratio, 2)))
            continue

        block = last.group(0)
        if not block.rstrip().endswith(","):
            block = block.rstrip() + ",\n"
        rest = (body + "\n")[: last.start()] + (body + "\n")[last.end():]
        # The block that is now last may have lost its trailing comma need; the
        # generated files carry one on every entry, so normalise.
        rest = rest.rstrip("\n")
        if rest and not rest.rstrip().endswith(","):
            rest = rest.rstrip() + ","

        new_body = block.rstrip("\n") + "\n" + rest
        s = s[: m.start(2)] + new_body + s[m.end(2):]
        open(f, "w").write(s)
        moved.append((f.split("/")[-1], src, f"{w}x{h}"))

    for name, src, size in moved:
        print(f"  moved  {name:<48} {size:<11} {src}")
    if skipped:
        print(f"\n  left in place (not banner-shaped):")
        for name, src, size, ratio in skipped:
            print(f"    {name:<48} {size:<11} ratio {ratio}")
    print(f"\nlifted {len(moved)} banner(s); left {len(skipped)} non-banner image(s) alone")
    return 0


if __name__ == "__main__":
    sys.exit(main())
