# Findings log — running notes for the client report (item 12)

Appended to as work proceeds. Phase 8 turns this into
`dietz-issues-and-solutions.md`.

## F1 — Every German route 404'd in local development (fixed)
**Observed.** `next dev` returned 404 for all ~344 German URLs — `/produkte/`,
`/branchen/`, `/kontakt/`, everything except the bare `/` homepage. English
was unaffected. A previous session recorded this as a "stale dev server"; it
was not, and restarting did not fix it.

**Cause.** `src/app/[locale]/` was a single dynamic route segment. German is
the default locale and therefore unprefixed, so `/produkte/` is one path
segment — and a dynamic segment out-specifies the `(default)/[...slug]`
catch-all that was supposed to serve it. Next matched `locale="produkte"`,
found no such entry in `generateStaticParams`, and with `dynamicParams = false`
returned 404 instead of falling through.

**Impact.** Development-only. The deployed site is a static export, which
writes real files and never runs the router, so `.next-prod/produkte/index.html`
existed and the live site was fine. But it made the entire German site — the
primary locale — impossible to preview or QA locally.

**Fixed.** Replaced the dynamic `[locale]` segment with a concrete `src/app/en/`
folder, so a literal segment wins and nothing competes. Shared route bodies
moved to `src/lib/pageRoutes.tsx`. Verified: 30/30 sampled routes across both
locales return 200.

## F2 — Homepage image loading was starved by the scroll-video frame queue (fixed)
**Observed.** Images arrived slowly or intermittently across the homepage, worst
of all the certification marks near the foot of the page.

**Cause.** Each of the five scroll-video sections queued *every* frame it owned
and drained that queue with its own pool of 8 concurrent fetches — and never
released the downloaded data. Fully scrolled, the homepage issued **824 requests
for ~67 MB** and held all of it for the lifetime of the page. Everything else
competed with that. The certification marks are 8 files totalling **64 KB**;
they were never slow, they were queued behind 67 MB of video frames.

**Fixed.** Replaced the five independent fetch pools with one budgeted scheduler
(`src/components/scroll/frameFetchScheduler.ts`) shared by the whole page, and
gave each sequence a bounded window that follows the reader instead of a queue
of everything. A coarse "spine" of every 16th frame is retained so jumping
straight to a section still lands on real footage. Also: deleted a dead 5.4 MB
`hero.mp4` that no code path referenced, stopped the four below-the-fold section
posters being fetched eagerly on mobile (~1 MB), and preloaded the hero poster,
which is the page's actual LCP element but was only requested after hydration.

**Measured**, homepage scrolled to the certifications section, 4 Mbit/s
throttled, 1440x900:

| | before | after |
|---|---|---|
| peak concurrent frame requests | 40 | **6** |
| mean cert-mark fetch wait | 7,849 ms | **4,899 ms** |
| slowest cert mark | 17,583 ms | **14,892 ms** |

Unthrottled, full scroll: **824 frame requests -> 620**, peak concurrency
**24 -> 6**. Repeatable via `node scripts/perf/frame-budget.cjs --scroll --throttle`.

**Still outstanding (deploy-side, not in the repo):** `/frames/` and `/images/`
should be served with `Cache-Control: public, max-age=31536000, immutable`.
67 MB revalidating on every visit outweighs every optimisation above.

## F3 — Landing-page card grids left visible grey rectangles (fixed)
**Observed.** A blank area after the industry cards, and a large empty area
beneath the Quality and Logistics cards on Services.

**Cause.** One bug, not two. The card grid was a fixed three-column layout, and
it draws its dividing rules by showing the container's grey through a 1px gap
with each tile's white masking the rest. That is efficient, but it means a cell
with no card in it is **not whitespace — it is a grey rectangle**. Five industry
cards in three columns left one; four service cards left two.

**Fixed.** Column count is now derived from the card count so the last row is
always full (`src/lib/gridPlan.ts`), with an optional authored `span` for
editorial emphasis. Industries: Automotive is now a `span: 2` feature tile,
image and copy side by side — 5 cards + 1 double = 6, which fills two rows of
three exactly, as requested. Services: four cards now lay out 2x2.

Also caught in the same pass: spans originally only applied at desktop width,
so at tablet width an odd card count still orphaned the last tile. Both
breakpoints are now covered, and `node scripts/content/check-grids.mjs` fails
the build if any hub page reintroduces a gap.

## F4 — English Industries page repeated a card's text as its introduction (fixed)
**Observed.** `/en/industries/` opened with two paragraphs; the second was
word-for-word the body of its own "Medical technology" card.

**Cause.** A migration artefact — the German page has only the one introductory
paragraph. The card's copy had leaked upward into the page intro.

**Fixed.** Removed, so EN now matches DE.

## F5 — Product sub-pages had no images at all (fixed, 2 deliberate exceptions)
**Observed.** The Products landing page showed a photo for every category, but
19 of the 27 category pages behind those cards opened as walls of text.

**Cause.** The photographs those pages originally referenced are dead 2016
WordPress uploads that did not survive the migration.

**Fixed, without inventing anything.** Two mechanical passes:
- Each hub card already asserts a photo for its category — an editorial
  decision Dietz made. `lead-image-from-hub.py` reads that existing statement
  backwards and makes it the target page's lead image. Alt text is the target
  page's own H1, verbatim.
- 44 separate example pages each hold one photographed, correctly attributed
  part, and nothing linked them to the categories they belong to.
  `link-product-examples.py` now gives 17 category pages a gallery of the real
  parts in that category, every field copied verbatim from the example page.
  This also answers the complaint that industry sub-pages link through to
  product pages with no product content.

Result: product pages with no image went **19 to 2**.

**Two things we found and deliberately did not paper over:**
1. **The Bandbiegeteile card shows a wire part.** `DTZ_drahtbiegeteile_t.jpg` is
   a round-wire bent component; Bandbiegeteile are formed from flat strip. The
   same photo is correctly used by the Drahtbiegeteile card. There is **no
   strip-bending photograph anywhere in the supplied material**, so rather than
   lead the strip-bending page with a picture of a different product, we left it
   text-only. *We need a photograph of a strip-bent part.*
2. **The Schenkelfedern card shows a flat formed clip** (`DTZ_rollofederjpg.jpg`),
   not a torsion spring. The repo does contain a correct one
   (`DTZ-schenkelfederLeuchten.jpg`, a coil with two legs), so the torsion-spring
   page now leads with that. *The card on the Products page still shows the clip
   — worth correcting on the live site too.*

Eight further example parts could not be assigned to a category from the page
itself and are listed, with the specific question for each, in
`reference/content/example-to-category.json`. One pass of confirmation from
Dietz turns each into a placed photograph.

## F6 — Film stills for pages with no photography of their own
Two stills were cut from the 90-year company film to illustrate pages that had
no image (`scripts/video/extract-stills.py`, picks recorded in
`still-list.json`). The rule applied throughout: **a film still is never
captioned as a specific part.** It shows a facility, a machine, or people at
work — product photography only ever comes from pages that carry a verified
attribution. Each pick records what the shot actually depicts, so the choice is
checkable rather than trusted.

The source film is 380 MB and is kept outside the repository at
`/home/ubuntu/media/dietz/`; the extracted stills are committed.

## F7 — "Resources" was a menu heading with nothing behind it (fixed)
**Observed.** The main menu offered Blog, Glossary, Downloads and News under a
"Wissen"/"Resources" heading, but the heading itself was not clickable.

**Cause.** It was the only top-level menu item with no page behind it, so it
rendered as an inert label. A visitor could open the menu but never land on the
section, and nothing tied the four together for anyone arriving from search.

**Fixed.** Built `/wissen/` and `/en/resources/` as proper section pages with
introductory copy explaining what the cluster is, and made the menu item a link.
All seven top-level menu items are now links.

## F8 — Company page: image position and subpage navigation (fixed)
**Observed.** The photograph of the building sat at the very bottom of the page;
the list of subpages was small and hard to read.

**Fixed.** The building photograph now sits between the H1 and the
"Leistungsfähig und kompetent – seit 90 Jahren" heading, as requested.

The subpage list was not navigation at all — it was the "related links" block,
assembled by matching words in page addresses. On this page that happened to
approximate the real children, which made it *look* like navigation while being
capable of both including a page that is not a child and omitting one that is.
It is now a proper card grid built from the site menu itself, so it can never
disagree with the header, and it shows each section's own photograph and
opening paragraph. Because it reads the menu rather than the page, the same fix
applies to Products, Industries, Services, Career and Resources with no content
changes at all.

*Minor, worth a decision:* Unternehmenspolitik and Partner & Mitgliedschaften
both lead with the same photograph of the building, so their cards look alike.
Distinct images for those two pages would help.

## F9 — Ten job vacancies were published but unreachable (fixed)
**Observed.** The careers page listed vacancies as one block of run-on text — a
candidate could read "Elektroniker (m/w/d)… Fachkraft | ab sofort, Vollzeit"
and had no way to open it.

**Cause.** All ten job pages existed, but on flat addresses with nothing linking
to them. The migration had flattened the careers page into 59 undifferentiated
blocks: the seven company values became seven bare paragraphs, the eleven
benefits became eleven heading-and-paragraph pairs, the HR contact became a
paragraph followed by a bullet list containing a phone number, and the
vacancies became one list of run-on strings.

**Impact.** Every vacancy was invisible to candidates and to search engines. For
a manufacturer competing for skilled staff and apprentices in a tight regional
labour market, this was probably the single most commercially costly defect
found.

**Fixed.** The careers page is rebuilt on the structured template that already
existed for it: values, benefits, section cards with real employee photography,
a proper contact card for Andrea Dietz, and all ten vacancies as **links**, each
labelled with its type and hours. Every word is the live site's own copy, only
re-homed.

Each vacancy now also carries `JobPosting` structured data, which makes them
eligible for **Google Jobs** — a free, high-intent channel Dietz is currently
absent from. We deliberately do **not** publish a posting date, because the live
site does not state one and an invented date would put the whole feed at risk.
*If you can supply posting dates, we will add them — it materially improves
ranking in Google Jobs.*

## F10 — English careers
There is no English careers content on the live site. We have built an English
careers landing page giving the facts, the benefits and the HR contact, and
linking to the German listings, rather than machine-translating twenty pages of
HR and contractual copy. **This is a decision to confirm.** The roles are at the
Neustadt bei Coburg plant and require working German, and this project has a
documented record of machine-translation errors on exactly this kind of copy
(see F12). If you would like the listings translated properly, that is a
copywriting job, not a technical one.

## F11 — Excess white space, and a scrolling summary card (done)
**Observed.** Too much empty space on every page.

**Cause, measured rather than guessed.** Three separate rules that no single
file could see at once:
- The breadcrumb bar reserved 112–128px of clearance for a header that is 64px
  tall — roughly 50px of pure surplus at the top of **every** page.
- The page foot stacked three independent paddings: the template's own, the
  related-links margin, and the page wrapper's. Together ~304px of nothing.
- Every H2 carried 88px of space above it. On a 20-heading article that is
  1,760px of scrolling from one rule.

**Fixed.** Spacing is now defined once as tokens (`--header-h`,
`--space-page-bottom`, `--space-section`) rather than as literals repeated
across seven templates, so it cannot drift apart again. Top clearance is now
derived from the header height (88px). The page foot is owned in one place
(~160px). Each H2 now takes 72px. Verified in the browser, not assumed.

**The summary card.** Content pages now carry a glass-morphic card that tracks
your position as you scroll. It holds two things:
- **Key takeaways** — three to five specific facts (tolerances, wire standards,
  alloys). This is the format AI answer engines and Google's featured snippets
  lift verbatim, which is why it is authored rather than generated: a wrong
  tolerance quoted back as Dietz's specification would be worse than no answer
  at all. `scripts/content/check-takeaways.py` fails the build if a takeaway
  cites a figure or standard the page itself does not state — we verified the
  check by feeding it an invented tolerance and confirming it rejects it.
- **A contents list**, derived automatically from the page's own headings, with
  the current section highlighted as you scroll.

On desktop the card sits in the empty gutter beside the text — space the layout
was already wasting — so the reading column keeps its exact measure (verified:
736px before and after). On narrower screens only the takeaways show, inline,
because a contents list on a phone is a scroll tax.

**Status:** the mechanism is complete and live on the compression-spring pages.
Takeaways still need authoring for the remaining money pages — roughly a day of
work, and it must be done by someone who can check each figure against the page.

## F14 — The German and English company pages disagree on headcount
**Observed.** `/unternehmen/` states **170 Beschäftigte**; `/en/enterprise/`
states **160 employees**. Same page, same paragraph, two different numbers.

**How we found it.** Not by reading — by the automated check that verifies key
takeaways against the page's own body copy. We wrote "170 employees" into the
English summary, and the check rejected it because the English page does not say
170. That is the check doing exactly the job it exists for.

**Impact.** Low individually, but it is a factual claim about the company that
differs by language, and it is live now. It also sits alongside the commercial
register conflict (F12) as evidence that the two language versions have drifted
apart over time rather than being maintained together.

**Status.** Each summary now quotes its own page, so nothing we publish
contradicts the page it sits on. **Which number is correct is yours to confirm**
— we have not silently changed either page.

## F15 — Follow-up round (3 August 2026)

Nine adjustments requested after reviewing the work above. Two of them turned
out to be regressions we had introduced earlier in the same day, both caused by
the same class of mistake — a CSS rule that looked right and silently did
nothing.

**Bottom spacing had stopped working entirely (items 4 and 8).** Consolidating
the page-foot padding into one place was correct, but it was written as
`pb-[--space-page-bottom]`, and Tailwind v4's bracket syntax expects a *value*,
not a bare custom property. It compiled, shipped, and computed to **0px**, so
every content page's last line butted into the footer. Now `pb-(--space-page-bottom)`,
verified as 80px on every page type, and moved outside the related-links block
so a page with no related links (a hub such as `/en/resources/`) still gets it.

**The summary card was not scrolling with the page (item 5).** `.glass-panel`
sets `position: relative` for its bevel layer, and because that class is defined
after Tailwind it beat the `sticky` utility — so the rail sat still while the
page moved past it. `sticky` now lives on a plain wrapper, so neither rule has
to know about the other. Verified: the card travels with the reader and stops at
the end of the body copy.

**Also fixed:** the hero card's white glare (two bright layers were stacked in
the same corner, which read as frost rather than glass); the homepage Automotive
and White Goods tiles, which showed part close-ups while the Industries page
showed a vehicle and appliances for the same industries — the strip now reads
the Industries page's own cards so the two cannot disagree again; the Products
mega-menu, which ran to the page edge; separation above the "Sections" heading;
and the summary card now appears on content-rich pages such as Company.

**Navigation active state (item 9):** the current section is highlighted in
brand blue, including when you are on a sub-page — Industries stays lit on
`/branchen/automotive/`, Services on `/materialauswahl/`, Company on Partners.
Verified across all seven sections. On mobile the current section's menu group
also opens by default.

**One further content bug surfaced by this work — see F14:** the German company
page says 170 employees, the English says 160.

## F16 — Second follow-up round (3 August 2026)

**White goods image (both locales now agree).** The German Industries page used
the appliance line-up; the English used a photograph of a single torsion spring.
Because the homepage strip now reads the Industries cards, correcting the
English card fixed the English homepage at the same time.

**Banners were published below the body copy.** 15 pages carried their wide
establishing photograph *after* the prose — on an industry page the reader met
it only on the way to the parts gallery, having already read everything it was
meant to introduce. `scripts/content/lift-banners.py` moves them to sit directly
under the H1.

It decides by shape, not by position, and that distinction matters: **the ten
job-posting pages also end with an image, and that image is Andrea Dietz's
photograph** — a contact sign-off that is correctly placed at the foot. Banners
are panoramic (about 3.2:1); portraits and product shots are not. 15 moved, 18
correctly left alone.

**Summary rail extended to leaf and long-tail pages.** On an industry or service
page a contents list of its own two headings is not navigation; the useful
answer is the rest of the set. The rail now offers sibling pages, read from the
menu. On the ~250 glossary, blog and download pages — which sit on flat
addresses with no parent in the URL — it offers the other entries filed under
the same subject, so a reader arriving from a search result finally has a route
onward other than the back button.

**English Careers keeps its redirect and gains a bridge.** The rail lists the
German careers sections under English headings, each marked **DE** so the
language change is visible before the click rather than discovered after it.

**Resources listings gained a real index — and the obvious approach turned out
to be wrong twice:**
- Filing the blog A–Z put **45 of 120 posts under D**, because that is how many
  German titles begin "Die"/"Der"/"Das". Now filed on the first significant
  word; the largest bucket is 16.
- Filing the glossary A–Z put **31 of 46 terms under F**, because nearly all are
  "Feder-" compounds. Alphabetical cannot work there at all, so the glossary is
  grouped by subject instead — spring types, design and calculation, materials,
  manufacturing, testing and standards, load behaviour, prototyping — splitting
  it 3–9 per bucket with nothing left unclassified.
- Downloads group by document type, with an explicit "other" bucket rather than
  forcing an uncertain match.

## F17 — Third follow-up round (3 August 2026)

**The summary card now leads with substance, not navigation.** Sibling links
were the wrong thing to put first: they tell a reader where else they could go,
not what the page in front of them says. The card now reads **key takeaways →
summary → contents → section links**, with the navigation kept but subordinate.
An authored `summary` field was added for this, deliberately distinct from the
page `intro` (which renders under the H1 — repeating it in a card sitting beside
it would read as a duplication bug). Written for all 18 Industries and Services
sub-pages.

**Blog grouping redone by subject.** Alphabetical was wrong for the same reason
it was wrong on the glossary, and the fix is the same: the blog now uses the
glossary's subject rules plus one it needs and the glossary does not — a
supplier-selection cluster ("Finden Sie den richtigen Hersteller für
Druckfedern"). That cluster is tested first, or every such post gets filed by
whichever part its headline happens to name rather than by what the reader is
actually trying to do.

## F18 — The Automotive pages had lost their body copy entirely (fixed)
**Observed.** `/branchen/automotive/` and `/en/industries/automotive/` carried
two headings and **not one paragraph**. The busiest industry page on the site
was two words of text.

**How we found it.** Again by the takeaways check. We wrote "a reliable partner
since 1928" into the summary, and it was rejected because the page does not say
1928 — it does not say anything. The claim came from the card on the Industries
page, not from the page itself.

**Fixed.** Restored from the crawl of the live site held in `reference/`: four
paragraphs on the German page, six on the English. The two languages genuinely
differ in length on the live site, so they were restored separately rather than
one being translated to match the other.

*Note for the record:* the first restoration attempt copied raw markdown markers
("### H1: Automotive …") into the English page as body text, because the English
and German crawl files are structured differently. Caught before it went
anywhere, and worth stating plainly: automated content restoration needs its
output read, not just its exit code.

**Also:** the first heading on a page no longer draws its own rule directly
beneath the page header's, which had been stacking two hairlines a few pixels
apart on every page whose body opens with a heading.
