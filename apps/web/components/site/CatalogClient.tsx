"use client";

import { useState, useMemo } from "react";
import { Search, ChevronDown } from "lucide-react";
import type { AppWithDeps } from "@/lib/db";
import type { AppCategory } from "@/lib/db";
import { AppCard } from "@/components/site/AppCard";
import { formatCategory } from "@/lib/utils";

type SortOption = "a-z" | "popular" | "relevant";

interface CatalogClientProps {
  apps: AppWithDeps[];
  categories: { category: AppCategory; count: number }[];
}

export function CatalogClient({ apps, categories }: CatalogClientProps) {
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("relevant");

  const filteredAndSortedApps = useMemo(() => {
    let result = [...apps];

    // Category filter
    if (categoryFilter !== "all") {
      result = result.filter((app) => app.category === categoryFilter);
    }

    // Search filter (name, tags, replaces)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (app) =>
          app.name.toLowerCase().includes(q) ||
          app.tags.some((t: string) => t.toLowerCase().includes(q)) ||
          app.replaces.some((r: string) => r.toLowerCase().includes(q))
      );
    }

    // Sort
    switch (sortBy) {
      case "a-z":
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "popular":
        result.sort(
          (a, b) => (b.githubStars ?? 0) - (a.githubStars ?? 0)
        );
        break;
      case "relevant":
      default:
        result.sort(
          (a, b) => (b.businessRelevance ?? 0) - (a.businessRelevance ?? 0)
        );
        break;
    }

    return result;
  }, [apps, categoryFilter, searchQuery, sortBy]);

  return (
    <div className="space-y-8">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
        <div className="flex flex-col sm:flex-row gap-4 sm:items-center flex-1">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/40"
            />
            <input
              type="search"
              placeholder="Search by name, tags, or replaces..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border-2 border-ink bg-white font-mono text-sm placeholder:text-ink/40 focus:outline-none focus:ring-0"
            />
          </div>

          {/* Category dropdown */}
          <div className="relative">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="appearance-none w-full sm:w-auto min-w-[180px] pl-4 pr-10 py-2.5 border-2 border-ink bg-white font-mono text-sm focus:outline-none focus:ring-0 cursor-pointer"
            >
              <option value="all">All Categories</option>
              {categories.map(({ category }) => (
                <option key={category} value={category}>
                  {formatCategory(category)}
                </option>
              ))}
            </select>
            <ChevronDown
              size={18}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-ink pointer-events-none"
            />
          </div>
        </div>

        {/* Sort */}
        <div className="flex items-center gap-2">
          <span className="eyebrow shrink-0">Sort:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="pl-4 pr-10 py-2.5 border-2 border-ink bg-white font-mono text-sm focus:outline-none focus:ring-0 cursor-pointer appearance-none"
          >
            <option value="relevant">Most Relevant</option>
            <option value="popular">Most Popular</option>
            <option value="a-z">A–Z</option>
          </select>
        </div>
      </div>

      {/* Results count */}
      <p className="font-mono text-xs uppercase tracking-wider text-ink/60">
        {filteredAndSortedApps.length} app
        {filteredAndSortedApps.length !== 1 ? "s" : ""} found
      </p>

      {/* App grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredAndSortedApps.map((app) => (
          <AppCard key={app.id} app={app} />
        ))}
      </div>

      {filteredAndSortedApps.length === 0 && (
        <div className="border-2 border-ink p-12 text-center">
          <p className="font-serif text-xl font-bold">No apps match your filters</p>
          <p className="mt-2 text-ink/70">
            Try adjusting your search or category filter.
          </p>
        </div>
      )}
    </div>
  );
}
