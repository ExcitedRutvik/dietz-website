import type { Metadata } from "next";
import HomePage from "@/components/screens/HomePage";
import JsonLd from "@/components/layout/JsonLd";
import { homepageDe } from "@/content/pages/homepage/de";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata(homepageDe);

export default function Page() {
  return (
    <>
      <JsonLd entry={homepageDe} />
      <HomePage content={homepageDe} />
    </>
  );
}
