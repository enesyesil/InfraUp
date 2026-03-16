import { prisma } from "@infraup/db";
import type { App, AppCategory, Prisma } from "@infraup/db";

export type { App, AppCategory };

export type AppWithDeps = Prisma.AppGetPayload<{
  include: { dependencies: { include: { dependency: true } } };
}>;

async function runDbQuery<T>(label: string, query: () => Promise<T>): Promise<T> {
  try {
    return await query();
  } catch (error) {
    console.error(`[db] ${label} failed`, error);
    throw error;
  }
}

export async function getAllApps(): Promise<AppWithDeps[]> {
  return runDbQuery("getAllApps", () =>
    prisma.app.findMany({
      where: { isActive: true },
      include: { dependencies: { include: { dependency: true } } },
      orderBy: { businessRelevance: "desc" },
    })
  );
}

export async function getFeaturedApps(): Promise<AppWithDeps[]> {
  return runDbQuery("getFeaturedApps", () =>
    prisma.app.findMany({
      where: { isActive: true, featured: true },
      include: { dependencies: { include: { dependency: true } } },
      orderBy: { businessRelevance: "desc" },
      take: 6,
    })
  );
}

export async function getApp(slug: string): Promise<AppWithDeps | null> {
  return runDbQuery("getApp", () =>
    prisma.app.findUnique({
      where: { slug },
      include: { dependencies: { include: { dependency: true } } },
    })
  );
}

export async function getAppsByCategory(
  category: AppCategory
): Promise<AppWithDeps[]> {
  return runDbQuery("getAppsByCategory", () =>
    prisma.app.findMany({
      where: { isActive: true, category },
      include: { dependencies: { include: { dependency: true } } },
      orderBy: { businessRelevance: "desc" },
    })
  );
}

export async function getCategories(): Promise<
  { category: AppCategory; count: number }[]
> {
  const results = await runDbQuery("getCategories", () =>
    prisma.app.groupBy({
      by: ["category"],
      where: { isActive: true },
      _count: { _all: true },
      orderBy: { category: "asc" },
    })
  );

  return results.map((r) => ({
    category: r.category,
    count: r._count._all,
  }));
}

export async function getAlternatives(
  slug: string,
  category: AppCategory,
  limit = 3
): Promise<AppWithDeps[]> {
  return runDbQuery("getAlternatives", () =>
    prisma.app.findMany({
      where: { isActive: true, category, slug: { not: slug } },
      include: { dependencies: { include: { dependency: true } } },
      orderBy: { githubStars: "desc" },
      take: limit,
    })
  );
}
