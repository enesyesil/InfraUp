import type { Metadata } from "next";
import Link from "next/link";
import { SectionHeader } from "@/components/site/SectionHeader";
import { getGeneratorUrl } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Platform — The InfraUp Config Generator",
  description:
    "Generate ready-to-deploy Docker Compose configs for self-hosted apps. Free, Pro, Max, and Proserve tiers. Coming soon.",
};

const steps = [
  "Pick apps from the catalog",
  "Configure domains and secrets",
  "Generate Docker Compose",
  "Deploy with one command",
];

const tiers = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    features: [
      "custom project",
      "1 generation / week",
      "Docker Compose only",
      "Single app + dependencies",
      "Raw YAML download",
      "30-day modify window",
    ],
    highlight: false,
  },
  {
    name: "Pro",
    price: "$14.99",
    period: "one-time lifetime",
    features: [
      "3 projects",
      "Unlimited modifications",
      "Docker Compose + Swarm",
      "Multi-app stacks",
      "ZIP download",
      "Extra generations: $2.99",
    ],
    highlight: true,
  },
  {
    name: "Max",
    price: "$29.99",
    period: "one-time lifetime",
    features: [
      "10 projects",
      "Unlimited modifications",
      "Compose + Swarm + K8s",
      "Terraform + Helm configs",
      "Traefik auto-config",
      "ZIP download",
    ],
    highlight: false,
  },
  {
    name: "Proserve",
    price: "$199.99",
    period: "one-time",
    features: [
      "Everything in Max",
      "1:1 onboarding",
      "Config reviewed personally",
      "Deployment assistance",
      "30-day email support",
      "5 slots max",
    ],
    highlight: false,
  },
];

export default function PlatformPage() {
  const generatorUrl = getGeneratorUrl();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
      <div className="text-center mb-16">
        <span className="stamp-solid inline-block mb-6 rotate-[-3deg]">
          COMING SOON
        </span>
        <h1 className="section-heading">
          The InfraUp Config Generator
        </h1>
        <p className="mt-6 text-lg text-ink/70 max-w-2xl mx-auto">
          Generate production-ready Docker Compose configs for self-hosted apps.
          Pick apps, configure domains, deploy.
        </p>
      </div>

      {/* How it works preview */}
      <section className="mb-20">
        <p className="eyebrow mb-6">How it works</p>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {steps.map((step, i) => (
            <div
              key={i}
              className="border-2 border-dashed border-ink/40 bg-ink/[0.03] p-6"
              style={{ boxShadow: "var(--shadow-brutal-sm)" }}
            >
              <span className="font-mono text-sm font-bold text-accent">
                {String(i + 1).padStart(2, "0")}
              </span>
              <p className="mt-2 font-serif font-bold text-ink">{step}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing cards */}
      <section>
        <SectionHeader
          eyebrow="PRICING"
          title="Early Access Pricing"
          description="One-time payments. No subscriptions. Lock in these prices before launch."
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className={`border-2 p-6 flex flex-col transition-all duration-150 hover:-translate-y-0.5 hover:-translate-x-0.5 ${
                tier.highlight
                  ? "border-accent bg-ink text-white"
                  : "border-ink"
              } pricing-card ${tier.highlight ? "pricing-card--highlight" : ""}`}
            >
              {tier.highlight && (
                <span className="font-mono text-xs uppercase tracking-wider text-accent mb-2">
                  Most Popular
                </span>
              )}
              <h3 className="font-serif text-xl font-bold">{tier.name}</h3>
              <p className="mt-2 font-mono text-2xl font-bold">{tier.price}</p>
              {tier.period && (
                <p className={`font-mono text-xs ${tier.highlight ? "text-white/60" : "text-ink/60"}`}>
                  {tier.period}
                </p>
              )}
              <ul className="mt-6 space-y-2 flex-1">
                {tier.features.map((f) => (
                  <li key={f} className={`text-sm ${tier.highlight ? "text-white/70" : "text-ink/70"}`}>
                    • {f}
                  </li>
                ))}
              </ul>
              <Link
                href={generatorUrl}
                className={`${tier.highlight ? "btn-accent" : "btn-primary"} w-full text-center mt-6`}
              >
                Join waitlist
              </Link>
            </div>
          ))}
        </div>
        <p className="mt-8 font-mono text-xs text-ink/50">
          * Early access pricing. Prices may increase after launch.
        </p>
      </section>
    </div>
  );
}
