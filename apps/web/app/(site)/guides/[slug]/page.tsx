import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getGuide, getGuides } from "@/lib/mdx";
import { MdxContent } from "@/components/site/MdxContent";

export async function generateStaticParams() {
  const guides = getGuides();
  return guides.map((guide) => ({ slug: guide.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const guide = getGuide(slug);
  if (!guide) return { title: "Not Found | InfraUp" };
  return {
    title: `${guide.frontmatter.title} — InfraUp`,
    description: guide.frontmatter.description,
  };
}

export default async function GuidePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const guide = getGuide(slug);
  if (!guide) notFound();

  const allGuides = getGuides();
  const currentIndex = allGuides.findIndex((g) => g.slug === slug);
  const prevGuide = currentIndex > 0 ? allGuides[currentIndex - 1] : null;
  const nextGuide =
    currentIndex >= 0 && currentIndex < allGuides.length - 1
      ? allGuides[currentIndex + 1]
      : null;

  return (
    <article className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
      <header className="mb-12">
        <span className="badge">{guide.frontmatter.category}</span>
        <h1 className="section-heading mt-3">{guide.frontmatter.title}</h1>
        <p className="mt-4 text-lg text-ink/70">
          {guide.frontmatter.description}
        </p>
        <p className="eyebrow mt-2">{guide.readingTime}</p>
      </header>

      <div className="mdx-content">
        <MdxContent source={guide.content} />
      </div>

      <footer className="ruled-divider pt-12 mt-12 flex flex-wrap items-center justify-between gap-4">
        <Link href="/guides" className="btn-outline">
          ← Back to Guides
        </Link>
        <nav className="flex gap-4">
          {prevGuide && (
            <Link
              href={`/guides/${prevGuide.slug}`}
              className="font-mono text-sm uppercase tracking-wider text-ink/70 hover:text-ink"
            >
              ← {prevGuide.frontmatter.title}
            </Link>
          )}
          {nextGuide && (
            <Link
              href={`/guides/${nextGuide.slug}`}
              className="font-mono text-sm uppercase tracking-wider text-ink/70 hover:text-ink"
            >
              {nextGuide.frontmatter.title} →
            </Link>
          )}
        </nav>
      </footer>
    </article>
  );
}
