import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { getAllApps, getApp } from "@/lib/db";
import { AppComparison } from "@/components/site/AppComparison";
import { SectionHeader } from "@/components/site/SectionHeader";
import { formatCategory } from "@/lib/utils";
import type { AppWithDeps } from "@/lib/db";

function parseRamMb(ram: string): number {
  const m = ram.match(/^(\d+)(MB|GB)$/i);
  if (!m) return 0;
  const val = parseInt(m[1], 10);
  return m[2].toUpperCase() === "GB" ? val * 1024 : val;
}

function generateAutoVerdict(appA: AppWithDeps, appB: AppWithDeps): React.ReactNode {
  const parts: string[] = [];
  const starsA = appA.githubStars ?? 0;
  const starsB = appB.githubStars ?? 0;
  const ramA = parseRamMb(appA.minRam);
  const ramB = parseRamMb(appB.minRam);
  const depsA = appA.dependencies.length;
  const depsB = appB.dependencies.length;

  if (starsA > starsB) {
    parts.push(
      `${appA.name} has more GitHub stars and a more active community.`
    );
  } else if (starsB > starsA) {
    parts.push(
      `${appB.name} has more GitHub stars and a more active community.`
    );
  }

  if (ramA < ramB && ramA > 0) {
    parts.push(`${appA.name} requires less RAM.`);
  } else if (ramB < ramA && ramB > 0) {
    parts.push(`${appB.name} requires less RAM.`);
  }

  if (depsA < depsB && depsA === 0) {
    parts.push(`${appA.name} has fewer dependencies.`);
  } else if (depsB < depsA && depsB === 0) {
    parts.push(`${appB.name} has fewer dependencies.`);
  } else if (depsA < depsB) {
    parts.push(`${appA.name} requires fewer dependencies.`);
  } else if (depsB < depsA) {
    parts.push(`${appB.name} requires fewer dependencies.`);
  }

  if (parts.length === 0) {
    return (
      <p>
        Both {appA.name} and {appB.name} are solid choices in the{" "}
        {formatCategory(appA.category)} space. Choose based on your feature
        requirements and deployment preferences.
      </p>
    );
  }

  return <p>{parts.join(" ")}</p>;
}

export async function generateStaticParams(): Promise<{ slug: string }[]> {
  const apps = await getAllApps();
  const byCategory = new Map<string, AppWithDeps[]>();
  for (const app of apps) {
    const cat = app.category;
    if (!byCategory.has(cat)) byCategory.set(cat, []);
    byCategory.get(cat)!.push(app);
  }

  const params: { slug: string }[] = [];
  for (const [, categoryApps] of byCategory) {
    const slugs = categoryApps.map((a) => a.slug).sort();
    for (let i = 0; i < slugs.length; i++) {
      for (let j = i + 1; j < slugs.length; j++) {
        const a = slugs[i];
        const b = slugs[j];
        params.push({ slug: `${a}-vs-${b}` });
      }
    }
  }
  return params;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const parts = slug.split("-vs-");
  if (parts.length !== 2) {
    return { title: "Comparison | InfraUp" };
  }
  const [slugA, slugB] = parts;
  const [appA, appB] = await Promise.all([getApp(slugA), getApp(slugB)]);
  if (!appA || !appB || appA.category !== appB.category) {
    return { title: "Comparison | InfraUp" };
  }
  return {
    title: `${appA.name} vs ${appB.name} — Comparison`,
  };
}

export default async function ComparePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const parts = slug.split("-vs-");
  if (parts.length !== 2) notFound();

  const [slugA, slugB] = parts;
  const [appA, appB] = await Promise.all([getApp(slugA), getApp(slugB)]);

  if (!appA || !appB || appA.category !== appB.category) notFound();

  const verdict = generateAutoVerdict(appA, appB);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
      <div className="mb-12">
        <SectionHeader
          eyebrow="COMPARISON"
          title={`${appA.name} vs ${appB.name}`}
          description={`Compare ${appA.name} and ${appB.name} in the ${formatCategory(appA.category)} category.`}
        />
      </div>

      <AppComparison appA={appA} appB={appB} verdict={verdict} />

      <div className="mt-12 ruled-divider pt-8">
        <Link href="/apps" className="btn-outline">
          Browse app catalog
        </Link>
      </div>
    </div>
  );
}
