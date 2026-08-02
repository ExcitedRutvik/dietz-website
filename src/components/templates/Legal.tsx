import type { LegalContent } from "@/content/schema";
import BlockRenderer from "./BlockRenderer";
import PageHeader from "./PageHeader";

// The privacy policy runs to 111 paragraphs. Nothing here should be pretty at
// the expense of being findable — it is the same reading column as Post, so
// the H2 rules BlockRenderer draws do the section-finding work.
export default function Legal({ h1, blocks }: LegalContent) {
  return (
    <main className="mx-auto max-w-[46rem] px-6 pb-28 pt-10">
      <PageHeader h1={h1} wide />
      <div className="mt-12">
        <BlockRenderer blocks={blocks} />
      </div>
    </main>
  );
}
