import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import PageRenderer from "@/components/templates/PageRenderer";
import JsonLd from "@/components/layout/JsonLd";
import HomePage from "@/components/screens/HomePage";
import { getPage } from "@/content/pages";
import type { Locale } from "@/lib/locale";
import { buildMetadata } from "@/lib/seo";

// Shared bodies for the per-locale route files.
//
// These used to live in a single `app/[locale]/` dynamic segment. That segment
// silently shadowed the entire German site in `next dev`: DE is the default
// locale and therefore unprefixed, so `/produkte/` is one path segment, and a
// dynamic segment out-specifies the `(default)/[...slug]` catch-all. Next
// matched it as `locale="produkte"`, found no such entry in
// generateStaticParams, and — with `dynamicParams = false` — returned 404
// rather than falling through to the catch-all. Every DE content route 404'd
// in dev while the static export was perfectly fine, because an export writes
// real files and never runs the router.
//
// A concrete `app/en/` folder removes the ambiguity: a literal segment always
// beats a catch-all, and nothing competes. The cost is that adding a locale
// means adding a folder rather than just a content file — two files that call
// the helpers below, which is why the helpers exist. See `app/en/`.

export function contentMetadata(locale: Locale, slug: string[]): Metadata {
  const entry = getPage(locale, slug);
  return entry ? buildMetadata(entry) : {};
}

export function ContentPage({
  locale,
  slug,
}: {
  locale: Locale;
  slug: string[];
}) {
  const entry = getPage(locale, slug);
  if (!entry) notFound(); // dynamicParams=false means this should be unreachable

  return (
    <>
      <Header locale={locale} currentPageId={entry.id} forceSolid />
      <JsonLd entry={entry} />
      <PageRenderer entry={entry} />
      <Footer locale={locale} />
    </>
  );
}

export function homepageMetadata(locale: Locale): Metadata {
  const entry = getPage(locale, []);
  return entry?.type === "homepage" ? buildMetadata(entry) : {};
}

export function HomepageRoute({ locale }: { locale: Locale }) {
  const entry = getPage(locale, []);
  if (entry?.type !== "homepage") notFound();
  return (
    <>
      <JsonLd entry={entry} />
      <HomePage content={entry} />
    </>
  );
}
