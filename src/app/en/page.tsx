import type { Metadata } from "next";
import { HomepageRoute, homepageMetadata } from "@/lib/pageRoutes";

// A concrete folder per non-default locale, not a `[locale]` dynamic segment —
// see the comment in `src/lib/pageRoutes.tsx` for why. Adding French means
// copying this file and `[...slug]/page.tsx` into `src/app/fr/`.
const LOCALE = "en" as const;

export function generateMetadata(): Metadata {
  return homepageMetadata(LOCALE);
}

export default function Page() {
  return <HomepageRoute locale={LOCALE} />;
}
