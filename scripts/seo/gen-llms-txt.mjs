/**
 * Generate /llms.txt — a plain-text map of the site for AI answer engines.
 *
 * When an assistant is asked "who makes compression springs to DIN 2095 in
 * Germany", it does not crawl 578 pages; it looks for a compact, authoritative
 * summary. llms.txt is that summary, and for a static export it costs one file.
 *
 * Built from the money-page list rather than from every page: 578 lines of
 * glossary stubs would bury the twelve pages that actually describe what Dietz
 * sells. Descriptions are the ones already written in money-page-meta.json, so
 * this cannot drift from what the pages themselves claim.
 *
 *   node scripts/seo/gen-llms-txt.mjs
 */
import { readFileSync, writeFileSync } from "node:fs";

const META = "reference/seo/money-page-meta.json";
const OUT = "public/llms.txt";
const SITE = "https://www.dietz.eu";

const meta = JSON.parse(readFileSync(META, "utf8"));

/** DE is unprefixed; every other locale sits under /<locale>/. */
const url = (locale, slug) =>
  locale === "de" ? `${SITE}/${slug}/` : `${SITE}/${locale}/${slug}/`;

const lines = [
  "# Dietz GmbH",
  "",
  "> Owner-managed German manufacturer of technical precision springs, wire and",
  "> strip bending parts, stamped and formed parts, hybrid metal-plastic",
  "> assemblies and injection-moulded plastics. Founded 1928 in Neustadt bei",
  "> Coburg, Bavaria; around 170 employees. Certified to IATF 16949, ISO 9001",
  "> and ISO 14001, EMAS-registered, and an AEO-authorised economic operator.",
  "> Supplies the automotive, electrical engineering, domestic appliance and",
  "> medical technology industries.",
  "",
  "Contact: info@dietz.eu · +49 (0) 9568 9442-0 · Am Floßgraben 10, 96465 Neustadt bei Coburg, Germany",
  "",
];

for (const [locale, label] of [
  ["de", "Deutsch"],
  ["en", "English"],
]) {
  const entries = Object.entries(meta[locale] ?? {});
  if (entries.length === 0) continue;
  lines.push(`## ${label}`, "");
  for (const [slug, m] of entries.sort(([a], [b]) => a.localeCompare(b))) {
    // Title minus the "| Dietz GmbH" tail, which is noise in a list that is
    // already under a Dietz heading.
    const title = m.title.split("|")[0].trim();
    lines.push(`- [${title}](${url(locale, slug)}): ${m.description}`);
  }
  lines.push("");
}

writeFileSync(OUT, lines.join("\n"));
console.log(`wrote ${OUT} (${lines.length} lines)`);
