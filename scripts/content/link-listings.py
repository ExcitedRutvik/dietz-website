#!/usr/bin/env python3
"""Turn the index pages (Glossar, Blog, News) into real linked listings.

The live-site scrape captured these six pages as a single `list` block of
plain strings — 460 entries between them, not one of them a link. That is why
roughly 350 glossary and article pages were reachable from nowhere in the
site: the pages existed, the index that should point at them was prose.

Each captured string turns out to be the target page's own `h1` with its
excerpt run on directly after it, so the link target can be recovered by
finding the registry page whose h1 is the longest prefix of the string. No
titles are invented and no mapping is hand-maintained; if a string does not
match a real page it is kept as an unlinked item rather than guessed at.

Idempotent: re-running on an already-converted file is a no-op.
"""
import glob
import re
import sys
import unicodedata

ROOT = "src/content/pages"
TARGETS = ["glossar.de", "glossary.en", "blog.de", "blog.en", "news.de"]


def norm(s: str) -> str:
    """Fold the dash and space variants the scrape picked up inconsistently."""
    s = unicodedata.normalize("NFKC", s)
    s = re.sub(r"[‐-―−]", "-", s)
    return re.sub(r"\s+", " ", s).strip()


def unescape(s: str) -> str:
    return s.replace('\\"', '"').replace("\\\\", "\\")


def escape(s: str) -> str:
    return s.replace("\\", "\\\\").replace('"', '\\"')


def load_pages():
    """locale -> [(normalised h1, href)] for every page that has an h1."""
    out = {}
    for f in glob.glob(f"{ROOT}/**/*.ts", recursive=True):
        s = open(f).read()
        loc = re.search(r'\n  locale: "(\w+)"', s)
        slug = re.search(r'\n  slug: "([^"]*)"', s)
        h1 = re.search(r'\n  h1: "((?:[^"\\]|\\.)*)"', s)
        if not (loc and slug and h1) or not slug.group(1):
            continue
        locale, sl = loc.group(1), slug.group(1)
        href = f"/{sl}/" if locale == "de" else f"/{locale}/{sl}/"
        out.setdefault(locale, []).append((norm(unescape(h1.group(1))), href))
    return out


def convert(path: str, locale: str, pages) -> bool:
    src = open(path).read()
    if 'type: "listing"' in src:
        return False

    # News carries a stray "Aktuelle Meldungen" heading above its list; the
    # heading becomes the listing's own section chrome, so only the list is
    # read and anything else in `blocks` is dropped with it.
    block = re.search(r"  blocks: \[.*?\],\n", src, re.S)
    if not block or 'kind: "list"' not in block.group(0):
        print(f"  skip {path}: no list block")
        return False
    listing = re.search(r'\{ kind: "list", items: \[(.*?)\] \}', block.group(0), re.S)
    if not listing:
        print(f"  skip {path}: list block not in expected shape")
        return False

    raw = re.findall(r'"((?:[^"\\]|\\.)*)"', listing.group(1))
    self_slug = re.search(r'\n  slug: "([^"]*)"', src).group(1)
    self_href = f"/{self_slug}/" if locale == "de" else f"/{locale}/{self_slug}/"
    # Exclude the index page's own h1 from the candidates. "Glossar" is a
    # prefix of every one of its own entries, so without this every row
    # links back to the page it is on.
    candidates = [(h, u) for h, u in pages.get(locale, []) if u != self_href]
    items, unmatched = [], 0

    for entry in raw:
        text = norm(unescape(entry))
        best = max(
            (h for h, _ in candidates if text.startswith(h) and h),
            key=len,
            default=None,
        )
        if best is None:
            unmatched += 1
            title, href, excerpt = text, None, None
        else:
            href = next(u for h, u in candidates if h == best)
            title = best
            excerpt = text[len(best):].strip(" -–—:·") or None

        parts = [f'title: "{escape(title)}"']
        if href:
            parts.append(f'href: "{href}"')
        if excerpt:
            parts.append(f'excerpt: "{escape(excerpt)}"')
        items.append("    { " + ", ".join(parts) + " },")

    # `blocks: [ ...one list... ]` becomes `items: [ ...links... ]`; the h1 and
    # everything above it stay exactly as scraped.
    out = (
        src[: block.start()]
        + "  items: [\n"
        + "\n".join(items)
        + "\n  ],\n"
        + src[block.end():]
    )
    out = out.replace('  type: "post",\n', '  type: "listing",\n', 1)
    open(path, "w").write(out)
    print(f"  {path}: {len(items)} items, {unmatched} unlinked")
    return True


def main():
    pages = load_pages()
    changed = 0
    for target in TARGETS:
        name, locale = target.rsplit(".", 1)
        found = glob.glob(f"{ROOT}/**/{name}.{locale}.ts", recursive=True)
        if not found:
            print(f"  skip {target}: no file")
            continue
        changed += convert(found[0], locale, pages)
    print(f"converted {changed} file(s)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
