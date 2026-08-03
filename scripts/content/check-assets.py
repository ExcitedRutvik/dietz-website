#!/usr/bin/env python3
"""Audit image references across the content tree.

Three questions, all of which had wrong answers at some point in this project:

  1. Does every image a page references actually exist on disk? A broken path
     renders as a silently missing picture, not as an error.
  2. Which pages carry no image at all? Those are the gaps worth filling.
  3. Which files under public/images/ is nothing pointing at? Several whole
     directories were staged and then never wired up.

Read-only. Exits non-zero only for (1), the actual defect; (2) and (3) are
reported for judgement, not enforced.

  python3 scripts/content/check-assets.py [--verbose]
"""
import glob
import os
import re
import sys
from collections import defaultdict

ROOT = "src/content/pages"
PUBLIC = "public"
VERBOSE = "--verbose" in sys.argv

# Any absolute asset path in a string literal, in content or components.
REF = re.compile(r'"(/(?:images|frames|logo|video)/[^"]*)"')


def strip_comments(src):
    """Drop // line comments so a commented-out path is not read as a reference.

    Crude but sufficient: these are generated files with no `//` inside string
    literals other than in URLs, which are http:// and so not asset paths.
    """
    out = []
    for line in src.split("\n"):
        i = line.find("//")
        # Leave `https://` alone.
        while i != -1 and i > 0 and line[i - 1] == ":":
            i = line.find("//", i + 2)
        out.append(line if i == -1 else line[:i])
    return "\n".join(out)


def refs_in(src):
    """Asset paths a file genuinely requests at runtime.

    `framePrefix` values are deliberately partial — `frameUrl()` appends the
    zero-padded index and the extension — so they are not paths and must not be
    checked as if they were.
    """
    src = strip_comments(src)
    prefixes = set(re.findall(r'framePrefix:\s*"([^"]+)"', src))
    return [r for r in REF.findall(src) if r not in prefixes]


def page_meta(src):
    slug = re.search(r'\n  slug: "([^"]*)"', src)
    loc = re.search(r'\n  locale: "(\w+)"', src)
    typ = re.search(r'\n  type: "([\w-]+)"', src)
    return (
        slug.group(1) if slug else None,
        loc.group(1) if loc else None,
        typ.group(1) if typ else None,
    )


def main():
    referenced = set()
    missing = []
    no_image = defaultdict(list)
    counted = 0

    # Content pages.
    for f in sorted(glob.glob(f"{ROOT}/**/*.ts", recursive=True)):
        if f.endswith("index.ts"):
            continue
        src = open(f).read()
        slug, loc, typ = page_meta(src)
        if slug is None:
            continue
        counted += 1
        refs = refs_in(src)
        for r in refs:
            referenced.add(r)
            if not os.path.exists(os.path.join(PUBLIC, r.lstrip("/"))):
                missing.append((f, r))
        if not refs:
            no_image[typ or "?"].append(f)

    # Components reference assets too (homepage sections, badges, posters).
    for f in glob.glob("src/**/*.tsx", recursive=True) + glob.glob("src/**/*.ts", recursive=True):
        for r in refs_in(open(f).read()):
            referenced.add(r)
            if not os.path.exists(os.path.join(PUBLIC, r.lstrip("/"))):
                missing.append((f, r))

    # Everything on disk under public/images.
    on_disk = set()
    for dirpath, _, names in os.walk(f"{PUBLIC}/images"):
        for n in names:
            on_disk.add("/" + os.path.relpath(os.path.join(dirpath, n), PUBLIC))

    # A path built by interpolation (e.g. `/images/products/${slug}.jpg`) is not
    # a literal, so treat any directory reached by a template literal as used.
    interp_dirs = set()
    for f in glob.glob("src/**/*.tsx", recursive=True):
        for d in re.findall(r"`(/(?:images|frames)/[^`$]*)\$\{", open(f).read()):
            interp_dirs.add(d.rstrip("/"))

    unreferenced = defaultdict(list)
    for p in sorted(on_disk - referenced):
        if any(p.startswith(d) for d in interp_dirs):
            continue
        unreferenced[os.path.dirname(p)].append(p)

    print(f"content pages scanned      {counted}")
    print(f"distinct assets referenced {len(referenced)}")
    print(f"files under public/images  {len(on_disk)}")

    print(f"\nbroken references          {len(missing)}")
    for f, r in missing:
        print(f"  MISSING {r}  <- {f}")

    total_no_img = sum(len(v) for v in no_image.values())
    print(f"\npages with no image        {total_no_img}")
    for typ, files in sorted(no_image.items(), key=lambda kv: -len(kv[1])):
        print(f"  {typ:<16} {len(files)}")
        if VERBOSE:
            for f in files:
                print(f"      {f}")

    unref_total = sum(len(v) for v in unreferenced.values())
    print(f"\nunreferenced image files   {unref_total}")
    for d, files in sorted(unreferenced.items(), key=lambda kv: -len(kv[1])):
        print(f"  {d:<32} {len(files)}")
        if VERBOSE:
            for p in files:
                print(f"      {p}")

    if missing:
        print("\nFAIL - broken image references above")
        return 1
    print("\nOK - every referenced image exists on disk")
    return 0


if __name__ == "__main__":
    sys.exit(main())
