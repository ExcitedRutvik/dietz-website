#!/usr/bin/env python3
"""Give each product category page a gallery of the real parts in it.

The category pages describe what Dietz can make but showed none of it, while 44
separate example pages each hold one photographed, correctly-attributed part.
Nothing connected the two, so /produkte/druckfedern/ was a wall of text and the
photographs of actual compression springs sat on pages nothing linked to.

Every field emitted here is copied verbatim from the example page — its own
heading, its own intro, its own image and alt text. Nothing is composed, because
a caption written on this side would be a claim about a photograph nobody on
this side has verified. The category assignment is the one authored decision,
and it lives in reference/content/example-to-category.json with its evidence.

Only the example's own locale is used, so a German caption never appears on an
English page. Pages that already carry a gallery are left alone.

Idempotent.
"""
import glob
import json
import re
import sys

ROOT = "src/content/pages"
MAP = "reference/content/example-to-category.json"


def read_pages():
    out = {}
    for f in glob.glob(f"{ROOT}/**/*.ts", recursive=True):
        if f.endswith("index.ts"):
            continue
        s = open(f).read()
        pid = re.search(r'\n  id: "([^"]+)"', s)
        loc = re.search(r'\n  locale: "(\w+)"', s)
        slug = re.search(r'\n  slug: "([^"]*)"', s)
        if not (pid and loc and slug):
            continue
        out[(pid.group(1), loc.group(1))] = {
            "file": f,
            "src": s,
            "slug": slug.group(1),
            "locale": loc.group(1),
        }
    return out


def field(src, name):
    m = re.search(rf'\n  {name}: ("(?:[^"\\]|\\.)*")', src)
    return m.group(1) if m else None


def lead_image(src):
    m = re.search(r'\{ kind: "image", src: "([^"]+)", alt: ("(?:[^"\\]|\\.)*")', src)
    if m:
        return m.group(1), m.group(2)
    m = re.search(r'image: \{ src: "([^"]+)", alt: ("(?:[^"\\]|\\.)*")', src)
    return (m.group(1), m.group(2)) if m else (None, None)


def href_of(page):
    return (
        f"/{page['slug']}/" if page["locale"] == "de"
        else f"/{page['locale']}/{page['slug']}/"
    )


def main():
    mapping = json.load(open(MAP))
    pages = read_pages()

    written = 0
    for category, examples in mapping.items():
        if category.startswith("_"):
            continue
        for locale in ("de", "en"):
            target = pages.get((category, locale))
            if not target:
                continue
            if "gallery:" in target["src"]:
                continue

            entries = []
            for ex_id in examples:
                ex = pages.get((ex_id, locale))
                if not ex:
                    # No translation of this example: skip rather than show the
                    # other language's caption.
                    continue
                heading = field(ex["src"], "h1")
                caption = field(ex["src"], "intro")
                img, alt = lead_image(ex["src"])
                if not (heading and img):
                    continue
                parts = [f"heading: {heading}"]
                if caption:
                    parts.append(f"caption: {caption}")
                parts.append(f'href: "{href_of(ex)}"')
                parts.append(f'image: {{ src: "{img}", alt: {alt or heading} }}')
                entries.append("    { " + ", ".join(parts) + " },")

            if not entries:
                continue

            block = "  gallery: [\n" + "\n".join(entries) + "\n  ],\n"
            # Insert before the closing brace of the exported object.
            m = list(re.finditer(r"\n\};\s*$", target["src"]))
            if not m:
                print(f"  SKIP {target['file']} - unexpected shape")
                continue
            at = m[-1].start() + 1
            out = target["src"][:at] + block + target["src"][at:]
            open(target["file"], "w").write(out)
            pages[(category, locale)]["src"] = out
            written += 1
            print(f"  {target['file']}: {len(entries)} example(s)")

    print(f"gave {written} category page(s) a gallery of real parts")
    return 0


if __name__ == "__main__":
    sys.exit(main())
