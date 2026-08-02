"""Phase 3: convert scraped article markdown -> typed PageEntry TS files.

The scrape format is highly regular for blog/glossary articles:
  # <title>
  Source URL: <url>
  Page title: <seo title>
  ## H1: <h1>
  <intro paragraphs>
  ## H2: <heading>      /  ### H3: <heading>
  <body paragraphs>
  ## Images | ## Embedded Video | ## Internal Links | ## CTAs / Forms   <- metadata, stop
so this is a mechanical transform, not a judgement call. Pages whose scrape
admits it was summarized get a REVIEW-NEEDED banner instead of being trusted.
"""
import re, os, sys, json, pathlib

META_HEAD = re.compile(r'^##\s+(Images|Embedded Video|Video Embeds|Internal Links|CTAs?\s*/\s*Forms|CTA)\b', re.I)
H_RE = re.compile(r'^##\s+H(\d):\s*(.*)$')
H2_RE = re.compile(r'^##\s+(?!H\d:)(.*)$')
H3_RE = re.compile(r'^###\s+(?:H(\d):\s*)?(.*)$')

def esc(t): return t.replace("\\","\\\\").replace('"','\\"')

def camel(loc, slug):
    parts = re.split(r'[^a-zA-Z0-9]+', slug)
    name = parts[0].lower() + "".join(p.capitalize() for p in parts[1:] if p)
    if name and name[0].isdigit(): name = "p" + name
    return name + loc.upper()

def parse(path):
    lines = open(path, encoding="utf-8", errors="replace").read().split("\n")
    src_url = seo_title = None
    h1 = None
    blocks = []          # list of dicts
    intro = []           # paragraphs before the first heading
    cur_para = []
    in_meta = False
    meta = {}
    cur_meta = None
    seen_h1 = False

    def flush():
        nonlocal cur_para
        t = " ".join(x.strip() for x in cur_para).strip()
        cur_para = []
        if not t: return
        if not blocks and not seen_h1_body[0]:
            intro.append(t)
        elif not blocks:
            intro.append(t)
        else:
            blocks.append({"kind":"paragraph","text":t})
    seen_h1_body=[False]

    for ln in lines:
        if META_HEAD.match(ln):
            flush(); in_meta = True
            cur_meta = re.sub(r'[^a-z]','', ln.lower())
            meta.setdefault(cur_meta, [])
            continue
        if in_meta:
            if ln.startswith("## "):   # another meta section
                cur_meta = re.sub(r'[^a-z]','', ln.lower())
                meta.setdefault(cur_meta, [])
            elif cur_meta:
                meta[cur_meta].append(ln)
            continue
        if ln.startswith("Source URL:"):
            src_url = ln.split(":",1)[1].strip(); continue
        if ln.startswith("Page title:"):
            seo_title = ln.split(":",1)[1].strip(); continue
        m = H_RE.match(ln)
        if m:
            flush()
            lvl, txt = int(m.group(1)), m.group(2).strip()
            if lvl == 1 and not seen_h1:
                h1 = txt; seen_h1 = True; seen_h1_body[0]=True
            else:
                blocks.append({"kind":"heading","level":2 if lvl<=2 else 3,"text":txt})
            continue
        m = H3_RE.match(ln)
        if m and ln.startswith("### "):
            flush(); blocks.append({"kind":"heading","level":3,"text":(m.group(2) or "").strip()}); continue
        m = H2_RE.match(ln)
        if m and ln.startswith("## "):
            flush(); blocks.append({"kind":"heading","level":2,"text":m.group(1).strip()}); continue
        if ln.startswith("# "):
            continue
        if ln.strip()=="":
            flush()
        else:
            cur_para.append(ln)
    flush()
    return dict(src_url=src_url, seo_title=seo_title, h1=h1, intro=intro,
                blocks=blocks, meta=meta,
                raw=open(path,encoding="utf-8",errors="replace").read())

def build_ts(loc, slug, d):
    export = camel(loc, slug)
    h1 = d["h1"] or (d["seo_title"] or slug).split("|")[0].strip()
    seo_title = d["seo_title"] or h1
    intro = d["intro"][0] if d["intro"] else ""
    extra_intro = d["intro"][1:] if len(d["intro"])>1 else []
    blocks = [{"kind":"paragraph","text":t} for t in extra_intro] + d["blocks"]
    desc = (intro or h1)[:180]

    ctatext = " ".join(d["meta"].get("ctasforms", []) + d["meta"].get("cta", []))
    cta = ""
    if re.search(r'typeform', ctatext, re.I):
        label = "Jetzt unverbindlich Kontakt mit uns aufnehmen" if loc=="de" else "Contact us now"
        cta = f'  cta: {{ kind: "typeform", typeformId: "01HHYPGYGQFR0BRFHV2WWR2ZEF", label: "{label}" }},\n'

    body=[]
    for b in blocks:
        if b["kind"]=="heading":
            body.append(f'    {{ kind: "heading", level: {b["level"]}, text: "{esc(b["text"])}" }}')
        else:
            body.append(f'    {{ kind: "paragraph", text: "{esc(b["text"])}" }}')

    warn = ""
    if re.search(r'condensed|summar[iy]|not captured|paraphras|truncat', d["raw"], re.I):
        warn = ("// REVIEW-NEEDED: the source scrape for this page flags its own content as\n"
                "// summarized/truncated rather than verbatim. Re-scrape before launch.\n")

    return export, (
        f'// Generated from reference/pages/{loc}/{slug}.md by scripts/content/md-to-content.py\n'
        f'// Source: {d["src_url"] or ""}\n' + warn +
        f'import type {{ PageEntry }} from "@/content/schema";\n\n'
        f'export const {export}: PageEntry = {{\n'
        f'  id: "post.{slug.replace("/","-")}",\n  locale: "{loc}",\n  slug: "{slug}",\n'
        f'  seo: {{\n    title: "{esc(seo_title)}",\n    description: "{esc(desc)}",\n  }},\n'
        f'  type: "post",\n  h1: "{esc(h1)}",\n'
        + (f'  intro: "{esc(intro)}",\n' if intro else "")
        + cta +
        f'  blocks: [\n' + ",\n".join(body) + ("," if body else "") + f'\n  ],\n}};\n'
    )

if __name__ == "__main__":
    todo = [l.strip().split("\t") for l in open(sys.argv[1]) if l.strip()]
    outdir = pathlib.Path("src/content/pages/article")
    outdir.mkdir(parents=True, exist_ok=True)
    made=skipped=review=0
    for loc, slug in todo:
        src = f"reference/pages/{loc}/{slug}.md"
        if not os.path.exists(src):
            skipped+=1; continue
        d = parse(src)
        if not (d["blocks"] or d["intro"]):
            skipped+=1; continue
        export, ts = build_ts(loc, slug, d)
        fn = slug.replace("/","--") + f".{loc}.ts"
        (outdir/fn).write_text(ts)
        if "REVIEW-NEEDED" in ts: review+=1
        made+=1
    print(f"generated={made} skipped={skipped} review-flagged={review}")
