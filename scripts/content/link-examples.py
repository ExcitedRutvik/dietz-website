#!/usr/bin/env python3
"""Rebuild the Branchen leaf pages as real example galleries.

/en/industries/automotive/ and its nine siblings are galleries of application
examples: a photograph per example, a name, and a sentence saying what the part
does. The live-site scrape flattened all of that into one `list` block of
run-on strings ("Pressure spring Compensation of length tolerances in a seat
assembly..."), and emitted every photograph afterwards in a clump. So the page
showed a wall of text followed by a wall of unlabelled images, with no
correspondence between them.

Worse, the earlier image-distribution pass could not help: it places one image
after the first paragraph following each heading, and these pages contain no
paragraphs at all. There was nothing to distribute *to*.

Everything needed to reassemble them is already in the repo:

  * Each run-on string starts with the exact `h1` of an `example.*` page, so
    the name splits cleanly from the description and the example page becomes
    the link target.
  * Each photograph's filename names its example (`DTZ_anpressfeder.jpg` ->
    Anpressfeder / Pressure spring), so image and example pair up.

Anything that does not match keeps its text and simply gets no image or link.

Idempotent: re-running on a converted file is a no-op.
"""
import glob
import json
import re
import sys
import unicodedata

ROOT = "src/content/pages"

# Filename stems carry the German part name even on the English pages, so the
# German example title is what an image is matched against.
STOP = {"dtz", "dietz", "produkte", "t", "jpg", "teaser", "prod"}


def fold(s: str) -> str:
    s = s.lower().replace("ß", "ss").replace("ä", "ae").replace("ö", "oe").replace("ü", "ue")
    s = unicodedata.normalize("NFKD", s).encode("ascii", "ignore").decode()
    return re.sub(r"[^a-z0-9]", "", s)


def stem_tokens(src: str) -> set:
    stem = src.rsplit("/", 1)[-1].rsplit(".", 1)[0]
    parts = re.split(r"[-_]", stem)
    return {fold(p) for p in parts if fold(p) and fold(p) not in STOP}


def load_examples():
    """(locale, folded h1) -> {slug, de_title}; plus the DE title of each id."""
    by_id = {}
    for f in glob.glob(f"{ROOT}/**/*.ts", recursive=True):
        s = open(f).read()
        pid = re.search(r'\n  id: "(example\.[^"]*)"', s)
        if not pid:
            continue
        loc = re.search(r'\n  locale: "(\w+)"', s).group(1)
        slug = re.search(r'\n  slug: "([^"]*)"', s).group(1)
        h1 = re.search(r'\n  h1: "((?:[^"\\]|\\.)*)"', s)
        img = re.search(r'\{ kind: "image", src: "([^"]+)"', s)
        by_id.setdefault(pid.group(1), {})[loc] = {
            "slug": slug,
            "h1": h1.group(1).replace('\\"', '"') if h1 else "",
            "img": img.group(1) if img else None,
        }
    return by_id


def convert(path: str, examples) -> bool:
    src = open(path).read()
    locale = re.search(r'\n  locale: "(\w+)"', src).group(1)
    if '"gallery"' in src or "  gallery: [" in src:
        return False

    body = re.search(r"\n  blocks: \[(.*?)\n  \],\n", src, re.S)
    if not body:
        return False
    lines = [ln.strip().rstrip(",") for ln in body.group(1).strip().split("\n") if ln.strip()]

    listing = next((ln for ln in lines if '{ kind: "list"' in ln), None)
    if not listing:
        return False
    entries = re.findall(r'"((?:[^"\\]|\\.)*)"', listing[listing.index("[") :])
    if len(entries) < 2:
        return False

    images = [re.match(r'\{ kind: "image", src: "([^"]+)"', ln).group(1)
              for ln in lines if ln.startswith('{ kind: "image"')]

    # Candidate examples for this locale, longest title first so
    # "Thigh springs for opening a flap" wins over "Thigh springs".
    cands = []
    for pid, locs in examples.items():
        e = locs.get(locale)
        if e and e["h1"]:
            cands.append((e["h1"], e["slug"], locs.get("de", e)["h1"],
                      e["img"] or locs.get("de", e).get("img")))
    cands.sort(key=lambda c: -len(c[0]))

    gallery, unmatched = [], 0
    for entry in entries:
        text = entry.replace('\\"', '"').strip()
        hit = next((c for c in cands if text.startswith(c[0])), None)
        if not hit:
            unmatched += 1
            heading, caption, href, de_title, own = text, "", None, text, None
        else:
            heading, slug, de_title, own = hit
            caption = text[len(heading):].strip(" .:-")
            href = f"/{slug}/" if locale == "de" else f"/{locale}/{slug}/"

        want = fold(de_title) or fold(heading)

        # Two ways a filename names its example, both needed. Containment
        # catches "hebel" inside "hebelauspolyamidpa"; a shared prefix catches
        # the cases where neither string contains the other because the
        # filename drifted by a plural ("silikonfedern" vs "Silikonfeder") or
        # swallowed its extension ("rollofederjpg"). Tokens under 4 characters
        # are excluded from containment, where they would match anything.
        def pairs(token: str) -> bool:
            if len(token) >= 4 and (token in want or want in token):
                return True
            n = min(len(token), len(want), 10)
            return n >= 8 and token[:n] == want[:n]

        img = own or next((s for s in images if any(pairs(t) for t in stem_tokens(s))), None)
        if img in images:
            images.remove(img)

        item = {"heading": heading, "caption": caption}
        if href:
            item["href"] = href
        if img:
            item["src"] = img
        gallery.append(item)

    if sum(1 for g in gallery if "src" in g) == 0:
        print(f"  skip {path}: no image matched an example")
        return False

    def js(g):
        p = [f'heading: {json.dumps(g["heading"], ensure_ascii=False)}',
             f'caption: {json.dumps(g.get("caption", ""), ensure_ascii=False)}']
        if g.get("href"):
            p.append(f'href: "{g["href"]}"')
        if g.get("src"):
            alt = json.dumps(g["heading"], ensure_ascii=False)
            p.append(f'image: {{ src: "{g["src"]}", alt: {alt} }}')
        return "    { " + ", ".join(p) + " },"

    # Prose and headings survive; the list and the loose images are replaced by
    # the gallery. The lead image (before the first heading) stays as the
    # page's own visual if it was not consumed by an example.
    keep = [ln for ln in lines
            if not ln.startswith('{ kind: "image"') and '{ kind: "list"' not in ln]
    keep += [f'{{ kind: "image", src: "{s}", alt: "" }}' for s in images[:1]]

    out = ""
    if keep:
        out += "  blocks: [\n" + "\n".join("    " + k + "," for k in keep) + "\n  ],\n"
    out += "  gallery: [\n" + "\n".join(js(g) for g in gallery) + "\n  ],"

    src = src[: body.start()] + "\n" + out + "\n" + src[body.end():]
    open(path, "w").write(src)
    linked = sum(1 for g in gallery if g.get("href"))
    imaged = sum(1 for g in gallery if g.get("src"))
    print(f"  {path}: {len(gallery)} examples, {linked} linked, {imaged} with images, {unmatched} unmatched")
    return True


def main():
    examples = load_examples()
    targets = sorted(set(
        glob.glob(f"{ROOT}/**/branchen--*.ts", recursive=True)
        + glob.glob(f"{ROOT}/**/industries--*.ts", recursive=True)
    ))
    changed = sum(convert(f, examples) for f in targets)
    print(f"converted {changed} page(s)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
