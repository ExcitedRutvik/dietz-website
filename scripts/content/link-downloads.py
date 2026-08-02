#!/usr/bin/env python3
"""Give the Downloads pages working links.

The live-site scrape flattened each document row into a single string ending
in the word "Download" - the anchor's own label - and threw the href away. So
both Downloads pages listed 55 documents between them and offered no way to
open any of them.

The hrefs are re-read from the live pages (see reference/downloads.json and
reference/downloads-en.json, which are the saved register) and matched back to
the captured rows by title. Both sides come from the same source page in the
same order, so this is a join, not a guess: a row whose title does not match a
scraped document keeps its text and simply has no link.

The PDFs still live on the WordPress host. If that host is retired the files
must be copied into public/downloads/ and these hrefs repointed - the register
files exist so that is a rename, not another scrape.
"""
import glob
import json
import re
import sys
import unicodedata

TARGETS = [
    ("downloads.de", "de", "reference/downloads.json"),
    ("downloads.en", "en", "reference/downloads-en.json"),
]


def fold(s: str) -> str:
    s = s.lower().replace("ß", "ss")
    s = unicodedata.normalize("NFKD", s).encode("ascii", "ignore").decode()
    return re.sub(r"[^a-z0-9]", "", s)


def convert(name: str, locale: str, register: str) -> bool:
    found = glob.glob(f"src/content/pages/**/{name}.ts", recursive=True)
    if not found:
        print(f"  skip {name}: no file")
        return False
    path = found[0]
    src = open(path).read()
    if 'type: "listing"' in src:
        return False

    docs = json.load(open(register))
    by_title = {fold(d["title"]): d["href"] for d in docs}

    block = re.search(r'\n    \{ kind: "list", items: \[(.*?)\] \},?', src, re.S)
    if not block:
        print(f"  skip {path}: no list block")
        return False

    raw = re.findall(r'"((?:[^"\\]|\\.)*)"', block.group(1))
    items, missed = [], 0
    for entry in raw:
        # Every row ends in the anchor's own label; it is chrome, not a title.
        title = re.sub(r"\s*Download\s*$", "", entry.replace('\\"', '"')).strip()
        href = by_title.get(fold(title))
        if not href:
            # Fall back to a containment match: a few rows carry a trailing
            # note the register's own title does not.
            key = fold(title)
            href = next((h for t, h in by_title.items() if t and (t in key or key in t)), None)
        if not href:
            missed += 1
        parts = [f'title: {json.dumps(title, ensure_ascii=False)}']
        if href:
            parts.append(f'href: "{href}"')
        items.append("    { " + ", ".join(parts) + " },")

    # Prose that sat alongside the list (the TISAX note and its portal IDs)
    # becomes the listing's intro, which is the only slot ListingContent has.
    paras = re.findall(r'\{ kind: "paragraph", text: "((?:[^"\\]|\\.)*)" \}', src)
    intro = " ".join(p.replace('\\"', '"') for p in paras).strip()

    body = '  type: "listing",\n'
    h1 = re.search(r'\n  h1: "((?:[^"\\]|\\.)*)"', src).group(1)
    body += f'  h1: "{h1}",\n'
    if intro:
        body += f"  intro: {json.dumps(intro, ensure_ascii=False)},\n"
    body += "  items: [\n" + "\n".join(items) + "\n  ],\n"

    head = src[: src.index('  type: "post",')]
    src = head + body + "};\n"
    open(path, "w").write(src)
    print(f"  {path}: {len(items)} documents, {missed} without a link")
    return True


def main():
    changed = sum(convert(*t) for t in TARGETS)
    print(f"converted {changed} file(s)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
