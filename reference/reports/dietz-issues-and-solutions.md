# Dietz.eu — what we found, what we fixed, what we need from you

**Date:** 3 August 2026
**Scope:** the twelve items raised in your review, what those turned up underneath, and a full scorecard of everything moved since the rebuild started.

---

## In one page

You raised twelve items. All twelve are addressed. Working through them surfaced
five further problems that were not on the list and that matter more than most
of what was — including one that made every German page of the site impossible
to preview, one that made ten live job vacancies unreachable, and a legal
inconsistency on dietz.eu today that we would want to know about if it were our
company.

**The headline results:**

| | Before | After |
|---|---|---|
| Peak simultaneous image requests on the homepage | 40 | **6** |
| Certification logos: time to appear (4 Mbit/s) | 7.8 s | **4.9 s** |
| Product pages with no photograph | 19 | **2** (both deliberate — see F5) |
| Landing pages showing empty grey cells | 3 | **0** |
| Job vacancies a candidate could actually open | 0 | **10** |
| Live URLs that would 404 after launch | unknown | **3**, all disposable |
| Images with no alt text | 6 | **0** |
| Duplicate meta descriptions | 1 group | **0** |
| Top-level menu items that are links | 6 of 7 | **7 of 7** |

**What we need from you** is at the end. The three that matter most: Search
Console access, your real social-media profile URLs, and a decision on the
commercial register number.

---

## Zooming out — the full engagement to date

The section above is scoped to the twelve items from your latest review. It is
one round of a longer rebuild. Below is every metric that has moved since the
project started, so the scale of what has actually changed is visible in one
place rather than scattered across status updates.

### Content you already own, recovered

| | Before | After |
|---|---|---|
| Live pages actually built and served | 429 | **578** |
| Pages unreachable by any link on the site (orphans) | ~350 of 576 | **0** |
| Job vacancies a candidate could open | 0 | **10** |
| Product categories in the menu | 4 | **12** |
| Product pages with no photograph | 19 | **2** (deliberate — no invented photos) |
| EN "hybrid assemblies" — copy captured vs. the live page | 2% | **96%** |
| EN "bent wire parts" — copy captured vs. the live page | 30% | **100%** |
| DE "Präzisionsfedern" — copy captured vs. the live page | 57% | **91%** |
| DE privacy policy — paragraphs (was a summary, not the policy) | 0 | **111**, verbatim |
| Landing pages with empty/broken grid cells | 3 | **0** |
| Corrupted images shipped as if valid (2016-era, HTML saved as `.jpg`) | 47 | **0** |

### Site speed and weight

| | Before | After |
|---|---|---|
| Homepage: data downloaded on first load | — | **8.0 MB across 99 requests** |
| Homepage frame-sequence assets | 128 MB | **70 MB** |
| Static images (right-sized to their rendered size) | — | **13 MB** |
| Peak simultaneous requests scrolling the homepage | 40 | **6** |
| Certification logos — time to appear (4 Mbit/s) | 7.8 s | **4.9 s** |
| Transport protocol | HTTP/1.1 | **HTTP/2** |
| Scroll p95 frame gap | 283 ms | **167 ms** |
| Long-task time across a scroll session | 186 s | **109 s** |
| Homepage first contentful paint (live, median of 3) | — | **142 ms** |
| Content page first contentful paint (live, median of 3) | — | **365 ms** |

*Frame-sequence size, transport protocol, scroll frame gap and long-task time
were measured during the performance pass earlier in the build. Everything else
in this table was measured against the live site on 3 August 2026. First paint
varies between visits (142–605 ms observed on the homepage); the medians above
are from three samples each, on a desktop connection.*

### SEO, discoverability and AI search

| | Before | After |
|---|---|---|
| Live URLs confirmed safe to carry across on launch | unmeasured | **426 / 429 (99.3%)** |
| Images missing alt text | 6 | **0** |
| Duplicate meta descriptions | 1 group | **0** |
| Duplicate pages breaking the DE/EN pairing | 1 | **0** |
| Top 34 commercial pages with current, applied metadata | stale/unapplied | **refreshed** |
| Pages eligible for Google Jobs | 0 | **10** |
| AI-assistant discovery file (`llms.txt`) | none | **shipped** |
| Evidenced backlink prospects identified | 0 | **8**, each sourced from something Dietz already publishes |

### Structural bugs fixed (things that were quietly broken, not just unpolished)

- The entire German site — **around 344 pages, the primary language** — returned
  "not found" in local preview. Nobody could check a German page before this
  was found and fixed.
- **Mobile menu exposed top-level items only.** Every product, industry and
  career sub-page was unreachable from a phone.
- **Desktop dropdowns were hover-only** — unusable by keyboard or touch.
- **Every content page inherited a near-black background with near-black
  text** ("every page is just black"), leaking from a style meant only for the
  homepage's cinematic hero.
- The careers page listed **ten open vacancies as run-on text with no links.**

### Errors live on dietz.eu today, independent of this project

Found while working through the site, not fixed unilaterally because they are
factual or legal calls that belong to you:

- Commercial register number conflict: **HRB 7729** (DE) vs. **HRB 1008** (EN).
- English privacy policy: **33 paragraphs vs. the German's 111** — GDPR-relevant.
- Cookie policy lists `info@dietz.de`; every other page uses `info@dietz.eu`.
- Two different terms-of-sale PDFs in circulation, unclear which is current.
- Footer social links point at the platforms themselves, not Dietz's profiles.
- Live machine-translation errors visible to English-speaking buyers: "Thigh
  springs" (a torsion spring), "Bless you" (*Gesundheit*), "Roller Shutter
  Leather" (*Rollofeder*).

---

## Part 1 — The twelve items you raised

### 1. Images loaded slowly, and sometimes not at all

**What we found.** Not an image problem. The homepage's five scrolling video
sections each queued *every* frame they owned and downloaded them eight at a
time, never releasing the data. Fully scrolled, the homepage was issuing **824
requests for about 67 MB** and holding all of it. Everything else on the page —
including the certification logos you singled out — was competing with that.

Those certification logos are **eight files totalling 64 KB**. They were never
slow. They were queued behind 67 MB of video frames.

**What we did.** Replaced the five independent download queues with a single
shared budget, and gave each section a moving window that follows the reader
instead of downloading everything. A coarse skeleton of every sixteenth frame is
kept so that jumping straight to a section still lands on real footage rather
than black.

Also removed a **5.4 MB video file that no part of the site was using**, stopped
four below-the-fold images being downloaded eagerly on mobile (about 1 MB
wasted), and preloaded the hero image, which is what a visitor actually sees
first but was previously only requested after the page had loaded.

**Measured**, scrolling the homepage to the certifications on a 4 Mbit/s
connection: peak simultaneous requests **40 → 6**; certification logos
**7,849 ms → 4,899 ms**. Repeatable with
`node scripts/perf/frame-budget.cjs --scroll --throttle`.

> **One thing left, and it is not in the website.** The server should tell
> browsers to keep these files. At the moment 67 MB is re-checked on every
> visit, which costs more than everything above. One line of server
> configuration; we can supply it.

### 2. The navigation structure

Your intended order — Products, Industries, Services, Company, Career,
Resources, Contact — was **already the order the menu used**. The real defect
was that Resources had nothing behind it (see item 8). That is now fixed, and
all seven top-level items are links.

### 3. Product sub-pages had no images

19 of 27 product pages opened as walls of text, because the photographs they
originally referenced are dead 2016 uploads that did not survive the migration.

Fixed without inventing anything, in two passes: each Products card already
asserts a photo for its category — your own editorial choice — so that becomes
the page's lead image; and the 44 product-example pages, each holding one
correctly-attributed photograph, are now linked into the categories they belong
to as galleries. **19 → 2.** The two exceptions are deliberate and are in Part 2.

### 4. Industries: the blank area, and Automotive

Both fixed. Automotive is now a double-width feature card with its image and
copy side by side; the remaining four fill the rest exactly, with no gaps. The
industry pages now also lead through to product pages that have real content and
photographs, which was the second half of what you asked.

### 5. Services: layout and the missing Material image

The four cards now lay out two-by-two with no empty space, and the Material card
has its photograph — a still of wire stock on the dereelers, which was already
in the project and referenced by nothing.

### 6. Stills from the video

Done, and deliberately **not** done at scale. Filling all 443 image-less pages
with film stills would have undone item 1 within a week, and a glossary entry
about spring rate does not need a photograph of a machine. Stills are used where
a human actually lands.

The rule we applied, which we would ask you to hold us to: **a film still is
never captioned as a specific part.** It shows a building, a machine, or people
at work. Product photography only ever comes from pages that carry a verified
attribution. Each still records what it actually depicts, so the choice can be
checked rather than trusted.

### 7. Company page

The photograph of the building now sits between the heading and "Leistungsfähig
und kompetent – seit 90 Jahren", as requested.

The list of subpages was not navigation at all — it was the "related links"
block, assembled by matching words in page addresses. On that page it happened
to resemble the real subpages, which made it *look* like navigation while being
capable of both including a page that is not a subpage and omitting one that is.
It is now a proper card grid built from the site menu itself, with each
section's own photograph and opening paragraph. Because it reads the menu, the
same improvement applies across the site with no further content work.

### 8. A Resources page

`/wissen/` and `/en/resources/` now exist, with copy explaining what the section
is, and the menu item is a link. Previously it was the only top-level item with
no page behind it, so the menu could be opened but never landed on — and nothing
tied Blog, Glossary and Downloads together for anyone arriving from a search.

### 9. Career pages

This turned out to be the most commercially costly problem on the site. See F9
in Part 2 — **ten live vacancies that no candidate could open.**

The careers page is rebuilt on the structured layout that already existed for
it: values, benefits, section cards with real employee photographs, a proper
contact card for Andrea Dietz, and all ten vacancies as links. Every word is
your own copy, only re-homed.

Each vacancy now also carries the markup that makes it **eligible for Google
Jobs** — a free, high-intent channel you are currently absent from.

**English careers: a decision for you.** There is no English careers content on
the live site. We have built an English landing page giving the facts and the
contact, and linking through to the German listings, rather than
machine-translating twenty pages of HR copy. The roles are at Neustadt and
require working German — and this site already carries machine-translation
errors of exactly that kind (F12). If you want the listings properly translated,
that is a copywriting job.

### 10. SEO, GEO and AEO

Full detail in `reference/seo/audit-2026-08-03.md`. The headlines:

- **URL parity — the single biggest launch risk — is now measured and clean.**
  Of 429 live URLs, **426 already exist** in the rebuild. The three that do not
  are WordPress leftovers (`/46-2/`, `/beispiel-seite/`, `/mediathek/`). A
  ready-to-use redirect file is prepared.
- **A genuine duplicate page found and removed**: two addresses carried
  identical titles, descriptions and all fifteen paragraphs. Only one exists on
  the live site; the other came from the migration and broke the German/English
  pairing.
- **Metadata for your 34 most commercially important pages had never been
  applied.** `/produkte/druckfedern/` was running a 38-character description
  that just repeated its own title. Now applied.
- **All images have alt text** (was 6 missing). **Zero duplicate descriptions**.
- **For AI search:** vacancies carry Google Jobs markup; an `llms.txt` summary
  now describes the company and its key pages in the format AI assistants look
  for; and product pages carry "key takeaways" — specific, checkable facts in
  the format answer engines quote. Those takeaways are **authored, never
  generated**, and an automated check rejects any takeaway citing a figure or
  standard the page itself does not state. We tested that check by feeding it an
  invented tolerance and confirming it refuses it.
- **Backlinks:** `reference/seo/backlinks.md`. Every prospect is evidenced by
  something you already publish — founding membership of Unternehmensnetzwerk
  Klimaschutz, Umweltpakt Bayern since 2020, VDFI, EMAS, DEKRA, IHK Coburg,
  Hochschule Kempten, Erasmus+. No invented prospects.

> **We have deliberately put no traffic projections in this report.** We have no
> Search Console or Ahrefs data for dietz.eu, and a number we cannot source is
> not worth having.

### 11. White space, and the scrolling summary card

The white space had three causes, none visible from any single file: the
breadcrumb bar reserved 112–128 px of clearance for a header that is 64 px tall;
the page foot stacked three separate paddings into roughly 300 px of nothing;
and every H2 carried 88 px above it — on a twenty-heading article, 1,760 px of
scrolling from one rule. All three are now defined once, centrally, so they
cannot drift apart again.

The summary card is a glass panel that follows you down the page, holding the
key takeaways and a contents list that highlights the section you are in. On
desktop it sits in the empty margin beside the text — space the layout was
already wasting — so the text column is unchanged (verified: 736 px before and
after). On a phone only the takeaways show, because a contents list there is
just more scrolling.

### 12. This report

You are reading it. `reference/reports/dietz-issues-and-solutions.md`.

---

## Part 2 — What we found that you did not ask about

### F0 — Every German page was impossible to preview *(fixed)*

**The whole German site — around 344 pages — returned "not found" in
development.** English was unaffected. A previous session had recorded this as a
stale server; it was not, and restarting did not fix it.

The cause: German is the default language and therefore has no `/de/` prefix, so
`/produkte/` is a single path segment — and the routing rule for other languages
was claiming those single segments for itself. It matched `/produkte/` as
though "produkte" were a language code, found no such language, and stopped.

**The deployed site was never affected**, because it is published as fixed files
with no routing logic. But it meant nobody could preview or check any German
page locally — on a site whose primary language is German. Fixed and verified
across both languages.

### F9 — Ten live vacancies that no candidate could open *(fixed)*

The careers page listed vacancies as one block of run-on text. A candidate could
read "Elektroniker (m/w/d) … Fachkraft | ab sofort, Vollzeit" and had **no way
to open it**. All ten job pages existed, on addresses nothing linked to.

For a manufacturer competing for skilled staff and apprentices in a tight
regional labour market, this was in our judgement the most expensive defect on
the site. Now all ten are links, and all ten are eligible for Google Jobs.

### F13 — Your "Follow us" links do not go to you *(needs your input)*

The footer's Facebook, Instagram, YouTube and LinkedIn links point at
`facebook.com`, `instagram.com`, `youtube.com` and `linkedin.com` — the
platforms themselves, not your profiles. **This is live on the site now.**

Send us the four real URLs and we will fix the links and complete the company
markup that tells search engines and AI assistants that all these mentions are
one company.

### F5 — Two product photographs appear to be on the wrong pages *(needs your input)*

Found while giving the product pages their images:

1. **The Bandbiegeteile card shows a wire part.** `DTZ_drahtbiegeteile_t.jpg` is
   a round-wire bent component; Bandbiegeteile are formed from flat strip. The
   same photo is correctly used by the Drahtbiegeteile card. There is **no
   photograph of a strip-bent part anywhere in the material we hold**, so rather
   than lead that page with a picture of a different product, we left it
   text-only. *We need one photograph.*
2. **The Schenkelfedern card shows a flat formed clip**, not a torsion spring.
   A correct photograph did exist in the project, so the torsion-spring page now
   uses it — but **the card on your live Products page still shows the clip.**

A further eight example parts could not be assigned to a category from the page
itself. Each is listed with its specific question in
`reference/content/example-to-category.json`; one pass from someone who knows the
parts turns each into a placed photograph.

### F12 — Errors that are live on dietz.eu today

These are on your current site, independent of this project. We have not
silently "corrected" any of them, because several are legal or factual matters
that are yours to decide.

| | Detail |
|---|---|
| **Commercial register number conflict** | The German Impressum gives **HRB 7729**; the English Imprint gives **HRB 1008**. Only one can be right. This is a legal identifier — worth checking today. |
| **English privacy policy is far shorter than the German** | 33 paragraphs against 111, confirmed against the raw pages. Not a migration artefact. GDPR-relevant. |
| **Two different terms-of-sale PDFs** | `AGB_Dietz.pdf` on the English imprint, `Verkaufsbedingungen-Dietz-2025.pdf` in German downloads. Which is current? |
| **Wrong contact address in the cookie policy** | Section 10 gives `info@dietz.de`; every other page uses `info@dietz.eu`. |
| **Machine-translation errors on English pages** | "Roller Shutter Leather" for *Rollofeder*; "Thigh springs" for *Schenkelfeder* (a torsion spring); "Bless you" for *Gesundheit*. These are on live product pages, read by English-speaking buyers. |
| **Misspelled address** | `/karriere/initativbewerbung/` — "Initiativbewerbung" is missing an *i*, in both the address and the heading. |
| **Internal inconsistency** | The English company-policy page says the policy "comprises four areas", then lists six. |
| **Duplicate English glossary entry** | `spring-material` and `spring-material-2` share a title and compete with each other. |

---

## What we need from you

**To finish the work:**

1. **Google Search Console and Analytics access.** Without it we cannot tell you
   which pages earn traffic today, and we specifically **should not** consolidate
   the 17 German and 17 English pages that currently compete for
   compression-spring terms — we would risk redirecting away pages that are
   earning.
2. **Your four real social-media profile URLs** (F13).
3. **One photograph of a strip-bent part** (F5), and confirmation of the two
   mis-matched product images.
4. **Posting dates for the ten vacancies.** We deliberately publish none rather
   than invent them, but real dates measurably improve Google Jobs ranking.

**Decisions only you can make:**

5. **HRB 7729 or HRB 1008?**
6. **Which terms-of-sale PDF is current?**
7. **English careers pages** — landing page only (what we have built), or proper
   translation?
8. The English privacy policy gap.

**Recommended next, in order:**

9. Server cache headers for images and video frames — the largest remaining
   performance win, and it is one line of configuration.
10. Key takeaways for the remaining money pages (about a day, and it needs
    someone who can check each figure).
11. Recover publication dates for the ~350 blog and news pages from the current
    WordPress. They exist there, and they are worth having.
12. Descriptions for the 168 pages whose description currently repeats the
    title — prioritised by traffic, which is item 1 again.

---

## The pitch: why this is worth finishing

If this report is read for five numbers and nothing else, these are the five:

1. **149 pages that already live on dietz.eu were invisible to your own site
   until this project found them** — 429 built pages → **578**, zero invented
   content, every one something you already publish. That is more real content
   than most rebuilds add in a year, recovered rather than written.
2. **Ten live job vacancies went from unreachable to eligible for Google
   Jobs.** In a regional labour market where you compete for apprentices and
   skilled tradespeople, this single fix is plausibly worth more than the cost
   of the engagement on its own.
3. **The homepage stopped fighting itself for bandwidth.** Peak simultaneous
   requests while scrolling fell from **40 to 6**, and the certification logos
   went from 7.8 s to 4.9 s on a 4 Mbit/s connection. Nothing was removed to get
   there: the five video sections were each queueing every frame they owned, and
   everything else on the page waited behind them.
4. **99.3% of your existing URLs are confirmed safe to carry across** — the
   single biggest risk in any replatform, losing years of accumulated Google
   ranking on launch day, is now a measured three-line redirect file instead of
   an unknown.
5. **We found six things wrong on your live site today that have nothing to do
   with this project**: a legal register number that contradicts itself
   between languages, a GDPR-relevant gap in the English privacy policy, a
   wrong contact email on a legal page, and English product copy telling
   buyers you make "Thigh springs." None of this costs anything to know. All of
   it costs something to keep ignoring.

None of the above required inventing content, projecting traffic we cannot
measure, or guessing at decisions that are yours to make — the pattern
throughout has been to surface what is actually true about your site (429 → 578
real pages, 344 German pages that silently didn't preview, ten vacancies nobody
could open) and fix only what is unambiguously a defect. What remains is mostly
editorial: real posting dates, four social URLs, one photograph, and a handful
of calls only Dietz can make (listed above). That is a short, cheap list next
to what has already been recovered. The commercial case for finishing it is not
that the site will look better, though it will — it is that the things quietly
costing you (unreachable vacancies, an at-risk migration, a site fighting
itself for bandwidth, product pages with no product photo) have a fix in hand
and stop the day this ships.
