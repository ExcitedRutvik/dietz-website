import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import PageRenderer from "@/components/templates/PageRenderer";
import JsonLd from "@/components/layout/JsonLd";
import { getPage, routeParamsFor } from "@/content/pages";
import { DEFAULT_LOCALE } from "@/lib/locale";
import { buildMetadata } from "@/lib/seo";

export function generateStaticParams() {
  return routeParamsFor(DEFAULT_LOCALE);
}
export const dynamicParams = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const entry = getPage(DEFAULT_LOCALE, slug);
  if (!entry) return {};
  return buildMetadata(entry);
}

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const { slug } = await params;
  const entry = getPage(DEFAULT_LOCALE, slug);
  if (!entry) notFound(); // dynamicParams=false means this should be unreachable

  return (
    <>
      <Header locale={DEFAULT_LOCALE} currentPageId={entry.id} forceSolid />
      <JsonLd entry={entry} />
      <PageRenderer entry={entry} />
      <Footer locale={DEFAULT_LOCALE} />
    </>
  );
}
