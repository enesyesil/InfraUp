import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getBlogPost, getBlogPosts } from "@/lib/mdx";
import { MdxContent } from "@/components/site/MdxContent";

export async function generateStaticParams() {
  const posts = getBlogPosts();
  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getBlogPost(slug);
  if (!post) return { title: "Not Found | InfraUp" };
  return {
    title: `${post.frontmatter.title} — InfraUp`,
    description: post.frontmatter.excerpt,
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getBlogPost(slug);
  if (!post) notFound();

  return (
    <article className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
      <header className="mb-12">
        <h1 className="section-heading">{post.frontmatter.title}</h1>
        <div className="mt-4 flex flex-wrap gap-4 eyebrow">
          <span>{post.frontmatter.author}</span>
          <span>{post.frontmatter.date}</span>
          <span>{post.readingTime}</span>
        </div>
      </header>

      <div className="mdx-content">
        <MdxContent source={post.content} />
      </div>

      <footer className="ruled-divider pt-12 mt-12">
        <Link href="/blog" className="btn-outline">
          ← Back to Blog
        </Link>
      </footer>
    </article>
  );
}
