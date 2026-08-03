// Authored, not migrated: there is no /wissen/ page on the live site.
//
// The main menu already grouped News, Blog, Glossar and Downloads under a
// "Wissen" heading, but that heading was the only top-level item with no page
// behind it — it rendered as an inert label, so the cluster could be opened but
// never landed on, and nothing linked the four together for a reader arriving
// from search.
import type { PageEntry } from "@/content/schema";

export const wissenDE: PageEntry = {
  id: "post.wissen",
  locale: "de",
  slug: "wissen",
  seo: {
    navLabel: "Wissen",
    title: "Wissen: Federntechnik, Downloads und Glossar | Dietz",
    description:
      "Fachwissen zur Federntechnik von Dietz: Glossar der Federnbegriffe, Blog mit Anwendungsbeispielen, aktuelle News und Downloads mit Zertifikaten und Datenblättern.",
  },
  type: "hub",
  h1: "Wissen",
  intro:
    "Technisches Nachschlagewerk, Anwendungsbeispiele und Dokumente, gesammelt an einer Stelle.",
  blocks: [
    { kind: "image", src: "/images/stills/produktionshalle-weit.jpg", alt: "Produktionshalle der Dietz GmbH mit Hallenkran und Fertigungszellen", width: 1280, height: 549 },
    { kind: "paragraph", text: "Federauslegung ist Detailarbeit: Werkstoff, Drahtdurchmesser, Windungszahl und Oberfläche hängen voneinander ab, und die passende Kombination entscheidet über Lebensdauer und Funktion im Bauteil. In unserem Glossar erklären wir die Begriffe und Normen, die in Zeichnungen und Anfragen vorkommen. Im Blog zeigen wir an konkreten Bauteilen, wie eine Aufgabenstellung zur fertigen Feder wird." },
    { kind: "paragraph", text: "Im Downloadbereich finden Sie unsere aktuellen Zertifikate (IATF 16949, ISO 9001 und ISO 14001) sowie Datenblätter und Formulare zum direkten Herunterladen." },
  ],
  cards: [
    { title: "Glossar", href: "/glossar/", body: "Begriffe der Federntechnik von A bis Z: Federrate, Federnormen, Werkstoffe, Prüfverfahren und Fertigungsbegriffe, nachschlagbar erklärt." },
    { title: "Blog", href: "/blog/", body: "Anwendungsbeispiele, Werkstoffkunde und Hintergründe aus der Federnfertigung, geschrieben für Konstrukteure und Einkäufer." },
    { title: "Downloads", href: "/downloads/", body: "Zertifikate, Datenblätter, Verkaufsbedingungen und Formulare als PDF zum Herunterladen." },
    { title: "News", href: "/news/", body: "Aktuelles aus dem Unternehmen: Investitionen, Auszeichnungen, Messetermine und Meldungen aus der Ausbildung." },
  ],
};
