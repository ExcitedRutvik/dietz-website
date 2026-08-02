#!/usr/bin/env python3
"""Give every card, tile and listing row the photo its own target page holds.

A tile that links somewhere and shows no picture is not a design choice here,
it is a gap: the scrape attached images to whichever page it happened to be on
and never propagated them to the pages that link there. So a hub card for
Präzisionsfedern rendered as text while /praezisionsfedern/ opened on a
photograph of the part.

The rule is simply: if a tile has an href, and the page behind that href leads
with an image, use it. Nothing is invented and nothing is fetched; this only
moves a reference the repo already holds. Tiles that already carry an image
are left alone, and so are tiles whose target genuinely has no photo.

Idempotent.
"""
import glob
import re
import sys

ROOT = "src/content/pages"
# A tile line is one of: a hub card, a gallery example, or a listing row.
TILE = re.compile(r"\{ (?:heading|title): .*? \},")


def lead_image(src: str):
    """The first image a page leads with, if any."""
    m = re.search(r'\{ kind: "image", src: "([^"]+)"', src)
    if m:
        return m.group(1)
    m = re.search(r'image: \{ src: "([^"]+)"', src)
    return m.group(1) if m else None


def index_pages():
    """href -> lead image path"""
    out = {}
    for f in glob.glob(f"{ROOT}/**/*.ts", recursive=True):
        s = open(f).read()
        slug = re.search(r'\n  slug: "([^"]*)"', s)
        loc = re.search(r'\n  locale: "(\w+)"', s)
        if not (slug and loc) or not slug.group(1):
            continue
        href = (f"/{slug.group(1)}/" if loc.group(1) == "de"
                else f"/{loc.group(1)}/{slug.group(1)}/")
        img = lead_image(s)
        if img:
            out[href] = img
    return out


def main():
    pages = index_pages()
    filled = files = 0

    for f in glob.glob(f"{ROOT}/**/*.ts", recursive=True):
        s = open(f).read()
        self_slug = re.search(r'\n  slug: "([^"]*)"', s)
        self_loc = re.search(r'\n  locale: "(\w+)"', s)
        self_href = None
        if self_slug and self_loc and self_slug.group(1):
            self_href = (f"/{self_slug.group(1)}/" if self_loc.group(1) == "de"
                         else f"/{self_loc.group(1)}/{self_slug.group(1)}/")

        n = 0

        def fill(m):
            nonlocal n
            line = m.group(0)
            if "image: {" in line or "thumb:" in line:
                return line
            href = re.search(r'href: "([^"]+)"', line)
            if not href or href.group(1) == self_href:
                return line
            img = pages.get(href.group(1))
            if not img:
                return line
            n += 1
            # Gallery tiles carry a nested `image`; hub cards and listing rows
            # carry a flat `thumb`.
            if "heading:" in line:
                alt = re.search(r'heading: ("(?:[^"\\]|\\.)*")', line)
                return line[:-3] + f', image: {{ src: "{img}", alt: {alt.group(1) if alt else chr(34)*2} }} }},'
            return line[:-3] + f', thumb: "{img}" }},'

        out = TILE.sub(fill, s)
        if n:
            open(f, "w").write(out)
            filled += n
            files += 1
            print(f"  {f}: {n} tile(s) given their target's photo")

    print(f"filled {filled} tiles across {files} file(s)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
