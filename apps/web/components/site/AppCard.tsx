import Link from "next/link";
import { ArrowRight, Star } from "lucide-react";
import type { AppWithDeps } from "@/lib/db";
import { formatCategory, categorySlug } from "@/lib/utils";

interface AppCardProps {
  app: AppWithDeps;
}

export function AppCard({ app }: AppCardProps) {
  return (
    <Link
      href={`/apps/${app.slug}`}
      className="group block card"
    >
      <div className="flex items-start gap-4">
        {app.logoUrl && (
          <img
            src={`/logos/${app.logoUrl}`}
            alt={`${app.name} logo`}
            className="w-10 h-10 object-contain"
          />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-serif text-lg font-bold">{app.name}</h3>
            <span className="badge text-[10px]">
              {formatCategory(app.category)}
            </span>
          </div>

          {app.replaces.length > 0 && (
            <p className="mt-1 text-sm text-ink/60">
              Replaces:{" "}
              <span className="line-through">
                {app.replaces.join(", ")}
              </span>
            </p>
          )}
        </div>
      </div>

      <p className="mt-3 text-sm text-ink/70 line-clamp-2">{app.description}</p>

      <div className="mt-4 flex items-center gap-3 flex-wrap">
        <span className="badge text-[10px]">{app.minRam}</span>
        {app.license && <span className="badge text-[10px]">{app.license.replace(/_/g, "-")}</span>}
        <span className="badge text-[10px]">{app.tier}</span>
        {app.githubStars && (
          <span className="flex items-center gap-1 text-xs text-ink/60">
            <Star size={12} />
            {app.githubStars >= 1000
              ? `${(app.githubStars / 1000).toFixed(1)}k`
              : app.githubStars}
          </span>
        )}
      </div>

      {app.tags.length > 0 && (
        <div className="mt-3 flex items-center gap-2 flex-wrap">
          {app.tags.slice(0, 4).map((tag: string) => (
            <span key={tag} className="text-xs text-ink/50 font-mono">
              #{tag}
            </span>
          ))}
        </div>
      )}

      <div className="mt-4 flex items-center gap-1 font-mono text-xs uppercase tracking-wider text-ink/60 group-hover:text-accent transition-colors">
        View App <ArrowRight size={14} />
      </div>
    </Link>
  );
}
