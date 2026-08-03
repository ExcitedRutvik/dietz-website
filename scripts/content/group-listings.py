#!/usr/bin/env python3
"""Give the Resources listings an index instead of one long scroll.

Blog is 121 rows, News 91, Glossar 47, Downloads 33 — all rendered as a single
flat list, which is fine to skim once and useless to navigate. Nothing on these
rows carries a date (verified: zero `date:` fields across all four), so grouping
by year is not available. What *is* available:

  - **By subject** for Glossar and Blog. Alphabetical filing was tried first and
    is simply wrong for this content: 31 of the 46 glossary terms are "Feder-"
    compounds, so A-Z yields one bucket of 31 and a scattering of ones, and on
    the blog 45 of 120 titles begin "Die"/"Der"/"Das". Filing on the first
    significant word fixes the second problem and not the first. Subject
    grouping fixes both, and is what a reader browses by in any case.

    The blog additionally carries a supplier-selection cluster the glossary does
    not ("Finden Sie den richtigen Hersteller für Druckfedern"), tested first so
    those posts are filed by the reader's intent rather than by whichever part
    the headline happens to name.
  - **By document type** for Downloads, from the words in the title. A download
    misfiled between "Certificates" and "Brochures" costs a reader one extra
    glance, which is the right risk to take for a real index — but anything the
    rules do not clearly match falls into an explicit "Weitere"/"Other" bucket
    rather than being forced into a category.

News keeps its published order: it is chronological by nature, and alphabetising
announcements would destroy the only ordering it has.

Idempotent.
"""
import glob
import re
import sys

ROOT = "src/content/pages/article"

# Slug -> strategy. Anything not listed here is left alone.
GLOSSARY = {"glossar", "glossary"}
BLOG = {"blog"}
DOWNLOADS = {"downloads"}

# Glossary topics. Alphabetical filing collapses here whatever you do: 31 of the
# 46 German terms are "Feder-" compounds, so an A-Z index is one bucket of 31
# and a scattering of ones. What a reader actually browses by is subject.
# Ordered specific-to-general; first match wins.
GLOSSARY_RULES = [
    ("Musterbau & 3D-Druck", "Prototyping & 3D printing",
     r"muster|handmuster|3d-druck|3d print|metalldruck|metal print"),
    ("Prüfung & Normen", "Testing & standards",
     r"prüfung|testing|norm|standard|kennzeichnung|marking"),
    ("Werkstoffe", "Materials",
     r"material|werkstoff|stahldraht|steel wire|draht|wire|beschichtung|coating"),
    ("Fertigung", "Manufacturing",
     r"herstellung|manufactur|montage|assembly|installation|windeautomat|coiling"),
    ("Belastung & Verhalten", "Load & behaviour",
     r"beanspruchung|belastung|load|stress|vorspannung|preload|reibung|friction|geräusch|noise|festigkeit|strength"),
    ("Auslegung & Berechnung", "Design & calculation",
     r"berechnung|calculat|design|rate|konstante|constant|steifigkeit|stiffness|charakteristik|characteristic|kraft|force|abmessung|dimension|länge|length"),
    ("Federtypen", "Spring types",
     r"feder|spring|stößel|plunger"),
]

# The blog covers the same subject space as the glossary, so it reuses those
# rules — but it also carries a cluster the glossary does not: posts written for
# someone choosing a supplier ("Finden Sie den richtigen Hersteller für
# Druckfedern", "Federn nach Maß"). That is a different reader with a different
# intent, and it has to be tested *before* the spring-type rule, or every one of
# those posts is filed by the part it happens to name.
BLOG_RULES = [
    ("Hersteller & Beschaffung", "Suppliers & sourcing",
     r"hersteller|lieferant|supplier|manufacturer|nach maß|maßgefertigt|maßgeschneidert|custom|auswahl eines|finden sie"),
] + GLOSSARY_RULES

# Document types, most specific first — the first rule that matches wins, so
# order is the tie-breaker and is deliberate.
DOC_RULES = [
    ("Zertifikate", "Certificates", r"zertifikat|certificate|emas|iatf|iso\s?\d|ecovadis"),
    ("Bedingungen & Formulare", "Terms & forms", r"bedingung|agb|terms|conditions|formular|erklärung zur|proposition"),
    ("Broschüren", "Brochures", r"broschüre|brochure|flyer|imagebro"),
    ("Berichte", "Reports", r"bericht|report|umwelterklärung|nachhaltigkeitsbericht"),
    ("Werkstoffe & Compliance", "Materials & compliance", r"mica|seltene erden|rare earth|reach|rohs|konflikt|conflict"),
]



def topic_group(title: str, locale: str, rules, fallback_de: str, fallback_en: str) -> str:
    low = title.lower()
    for de, en, pattern in rules:
        if re.search(pattern, low):
            return de if locale == "de" else en
    return fallback_de if locale == "de" else fallback_en


def doc_group(title: str, locale: str) -> str:
    return topic_group(title, locale, DOC_RULES,
                       "Weitere Dokumente", "Other documents")


def main():
    changed = 0
    for f in sorted(glob.glob(f"{ROOT}/*.ts")):
        s = open(f).read()
        slug_m = re.search(r'\n  slug: "([^"]*)"', s)
        loc_m = re.search(r'\n  locale: "(\w+)"', s)
        if not (slug_m and loc_m):
            continue
        slug, locale = slug_m.group(1), loc_m.group(1)
        if slug in GLOSSARY:
            mode = "glossary"
        elif slug in BLOG:
            mode = "blog"
        elif slug in DOWNLOADS:
            mode = "docs"
        else:
            continue

        n = [0]

        def add_group(m):
            line = m.group(0)
            if "group:" in line:
                return line
            title_m = re.search(r'title: "((?:[^"\\]|\\.)*)"', line)
            if not title_m:
                return line
            title = title_m.group(1)
            if mode == "glossary":
                g = topic_group(title, locale, GLOSSARY_RULES,
                                "Weitere Begriffe", "Other terms")
            elif mode == "blog":
                g = topic_group(title, locale, BLOG_RULES,
                                "Weitere Beiträge", "Other posts")
            else:
                g = doc_group(title, locale)
            n[0] += 1
            return line.replace(
                f'title: "{title}"', f'title: "{title}", group: "{g}"', 1
            )

        out = re.sub(r"^    \{ title: .*\},$", add_group, s, flags=re.M)
        if n[0]:
            open(f, "w").write(out)
            changed += 1
            print(f"  {f.split('/')[-1]:<24} {mode:<6} {n[0]} row(s) grouped")

    print(f"grouped {changed} listing(s)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
