import type { Metadata } from "next";
import Link from "next/link";
import { SectionHeader } from "@/components/site/SectionHeader";
import { WaitlistForm } from "@/components/site/WaitlistForm";

export const metadata: Metadata = {
  title: "About — InfraUp",
  description:
    "InfraUp helps teams replace costly SaaS tools with self-hosted open source alternatives. Own your data, control your costs.",
};

export default function AboutPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
      <SectionHeader
        eyebrow="ABOUT INFRAUP"
        title="We believe SaaS pricing punishes growth"
      />

      <div className="max-w-2xl space-y-12">
        <p className="font-serif text-xl text-ink/90 leading-relaxed">
          Every seat you add, every feature you unlock—the bill goes up. We&apos;ve
          watched teams hit scaling walls not because of technical limits, but
          because their software stack became a tax on growth. That&apos;s backwards.
        </p>

        <p className="font-serif text-lg text-ink/80 leading-relaxed">
          We&apos;re building InfraUp to flip that. A curated catalog of self-hosted
          open source alternatives. A config generator that turns &quot;pick your
          apps&quot; into &quot;deploy in one command.&quot; Your infrastructure, your
          rules, your data.
        </p>

        <section>
          <h2 className="font-serif text-2xl font-bold mb-4">
            What we&apos;re building
          </h2>
          <ul className="space-y-3 text-ink/70">
            <li className="flex gap-3">
              <span className="font-mono text-ink/50">01</span>
              A discovery site for 50+ self-hosted alternatives to Notion, Slack,
              HubSpot, and more.
            </li>
            <li className="flex gap-3">
              <span className="font-mono text-ink/50">02</span>
              A config generator that produces ready-to-deploy Docker Compose
              stacks.
            </li>
            <li className="flex gap-3">
              <span className="font-mono text-ink/50">03</span>
              Guides and comparisons to help you choose and deploy with
              confidence.
            </li>
          </ul>
        </section>

        <section className="border-2 border-ink py-8 px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <p className="font-serif text-3xl font-bold">50+</p>
              <p className="eyebrow mt-1">Apps</p>
            </div>
            <div>
              <p className="font-serif text-3xl font-bold">20+</p>
              <p className="eyebrow mt-1">Categories</p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="font-serif text-2xl font-bold mb-4">Open source</h2>
          <p className="text-ink/70 mb-4">
            InfraUp is open source. The catalog, the guides, and the generator
            logic are built in the open. Contributions welcome.
          </p>
          <a
            href="https://github.com/infraup"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-outline"
          >
            View on GitHub
          </a>
        </section>

        <section id="waitlist" className="scroll-mt-24 ruled-divider pt-12">
          <h2 className="font-serif text-2xl font-bold mb-4">
            Get early access
          </h2>
          <p className="text-ink/70 mb-6">
            Join the waitlist to be notified when the config generator launches.
          </p>
          <div className="max-w-md">
            <WaitlistForm />
          </div>
        </section>
      </div>
    </div>
  );
}
