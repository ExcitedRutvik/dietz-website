import { graphFor } from "@/lib/structuredData";
import type { PageEntry } from "@/content/schema";

/**
 * Server-rendered JSON-LD. Deliberately a plain `<script>` in the RSC output
 * rather than anything injected on the client: Google renders JS, but the many
 * crawlers and LLM fetchers that do not would see no markup at all.
 *
 * `JSON.stringify` output is escaped for `</script>` — a page whose copy
 * contains that sequence would otherwise close the tag early.
 */
export default function JsonLd({ entry }: { entry: PageEntry }) {
  const json = JSON.stringify(graphFor(entry)).replace(/</g, "\\u003c");
  return (
    <script
      type="application/ld+json"
      // Next escapes children of <script>; only this prop emits raw JSON.
      dangerouslySetInnerHTML={{ __html: json }}
    />
  );
}
