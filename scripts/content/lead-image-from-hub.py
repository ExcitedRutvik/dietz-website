#!/usr/bin/env python3
"""Give a page the photo its own hub card already shows for it.

`fill-thumbs.py` runs one way: it copies a page's lead image onto the tiles that
link to it. This is the same relationship read in the other direction, and it
closes the opposite gap.

The product hub asserts a photo for every category — Druckfedern shows a
sonderdruckfeder, Zugfedern an überlange Zugfeder — but the category pages
themselves opened as walls of text, because the images they originally
referenced are dead 2016 uploads that did not survive the migration. The hub's
own card is therefore an existing, checked statement of "this is what this
category looks like", made by the same people who wrote the page.

So: if a hub card has a thumb, and the page it links to has no image at all,
that thumb becomes the target page's lead image. Nothing is invented, nothing is
fetched, no mapping is authored — this only reads a reference the repo already
holds. Pages that already have an image are left alone.

Idempotent.
"""
import glob
import os
import re
import sys

ROOT = "src/content/pages"
PUBLIC = "public"

CARD = re.compile(r"\{ title: .*?href: \"([^\"]+)\".*?\}")
THUMB = re.compile(r'thumb: "([^"]+)"')

# Hub cards whose photo does not depict the category they link to. Propagating
# these would take a wrong picture that is currently small and on one page, and
# make it the lead image of the page about that exact subject — which is worse.
#
# Bandbiegeteile are stamped from flat strip; DTZ_drahtbiegeteile_t.jpg is a
# round-wire bent part, and is correctly used by the Drahtbiegeteile card as
# well. No strip-bending photograph exists anywhere in the repo, so these pages
# stay text-only until Dietz supplies one. Raised with the client.
MISATTRIBUTED = {
    "/produkte/bandbiegeteile/",
    "/en/products/strip-bending-parts/",
}

# Same problem, but here the repo does hold a correct photograph, so the page
# gets that one instead of the hub's.
#
# The Schenkelfedern card shows DTZ_rollofederjpg.jpg, a flat formed strip clip.
# A Schenkelfeder is a helical coil with two legs — DTZ-schenkelfederLeuchten.jpg
# is exactly that, and is already in the repo. Leading the torsion-spring page
# with a stamped clip would misdescribe the whole category to a buyer.
OVERRIDE = {
    "/produkte/schenkelfedern/": "/images/live/DTZ-schenkelfederLeuchten.jpg",
    "/en/products/torsion-springs/": "/images/live/DTZ-schenkelfederLeuchten.jpg",
}


def dims(path):
    """Intrinsic size, so BlockRenderer can tell a photo from an icon."""
    try:
        from PIL import Image

        with Image.open(os.path.join(PUBLIC, path.lstrip("/"))) as im:
            return im.size
    except Exception:
        return None


def meta(src):
    slug = re.search(r'\n  slug: "([^"]*)"', src)
    loc = re.search(r'\n  locale: "(\w+)"', src)
    h1 = re.search(r'\n  h1: ("(?:[^"\\]|\\.)*")', src)
    return (
        slug.group(1) if slug else None,
        loc.group(1) if loc else None,
        h1.group(1) if h1 else None,
    )


def href_of(slug, loc):
    return f"/{slug}/" if loc == "de" else f"/{loc}/{slug}/"


def has_image(src):
    """Whether the page already *leads* with an image.

    Only a `blocks` image counts. A gallery image does not: it sits below the
    body copy, so a page with a gallery and no block image still opens on text.
    Treating the gallery as "has an image" is why the automotive and white-goods
    pages never got a banner while their siblings did — and why their first
    gallery tile ended up as the Largest Contentful Paint.
    """
    return bool(re.search(r'\{ kind: "image"', src))


def main():
    files = {f: open(f).read() for f in glob.glob(f"{ROOT}/**/*.ts", recursive=True)
             if not f.endswith("index.ts")}

    # href -> file, for resolving card links to pages.
    by_href = {}
    for f, s in files.items():
        slug, loc, _ = meta(s)
        if slug and loc:
            by_href[href_of(slug, loc)] = f

    # Every thumb any hub card asserts for a target page.
    wanted = {}
    for f, s in files.items():
        if not re.search(r'type: "(hub|career-hub)"', s):
            continue
        for line in s.split("\n"):
            if not re.match(r"\s*\{ title:", line):
                continue
            href = re.search(r'href: "([^"]+)"', line)
            thumb = THUMB.search(line)
            if href and thumb:
                wanted.setdefault(href.group(1), thumb.group(1))

    changed = 0
    for href, thumb in sorted(wanted.items()):
        if href in MISATTRIBUTED:
            print(f"  SKIP {href} - hub thumb does not depict this category")
            continue
        if href in OVERRIDE:
            thumb = OVERRIDE[href]
        target = by_href.get(href)
        if not target:
            continue
        src = files[target]
        if has_image(src):
            continue
        _, _, h1 = meta(src)
        if not h1:
            continue
        size = dims(thumb)
        if not size:
            print(f"  SKIP {href} - cannot read {thumb}")
            continue
        w, h = size
        # alt is the target page's own h1, verbatim. Never composed: a made-up
        # description of a photograph nobody on this side has looked at is worse
        # than a plain one.
        block = (
            f'    {{ kind: "image", src: "{thumb}", alt: {h1}, '
            f"width: {w}, height: {h} }},\n"
        )
        m = re.search(r"\n  blocks: \[\n", src)
        if not m:
            print(f"  SKIP {href} - no blocks array")
            continue
        out = src[: m.end()] + block + src[m.end():]
        open(target, "w").write(out)
        files[target] = out
        changed += 1
        print(f"  {target}: lead image {thumb}")

    print(f"gave {changed} page(s) the photo their hub card already showed")
    return 0


if __name__ == "__main__":
    sys.exit(main())
