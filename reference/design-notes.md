# Design & Content Notes — dietz.eu (for redesign reference)

Synthesized from the full 430-page crawl (223 DE + 206 EN pages, [INDEX.md](INDEX.md)). These are patterns and issues that recur across many pages, not worth repeating in every individual page file.

## Platform / stack observations
- Site runs **WordPress + Avada/Fusion Builder** (mega-menu classes `fusion-dropdown-menu`/`fusion-dropdown-submenu`, `fusion-standard-logo`, `article.hentry` blog template) with **WPML** for the 5-language setup.
- Site appears mid-relaunch: many asset/image URLs point at a `relaunch.dietz.eu` staging subdomain. **That subdomain no longer resolves in DNS at all (confirmed NXDOMAIN)** — every one of those assets had to be substituted with the equivalent path on production `www.dietz.eu`, which mirrors the same media library. Not an issue for the redesign, but explains inconsistent host references seen inside page HTML/source.
- Several H1 titles are self-wrapped in `<a>` tags pointing to stale `relaunch.dietz.eu/<german-slug>/` URLs (an Avada page-title-bar quirk) — cosmetic markup noise, not real navigation.

## Recurring UI patterns
- **CTA pattern**: almost every page (both languages) uses the same embedded **Typeform** widget (`data-tf-live` id `01HHYPGYGQFR0BRFHV2WWR2ZEF`) behind a button labeled "Jetzt unverbindlich Kontakt mit uns aufnehmen" (DE) / "Contact us now" (EN). This is effectively the site's universal lead-gen CTA — worth treating as a single reusable component in the rebuild rather than per-page content.
- **Sitewide chrome images** (logo, 4 language flag icons, ~8-10 certification/quality badges — DEKRA ISO 9001, DEKRA IATF 16949, ISO 14001:2015, EMAS, Umweltpakt Bayern, DIHK, "Klimaneutrales Bayern 2040", UMPreis 2023/2024, EcoVadis Bronze, AEO) recur on nearly every page footer and are already captured once in `assets/logo/` and `assets/images/{de,en}/` — no need to treat them as page-specific content.
- The `/kontakt/` (DE) page is the one exception with a **native HTML contact form** (name, company, email, phone, consent checkbox) rather than the Typeform embed.
- `/downloads/` links to roughly 30 PDFs (datasheets/certificates) — worth a dedicated downloads/resources section in the redesign rather than a flat list.
- Blog/glossary articles are heavily **templated SEO content**: title + H1 + a handful of H2 sections + closing CTA, with no in-body images or video on the vast majority (only the sitewide chrome images appear). Good candidate for a single article template in the rebuild.
- One large **company video** is linked (not embedded as a normal player) from the `/unternehmen/` page: `https://www.dietz.eu/wp-content/uploads/2023/12/DIETZ-firmenvideo.mp4` (~380MB) with poster image `Bildschirmfoto-2023-12-18-um-09.58.06.png` (captured). Not downloaded (out of scope for an image archive) — link and poster are recorded in `pages/de/unternehmen.md`.
- No YouTube/Vimeo iframe embeds were found anywhere in the crawl — video is not otherwise used on the site.

## Content bugs / gaps found on the live site (worth fixing in the rebuild, not scraping artifacts)
1. **Translation gap**: the English contact form (`pages/en/contact.md`) still shows German placeholders ("Vorname Nachname", "Firmenname") and a German submit button ("Anfrage absenden").
2. **Duplicated paragraph**: `pages/en/wire-bending-parts-manufacturer.md` — a bolded lead-in paragraph under "Advantages of Choosing a Leading Wire Bending Parts Manufacturer" is repeated verbatim as a list item. Confirmed present in the live HTML, not a scraping error.
3. **Dead images** (8 confirmed, all same root cause): URLs under `/wp-content/uploads/2016/05/Baugruppen-Montage-000{1,2,3,6,7}-WEB.jpg` (and a few siblings) now 301-redirect to the homepage on `www.dietz.eu`, and the `relaunch.dietz.eu` fallback no longer resolves — these images are genuinely gone from the live site. Flagged inline in `pages/en/products/hybrid-assemblies.md` and `pages/en/products/special-packaging.md`. Real replacement photography will be needed for these in the redesign.
4. **Blog archive isn't paginated**: `/blog/` and `/en/blog/` render ~120 article-card teasers in a single page load with no pagination markup — captured as a flat link list rather than structured content (see `pages/de/blog.md` / `pages/en/blog.md`).
5. A few stub/placeholder pages exist in the sitemap that carry little real content: `pages/de/46-2.md` (thin stub, mostly nav/footer) and `pages/de/beispiel-seite.md` (default WordPress "Sample Page" — likely safe to drop in the rebuild rather than migrate).

## Asset notes
- 132 unique image files downloaded into `assets/images/{de,en}/` (86 jpg, 41 png, 5 svg), all verified as valid non-zero-byte images.
- A handful of certification-badge images (DEKRA, AEO, ISO 14001, UMPreis 2023) are byte-identical between the `de/` and `en/` folders (same sitewide chrome, downloaded once per language crawl) — harmless duplication, not worth restructuring, but a shared `assets/images/common/` folder would be the cleaner home for these if reorganizing during the rebuild.
