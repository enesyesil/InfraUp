import fs from "fs";
import path from "path";
import matter from "gray-matter";

const WORDS_PER_MINUTE = 200;

export interface BlogPost {
  slug: string;
  frontmatter: {
    title: string;
    date: string;
    author: string;
    excerpt: string;
    tags: string[];
  };
  content: string;
  readingTime: string;
}

export interface Guide {
  slug: string;
  frontmatter: {
    title: string;
    description: string;
    category: string;
    order: number;
  };
  content: string;
  readingTime: string;
}

function getContentDir(): string {
  return path.join(process.cwd(), "content");
}

function getRegistryContentDir(): string {
  const cwd = process.cwd();
  if (cwd.endsWith("web")) {
    return path.join(cwd, "..", "..", "registry", "content");
  }
  return path.join(cwd, "registry", "content");
}

function calculateReadingTime(content: string): string {
  const words = content.trim().split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.ceil(words / WORDS_PER_MINUTE));
  return `${minutes} min read`;
}

function readMdxFile(filePath: string): { content: string; frontmatter: Record<string, unknown> } | null {
  if (!fs.existsSync(filePath)) return null;
  const raw = fs.readFileSync(filePath, "utf-8");
  const { content, data } = matter(raw);
  return { content, frontmatter: data as Record<string, unknown> };
}

export function getBlogPosts(): BlogPost[] {
  const blogDir = path.join(getContentDir(), "blog");
  if (!fs.existsSync(blogDir)) return [];

  const files = fs.readdirSync(blogDir).filter((f) => f.endsWith(".mdx"));
  const posts: BlogPost[] = files.map((file) => {
    const slug = file.replace(/\.mdx$/, "");
    const filePath = path.join(blogDir, file);
    const raw = fs.readFileSync(filePath, "utf-8");
    const { content, data } = matter(raw);
    const frontmatter = data as BlogPost["frontmatter"];
    return {
      slug,
      frontmatter: {
        title: frontmatter.title ?? "",
        date: frontmatter.date ?? "",
        author: frontmatter.author ?? "",
        excerpt: frontmatter.excerpt ?? "",
        tags: Array.isArray(frontmatter.tags) ? frontmatter.tags : [],
      },
      content,
      readingTime: calculateReadingTime(content),
    };
  });

  return posts.sort((a, b) => {
    const dateA = new Date(a.frontmatter.date).getTime();
    const dateB = new Date(b.frontmatter.date).getTime();
    return dateB - dateA;
  });
}

export function getBlogPost(slug: string): BlogPost | null {
  const blogDir = path.join(getContentDir(), "blog");
  const filePath = path.join(blogDir, `${slug}.mdx`);
  const result = readMdxFile(filePath);
  if (!result) return null;

  const frontmatter = result.frontmatter as BlogPost["frontmatter"];
  return {
    slug,
    frontmatter: {
      title: frontmatter.title ?? "",
      date: frontmatter.date ?? "",
      author: frontmatter.author ?? "",
      excerpt: frontmatter.excerpt ?? "",
      tags: Array.isArray(frontmatter.tags) ? frontmatter.tags : [],
    },
    content: result.content,
    readingTime: calculateReadingTime(result.content),
  };
}

export function getGuides(): Guide[] {
  const guidesDir = path.join(getContentDir(), "guides");
  if (!fs.existsSync(guidesDir)) return [];

  const files = fs.readdirSync(guidesDir).filter((f) => f.endsWith(".mdx"));
  const guides: Guide[] = files.map((file) => {
    const slug = file.replace(/\.mdx$/, "");
    const filePath = path.join(guidesDir, file);
    const raw = fs.readFileSync(filePath, "utf-8");
    const { content, data } = matter(raw);
    const frontmatter = data as Guide["frontmatter"];
    return {
      slug,
      frontmatter: {
        title: frontmatter.title ?? "",
        description: frontmatter.description ?? "",
        category: frontmatter.category ?? "",
        order: typeof frontmatter.order === "number" ? frontmatter.order : 0,
      },
      content,
      readingTime: calculateReadingTime(content),
    };
  });

  return guides.sort((a, b) => a.frontmatter.order - b.frontmatter.order);
}

export function getGuide(slug: string): Guide | null {
  const guidesDir = path.join(getContentDir(), "guides");
  const filePath = path.join(guidesDir, `${slug}.mdx`);
  const result = readMdxFile(filePath);
  if (!result) return null;

  const frontmatter = result.frontmatter as Guide["frontmatter"];
  return {
    slug,
    frontmatter: {
      title: frontmatter.title ?? "",
      description: frontmatter.description ?? "",
      category: frontmatter.category ?? "",
      order: typeof frontmatter.order === "number" ? frontmatter.order : 0,
    },
    content: result.content,
    readingTime: calculateReadingTime(result.content),
  };
}

export function getAppContent(slug: string): { content: string; frontmatter: Record<string, unknown> } | null {
  const appsDir = path.join(getRegistryContentDir(), "apps");
  const filePath = path.join(appsDir, `${slug}.mdx`);
  return readMdxFile(filePath);
}

export function getComparisonContent(
  slugA: string,
  slugB: string
): { content: string; frontmatter: Record<string, unknown> } | null {
  const comparisonsDir = path.join(getRegistryContentDir(), "comparisons");
  const filePath = path.join(comparisonsDir, `${slugA}-vs-${slugB}.mdx`);
  return readMdxFile(filePath);
}
