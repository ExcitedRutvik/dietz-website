import type { Metadata } from "next";
import { ContentPage, contentMetadata } from "@/lib/pageRoutes";
import { routeParamsFor } from "@/content/pages";
import { DEFAULT_LOCALE } from "@/lib/locale";

// DE is the default locale and therefore unprefixed, so this catch-all owns
// every German URL at the site root.
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
  return contentMetadata(DEFAULT_LOCALE, slug);
}

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const { slug } = await params;
  return <ContentPage locale={DEFAULT_LOCALE} slug={slug} />;
}
