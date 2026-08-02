import type { Metadata } from "next";
import { notFound } from "next/navigation";
import HomePage from "@/components/screens/HomePage";
import JsonLd from "@/components/layout/JsonLd";
import { getPage, homepageLocales } from "@/content/pages";
import { DEFAULT_LOCALE, LOCALES, type Locale } from "@/lib/locale";
import type { HomepageEntry } from "@/content/schema";
import { buildMetadata } from "@/lib/seo";

function isLocale(value: string): value is Locale {
  return (LOCALES as string[]).includes(value);
}

// Driven by the content aggregator, not a hardcoded list — adding a new
// locale's homepage.ts file is the entire change needed for that locale's `/
// {locale}/` route to start building. DE is excluded here: its homepage is
// served by the (default) route group at bare `/`, not this one.
export function generateStaticParams() {
  return homepageLocales()
    .filter((locale) => locale !== DEFAULT_LOCALE)
    .map((locale) => ({ locale }));
}
export const dynamicParams = false;

function findHomepage(locale: string): HomepageEntry | undefined {
  if (!isLocale(locale)) return undefined;
  const entry = getPage(locale, []);
  return entry?.type === "homepage" ? entry : undefined;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const entry = findHomepage(locale);
  if (!entry) return {};
  return buildMetadata(entry);
}

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const entry = findHomepage(locale);
  if (!entry) notFound(); // unreachable given dynamicParams=false above
  return (
    <>
      <JsonLd entry={entry} />
      <HomePage content={entry} />
    </>
  );
}
