// Copy transcribed verbatim from reference/pages/de/index.md (https://www.dietz.eu/).
// Do not paraphrase; this is the live site's approved German wording. As with
// the English file, the hero lede's trailing "Wir arbeiten unter anderem für
// folgende Branchen:" clause now lives as `hero.industriesIntro` for the
// IndustryStrip section, matching the same structural split EN made.
//
// Three product hrefs (Hybride Baugruppen, Drahtbiegeteile, Muster- und
// Prototypenbau) have NO real page anywhere on the live DE site — the scrape
// found the DE homepage linking to `/produkte/hybride-baugruppen/` etc., but
// those URLs don't exist in the DE sitemap at all (leftovers from an abandoned
// relaunch.dietz.eu staging migration). Per the plan, that dead link is not
// reproduced verbatim; these three instead use flat slugs consistent with DE's
// existing product pages (praezisionsfedern, stanz-umformteile, ...) as the
// forward-looking path Phase 2 will build these pages under. News/events hrefs
// point at real live post URLs that exist on the site but were outside this
// round's scrape scope (news-sitemap.xml wasn't crawled) — fine, since a href
// to content not yet in our system is no different from any other page this
// round defers to Phase 2/3.
import type { HomepageEntry } from "@/content/schema";

export const homepageDe: HomepageEntry = {
  id: "homepage",
  locale: "de",
  slug: "",
  seo: {
    title: "Dietz GmbH | Spezialisten für Federn, Biegeteile, Bauteile & mehr",
    description:
      "Einer der führenden Hersteller von hybriden Baugruppen, Präzisionsfedern und Stanz-Umformteilen in Deutschland. IATF 16949 zertifiziert, familiengeführt seit 1928.",
  },
  type: "homepage",

  hero: {
    kicker: "Seit 1928 · Neustadt bei Coburg",
    title: "Dietz GmbH – Federn, Biegeteile und Bauteile made in Germany",
    intro:
      "Wir sind einer der führenden Hersteller von hybriden Baugruppen, Präzisionsfedern und Stanz-Umformteilen in Deutschland.",
    industries: ["Automotive", "Elektrotechnik", "Medizintechnik", "Weisse Ware"],
    industriesIntro: "Wir arbeiten unter anderem für folgende Branchen.",
  },

  products: {
    title: "Produkte",
    exploreLabel: "Mehr über",
    items: [
      {
        title: "Hybride Baugruppen",
        href: "/produkte/hybride-baugruppen/",
        body: "Die Dietz GmbH ist spezialisiert auf die Entwicklungsunterstützung und Fertigung von hybriden Baugruppen. Durch die Kombination verschiedener Werkstoffe und Fertigungstechniken können wir flexible Lösungen für anspruchsvolle Anwendungen bieten. Ob elektronische Komponenten in Kunststoffgehäusen, Metallteile mit integrierten Kunststoffelementen oder andere individuelle Anforderungen – wir finden die passende Lösung für Ihr Projekt. Profitieren Sie von unserem Know-how in der hybriden Baugruppenfertigung und setzen Sie auf Qualität und Zuverlässigkeit.",
      },
      {
        title: "Stanz- Umformteile",
        href: "/stanz-umformteile/",
        body: "Dietz GmbH ist Ihr Partner für Stanz- und Umformtechnik. Mit modernsten Maschinen und einem erfahrenen Team können wir komplexe Blechteile nach Ihren individuellen Anforderungen herstellen. Ob Prototypen oder Serienfertigung – wir bieten Ihnen höchste Präzision und Qualität. Unser breites Leistungsspektrum umfasst das Stanzen, Biegen, Umformen und weitere Verfahren. Verlassen Sie sich auf unsere Fachkenntnisse in der Stanz- und Umformtechnik und profitieren Sie von kosteneffizienten Lösungen und kurzen Lieferzeiten.",
      },
      {
        title: "Präzisionsfedern",
        href: "/praezisionsfedern/",
        body: "Die Dietz GmbH ist Ihr kompetenter Partner für Federntechnik. Wir produzieren hochpräzise und zuverlässige Federn für eine Vielzahl von Anwendungen. Ob Druckfedern, Zugfedern, Schenkelfedern oder Torsionsfedern – wir fertigen nach individuellen Kundenanforderungen und bieten Ihnen maßgeschneiderte Lösungen. Unsere erfahrenen Mitarbeiter und modernste Produktionsanlagen gewährleisten höchste Qualität und eine schnelle Lieferung. Vertrauen Sie auf unsere langjährige Erfahrung in der Federntechnik und profitieren Sie von effizienten und kostengünstigen Lösungen.",
      },
      {
        title: "Drahtbiegeteile",
        href: "/produkte/drahtbiegeteile/",
        body: "Die Dietz GmbH ist Ihr zuverlässiger Partner in der Fertigung von Drahtbiegeteilen. Mit unserer hochmodernen Fertigungstechnologie sind wir in der Lage, maßgeschneiderte Lösungen für Ihre individuellen Anforderungen zu bieten. Unser erfahrenes Team aus Fachkräften garantiert höchste Präzision und Qualität bei jedem Schritt des Herstellungsprozesses. Egal, ob es sich um kleinere oder größere Stückzahlen handelt, wir liefern termingerecht und zu wettbewerbsfähigen Preisen. Vertrauen Sie auf unsere langjährige Expertise und lassen Sie uns gemeinsam Ihre Ideen in die Realität umsetzen.",
      },
      {
        title: "Muster- und Prototypenbau",
        href: "/produkte/prototypen-und-musterbau/",
        body: "Innovation und Qualität stehen bei der Dietz GmbH im Bereich Muster- und Prototypenbau an erster Stelle. Unser hochqualifiziertes Team arbeitet eng mit Ihnen zusammen, um Ihre Anforderungen genau zu verstehen und Ihre Vision in die Realität umzusetzen. Wir bieten Ihnen schnellstmögliche Lieferzeiten und hervorragende Ergebnisse, um sicherzustellen, dass Sie Ihre Entwicklungsziele erreichen. Vertrauen Sie auf unsere langjährige Erfahrung und unsere technische Expertise – wir freuen uns darauf, mit Ihnen zusammenzuarbeiten!",
      },
      {
        title: "Kunststofftechnik",
        href: "/kunststofftechnik/",
        body: "Unsere Kunststoffe sind vielseitig einsetzbare Materialien mit einer breiten Palette von Eigenschaften, die je nach Bedarf angepasst werden können. Mit unseren modernen Maschinenpark stellen wir eine Prozesssichere Produktion zur Verfügung. Diese Technologie ermöglicht die Herstellung von Produkten in unterschiedlichen Größen, Formen und Designs mit ausgezeichneter Präzision und Qualität.",
      },
      {
        title: "Sonderverpackungen",
        href: "/sonderverpackungen/",
        body: "Dietz GmbH ist Ihr kompetenter Ansprechpartner für die Entwicklung und Herstellung von Sonderverpackungen. Wir bieten maßgeschneiderte Lösungen für verschiedene Branchen und Anwendungen. Ob Transportverpackungen, Verkaufsverpackungen oder spezielle Anforderungen – wir entwickeln zusammen mit Ihnen die optimale Lösung für Ihre Produkte. Unsere Verpackungen überzeugen durch Qualität, Funktionalität und ansprechendes Design. Vertrauen Sie auf unsere Erfahrung und unsere hohe Flexibilität, um Ihre Produkte sicher und attraktiv zu verpacken.",
      }
    ],
  },

  services: {
    title: "Services",
    moreLabel: "Mehr über",
    items: [
      {
        title: "Produktion",
        href: "/unternehmen/leistungen/produktion/",
        thumb: "/images/teasers/t-produktion.jpg",
        body: "Von mechanischen Komponenten bis hin zu elektronischen Bauteilen bieten wir maßgeschneiderte Lösungen für jeden Kunden. Dabei greifen wir auf modernste Technologien und Produktionsverfahren zurück, um höchste Qualitätsstandards zu gewährleisten.",
      },
      {
        title: "Materialauswahl",
        href: "/unternehmen/leistungen/materialauswahl/",
        thumb: null,
        body: "Unsere Materialauswahl erfolgt nach strengen Kriterien und basiert auf langjähriger Erfahrung sowie gründlicher Marktanalyse. Wir arbeiten eng mit renommierten Lieferanten zusammen, die uns eine breite Palette an hochwertigen Materialien aus aller Welt zur Verfügung stellen.",
      },
      {
        title: "Qualität",
        href: "/unternehmen/leistungen/qualitaet/",
        thumb: "/images/teasers/t-qualitaet.jpg",
        body: "Wir sind IATF 16949 zertifiziert und erfüllen höchste Qualitätsstandards. Unser Unternehmen setzt auf Automatisierung, Prozessoptimierung und kontinuierliche Verbesserung, um sicherzustellen, dass unsere Kunden stets die bestmögliche Qualität erhalten.",
      },
      {
        title: "Logistik",
        href: "/unternehmen/leistungen/logistik/",
        thumb: "/images/teasers/t-logistik.jpg",
        body: "Mit umfassenden Know-how optimiert die Dietz GmbH die Abläufe in der Lieferkette, um eine effiziente und reibungslose Logistik zu gewährleisten.",
      }
    ],
  },

  sustainability: {
    title: "Nachhaltigkeit",
    subtitle: "Ressourcenschonung, Umweltprojekte, Leitlinien",
    href: "/unternehmen/qualitaet-umwelt/",
    body: "Unser Denken für die Umwelt beginnt bereits bei der Produktentwicklung. Durch den Einsatz modernster Technologien und umweltschonender Materialien stellen wir sicher, dass unsere Produkte höchsten ökologischen Standards gerecht werden. Wir achten darauf, dass alle eingesetzten Materialien recycelbar sind und dass bei der Produktion keine schädlichen Emissionen entstehen.",
    linkLabel: "Unsere Nachhaltigkeitsinitiativen",
  },

  company: {
    title: "Das Unternehmen",
    subtitle: "Innovation, Qualität, Geschichte",
    href: "/unternehmen/",
    body: "Gegründet 1928 in Neustadt bei Coburg, ist die Dietz GmbH einer der führenden Hersteller von technischen Präzisionsfedern, Hybriden Baugruppen und Drahtbiegeteilen. Als mittelständisches, inhabergeführtes Unternehmen mit 160 Mitarbeitern beliefert Dietz namhafte und internationale Kunden aus den verschiedensten Industriezweigen.",
    stats: [
      { value: "1928", label: "Gegründet in Neustadt bei Coburg" },
      { value: "160", label: "Mitarbeiter" },
      { value: "IATF 16949", label: "Zertifiziertes Qualitätsmanagement" }
    ],
    linkLabel: "Über die Dietz GmbH",
  },

  // DE-only sections — no EN equivalent exists on the live site.
  news: {
    title: "News",
    items: [
      {
        title:
          "Dietz GmbH mit EcoVadis Bronze-Medaille ausgezeichnet – ein starkes Signal für Nachhaltigkeit in der Branche",
        href: "/ecovadis-bronze-medaille/",
        excerpt:
          "Sehr geehrte Kunden, Partner und Interessenten, wir freuen uns sehr, Ihnen mitteilen …",
      },
      {
        title: "Wir handeln – für ein klimaneutrales Bayern 2040!",
        href: "/wir-handeln-fuer-ein-klimaneutrales-bayern-2040/",
        excerpt:
          "Bei Dietz GmbH ist Nachhaltigkeit kein Trend, sondern Standard seit 2021! 100 % Erneuerbare Energien – seit …",
      },
      {
        title: "Dreifach nominiert – und jetzt Finalist!",
        href: "/dreifach-nominiert-und-jetzt-finalist/",
        excerpt: "Dreifach nominiert – und jetzt Finalist! Wir sind begeistert: Die …",
      }
    ],
  },
  events: {
    title: "Termine & Messen",
    items: [
      {
        title: "NECAzubi 2026 – Deine Chance auf den Traum-Ausbildungsplatz",
        href: "/necazubi-2026-deine-chance-auf-den-traum-ausbildungsplatz/",
      },
      {
        title: "NECAzubi 2025 – Deine Chance auf den Traum-Ausbildungsplatz",
        href: "/necazubi-2025-ausbildungsmesse/",
      },
      {
        title: "Save the date: NECAzubi – Ausbildungsmesse",
        href: "/save-the-date-necazubi-ausbildungsmesse/",
      }
    ],
  },

  certifications: {
    heading:
      "Zertifiziert nach den Standards, nach denen auch unsere Kunden geprüft werden.",
    intro:
      "Qualitäts-, Umwelt- und Zollzertifizierungen der Dietz GmbH. Die vollständigen Zertifikate finden Sie im Downloadbereich.",
    items: [
      {
        src: "/images/certs/dekra-iso-9001.webp",
        name: "ISO 9001",
        note: "Qualitätsmanagementsystem, zertifiziert durch DEKRA",
      },
      {
        src: "/images/certs/dekra-iatf-16949.webp",
        name: "IATF 16949",
        note: "Qualitätsmanagement für die Automobilindustrie, zertifiziert durch DEKRA",
      },
      {
        src: "/images/certs/ISO-14001-2015.webp",
        name: "ISO 14001:2015",
        note: "Umweltmanagementsystem",
      },
      {
        src: "/images/certs/emas_logo_2020-07-16-Dietz.webp",
        name: "EMAS",
        note: "EU-Öko-Audit-System (EMAS)",
      },
      {
        src: "/images/certs/logo-umweltpakt2015-rgb.webp",
        name: "Umweltpakt Bayern",
        note: "Umweltpakt mit dem Freistaat Bayern",
      },
      {
        src: "/images/certs/Logo-Klimaneutrales-Bayern-2040.webp",
        name: "Klimaneutrales Bayern 2040",
        note: "Bayerische Klimaneutralitätsinitiative",
      },
      {
        src: "/images/certs/medal.webp",
        name: "EcoVadis",
        note: "Bronze-Medaille für Nachhaltigkeitsleistung",
      },
      {
        src: "/images/certs/aeo.webp",
        name: "AEO",
        note: "Zugelassener Wirtschaftsbeteiligter (Zollstatus)",
      }
    ],
    downloadsHref: "/downloads/",
    downloadsLabel: "Zertifikate herunterladen",
  },

  cta: {
    heading: "Lassen Sie uns Ihr Bauteil realisieren.",
    body: "Sagen Sie uns, was Sie brauchen: Federn, Biegeteile, Stanzteile oder eine komplette Hybridbaugruppe. Wir melden uns mit einem Weg zur Serienproduktion.",
    button: {
      kind: "typeform",
      typeformId: "01HHYPGYGQFR0BRFHV2WWR2ZEF",
      label: "Jetzt unverbindlich Kontakt aufnehmen",
    },
  },
};
