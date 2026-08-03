import type { PageEntry } from "@/content/schema";
import Breadcrumbs from "@/components/layout/Breadcrumbs";
import Hub from "./Hub";
import CareerHub from "./CareerHub";
import Listing from "./Listing";
import Post from "./Post";
import Contact from "./Contact";
import Legal from "./Legal";
import RelatedLinks from "./RelatedLinks";
import ChildPages, { childHrefs } from "./ChildPages";
import { sectionNav } from "@/lib/sectionNav";

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
        <>
          {/* Section landing pages get a real child grid from the menu data.
              Its hrefs are then withheld from RelatedLinks, so the two do not
              list the same pages twice under different headings. */}
          <ChildPages entry={entry} />
          <div className="mx-auto max-w-[46rem] px-6">
            <RelatedLinks entry={entry} skip={childHrefs(entry)} />
          </div>
        </>
      )}
      {/* The gap above the footer is owned here, once, and unconditionally.
          Templates used to add their own pb-28 on top of a pb-24 here and
          RelatedLinks' own margin — ~300px that no single file could see.
          Collapsing that into one rule is right, but it has to sit outside the
          conditional above: a page with no related links and no child grid (a
          hub such as /en/resources/) otherwise gets no bottom spacing at all
          and its last card butts straight into the footer.

          Note the parentheses. `pb-[--space-page-bottom]` is *silently* zero in
          Tailwind v4 — bracket syntax expects a value, not a bare custom
          property — which is exactly how the spacing disappeared unnoticed. */}
      <div aria-hidden className="pb-(--space-page-bottom)" />
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
      // Only this level still holds the full entry, so the section nav —
      // which needs the page id to find its place in the menu — is resolved
      // here and handed down.
      return <Post {...entry} section={entry.sectionLinks ?? sectionNav(entry)} />;
    case "contact":
      return <Contact {...entry} />;
    case "legal":
      return <Legal {...entry} />;
    case "homepage":
      return null; // unreachable — the [...slug] dispatcher excludes slug === ""
  }
}
