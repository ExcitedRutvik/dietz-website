import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import "../globals.css";

// Kept minimal for the same reason as (default)/layout.tsx — page-specific
// metadata belongs on each page, not the layout.
export const metadata: Metadata = {
  metadataBase: new URL("https://www.dietz.eu"),
};

export default function EnLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${GeistSans.variable} antialiased`}>
      <body>{children}</body>
    </html>
  );
}
