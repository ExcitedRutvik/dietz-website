import type { Metadata } from "next";
import { ContentPage, contentMetadata } from "@/lib/pageRoutes";
import { routeParamsFor } from "@/content/pages";

const LOCALE = "en" as const;

export function generateStaticParams() {
  return routeParamsFor(LOCALE);
}
export const dynamicParams = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}): Promise<Metadata> {
  const { slug } = await params;
  return contentMetadata(LOCALE, slug);
}

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const { slug } = await params;
  return <ContentPage locale={LOCALE} slug={slug} />;
}
