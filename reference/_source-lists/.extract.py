#!/usr/bin/env python3
"""Extract page structure from a dietz.eu HTML file for the reference archive."""
import sys, re, json
from bs4 import BeautifulSoup
from urllib.parse import urljoin

BASE = "https://www.dietz.eu"

NOISE_CLASS_SUBSTRINGS = [
    'fusion-sharing-box', 'comment-respond', 'about-author', 'breadcrumb',
    'cookie', 'gdpr', 'fusion-meta-info', 'awb-related', 'related-post',
    'fusion-blog-layout-related', 'yarpp', 'nav-links', 'post-navigation',
    'rich-snippet-hidden', 'screen-reader-text',
]

def is_noise(tag):
    for parent in tag.parents:
        if parent.name in ('header', 'footer', 'nav'):
            return True
        cls_tokens = parent.get('class') or []
        pid = parent.get('id') or ''
        for n in NOISE_CLASS_SUBSTRINGS:
            if any(n in tok for tok in cls_tokens) or n in pid:
                return True
        if parent.name == 'main':
            break
    return False

def abs_url(u):
    if not u:
        return u
    return urljoin(BASE + '/', u)

def extract(html_path, page_url):
    html = open(html_path, encoding='utf-8', errors='ignore').read()
    soup = BeautifulSoup(html, 'lxml')
    title = soup.title.string.strip() if soup.title and soup.title.string else None

    main = soup.find('main')
    if main is None:
        return {"error": "no <main> found", "title": title}

    article = main.find('article')
    is_blog = False
    content_root = main
    if article and article.find('div', class_='post-content'):
        is_blog = True
        content_root = article

    # Determine scanning root(s): for blog, h1 + post-content; else whole main minus noise
    scan_nodes = []
    if is_blog:
        h1 = article.find('h1', class_='entry-title')
        if h1:
            scan_nodes.append(h1)
        pc = article.find('div', class_='post-content')
        if pc:
            scan_nodes.append(pc)
    else:
        scan_nodes.append(main)

    headings_out = []  # list of (level:int, text, [body paragraphs])
    current = None

    def add_heading(tag):
        nonlocal current
        level = int(tag.name[1])
        text = tag.get_text(" ", strip=True)
        current = {"level": level, "text": text, "body": []}
        headings_out.append(current)

    def add_body(text):
        if not text:
            return
        if current is None:
            # body text before any heading found
            if not headings_out or headings_out[0]["text"] != "__preamble__":
                pre = {"level": 0, "text": "__preamble__", "body": []}
                headings_out.insert(0, pre)
            headings_out[0]["body"].append(text)
        else:
            current["body"].append(text)

    seen_text = set()
    for root in scan_nodes:
        if root.name in ('h1','h2','h3','h4','h5'):
            add_heading(root)
            continue
        for el in root.find_all(['h1','h2','h3','h4','h5','p','li'], recursive=True):
            if is_noise(el):
                continue
            # skip li that are inside nav-like uls (menus) - heuristic: parent ul/ol has class with 'menu'
            if el.name == 'li':
                parent_list = el.find_parent(['ul','ol'])
                if parent_list:
                    pcls = ' '.join(parent_list.get('class') or [])
                    if 'menu' in pcls:
                        continue
            if el.name in ('h1','h2','h3','h4','h5'):
                add_heading(el)
            else:
                txt = el.get_text(" ", strip=True)
                if txt and txt not in seen_text:
                    seen_text.add(txt)
                    add_body(txt)

    # images
    images = []
    seen_img = set()
    for img in content_root.find_all('img') if is_blog else main.find_all('img'):
        if is_noise(img):
            continue
        src = img.get('src') or img.get('data-src') or img.get('data-lazy-src')
        srcset = img.get('srcset')
        if not src and srcset:
            src = srcset.split(',')[0].strip().split(' ')[0]
        if not src:
            continue
        src = abs_url(src)
        if 'gravatar.com' in src:
            continue
        alt = img.get('alt') or ''
        key = src
        if key in seen_img:
            continue
        seen_img.add(key)
        images.append((src, alt))

    # iframes (video)
    videos = []
    for ifr in main.find_all('iframe'):
        src = ifr.get('src') or ifr.get('data-src')
        if src and ('youtube' in src or 'vimeo' in src):
            videos.append(abs_url(src) if src.startswith('/') else src)

    # internal links
    links = []
    seen_link = set()
    scan_link_root = content_root if is_blog else main
    page_url_norm = page_url.rstrip('/')
    for a in scan_link_root.find_all('a', href=True):
        if is_noise(a):
            continue
        href = a['href']
        if href.startswith('#') or href.startswith('mailto:') or href.startswith('tel:'):
            continue
        full = abs_url(href) if href.startswith('/') else href
        if 'dietz.eu' not in full:
            continue
        # skip stale relaunch.dietz.eu staging-domain self/breadcrumb links (site quirk, not real nav)
        if 'relaunch.dietz.eu' in full:
            continue
        # skip exact self-referencing links (e.g. H1 title bar wrapped in <a> to itself)
        if full.rstrip('/') == page_url_norm:
            continue
        # skip social share / wp-login / feed noise
        if any(s in full for s in ['wp-login', '/feed/', 'facebook.com','twitter.com','x.com','linkedin.com','pinterest.com','reddit.com','whatsapp.com','telegram','tumblr.com','vk.com','xing.com', '#respond']):
            continue
        text = a.get_text(" ", strip=True)
        key = (full, text)
        if key in seen_link:
            continue
        seen_link.add(key)
        links.append((full, text))

    # forms
    forms = []
    for f in main.find_all('form'):
        if 'comment' in ' '.join(f.get('class') or []) or f.get('id') == 'commentform':
            continue
        fields = []
        for inp in f.find_all(['input','textarea','select']):
            if inp.get('type') in ('hidden',):
                continue
            fields.append({
                "name": inp.get('name'),
                "type": inp.get('type') or inp.name,
                "placeholder": inp.get('placeholder'),
            })
        btn_text = None
        for inp in f.find_all('input', type='submit'):
            btn_text = inp.get('value')
        for btn in f.find_all('button'):
            t = btn.get_text(strip=True)
            if t and t != '×':
                btn_text = t
        forms.append({"fields": fields, "button": btn_text})

    return {
        "title": title,
        "is_blog": is_blog,
        "headings": headings_out,
        "images": images,
        "videos": videos,
        "links": links,
        "forms": forms,
    }

if __name__ == '__main__':
    html_path, page_url = sys.argv[1], sys.argv[2]
    result = extract(html_path, page_url)
    print(json.dumps(result, ensure_ascii=False, indent=2))
