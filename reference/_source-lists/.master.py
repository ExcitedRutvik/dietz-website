#!/usr/bin/env python3
import subprocess, sys, os, time, json
from urllib.parse import urlparse
sys.path.insert(0, os.path.dirname(__file__))
import importlib.util
spec = importlib.util.spec_from_file_location("extract", os.path.join(os.path.dirname(__file__), ".extract.py"))
ex = importlib.util.module_from_spec(spec)
spec.loader.exec_module(ex)

ROOT = "/home/ubuntu/projects/dietz"
PAGES_ROOT = os.path.join(ROOT, "reference/pages/en")
TMP_DIR = "/tmp/claude-1001/-home-ubuntu-projects/3e4b1911-e9de-46a0-8a9e-24b13260f01e/scratchpad/dietz_html"
os.makedirs(TMP_DIR, exist_ok=True)

def derive_path(url):
    p = url.replace("https://www.dietz.eu/en/", "")
    p = p.strip("/")
    if p == "":
        return os.path.join(PAGES_ROOT, "index.md")
    return os.path.join(PAGES_ROOT, p + ".md")

def fetch_html(url, tries=3):
    dest = os.path.join(TMP_DIR, str(abs(hash(url))) + ".html")
    for i in range(tries):
        r = subprocess.run(
            ["curl", "-s", "-L", "-A", "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36", "-w", "%{http_code}", "-o", dest, url],
            capture_output=True, text=True, timeout=30
        )
        code = r.stdout.strip()
        if os.path.exists(dest) and os.path.getsize(dest) > 500 and code.startswith("2"):
            return dest, code
        time.sleep(1.5)
    return dest, code if 'code' in dir() else "ERR"

def md_escape(s):
    return s if s else ""

def render_markdown(url, data):
    lines = []
    title = data.get("title") or "(no title found)"
    lines.append(f"# {title}")
    lines.append("")
    lines.append(f"Source: {url}")
    lines.append("")
    if data.get("error"):
        lines.append(f"**FETCH/PARSE ISSUE**: {data['error']}")
        lines.append("")
    headings = data.get("headings", [])
    if not headings:
        lines.append("## Content")
        lines.append("(No heading/body structure detected in main content area — page may be image-only, a redirect, or structured unusually. See raw page for manual review.)")
        lines.append("")
    for h in headings:
        level = h["level"]
        text = h["text"]
        if text == "__preamble__":
            hd = "## Content (before first heading)"
        else:
            hashes = "#" * min(max(level, 1), 6)
            hd = f"{hashes} {text}"
        lines.append(hd)
        lines.append("")
        for b in h["body"]:
            lines.append(b)
            lines.append("")

    lines.append("## Images")
    if data.get("images"):
        for src, alt in data["images"]:
            alt_disp = alt if alt else "(none)"
            lines.append(f'- {src} — Alt: "{alt_disp}"')
    else:
        lines.append("(none found)")
    lines.append("")

    lines.append("## Video Embeds")
    if data.get("videos"):
        for v in data["videos"]:
            lines.append(f"- {v}")
    else:
        lines.append("None detected.")
    lines.append("")

    lines.append("## Internal Links (main content)")
    if data.get("links"):
        for href, text in data["links"]:
            t = text if text else "(no text)"
            lines.append(f"- {href} — \"{t}\"")
    else:
        lines.append("(none found)")
    lines.append("")

    lines.append("## CTAs / Forms")
    if data.get("forms"):
        for f in data["forms"]:
            lines.append("- Form fields:")
            for fld in f["fields"]:
                lines.append(f"  - {fld.get('name')} ({fld.get('type')}) — placeholder: \"{fld.get('placeholder') or ''}\"")
            lines.append(f"  - Submit button text: \"{f.get('button') or ''}\"")
    else:
        lines.append("No CTA buttons or contact/quote forms detected in main content.")
    lines.append("")
    return "\n".join(lines)

def main():
    url_list_file = sys.argv[1]
    with open(url_list_file) as f:
        urls = [l.strip() for l in f if l.strip()]

    results = []
    all_images = {}  # url -> alt (first seen)
    image_manifest_path = os.path.join(os.path.dirname(__file__), ".image_manifest.tsv")
    manifest_f = open(image_manifest_path, "a")

    for url in urls:
        print(f"=== {url}", file=sys.stderr)
        try:
            html_path, code = fetch_html(url)
        except Exception as e:
            print(f"FETCH EXCEPTION: {e}", file=sys.stderr)
            html_path, code = None, "EXC"

        md_path = derive_path(url)
        os.makedirs(os.path.dirname(md_path), exist_ok=True)

        if not html_path or not os.path.exists(html_path) or os.path.getsize(html_path) < 500:
            content = f"# FETCH FAILED\n\nSource: {url}\n\n**FETCH FAILED** — HTTP status: {code}. Could not retrieve page content after retries.\n"
            with open(md_path, "w") as f:
                f.write(content)
            results.append({"url": url, "status": "FAILED", "md_path": md_path})
            continue

        try:
            data = ex.extract(html_path, url)
        except Exception as e:
            content = f"# FETCH FAILED\n\nSource: {url}\n\n**FETCH FAILED** — parsing exception: {e}\n"
            with open(md_path, "w") as f:
                f.write(content)
            results.append({"url": url, "status": "PARSE_FAILED", "md_path": md_path})
            continue

        md = render_markdown(url, data)
        with open(md_path, "w") as f:
            f.write(md)

        for src, alt in data.get("images", []):
            if src not in all_images:
                all_images[src] = alt
                manifest_f.write(f"{src}\t{alt}\t{url}\n")

        results.append({"url": url, "status": "OK", "md_path": md_path, "n_images": len(data.get("images", [])), "n_links": len(data.get("links", []))})

    manifest_f.close()
    print(json.dumps(results, indent=2))

if __name__ == "__main__":
    main()
