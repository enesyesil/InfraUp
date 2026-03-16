import Link from "next/link";
import { Check, X, ArrowRight, Star } from "lucide-react";
import type { AppWithDeps } from "@/lib/db";

interface AppComparisonProps {
  appA: AppWithDeps;
  appB: AppWithDeps;
  verdict?: React.ReactNode;
}

const featureLabels: Record<string, string> = {
  hasApi: "API",
  hasSSOSupport: "SSO Support",
  hasMobileApp: "Mobile App",
  hasGuestAccess: "Guest Access",
  hasAuditLog: "Audit Log",
  hasMultiLanguage: "Multi-language",
  hasOfflineMode: "Offline Mode",
  hasBackupTool: "Backup Tool",
};

function FeatureIcon({ value }: { value: boolean }) {
  return value ? (
    <Check size={18} className="text-ink" />
  ) : (
    <X size={18} className="text-ink/30" />
  );
}

function formatStars(stars: number | null): string {
  if (!stars) return "—";
  if (stars >= 1000) return `${(stars / 1000).toFixed(1)}k`;
  return String(stars);
}

export function AppComparison({ appA, appB, verdict }: AppComparisonProps) {
  return (
    <div className="space-y-12">
      {/* Side-by-side header */}
      <div className="grid grid-cols-2 gap-4">
        {[appA, appB].map((app) => (
          <div key={app.slug} className="border-2 border-ink p-6 text-center transition-all duration-150 hover:-translate-y-0.5" style={{ boxShadow: "var(--shadow-brutal-sm)" }}>
            {app.logoUrl && (
              <img
                src={`/logos/${app.logoUrl}`}
                alt={`${app.name} logo`}
                className="w-16 h-16 object-contain mx-auto mb-4"
              />
            )}
            <h3 className="font-serif text-xl font-bold">{app.name}</h3>
            <div className="mt-2 flex items-center justify-center gap-1 text-sm text-ink/60">
              <Star size={14} /> {formatStars(app.githubStars)}
            </div>
            <div className="mt-2 flex flex-wrap justify-center gap-2">
              <span className="badge text-[10px]">{app.minRam}</span>
              {app.license && (
                <span className="badge text-[10px]">
                  {app.license.replace(/_/g, "-")}
                </span>
              )}
            </div>
            <Link
              href={`/apps/${app.slug}`}
              className="mt-4 inline-flex items-center gap-1 font-mono text-xs uppercase tracking-wider hover:underline"
            >
              View {app.name} <ArrowRight size={12} />
            </Link>
          </div>
        ))}
      </div>

      {/* Feature matrix */}
      <div>
        <h3 className="font-serif text-xl font-bold mb-4">Feature Comparison</h3>
        <div className="border-2 border-ink" style={{ boxShadow: "var(--shadow-brutal)" }}>
          <div className="grid grid-cols-3 border-b-2 border-ink bg-ink text-white">
            <div className="p-3 font-mono text-xs uppercase tracking-wider">
              Feature
            </div>
            <div className="p-3 font-mono text-xs uppercase tracking-wider text-center border-l border-white/20">
              {appA.name}
            </div>
            <div className="p-3 font-mono text-xs uppercase tracking-wider text-center border-l border-white/20">
              {appB.name}
            </div>
          </div>
          {Object.entries(featureLabels).map(([key, label]) => (
            <div
              key={key}
              className="grid grid-cols-3 border-b border-ink/20 last:border-b-0"
            >
              <div className="p-3 text-sm">{label}</div>
              <div className="p-3 flex justify-center border-l border-ink/20">
                <FeatureIcon value={(appA as Record<string, unknown>)[key] as boolean} />
              </div>
              <div className="p-3 flex justify-center border-l border-ink/20">
                <FeatureIcon value={(appB as Record<string, unknown>)[key] as boolean} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Technical comparison */}
      <div>
        <h3 className="font-serif text-xl font-bold mb-4">Technical Details</h3>
        <div className="border-2 border-ink" style={{ boxShadow: "var(--shadow-brutal)" }}>
          <div className="grid grid-cols-3 border-b-2 border-ink bg-ink text-white">
            <div className="p-3 font-mono text-xs uppercase tracking-wider">
              Metric
            </div>
            <div className="p-3 font-mono text-xs uppercase tracking-wider text-center border-l border-white/20">
              {appA.name}
            </div>
            <div className="p-3 font-mono text-xs uppercase tracking-wider text-center border-l border-white/20">
              {appB.name}
            </div>
          </div>
          {[
            {
              label: "Min RAM",
              a: appA.minRam,
              b: appB.minRam,
            },
            {
              label: "Dependencies",
              a:
                appA.dependencies
                  .map((d) => d.dependency.name)
                  .join(", ") || "None",
              b:
                appB.dependencies
                  .map((d) => d.dependency.name)
                  .join(", ") || "None",
            },
            {
              label: "Complexity",
              a: appA.deploymentComplexity,
              b: appB.deploymentComplexity,
            },
            {
              label: "Docker Image",
              a: appA.officialDockerImage ? "Official" : "Community",
              b: appB.officialDockerImage ? "Official" : "Community",
            },
            {
              label: "License",
              a: appA.license?.replace(/_/g, "-") || "—",
              b: appB.license?.replace(/_/g, "-") || "—",
            },
            {
              label: "Tier",
              a: appA.tier,
              b: appB.tier,
            },
          ].map((row) => (
            <div
              key={row.label}
              className="grid grid-cols-3 border-b border-ink/20 last:border-b-0"
            >
              <div className="p-3 text-sm">{row.label}</div>
              <div className="p-3 text-sm text-center border-l border-ink/20">
                {row.a}
              </div>
              <div className="p-3 text-sm text-center border-l border-ink/20">
                {row.b}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Verdict */}
      {verdict && (
        <div className="border-2 border-ink p-8" style={{ boxShadow: "var(--shadow-brutal)" }}>
          <h3 className="font-serif text-xl font-bold mb-4">The Verdict</h3>
          <div className="prose prose-sm max-w-none">{verdict}</div>
        </div>
      )}
    </div>
  );
}
