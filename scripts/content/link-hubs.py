#!/usr/bin/env python3
"""Turn the category pages into real hubs with linked, illustrated cards.

Branchen, Produkte, Leistungen and Karriere (plus their EN counterparts) are
category pages: an H3 per child, a paragraph of body copy, and a "mehr ..."
link through to the child page. The live-site scrape captured the H3 as a
heading, the body as a paragraph, and the link as `{kind:"list",
items:["mehr ..."]}` - a bullet containing the *word* "mehr" and no href. So
every one of these pages named its children and linked to none of them, which
is the same failure the index pages had.

It also emitted every image in a clump, mostly at the end of the page, so the
photograph belonging to Logistik rendered three sections below Logistik.

Both are recoverable without inventing anything:

  * The link target comes from the nav tree, which already states which pages
    are children of which hub. An H3 is matched to a child by comparing
    normalised titles.
  * The image belongs to whichever section its filename names. These files are
    called `t-produktion.jpg`, `t-logistik.jpg`, `DTZ_elektrotechnik.jpg`;
    the pairing is right there in the slug.

Anything that does not match is left alone rather than guessed at.

Idempotent: re-running on a converted file is a no-op.
"""
import glob
import json
import re
import sys
import unicodedata

ROOT = "src/content/pages"

# hub id -> the nav children that hub links to. Mirrors MAIN_NAV; kept here so
# the script does not have to parse TypeScript.
HUBS = {
    "post.branchen": [
        "post.branchen-automotive",
        "post.branchen-elektrotechnik",
        "post.branchen-medizintechnik",
        "post.branchen-weisse-ware",
        "post.branchen-weitere-branchen",
    ],
    "post.unternehmen-leistungen": [
        "post.unternehmen-leistungen-produktion",
        "post.unternehmen-leistungen-qualitaet",
        "post.unternehmen-leistungen-materialauswahl",
        "post.unternehmen-leistungen-logistik",
    ],
    "post.produkte": [
        "product.produkte-druckfedern",
        "product.produkte-zugfedern",
        "product.produkte-schenkelfedern",
        "product.produkte-wellenfedern",
        "product.praezisionsfedern",
        "product.produkte-drahtbiegeteile",
        "product.produkte-bandbiegeteile",
        "product.stanz-umformteile",
        "product.produkte-hybride-baugruppen",
        "product.kunststofftechnik",
        "product.produkte-sonderverpackungen",
        "product.produkte-prototypen-und-musterbau",
    ],
}

# Umlaut/spelling variants the scrape and the filenames disagree on.
ALIASES = {
    "weisseware": "weisseware",
    "weissware": "weisseware",
    "medizin": "medizintechnik",
    "medical": "medizintechnik",
    "praktikum": "praktikum",
    "schuelerpraktikum": "praktikum",
}


# folded heading -> canonical child id, for the cases where the hub's wording
# and the child page's title genuinely differ.
HEADING_ALIASES = {
    "stanzundformteile": "product.stanz-umformteile",
    "stampedandformedparts": "product.stanz-umformteile",
    "gebogenedrahtteile": "product.produkte-drahtbiegeteile",
    "bentwireparts": "product.produkte-drahtbiegeteile",
    "besondereverpackung": "product.produkte-sonderverpackungen",
    "specialpackaging": "product.produkte-sonderverpackungen",
    "musterundprototypenbau": "product.produkte-prototypen-und-musterbau",
    "sampleandprototypeconstruction": "product.produkte-prototypen-und-musterbau",
    "plasticstechnology": "product.kunststofftechnik",
    "hybridassemblies": "product.produkte-hybride-baugruppen",
    "precisionsprings": "product.praezisionsfedern",
    "ausbildungsstellen": "post.karriere-ausbildung",
    "studentendualesstudium": "post.karriere-duales-studium",
}


def fold(s: str) -> str:
    """Lowercase, strip accents and every non-letter, so 'Weiße Ware' and
    't-weisseware.jpg' land on the same token."""
    s = s.lower().replace("ß", "ss").replace("ä", "ae").replace("ö", "oe").replace("ü", "ue")
    s = unicodedata.normalize("NFKD", s).encode("ascii", "ignore").decode()
    s = re.sub(r"[^a-z]", "", s)
    return ALIASES.get(s, s)


def load_pages():
    """id -> {locale: {slug, title, navLabel}}"""
    out = {}
    for f in glob.glob(f"{ROOT}/**/*.ts", recursive=True):
        s = open(f).read()
        pid = re.search(r'\n  id: "([^"]*)"', s)
        loc = re.search(r'\n  locale: "(\w+)"', s)
        slug = re.search(r'\n  slug: "([^"]*)"', s)
        if not (pid and loc and slug):
            continue
        title = re.search(r'\n    title: "((?:[^"\\]|\\.)*)"', s)
        nav = re.search(r'\n    navLabel: "((?:[^"\\]|\\.)*)"', s)
        out.setdefault(pid.group(1), {})[loc.group(1)] = {
            "slug": slug.group(1),
            "title": (nav or title).group(1) if (nav or title) else "",
            "file": f,
        }
    return out


def parse_blocks(src: str):
    """The block list, as (kind, raw-text) in document order."""
    body = re.search(r"\n  blocks: \[(.*?)\n  \],\n", src, re.S)
    if not body:
        return None, None, None
    raw = body.group(1)
    lines = [ln.strip().rstrip(",") for ln in raw.strip().split("\n") if ln.strip()]
    return body.start(), body.end(), lines


def convert(path: str, pid: str, locale: str, pages) -> bool:
    src = open(path).read()
    if 'type: "hub"' in src:
        return False

    start, end, lines = parse_blocks(src)
    if not lines:
        print(f"  skip {path}: no block list")
        return False

    # Children of this hub that exist in this locale, keyed by folded title.
    children, by_id = {}, {}
    for cid in HUBS[pid]:
        entry = pages.get(cid, {}).get(locale)
        if entry:
            children[fold(entry["title"])] = entry
            by_id[cid] = entry

    # Every image on the page, keyed by the folded stem of its filename.
    images = {}
    for ln in lines:
        m = re.match(r'\{ kind: "image", src: "([^"]+)"', ln)
        if m:
            stem = m.group(1).rsplit("/", 1)[-1].rsplit(".", 1)[0]
            images[stem] = m.group(1)

    def image_for(title: str):
        want = fold(title)
        for stem, src_ in images.items():
            if want and want in fold(stem):
                return src_
        return None

    # Walk the blocks: an H3 opens a card, the next paragraph is its body, and
    # a "mehr ..." list closes it.
    cards, leftover, used, i = [], [], set(), 0
    while i < len(lines):
        h = re.match(r'\{ kind: "heading", level: 3, text: "((?:[^"\\]|\\.)*)"', lines[i])
        if not h:
            if not re.match(r'\{ kind: "image"', lines[i]):
                leftover.append(lines[i])
            i += 1
            continue

        title = h.group(1)
        body_txt, j = "", i + 1
        while j < len(lines) and not re.match(r'\{ kind: "heading"', lines[j]):
            p = re.match(r'\{ kind: "paragraph", text: "((?:[^"\\]|\\.)*)"', lines[j])
            if p and not body_txt:
                body_txt = p.group(1)
            j += 1

        key = fold(title)
        match = children.get(key) or by_id.get(HEADING_ALIASES.get(key, ""))
        if match:
            href = f"/{match['slug']}/" if locale == "de" else f"/{locale}/{match['slug']}/"
            thumb = image_for(title)
            card = {"title": title.lstrip("… ").strip(), "href": href, "body": body_txt}
            if thumb:
                card["thumb"] = thumb
            cards.append(card)
            used.add(match["slug"])
        else:
            leftover.extend(lines[i:j])
        i = j

    for cid in HUBS[pid]:
        entry = pages.get(cid, {}).get(locale)
        if not entry or entry["slug"] in used:
            continue
        child_src = open(entry["file"]).read()
        lede = re.search(r'\n  intro: "((?:[^"\\]|\\.)*)"', child_src) or re.search(
            r'\{ kind: "paragraph", text: "((?:[^"\\]|\\.)*)"', child_src)
        href = f"/{entry['slug']}/" if locale == "de" else f"/{locale}/{entry['slug']}/"
        body_txt = lede.group(1) if lede else ""
        if len(body_txt) > 240:
            body_txt = body_txt[:237].rsplit(" ", 1)[0] + " ..."
        cards.append({"title": entry["title"], "href": href, "body": body_txt})

    if not cards:
        print(f"  skip {path}: no H3 matched a child page")
        return False

    def js(d):
        parts = [f'title: {json.dumps(d["title"], ensure_ascii=False)}',
                 f'href: "{d["href"]}"',
                 f'body: {json.dumps(d["body"], ensure_ascii=False)}']
        if "thumb" in d:
            parts.append(f'thumb: "{d["thumb"]}"')
        return "    { " + ", ".join(parts) + " },"

    out = "  cards: [\n" + "\n".join(js(c) for c in cards) + "\n  ],"
    # Keep any prose that was not part of a card (the page's own lede sections).
    keep = [ln for ln in leftover if not re.match(r'\{ kind: "(list|heading)"', ln)]
    if keep:
        out = "  blocks: [\n" + "\n".join("    " + k + "," for k in keep) + "\n  ],\n" + out

    src = src[:start] + "\n" + out + "\n" + src[end:]
    src = re.sub(r"\n  blocks: \[\n  \],\n", "\n", src)
    src = src.replace('  type: "post",\n', '  type: "hub",\n', 1)
    open(path, "w").write(src)

    linked = sum(1 for c in cards if c["href"])
    thumbed = sum(1 for c in cards if "thumb" in c)
    print(f"  {path}: {linked} cards linked, {thumbed} with images")
    return True


def main():
    pages = load_pages()
    changed = 0
    for pid in HUBS:
        for locale, entry in pages.get(pid, {}).items():
            changed += convert(entry["file"], pid, locale, pages)
    print(f"converted {changed} hub page(s)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
