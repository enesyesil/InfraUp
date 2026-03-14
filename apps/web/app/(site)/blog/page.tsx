import Link from "next/link";
import { getBlogPosts } from "@/lib/mdx";
import { SectionHeader } from "@/components/site/SectionHeader";

export const metadata = {
  title: "Blog — InfraUp",
  description:
    "Insights, updates, and guides on self-hosting and open source infrastructure.",
};

export default function BlogPage() {
  const posts = getBlogPosts();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
      <SectionHeader
        eyebrow="THE DISPATCH"
        title="InfraUp Blog"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-12">
        {posts.map((post) => (
          <Link
            key={post.slug}
            href={`/blog/${post.slug}`}
            className="card block group"
          >
            <h3 className="font-serif text-xl font-bold group-hover:text-accent transition-colors">
              {post.frontmatter.title}
            </h3>
            <p className="eyebrow mt-2">
              {post.frontmatter.date} · {post.readingTime}
            </p>
            <p className="mt-3 text-ink/70 line-clamp-3">
              {post.frontmatter.excerpt}
            </p>
            <span className="inline-block mt-4 font-mono text-xs uppercase tracking-wider text-accent group-hover:underline">
              Read
            </span>
          </Link>
        ))}
      </div>

      {posts.length === 0 && (
        <p className="text-ink/70 mt-8">No posts yet. Check back soon.</p>
      )}
    </div>
  );
}
