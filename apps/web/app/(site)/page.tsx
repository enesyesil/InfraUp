import Link from "next/link";
import { Package, Settings, Rocket } from "lucide-react";
import {
  getFeaturedApps,
  getCategories,
} from "@/lib/db";

/** DB is not reachable during Docker/BuildKit image build; render at request time. */
export const dynamic = "force-dynamic";
import { AppCard } from "@/components/site/AppCard";
import { CategoryCard } from "@/components/site/CategoryCard";
import { SectionHeader } from "@/components/site/SectionHeader";
import { WaitlistForm } from "@/components/site/WaitlistForm";

export default async function LandingPage() {
  const [featuredApps, categories] = await Promise.all([
    getFeaturedApps(),
    getCategories(),
  ]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-24 pb-24">
      {/* Hero */}
      <section className="pt-16 md:pt-24">
        <div className="max-w-4xl">
          <h1 className="section-heading">
            Self-Host Everything.
          </h1>
          <p className="mt-6 text-lg md:text-xl text-ink/70 max-w-2xl">
            Replace costly SaaS tools with open source alternatives. Deploy on
            your own infrastructure. Own your data.
          </p>
          <div className="mt-10">
            <Link href="#waitlist" className="btn-accent">
              Join the Waitlist
            </Link>
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="border-2 border-ink" style={{ boxShadow: "var(--shadow-brutal)" }}>
        <div className="grid grid-cols-1 md:grid-cols-3">
          <div className="text-center py-8 px-6 border-b-2 md:border-b-0 md:border-r-2 border-ink">
            <p className="font-serif text-3xl md:text-4xl font-bold">50+</p>
            <p className="eyebrow mt-2">Apps</p>
          </div>
          <div className="text-center py-8 px-6 border-b-2 md:border-b-0 md:border-r-2 border-ink">
            <p className="font-serif text-3xl md:text-4xl font-bold">$2,400/yr</p>
            <p className="eyebrow mt-2">Savings</p>
          </div>
          <div className="text-center py-8 px-6">
            <p className="font-serif text-3xl md:text-4xl font-bold">5 Min</p>
            <p className="eyebrow mt-2">Deploy</p>
          </div>
        </div>
      </section>

      {/* Featured apps */}
      <section>
        <SectionHeader
          eyebrow="FEATURED"
          title="Featured Apps"
          description="Popular open source replacements for the tools you use every day."
        />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {featuredApps.map((app) => (
            <AppCard key={app.id} app={app} />
          ))}
        </div>
      </section>

      {/* Categories */}
      <section>
        <SectionHeader
          eyebrow="CATEGORIES"
          title="Browse by Category"
          description="Find self-hosted alternatives organized by use case."
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {categories.map(({ category, count }) => (
            <CategoryCard
              key={category}
              category={category}
              count={count}
            />
          ))}
        </div>
      </section>

      {/* How it works */}
      <section>
        <SectionHeader
          eyebrow="HOW IT WORKS"
          title="Deploy in Minutes"
          description="Three steps to self-hosted infrastructure."
        />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
          <div className="card">
            <div className="w-12 h-12 border-2 border-ink flex items-center justify-center mb-4" style={{ boxShadow: "var(--shadow-brutal-sm)" }}>
              <Package size={24} className="text-ink" />
            </div>
            <h3 className="font-serif text-xl font-bold">1. Pick Apps</h3>
            <p className="mt-2 text-ink/70">
              Choose from 50+ curated open source alternatives. Filter by
              category, license, and requirements.
            </p>
          </div>
          <div className="card">
            <div className="w-12 h-12 border-2 border-ink flex items-center justify-center mb-4" style={{ boxShadow: "var(--shadow-brutal-sm)" }}>
              <Settings size={24} className="text-ink" />
            </div>
            <h3 className="font-serif text-xl font-bold">2. Configure</h3>
            <p className="mt-2 text-ink/70">
              Our generator produces a ready-to-deploy Docker Compose config.
              Customize domains, secrets, and integrations.
            </p>
          </div>
          <div className="card">
            <div className="w-12 h-12 border-2 border-ink flex items-center justify-center mb-4" style={{ boxShadow: "var(--shadow-brutal-sm)" }}>
              <Rocket size={24} className="text-ink" />
            </div>
            <h3 className="font-serif text-xl font-bold">3. Deploy</h3>
            <p className="mt-2 text-ink/70">
              One command to spin up your stack. Run on any VPS, homelab, or
              cloud provider.
            </p>
          </div>
        </div>
      </section>

      {/* Waitlist */}
      <section id="waitlist" className="scroll-mt-24">
        <SectionHeader
          eyebrow="JOIN THE WAITLIST"
          title="Get Early Access"
          description="Be the first to know when our config generator launches."
        />
        <div className="max-w-md">
          <WaitlistForm />
        </div>
      </section>
    </div>
  );
}
