import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { AppCategory } from "@infraup/db";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getGeneratorUrl(): string {
  return process.env.NEXT_PUBLIC_GENERATOR_LIVE === "true"
    ? "/platform/generate"
    : "/#waitlist";
}

export function formatCategory(category: string): string {
  return category
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function categorySlug(category: string): string {
  return category.toLowerCase().replace(/_/g, "-");
}

/** Maps slug back to AppCategory enum (e.g. "docs" -> "DOCS", "email-marketing" -> "EMAIL_MARKETING") */
export function slugToCategory(slug: string): string | null {
  const normalized = slug.toLowerCase();
  const categories = Object.values(AppCategory) as string[];
  for (const cat of categories) {
    if (categorySlug(cat) === normalized) return cat;
  }
  return null;
}

export function readingTime(content: string): string {
  const words = content.split(/\s+/).length;
  const minutes = Math.ceil(words / 200);
  return `${minutes} min read`;
}
