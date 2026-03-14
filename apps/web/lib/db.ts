import { prisma } from "@infraup/db";
import type { App, AppDependency, AppCategory } from "@infraup/db";

export type { App, AppDependency, AppCategory };

export type AppWithDeps = App & { dependencies: AppDependency[] };

export async function getAllApps(): Promise<AppWithDeps[]> {
  try {
    return await prisma.app.findMany({
      where: { isActive: true },
      include: { dependencies: true },
      orderBy: { businessRelevance: "desc" },
    });
  } catch {
    return [];
  }
}

export async function getFeaturedApps(): Promise<AppWithDeps[]> {
  try {
    return await prisma.app.findMany({
      where: { isActive: true, featured: true },
      include: { dependencies: true },
      orderBy: { businessRelevance: "desc" },
      take: 6,
    });
  } catch {
    return [];
  }
}

export async function getApp(slug: string): Promise<AppWithDeps | null> {
  try {
    return await prisma.app.findUnique({
      where: { slug },
      include: { dependencies: true },
    });
  } catch {
    return null;
  }
}

export async function getAppsByCategory(
  category: AppCategory
): Promise<AppWithDeps[]> {
  try {
    return await prisma.app.findMany({
      where: { isActive: true, category },
      include: { dependencies: true },
      orderBy: { businessRelevance: "desc" },
    });
  } catch {
    return [];
  }
}

export async function getCategories(): Promise<
  { category: AppCategory; count: number }[]
> {
  try {
    const results = await prisma.app.groupBy({
      by: ["category"],
      where: { isActive: true },
      _count: { _all: true },
      orderBy: { category: "asc" },
    });
    return results.map((r) => ({
      category: r.category,
      count: r._count._all,
    }));
  } catch {
    return [];
  }
}

export async function getAlternatives(
  slug: string,
  category: AppCategory,
  limit = 3
): Promise<AppWithDeps[]> {
  try {
    return await prisma.app.findMany({
      where: { isActive: true, category, slug: { not: slug } },
      include: { dependencies: true },
      orderBy: { githubStars: "desc" },
      take: limit,
    });
  } catch {
    return [];
  }
}
