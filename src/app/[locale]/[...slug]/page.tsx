import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import PageRenderer from "@/components/templates/PageRenderer";
import JsonLd from "@/components/layout/JsonLd";
import { getPage, routeParamsFor } from "@/content/pages";
import { LOCALES, DEFAULT_LOCALE, type Locale } from "@/lib/locale";
import { buildMetadata } from "@/lib/seo";

export function generateStaticParams() {
  return LOCALES.filter((l) => l !== DEFAULT_LOCALE).flatMap((locale) =>
    routeParamsFor(locale).map((p) => ({ locale, ...p })),
  );
}
export const dynamicParams = false;

function isLocale(value: string): value is Locale {
  return (LOCALES as string[]).includes(value);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string[] }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isLocale(locale)) return {};
  const entry = getPage(locale, slug);
  if (!entry) return {};
  return buildMetadata(entry);
}

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string; slug: string[] }>;
}) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();
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
