import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  getApp,
  getAppsByCategory,
  getAlternatives,
} from "@/lib/db";
import type { AppCategory } from "@/lib/db";
import type { AppWithDeps } from "@/lib/db";
import {
  formatCategory,
  categorySlug,
  slugToCategory,
  getGeneratorUrl,
} from "@/lib/utils";
import { AppCard } from "@/components/site/AppCard";
import { SectionHeader } from "@/components/site/SectionHeader";
import { DockerSnippet } from "@/components/site/DockerSnippet";

/** DB is not reachable during Docker/BuildKit image build; render at request time. */
export const dynamic = "force-dynamic";

async function getPageData(slug: string) {
  const [app, categoryEnum] = await Promise.all([
    getApp(slug),
    Promise.resolve(slugToCategory(slug)),
  ]);
  if (app) return { type: "app" as const, app };
  if (categoryEnum) {
    const apps = await getAppsByCategory(categoryEnum as AppCategory);
    return { type: "category" as const, category: categoryEnum, apps };
  }
  return null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const data = await getPageData(slug);
  if (!data) return { title: "Not Found | InfraUp" };
  if (data.type === "app") {
    const replaces = data.app.replaces[0] ?? "SaaS";
    return {
      title: `${data.app.name} — Self-hosted ${replaces} alternative | InfraUp`,
    };
  }
  const categoryName = formatCategory(data.category);
  return {
    title: `${categoryName} — Self-Hosted Alternatives | InfraUp`,
  };
}

export default async function AppsSlugPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = await getPageData(slug);
  if (!data) notFound();

  if (data.type === "category") {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <CategoryPage category={data.category} apps={data.apps} />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <AppDetailPage app={data.app} />
    </div>
  );
}

function CategoryPage({
  category,
  apps,
}: {
  category: string;
  apps: Awaited<ReturnType<typeof getAppsByCategory>>;
}) {
  const categoryName = formatCategory(category);
  const replacesSet = new Set<string>();
  apps.forEach((a) => a.replaces.forEach((r: string) => replacesSet.add(r)));
  const replacesList = Array.from(replacesSet).slice(0, 8);
  const replacesText =
    replacesList.length > 0
      ? replacesList.join(", ")
      : categoryName;

  return (
    <div className="py-12 md:py-16 space-y-12">
      {/* Breadcrumb */}
      <nav className="eyebrow flex items-center gap-2">
        <Link href="/" className="hover:text-ink">
          Home
        </Link>
        <span>/</span>
        <Link href="/apps" className="hover:text-ink">
          Apps
        </Link>
        <span>/</span>
        <span className="text-ink">{categoryName}</span>
      </nav>

      <div>
        <p className="eyebrow mb-3">
          <span className="stamp-solid">{categoryName.toUpperCase().replace(/ /g, " & ")}</span>
        </p>
        <h1 className="section-heading">Replace {replacesText}</h1>
        <p className="mt-4 font-mono text-sm text-ink/70">
          {apps.length} {apps.length === 1 ? "tool" : "tools"} available
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {apps.map((app) => (
          <AppCard key={app.id} app={app} />
        ))}
      </div>

      {apps.length >= 2 && (
        <div className="ruled-divider pt-8">
          <p className="eyebrow mb-2">Not sure which to pick?</p>
          <Link
            href={`/compare/${apps[0].slug}-vs-${apps[1].slug}`}
            className="btn-outline"
          >
            Compare {apps[0].name} vs {apps[1].name}
          </Link>
        </div>
      )}
    </div>
  );
}

async function AppDetailPage({
  app,
}: {
  app: NonNullable<Awaited<ReturnType<typeof getApp>>>;
}) {
  const alternatives = await getAlternatives(app.slug, app.category, 3);
  const categoryName = formatCategory(app.category);
  const replacesText = app.replaces[0] ?? "SaaS";

  const composeServices: string[] = [
    `  ${app.slug}:\n    image: ${app.dockerImage}:latest\n    ports:\n      - "${app.port}:${app.port}"`,
  ];
  app.dependencies.forEach((dep) => {
    composeServices.push(
      `  ${dep.dependencySlug}:\n    image: ${dep.dependency.image}  # ${dep.type}${dep.optional ? " (optional)" : ""}`
    );
  });
  const composeYaml =
    `services:\n${composeServices.join("\n\n")}`;

  const dockerTabs = [
    {
      label: "Pull",
      code: `docker pull ${app.dockerImage}:latest`,
    },
    {
      label: "Quick Run",
      code: `docker run -d --name ${app.slug} -p ${app.port}:${app.port} ${app.dockerImage}:latest`,
    },
    {
      label: "Compose",
      code: composeYaml,
    },
  ];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: app.name,
    description: app.description,
    applicationCategory: "DeveloperApplication",
    operatingSystem: "Docker",
    offers: app.tier === "FREE" ? { price: "0" } : undefined,
    ...(app.websiteUrl && { url: app.websiteUrl }),
    ...(app.githubUrl && { codeRepository: app.githubUrl }),
  };

  return (
    <div className="py-12 md:py-16 space-y-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Breadcrumb */}
      <nav className="eyebrow flex items-center gap-2 flex-wrap">
        <Link href="/" className="hover:text-ink">
          Home
        </Link>
        <span>/</span>
        <Link href="/apps" className="hover:text-ink">
          Apps
        </Link>
        <span>/</span>
        <Link href={`/apps/${categorySlug(app.category)}`} className="hover:text-ink">
          {categoryName}
        </Link>
        <span>/</span>
        <span className="text-ink">{app.name}</span>
      </nav>

      {/* Hero */}
      <div className="flex flex-wrap items-start gap-6">
        {app.logoUrl && (
          <img
            src={`/logos/${app.logoUrl}`}
            alt={`${app.name} logo`}
            className="w-20 h-20 object-contain border-2 border-ink"
            style={{ boxShadow: "var(--shadow-brutal-sm)" }}
          />
        )}
        <div>
          <h1 className="section-heading">{app.name}</h1>
          <p className="mt-2 text-lg text-ink/70">
            Open source {replacesText} alternative
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {app.license && (
              <span className="badge">{app.license.replace(/_/g, "-")}</span>
            )}
            <span className="badge">{app.minRam}</span>
            <span className="badge">{formatCategory(app.category)}</span>
          </div>
        </div>
      </div>

      {/* Quick stats bar */}
      <div
        className="grid grid-cols-2 md:grid-cols-4 gap-4 border-2 border-ink p-6"
        style={{ boxShadow: "var(--shadow-brutal)" }}
      >
        <div>
          <p className="eyebrow">Replaces</p>
          <p className="font-serif font-bold mt-1">
            {app.replaces.length > 0 ? app.replaces.join(", ") : "—"}
          </p>
        </div>
        <div>
          <p className="eyebrow">Min RAM</p>
          <p className="font-serif font-bold mt-1">{app.minRam}</p>
        </div>
        <div>
          <p className="eyebrow">Dependencies</p>
          <p className="font-serif font-bold mt-1">
            {app.dependencies.length > 0
              ? app.dependencies.length
              : "None"}
          </p>
        </div>
        <div>
          <p className="eyebrow">License</p>
          <p className="font-serif font-bold mt-1">
            {app.license ? app.license.replace(/_/g, "-") : "—"}
          </p>
        </div>
      </div>

      {/* Docker quick start */}
      <section>
        <SectionHeader
          eyebrow="DOCKER"
          title="Quick Start"
          description="Get running with Docker in seconds."
        />
        <DockerSnippet tabs={dockerTabs} />
      </section>

      {/* Links */}
      <section>
        <h2 className="section-heading text-2xl mb-4">Links</h2>
        <div className="flex flex-wrap gap-3">
          {app.githubUrl && (
            <a
              href={app.githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-outline"
            >
              GitHub
            </a>
          )}
          {app.dockerHubUrl && (
            <a
              href={app.dockerHubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-outline"
            >
              Docker Hub
            </a>
          )}
          {app.docsUrl && (
            <a
              href={app.docsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-outline"
            >
              Official Docs
            </a>
          )}
          {app.websiteUrl && (
            <a
              href={app.websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-outline"
            >
              Website
            </a>
          )}
        </div>
      </section>

      {/* Dependencies */}
      {app.dependencies.length > 0 && (
        <section>
          <h2 className="section-heading text-2xl mb-4">Dependencies</h2>
          <ul className="space-y-2">
            {app.dependencies.map((dep) => (
              <li key={dep.id} className="flex items-center gap-2">
                <span className="badge">{dep.dependency.name}</span>
                <span className="font-mono text-xs text-ink/60">
                  {dep.type} · {dep.dependency.image}
                  {dep.optional && " (optional)"}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Description */}
      <section>
        <h2 className="section-heading text-2xl mb-4">About</h2>
        <p className="text-ink/80 leading-relaxed">{app.description}</p>
      </section>

      {/* Also on InfraUp */}
      {alternatives.length > 0 && (
        <section>
          <SectionHeader
            eyebrow="ALSO ON INFRAUP"
            title="Alternatives in this category"
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {alternatives.map((alt: AppWithDeps) => (
              <AppCard key={alt.id} app={alt} />
            ))}
          </div>
        </section>
      )}

      {/* Phase 2 CTA */}
      <section
        className="p-8 border-2 border-accent bg-accent text-white"
        style={{ boxShadow: "var(--shadow-brutal-accent-lg)" }}
      >
        <h2 className="font-serif text-xl font-bold">Want a full production config?</h2>
        <p className="mt-2 text-white/90">
          Our generator produces ready-to-deploy Docker Compose with domains, secrets, and integrations.
        </p>
        <Link
          href={getGeneratorUrl()}
          className="inline-flex items-center justify-center px-6 py-3 font-mono text-sm uppercase tracking-wider mt-4 bg-white text-ink border-2 border-white hover:bg-ink hover:text-white hover:border-ink transition-colors duration-150"
        >
          Get Started
        </Link>
      </section>
    </div>
  );
}
