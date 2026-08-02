import type { PageEntry } from "@/content/schema";
import Breadcrumbs from "@/components/layout/Breadcrumbs";
import Hub from "./Hub";
import CareerHub from "./CareerHub";
import Listing from "./Listing";
import Post from "./Post";
import ProductCategory from "./ProductCategory";
import Contact from "./Contact";
import Legal from "./Legal";
import RelatedLinks from "./RelatedLinks";

// Homepage isn't handled here — it has its own route (page.tsx in each locale
// group) and its own screen assembly (HomePage.tsx), since it's a bespoke
// scroll-video build, not a generic template.
export default function PageRenderer({ entry }: { entry: PageEntry }) {
  // Breadcrumbs live here rather than in each template: this is the one place
  // that still holds the full entry (templates receive only their content
  // variant, which has no slug), and it also means the trail can never be
  // present on one template and missing on another. Templates therefore own
  // no top padding — the breadcrumb bar clears the fixed header for them.
  // RelatedLinks sits here for the same reason: it needs the full entry to
  // resolve its cluster, and putting it in one place is what guarantees no
  // template ships without internal links again.
  return (
    <>
      <Breadcrumbs entry={entry} />
      {body(entry)}
      {entry.type !== "legal" && entry.type !== "contact" && (
        <div className="mx-auto max-w-[46rem] px-6 pb-24">
          <RelatedLinks entry={entry} />
        </div>
      )}
    </>
  );
}

function body(entry: PageEntry) {
  switch (entry.type) {
    case "hub":
      return <Hub {...entry} />;
    case "career-hub":
      return <CareerHub {...entry} />;
    case "listing":
      return <Listing {...entry} />;
    case "post":
      return <Post {...entry} />;
    case "product-category":
      return <ProductCategory {...entry} />;
    case "contact":
      return <Contact {...entry} />;
    case "legal":
      return <Legal {...entry} />;
    case "homepage":
      return null; // unreachable — the [...slug] dispatcher excludes slug === ""
  }
}
