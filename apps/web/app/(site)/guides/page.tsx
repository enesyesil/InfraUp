import Link from "next/link";
import { getGuides } from "@/lib/mdx";
import { SectionHeader } from "@/components/site/SectionHeader";

export const metadata = {
  title: "Guides — InfraUp",
  description:
    "Self-hosting guides and tutorials for deploying open source alternatives.",
};

export default function GuidesPage() {
  const guides = getGuides();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
      <SectionHeader
        eyebrow="FIELD GUIDES"
        title="Self-Hosting Guides"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-12">
        {guides.map((guide) => (
          <Link
            key={guide.slug}
            href={`/guides/${guide.slug}`}
            className="card block group"
          >
            <span className="badge">{guide.frontmatter.category}</span>
            <h3 className="font-serif text-xl font-bold mt-3 group-hover:text-accent transition-colors">
              {guide.frontmatter.title}
            </h3>
            <p className="mt-2 text-ink/70 line-clamp-3">
              {guide.frontmatter.description}
            </p>
            <p className="eyebrow mt-3">{guide.readingTime}</p>
            <span className="inline-block mt-4 font-mono text-xs uppercase tracking-wider text-accent group-hover:underline">
              Read
            </span>
          </Link>
        ))}
      </div>

      {guides.length === 0 && (
        <p className="text-ink/70 mt-8">No guides yet. Check back soon.</p>
      )}
    </div>
  );
}
