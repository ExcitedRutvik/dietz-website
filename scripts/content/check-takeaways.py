#!/usr/bin/env python3
"""Assert that every key takeaway restates something the page actually says.

Key takeaways are the passage an AI answer engine is most likely to quote back
verbatim, and a search result that attributes a wrong tolerance or a wrong
standard to Dietz is worse than no result at all. So the rule is not "write good
takeaways", it is: **a takeaway may only contain figures, units and standards
that already appear in that page's own body copy.**

This checks the checkable part of that. It pulls every number, dimension and
standard designation out of each takeaway and requires each to appear somewhere
in the same page's blocks. Prose is not checked — that still needs a reader —
but the specific claims, which are what get quoted and what can be wrong in a
damaging way, are.

  python3 scripts/content/check-takeaways.py
"""
import glob
import re
import sys

ROOT = "src/content/pages"

# The claim-bearing tokens: decimals, standards, certifications, dimensions.
CLAIM = re.compile(
    r"""(
        \d+[.,]\d+          # 0,30  3.00
      | EN\s?\d+            # EN10270
      | DIN\s?[\d-]+        # DIN 2095
      | ISO\s?\d+           # ISO 9001
      | IATF\s?\d+          # IATF 16949
      | \b\d{3,}\b          # 16949, 1928
    )""",
    re.X | re.I,
)


def norm(s: str) -> str:
    """Compare on digits and letters only, so '0,30' matches '0.30' and
    'EN10270' matches 'EN 10270'."""
    return re.sub(r"[^0-9a-z]", "", s.lower())


def main():
    checked = pages = bad = 0

    for f in sorted(glob.glob(f"{ROOT}/**/*.ts", recursive=True)):
        if f.endswith("index.ts"):
            continue
        src = open(f).read()
        m = re.search(r"\n  keyTakeaways: \[(.*?)\n  \],", src, re.S)
        if not m:
            continue
        pages += 1

        takeaways = re.findall(r'"((?:[^"\\]|\\.)*)"', m.group(1))

        # Compare against the page's *body copy only*, not the whole file. The
        # seo block is metadata: a figure that appears only in a meta
        # description is not something the page tells the reader, so it must not
        # count as support for a takeaway that quotes it.
        blocks = re.search(r"\n  blocks: \[(.*?)\n  \],", src, re.S)
        gallery = re.search(r"\n  gallery: \[(.*?)\n  \],", src, re.S)
        body = norm((blocks.group(1) if blocks else "") + (gallery.group(1) if gallery else ""))

        for t in takeaways:
            checked += 1
            for claim in CLAIM.findall(t):
                if norm(claim) not in body:
                    print(f"  {f}")
                    print(f"    takeaway: {t}")
                    print(f"    UNSUPPORTED: {claim!r} appears nowhere in the page body")
                    bad += 1

    print(f"\n{pages} page(s) with takeaways, {checked} takeaway(s) checked")
    if bad:
        print(f"FAIL - {bad} unsupported claim(s)")
        return 1
    print("OK - every figure and standard cited is stated by the page itself")
    return 0


if __name__ == "__main__":
    sys.exit(main())
