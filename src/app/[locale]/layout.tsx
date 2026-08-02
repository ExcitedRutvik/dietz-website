import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import "../globals.css";

// Kept minimal for the same reason as (default)/layout.tsx — page-specific
// metadata belongs on each page, not the layout, once this group hosts more
// than just the homepage.
export const metadata: Metadata = {
  metadataBase: new URL("https://www.dietz.eu"),
};

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  // Next's generated route types require this to be `string`, not the
  // narrower `Locale` — generateStaticParams below is what actually
  // constrains which values ever reach this at build time.
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return (
    <html lang={locale} className={`${GeistSans.variable} antialiased`}>
      <body>{children}</body>
    </html>
  );
}
