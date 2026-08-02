#!/usr/bin/env python3
"""Scrape dietz.eu LIVE as the source of truth.

Why this exists: the original migration trusted a pre-made markdown scrape plus
`page-sitemap.xml`. Both were wrong in ways that silently lost content —
`/produkte/druckfedern/` and 8 siblings are absent from the sitemap yet return
200 with full articles, and several captured pages were third-person summaries
rather than the page's own copy (hybrid-assemblies shipped at 2% of the live
character count). Link discovery + direct extraction removes both failure modes.

Emits one JSON per page: h1, intro, typed blocks, images, CTA, and any
/produkte/ links (used to build category galleries).
"""
import json, os, re, sys, time, urllib.request, hashlib
from urllib.parse import urljoin, urlparse
from bs4 import BeautifulSoup

UA = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/120 Safari/537.36"
CHROME = ("script,style,nav,header,footer,.fusion-page-title-bar,.awb-menu,.fusion-footer,"
          ".fusion-secondary-header,#wpfront-scroll-top-container,.avada-footer-scripts,"
          # WordPress blog chrome that is boilerplate on every article
          ".about-author,.fusion-author,#comments,#respond,.comment-respond,"
          ".fusion-sharing-box,.fusion-meta-info,.post-navigation,.fusion-single-navigation")

# Chrome images appear on every page and are already staged in public/: the
# logo, WPML flag svgs, footer certification badges, gravatars, and the
# SalesViewer tracking pixel. Product photos frequently sit OUTSIDE
# .post-content, so images are scanned document-wide and filtered by this
# instead of by container.
IMG_CHROME = re.compile(
    r'(dietz-logo|/res/flags/|gravatar|secure\.gravatar|salesviewer|'
    r'dekra-iso|dekra-iatf|ISO-14001|emas_logo|umweltpakt|aeo\.png|medal\.png|'
    r'Klimaneutrales|UMPreis|KSU-Logo|\.gif$)', re.I)

def clean(t):
    return re.sub(r"\s+", " ", t).strip()

def fetch(url, tries=3):
    for i in range(tries):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": UA})
            with urllib.request.urlopen(req, timeout=30) as r:
                return r.read().decode("utf-8", "replace")
        except Exception:
            if i == tries - 1: raise
            time.sleep(1.5 * (i + 1))

def extract(url, html):
    soup = BeautifulSoup(html, "lxml")
    title = clean(soup.title.get_text()) if soup.title else ""

    # Grab the real post title BEFORE stripping chrome: Avada renders it as
    # h1.entry-title inside the page-title-bar, which the chrome selector below
    # removes. Missing this made every page fall through to its first H2.
    # WPML publishes rel=alternate hreflang for every translation of this page.
    # That is the authoritative DE<->EN pairing (and the FR/ES URLs for later):
    # slugs are fully translated, so counterparts cannot be matched by string
    # similarity. Captured before chrome removal.
    alternates = {}
    for link in soup.find_all("link", rel=lambda v: v and "alternate" in v):
        hl, href = link.get("hreflang"), link.get("href")
        if hl and href:
            alternates[hl.lower().split("-")[0]] = href

    real_h1 = None
    ent = soup.select_one("h1.entry-title, h1.fusion-post-title, .fusion-page-title-bar h1")
    if ent:
        t = clean(ent.get_text(" "))
        if t and t.lower() not in ("dietz.eu", "info", "produkte", "products"):
            real_h1 = t

    for bad in soup.select(CHROME):
        bad.decompose()
    root = soup.select_one(".post-content") or soup.select_one("main") or soup.select_one("#content") or soup.body

    h1 = real_h1
    if not h1:
        # Fall back to the page <title> minus the site suffix, then to the
        # first in-content heading.
        cand = re.sub(r"\s*\|\s*Dietz GmbH\s*$", "", title).strip()
        if cand and cand.lower() not in ("dietz.eu", "info"):
            h1 = cand
    if not h1:
        for tag in root.find_all(["h1", "h2"]):
            t = clean(tag.get_text(" "))
            if t and t.lower() not in ("dietz.eu", "info"):
                h1 = t; tag.decompose(); break
    else:
        # If the in-content copy repeats the title as its first heading, drop
        # the duplicate rather than rendering it twice.
        first = root.find(["h1", "h2"])
        if first and clean(first.get_text(" ")) == h1:
            first.decompose()

    blocks, images, prod_links = [], [], []
    seen_img, seen_txt = set(), set()
    cta_label = None

    # Document-wide image sweep (see IMG_CHROME): Avada renders the featured
    # product photo outside the article container on /produkte/* pages.
    for el in soup.find_all("img"):
        src = el.get("data-orig-src") or el.get("src") or el.get("data-src")
        if not src: continue
        src = urljoin(url, src)
        if "dietz.eu" not in src: continue
        if IMG_CHROME.search(src): continue
        if src in seen_img: continue
        seen_img.add(src)
        images.append({"src": src, "alt": clean(el.get("alt", ""))})

    for el in root.find_all(["h2", "h3", "h4", "p", "ul", "ol", "a"]):
        if el.name == "a":
            h = el.get("href", "")
            if "/produkte/" in h or "/products/" in h:
                lab = clean(el.get_text(" "))
                if lab and len(lab) < 90:
                    prod_links.append({"label": lab, "href": urljoin(url, h)})
            continue
        if el.find_parent(["ul", "ol"]): continue
        if el.name in ("ul", "ol"):
            items = [clean(li.get_text(" ")) for li in el.find_all("li", recursive=False)]
            items = [i for i in items if i and len(i) < 400]
            if items:
                blocks.append({"kind": "list", "ordered": el.name == "ol", "items": items})
            continue
        t = clean(el.get_text(" "))
        if not t or len(t) < 2: continue
        # The sitewide Typeform CTA renders as a heading; capture it, don't inline it.
        if re.search(r'unverbindlich Kontakt|Contact us now', t, re.I) and len(t) < 80:
            cta_label = t; continue
        if re.search(r'^(About the Author|Über den Autor|Leave A Comment|Hinterlassen Sie einen Kommentar|'
                     r'Share this|Teilen Sie|Related Posts|Ähnliche Beiträge)', t, re.I):
            continue
        key = (el.name, t)
        if key in seen_txt: continue
        seen_txt.add(key)
        if el.name in ("h2", "h3", "h4"):
            blocks.append({"kind": "heading", "level": 2 if el.name == "h2" else 3, "text": t})
        else:
            blocks.append({"kind": "paragraph", "text": t})

    # First paragraph before any heading becomes the lede.
    intro = None
    if blocks and blocks[0]["kind"] == "paragraph":
        intro = blocks.pop(0)["text"]

    chars = sum(len(b.get("text","")) + sum(len(i) for i in b.get("items",[])) for b in blocks) + len(intro or "")
    return {"url": url, "seo_title": title, "h1": h1, "intro": intro,
            "alternates": alternates,
            "blocks": blocks, "images": images, "product_links": prod_links,
            "cta_label": cta_label, "chars": chars}

def main(listfile, outdir):
    os.makedirs(outdir, exist_ok=True)
    # rstrip("\n") only: a homepage row is "de\t" with an empty slug, and a
    # bare .strip() would eat the tab and collapse it to a single field.
    todo = []
    for line in open(listfile):
        line = line.rstrip("\n")
        if not line: continue
        loc, _, slug = line.partition("\t")
        todo.append((loc, slug))
    done = fail = 0
    for i, (loc, slug) in enumerate(todo, 1):
        key = hashlib.md5(f"{loc}:{slug}".encode()).hexdigest()[:10]
        dest = os.path.join(outdir, f"{loc}__{key}.json")
        if os.path.exists(dest):
            done += 1; continue
        url = "https://www.dietz.eu/" + ("" if loc == "de" else "en/") + (slug + "/" if slug else "")
        try:
            d = extract(url, fetch(url))
            d["locale"] = loc; d["slug"] = slug
            json.dump(d, open(dest, "w"), ensure_ascii=False, indent=1)
            done += 1
        except Exception as e:
            fail += 1
            print(f"  FAIL {loc} /{slug}/ : {e}", flush=True)
        if i % 40 == 0:
            print(f"  {i}/{len(todo)} (ok={done} fail={fail})", flush=True)
        time.sleep(0.15)
    print(f"done: {done} scraped, {fail} failed")

if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
