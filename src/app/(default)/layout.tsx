import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import "../globals.css";

// Kept minimal deliberately: this group will host every DE page once Phase
// 1's [...slug] dispatcher lands, not just the homepage, so page-specific
// title/description belong on each page's own `metadata`/`generateMetadata`
// export, not hardcoded here.
export const metadata: Metadata = {
  metadataBase: new URL("https://www.dietz.eu"),
};

export default function DefaultLocaleLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de" className={`${GeistSans.variable} antialiased`}>
      <body>{children}</body>
    </html>
  );
}
