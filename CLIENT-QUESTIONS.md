# Open questions for Dietz — to send once the site is done

Items we deliberately left matching the current live site, pending confirmation.
Each notes exactly what we ship today so the change is a one-line edit later.

## 1. Commercial register number conflicts between locales
The German Impressum and the English Imprint give **different HRB numbers**:

| Page | Value |
|---|---|
| `/impressum/` (DE) | **HRB 7729** |
| `/en/imprint/` (EN) | **HRB 1008** |

Only one can be correct. **Currently shipped: both, exactly as they appear on the
live site today** — DE keeps 7729, EN keeps 1008, so we are not silently picking
a winner on a legal identifier.

*Where to change:* `src/content/pages/legal/impressum.de.ts` and
`impressum.en.ts`.

## 2. Contact email on the cookie policy
Cookie policy §10 gives **`info@dietz.de`** (.de) while every other page on the
site uses **`info@dietz.eu`** (.eu). Almost certainly a typo in the cookie-
consent plugin's template, but it is a contact address on a legal page, so we
have not changed it unilaterally.

**Currently shipped: `info@dietz.de`, as on the live site.**

*Where to change:* `src/content/pages/legal/cookie-richtlinie.de.ts`.

## 3. English privacy policy is substantially shorter than the German one
Not a migration bug — the live site itself is like this. Measured against the
live pages' raw HTML:

| Page | Paragraphs |
|---|---|
| `/datenschutzerklaerung/` (DE) | **111** |
| `/en/privacy-policy/` (EN) | **33** |

Both are now transcribed verbatim and in full, so the rebuild faithfully
reproduces each. But the English version is missing roughly two thirds of the
German policy's substance. **This is GDPR-relevant** and wants a professional
translation of the full German text rather than a machine translation — we have
deliberately not auto-translated legal copy.

## 4. AGB / terms — RESOLVED, no longer a question (recorded for the audit trail)
Two different terms PDFs were linked from the live site. We compared them:

| | `AGB_Dietz.pdf` | `Verkaufsbedingungen-Dietz-2025.pdf` |
|---|---|---|
| Entity named | "Federnfabrik Dietz GmbH" (former name) | "Dietz GmbH" (current) |
| Version / date | Version 2.2 | "Stand: 31.05.2025" |
| PDF created | 2003-04-11 (mod. 2004) | 2025-06-06 |
| Pages | 3 | 8 |

The 2025 document is unambiguously current. **The rebuild links
`Verkaufsbedingungen-Dietz-2025.pdf`.** Worth telling Dietz that the 2003 file
is still linked from their English imprint and should be retired.

A third, separate document also exists — `Allgemeine-Einkaufsbedingungen.pdf`
(*purchasing* terms, for suppliers). Different document, not a duplicate; not
linked in the footer.

## 4b. Missing product photography (needs new assets from Dietz)
A set of product photos uploaded in 2016 no longer exists on dietz.eu — the URLs
301-redirect to the homepage, so the images are broken on the live site too.
The rebuild therefore ships these pages without photography:

- Hybrid assemblies (DE + EN) - 5 photos (`Baugruppen-Montage-*`)
- Schenkelfedern / torsion springs - 8 photos
- Compression springs, special packaging, and several other product categories

**These pages are currently text-only.** They read fine, but a product page with
no product photo is weak for a procurement audience. Ask Dietz for replacement
photography, or for permission to reshoot.

## 5. Other live-site copy issues we preserved rather than "fixed"
Small things that are the client's call, all currently shipped as-found:
- `/karriere/initativbewerbung/` misspells "Initiativbewerbung" in both the URL
  and the page heading.
- `fachkraefte` reads "Ihr Ansprechpartnerin" (should be "Ihre").
- `unternehmenspolitik` (EN) says the policy "comprises four areas" then lists
  six; the German page says six.
- EN downloads page: "California Propositiono 65", "Per- und
  Plyflouralkylsubstances".
- Career consent checkboxes have no label text on the live site — only a "Zum
  Datenschutz" link. Shipped as-is; wants real label text before launch.

## 6. Machine-translation errors we DID correct
These were unambiguous mistranslations verified against the German source, so we
fixed them rather than shipping nonsense:
- "Bless you" → **Health** (German: *Gesundheit*; the English icon file is even
  named `..._gesundheit.png`)
- "Roller Shutter Leather" → **Roller blind spring** (German: *Rollofeder*) ×2
- "Thigh leather" / "Thigh springs" → **Torsion spring(s)** (German:
  *Schenkelfeder(n)*) ×5
