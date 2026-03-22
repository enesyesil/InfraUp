import { getAllApps, getCategories } from "@/lib/db";
import { CatalogClient } from "@/components/site/CatalogClient";

/** DB is not reachable during Docker/BuildKit image build; render at request time. */
export const dynamic = "force-dynamic";
import { SectionHeader } from "@/components/site/SectionHeader";

export default async function AppsCatalogPage() {
  const [apps, categories] = await Promise.all([
    getAllApps(),
    getCategories(),
  ]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
      <div className="mb-12">
        <SectionHeader
          eyebrow="THE CATALOG"
          title="Self-Hosted Alternatives"
          description="Browse 50+ open source alternatives to SaaS tools. Filter by category, search by name or tags, and find the right fit for your stack."
        />
      </div>
      <CatalogClient apps={apps} categories={categories} />
    </div>
  );
}
