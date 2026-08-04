# dietz.eu vs. the rebuild — full technical analysis and business impact

**Date:** 4 August 2026
**Subjects:** `https://www.dietz.eu/` (live, WordPress) vs. `https://dietz.trayaam.com/` (rebuild)
**Purpose:** establish, by measurement rather than assertion, what the current
site does well and badly, what the rebuild changes, and what each change is
worth commercially.

---

## Method, and why it matters

Every number below was measured today against both live origins, not estimated:

- **Real browser** (Chromium, Playwright) at desktop 1440×900 and mobile 390×844,
  measuring TTFB / FCP / LCP, bytes on the wire, and whether each `<img>`
  actually decoded pixels.
- **Full-page scroll before counting failures**, because a lazy image that has
  not loaded yet looks identical to a broken one in the DOM. Every apparent
  failure was then re-requested and confirmed by HTTP status.
- **DNS checked against three independent public resolvers** before any claim
  that a host is dead.
- **URL parity computed against the complete `sitemap_index.xml`** — all 13
  sub-sitemaps, 1,008 URLs — not a subset.

Two of these steps changed the answer materially, and both are documented in
"Corrections" at the end. Static HTML analysis alone would have produced two
confident, wrong numbers.

---

## Part A — The live site, analysed

### A1. Stack and infrastructure

| Layer | dietz.eu |
|---|---|
| CMS | WordPress + Avada/Fusion theme builder |
| Multilingual | WPML 4.6.9 (DE, EN, FR, ES, CS) |
| Consent | Complianz GDPR |
| Analytics/lead-gen | SalesViewer |
| SEO | Yoast |
| Web server | Apache, IONOS (`217.160.0.97`) |
| Protocol | HTTP/2 (no HTTP/3) |
| Compression | gzip (no brotli) |
| Rendering | Server-rendered PHP, per-request |

### A2. What the live site gets right

Worth stating plainly, because a fair comparison needs it:

- **Structured data is good.** The homepage emits `WebPage`, `BreadcrumbList`,
  `WebSite` and `Organization` JSON-LD — *more types than our homepage
  currently does*.
- **`hreflang` is thorough**: 6 alternates on the homepage, covering all five
  languages plus `x-default`. WPML is doing its job.
- **Alt text is complete** on the homepage — 0 images missing `alt`.
- **Static assets are cached well**: `max-age=10368000` (120 days) on uploads.
  This is *better than our current configuration* (see D2).
- **One `<h1>` per page**, correct `lang` attribute, valid viewport meta.
- **No horizontal overflow on mobile.**
- **1,008 URLs in the sitemap** — a genuinely large, indexed content estate.

### A3. What is measurably wrong

#### The company logo does not load

`relaunch.dietz.eu` — a staging domain from the 2024 relaunch — is referenced
**43 times in the live homepage HTML**, including 24 `<img>` tags, the hero
video `<source>`, and 4 navigation links.

That host returns **NXDOMAIN on Google, Cloudflare and Quad9 DNS.** It does not
exist.

Confirmed in a real browser: **the Dietz logo fails to render**, verified by
re-request (network-level DNS failure, not a 404). Most other staging-domain
references are rescued by the theme's lazy-load layer swapping in a working
`www.dietz.eu` URL before the browser requests them — which is why the visible
damage is far smaller than the raw HTML suggests, and why this needed a browser
to measure honestly.

Nine of ten sampled pages carry these dead references. A second dev host,
`dietz-federn.mgo-nh-dev.de`, is also contacted.

**Every one of those files exists at the identical path on `www.dietz.eu`
(verified HTTP 200).** This is an un-run search-replace after the relaunch — a
database-level find-and-replace, not a rebuild.

#### A 10.55 MB video downloads on every mobile homepage visit

The single worst performance defect on the site, and it is invisible on a desk
connection.

| Mobile (iPhone 390×844, initial view, no scroll) | dietz.eu |
|---|---|
| Hero video downloaded | **10.55 MB** |
| Total transferred | **11.99 MB** |
| **LCP** | **4,448 ms** |
| Load | 4,402 ms |

Google's Core Web Vitals threshold for LCP is 2,500 ms for "good" and 4,000 ms
for "poor". **The live homepage is in the failing band on mobile.** LCP is a
confirmed Google ranking signal.

There is no mobile-specific source, no `preload="none"`, no poster-only
fallback. Every phone visitor pays 12 MB to see the homepage.

#### 1.27 MB of render-blocking CSS

Three stylesheets, the largest of which is **1,270,832 bytes uncompressed**
(233 KB gzipped on the wire), served `media="all"` with no `preload` — fully
render-blocking. Plus **11 inline `<style>` blocks** in the document.

The wire cost is survivable; the parse-and-apply cost of 1.27 MB of CSS on a
mid-range Android is not, and it sits directly in front of first paint.

#### HTML that can never be cached

```
cache-control: max-age=0, no-cache, no-store, must-revalidate
expires: Mon, 29 Oct 1923 20:30:00 GMT
vary: User-Agent,Accept-Encoding
```

`no-store` forbids any caching of the HTML. `Vary: User-Agent` additionally
fragments any shared/CDN cache into one entry per user-agent string, which
defeats edge caching almost entirely. The `Expires: 1923` date is a plugin
artefact. Every visit re-fetches the document from Apache in Germany.

#### Zero security headers

| Header | dietz.eu |
|---|---|
| `strict-transport-security` | absent |
| `content-security-policy` | absent |
| `x-content-type-options` | absent |
| `x-frame-options` | absent |
| `referrer-policy` | absent |
| `permissions-policy` | absent |

No HSTS means a first visit over `http://` is downgradeable. No
`x-content-type-options` permits MIME-sniffing. No `x-frame-options` or CSP
`frame-ancestors` leaves the site framable — clickjacking-exposed.

#### A visitor-identification tracker fires before consent

**`salesviewer.org` is contacted on page load, with no consent interaction.**

SalesViewer is a B2B de-anonymisation service: it resolves visitor IPs to
company identities. Under GDPR and the German TTDSG, that is not a
"strictly necessary" purpose and requires prior opt-in consent. The site runs
Complianz specifically to gate this — and the tracker fires anyway.

This is a legal exposure, not a performance note. It sits alongside the
privacy-policy and Impressum problems already documented in
`dietz-issues-and-solutions.md`.

#### Accessibility

4 heading-level skips on the homepage (e.g. `h2` → `h4`), which breaks screen
reader navigation. 2 elements render wider than the mobile viewport.

---

## Part B — Side by side, with business impact

### B1. Mobile performance — the biggest single gap

| Metric (390×844, initial view) | dietz.eu | Rebuild | Change |
|---|---|---|---|
| Data to first view | 11.99 MB | **0.58 MB** | **−95%, 20× lighter** |
| Hero video downloaded | 10.55 MB | **0 MB** | eliminated |
| TTFB | 428 ms | **54 ms** | −87% |
| FCP | 1,109 ms | **170 ms** | −85% |
| **LCP** | **4,448 ms** (*poor*) | **170 ms** (*good*) | **−96%** |
| Load complete | 4,402 ms | **251 ms** | −94% |

**Business impact.** LCP moves from Google's failing band to its passing band.
Core Web Vitals is a live ranking factor, so this is a direct organic-search
input, not a cosmetic one. Separately, a German industrial buyer checking a
supplier on 4G currently spends 12 MB and 4.4 seconds to see a homepage; every
second of delay in that window is measurably correlated with abandonment. For a
company whose enquiries begin with a specification search, the homepage is the
qualifying step.

### B2. Desktop performance

| Metric (1440×900) | dietz.eu | Rebuild | Change |
|---|---|---|---|
| TTFB | 432 ms | **263 ms** | −39% |
| FCP | 1,182 ms | **544 ms** | −54% |
| LCP | 3,118 ms (*needs work*) | **1,353 ms** (*good*) | −57% |
| Load complete | 3,944 ms | **1,146 ms** | −71% |
| DOM nodes | 951 | **769** | −19% |
| Inline `<style>` blocks | 11 | **0** | eliminated |

**Business impact.** Desktop LCP crosses the 2.5 s "good" threshold. Procurement
research happens on desktop; a page that paints in half a second reads as a
competent supplier before a single word is processed.

### B3. Asset architecture

| | dietz.eu | Rebuild |
|---|---|---|
| CSS, wire | 233 KB gzip | **10 KB brotli** |
| CSS, parsed | 1,270,832 bytes | **~40 KB** |
| CSS files + inline blocks | 3 files + 11 inline | **1 file + 0 inline** |
| JS, wire | ~80 KB | 808 KB |
| HTML, wire | 33.5 KB gzip | **16.7 KB brotli** |
| Compression | gzip | **brotli** |
| Protocol | HTTP/2 | **HTTP/2 + HTTP/3** |

**Business impact.** CSS is **23× smaller on the wire and ~30× smaller to
parse** — the dominant cost in front of first paint, now effectively free.
Against that, **we ship roughly 10× more JavaScript** — this is a real
trade-off, discussed honestly in D1.

### B4. Reliability and correctness

| | dietz.eu | Rebuild |
|---|---|---|
| Images failing to render | **1 confirmed (the logo)** | **0** |
| Dead-domain references in HTML | 43 on homepage, 9 of 10 pages affected | **0** |
| Dev/staging hosts contacted | 2 (`relaunch.`, `mgo-nh-dev.de`) | **0** |
| HTTP ≥400 responses | 0 | 0 |

**Business impact.** A supplier whose own logo fails to load, on a site linking
to a dead staging domain, undercuts exactly the impression a precision
manufacturer needs to project. This is also the cheapest defect on the list to
fix — the assets already exist at the correct paths.

### B5. Security and privacy

| | dietz.eu | Rebuild |
|---|---|---|
| Security headers present | **0 of 7** | 2 of 7 |
| Trackers firing pre-consent | **SalesViewer** | **none** |
| Cookies set pre-consent | 1 (functional) | **0** |
| Third-party hosts on load | salesviewer.org | Cloudflare Insights (cookieless) |

**Business impact.** The pre-consent tracker is the material item: a GDPR/TTDSG
exposure on a German site whose customers are German industrial buyers, and the
kind of finding that becomes expensive only after a complaint. The rebuild sets
no cookies and contacts no tracker before consent.

### B6. Mobile UX and accessibility

| | dietz.eu | Rebuild |
|---|---|---|
| Elements wider than viewport | 2 | **0** |
| Heading-level skips | 4 | **1** |
| Internal links reachable without opening a menu | 35 of 71 | **52 of 53** |
| Horizontal scroll | no | no |

**Business impact.** On the live site roughly half the homepage's internal links
require opening a menu; in the rebuild essentially everything is reachable
directly. Fewer heading skips and no overflow also reduce the accessibility
exposure of a site that serves public-sector-adjacent and automotive customers
with their own compliance requirements.

### B7. Content and structure

Established in earlier rounds, restated for completeness:

| | Before | After |
|---|---|---|
| Pages built and served | 429 | **581** |
| Orphan pages (unreachable by any link) | ~350 of 576 | **0** |
| Job vacancies openable by a candidate | 0 | **10** |
| Product categories in the menu | 4 | **12** |
| Product pages with no photograph | 19 | **2** (deliberate) |

**Business impact.** The vacancies remain the clearest commercial line: ten live
roles that no candidate could open, in a regional labour market where Dietz
competes for apprentices and skilled trades.

---

## Part C — Corrections to previously reported figures

Measurement changed two numbers we had already given the client. Both are
corrected here rather than left standing.

### C1. URL parity is 83.5%, not 99.3% — and ~104 live URLs need redirects, not 3

The existing report states *"of 429 live URLs, 426 already exist"* and that only
three disposable URLs need a redirect. That was measured against a **429-URL
subset**. The full `sitemap_index.xml` declares **1,008 URLs across 13
sub-sitemaps**.

Measured against the full sitemap:

| Scope | Live URLs | In rebuild | Missing | Coverage |
|---|---|---|---|---|
| All languages | 1,008 | 575 | 433 | 57.0% |
| **DE + EN only** (FR/ES/CS deferred by agreement) | **689** | **575** | **114** | **83.5%** |

The 319 FR/ES/CS URLs are a known, agreed deferral — not a defect.

The 114 DE/EN misses break down as:

| Category | Count | Genuine content? |
|---|---|---|
| Media/download pages (`/mediadownload/`, `/download/`) | 58 | WordPress CPT |
| Taxonomy archives (`produktkategorie`, `kategorie`, `tag`, …) | 53 | WordPress archives |
| Known WordPress cruft (`/46-2/`, `/beispiel-seite/`, `/mediathek/`) | 3 | no |
| **Genuine editorial content pages** | **0** | — |

**The good news is real: not one editorial content page is missing.** The
correction is that **26 of 30 sampled missing URLs return HTTP 200 on the live
site today** — they are live, indexed, and would 404 on launch day without
redirects. So the redirect map is a **~104-URL job, not a 3-URL job.**

This is a launch-blocking item and it is better found now than in the week after
go-live.

### C2. The homepage image damage on dietz.eu is 1 image, not 24

Static HTML analysis showed 24 `<img>` tags pointing at the dead staging domain
and implied ~62% of homepage images were broken. In a real browser, **only the
logo actually fails** — the theme's lazy-load layer rewrites most of the rest to
working URLs before they are requested.

The dead-domain references are still a genuine defect and still need fixing. But
the honest user-visible impact is one broken logo, not a broken page, and the
client report should say so.

---

## Part D — Where the rebuild is not yet better

Stated plainly, because a comparison that only flatters one side is not an
analysis.

### D1. We ship ~10× more JavaScript

| | dietz.eu | Rebuild |
|---|---|---|
| JS on the wire | ~80 KB | **808 KB** (one 640 KB chunk) |

This buys the scroll-video homepage, and the rebuild still wins every paint
metric on both viewports — so it is not currently costing user-visible
performance. But it is the rebuild's largest remaining weight, it is
CPU-expensive on low-end Android, and the 640 KB chunk should be audited for
route-splitting before launch.

### D2. Our static caching is currently worse than theirs

| | dietz.eu | Rebuild |
|---|---|---|
| Uploads/images | `max-age=10368000` (**120 days**) | `max-age=14400` (**4 hours**) |
| Hashed, content-addressed JS/CSS | n/a | `max-age=14400, must-revalidate` |

Content-hashed filenames are safe to cache for a year; serving them for four
hours discards most of the benefit. This is the `Cache-Control: immutable` item
already flagged as outstanding — now confirmed against production, and it is a
one-line server change.

### D3. Full-scroll data is higher on the homepage

Scrolling the entire homepage transfers **26.67 MB** (245 frame fetches) versus
**13.32 MB** on the live site. The frames are requested progressively as the
reader scrolls and only for sections actually reached, whereas the live site's
10.55 MB video is downloaded up front regardless — which is why our *initial
view* is 20× lighter on mobile. But for a desktop visitor who scrolls the whole
homepage, we currently move more bytes. D2 would substantially mitigate this on
repeat visits.

### D4. Smaller structured-data and hreflang footprint on the homepage

The live homepage emits `WebPage` and `BreadcrumbList` JSON-LD that ours does
not, and carries 6 `hreflang` alternates to our 3 (a consequence of D5). Adding
`WebPage`/`BreadcrumbList` to the homepage is a small, worthwhile change.

### D5. FR/ES/CS are not built

319 live URLs. Agreed deferral, structurally ready, but it is the largest single
line in the parity gap and should be named in any launch conversation.

### D6. Staging is crawlable

`robots.txt` on the rebuild is `Allow: /` with no `noindex`. The canonical tag
correctly points at `www.dietz.eu`, which prevents duplicate-content indexing,
but staging should carry `noindex` until launch, and the canonical must be
flipped to the production domain as part of go-live.

---

## Part E — The pitch, in five numbers

1. **20× less mobile data to first view** — 11.99 MB → 0.58 MB — and **LCP from
   4,448 ms to 170 ms**, moving the homepage out of Google's failing Core Web
   Vitals band and into its passing one. This is a ranking input, not a
   cosmetic one.
2. **Their own logo does not load on the live site**, because the homepage still
   points at a decommissioned staging domain that no longer resolves — and every
   one of those files already exists at the correct path.
3. **A visitor de-anonymisation tracker fires before consent** on a German site
   with a consent plugin installed. That is a GDPR/TTDSG exposure, and it is
   live right now.
4. **Zero security headers on the live site**; no HSTS, no CSP, no
   clickjacking protection.
5. **~104 live, indexed URLs would 404 on launch day** without a redirect map —
   which we found by measuring against the full 1,008-URL sitemap rather than
   the subset we had been using, and corrected our own earlier figure to say so.

The argument to Dietz is not that the rebuild is prettier. It is that the
current site fails a Google ranking threshold on mobile, ships a legal exposure,
serves a broken logo, and has no security posture — and that the work to date
has already measured all of it, fixed most of it, and is honest about the four
places where the rebuild is not yet ahead.
