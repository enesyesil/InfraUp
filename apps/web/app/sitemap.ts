import type { MetadataRoute } from "next";
import { getAllApps, getCategories } from "@/lib/db";
import { categorySlug } from "@/lib/utils";
import { getBlogPosts } from "@/lib/mdx";
import { getGuides } from "@/lib/mdx";

const BASE_URL = "https://infraup.dev";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [apps, categories, posts, guides] = await Promise.all([
    getAllApps(),
    getCategories(),
    getBlogPosts(),
    getGuides(),
  ]);

  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
    { url: `${BASE_URL}/apps`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.9 },
    { url: `${BASE_URL}/deploy`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE_URL}/calculator`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE_URL}/platform`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE_URL}/about`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE_URL}/blog`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE_URL}/guides`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
  ];

  const categoryPages: MetadataRoute.Sitemap = categories.map(({ category }) => ({
    url: `${BASE_URL}/apps/${categorySlug(category)}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  const appPages: MetadataRoute.Sitemap = apps.map((app) => ({
    url: `${BASE_URL}/apps/${app.slug}`,
    lastModified: app.updatedAt,
    changeFrequency: "weekly" as const,
    priority: 0.9,
  }));

  const comparisonPages: MetadataRoute.Sitemap = [];
  const byCategory = new Map<string, string[]>();
  for (const app of apps) {
    const cat = app.category;
    if (!byCategory.has(cat)) byCategory.set(cat, []);
    byCategory.get(cat)!.push(app.slug);
  }
  for (const [, slugs] of byCategory) {
    const sorted = slugs.sort();
    for (let i = 0; i < sorted.length; i++) {
      for (let j = i + 1; j < sorted.length; j++) {
        comparisonPages.push({
          url: `${BASE_URL}/compare/${sorted[i]}-vs-${sorted[j]}`,
          lastModified: new Date(),
          changeFrequency: "monthly" as const,
          priority: 0.6,
        });
      }
    }
  }

  const blogPages: MetadataRoute.Sitemap = posts.map((post) => ({
    url: `${BASE_URL}/blog/${post.slug}`,
    lastModified: new Date(post.frontmatter.date),
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  const guidePages: MetadataRoute.Sitemap = guides.map((guide) => ({
    url: `${BASE_URL}/guides/${guide.slug}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  return [
    ...staticPages,
    ...categoryPages,
    ...appPages,
    ...comparisonPages,
    ...blogPages,
    ...guidePages,
  ];
}
