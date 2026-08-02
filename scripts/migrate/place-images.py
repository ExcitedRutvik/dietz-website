#!/usr/bin/env python3
"""Distribute a page's images through its content instead of dumping them.

The generator appended every image after the prose, which produced a strip of
photos at the bottom of 27 pages and no visual anchor anywhere above. Images
belong next to the section they illustrate.

Placement: the first image becomes the page's lead visual (directly after the
intro, before the first heading); the rest are spread one per H2 section, in
document order. Pages with a single image just get the lead treatment.
"""
import glob, re, sys, pathlib

BLOCK = re.compile(r'^(\s*)\{ kind: "(image|heading|paragraph|list)".*$')

def split_blocks(body):
    """Split the blocks array into individual entries, tolerating multi-line."""
    out, cur, depth = [], [], 0
    for line in body.split("\n"):
        if not line.strip(): continue
        cur.append(line)
        depth += line.count("{") - line.count("}")
        if depth == 0 and cur:
            out.append("\n".join(cur)); cur = []
    return out

def kind_of(b):
    m = re.search(r'kind: "([a-z]+)"', b)
    return m.group(1) if m else "?"

def level_of(b):
    m = re.search(r'level: (\d)', b)
    return int(m.group(1)) if m else 0

def redistribute(blocks):
    imgs = [b for b in blocks if kind_of(b) == "image"]
    rest = [b for b in blocks if kind_of(b) != "image"]
    if len(imgs) < 2 or not rest:
        return blocks
    lead, others = imgs[0], imgs[1:]
    # Indices of section boundaries. H3 counts as well as H2: the Branchen,
    # Leistungen and Produkte families section themselves with H3, so an
    # H2-only rule found no boundaries there and left every image trailing at
    # the bottom, which is the clump this script exists to prevent.
    h2 = [i for i, b in enumerate(rest) if kind_of(b) == "heading" and level_of(b) in (2, 3)]
    out, oi = [lead], 0
    for i, b in enumerate(rest):
        out.append(b)
        # place an image just after the first paragraph following each H2
        if oi < len(others) and i in [h + 1 for h in h2] and kind_of(b) == "paragraph":
            out.append(others[oi]); oi += 1
    out.extend(others[oi:])          # anything left over trails, as before
    return out

def main():
    changed = 0
    for f in glob.glob("src/content/pages/**/*.ts", recursive=True):
        if f.endswith("index.ts"): continue
        p = pathlib.Path(f); s = p.read_text()
        m = re.search(r'(  blocks: \[\n)(.*?)(\n  \],)', s, re.S)
        if not m: continue
        blocks = split_blocks(m.group(2))
        if sum(1 for b in blocks if kind_of(b) == "image") < 2: continue
        new = redistribute(blocks)
        if new == blocks: continue
        body = ",\n".join(b.rstrip().rstrip(",") for b in new)
        s = s[:m.start(2)] + body + s[m.end(2):]
        p.write_text(s); changed += 1
    print(f"redistributed images on {changed} pages")

if __name__ == "__main__":
    main()
