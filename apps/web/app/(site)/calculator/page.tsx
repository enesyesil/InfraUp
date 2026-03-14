import type { Metadata } from "next";
import Link from "next/link";
import { SectionHeader } from "@/components/site/SectionHeader";
import { SavingsCalculator } from "@/components/site/SavingsCalculator";

export const metadata: Metadata = {
  title: "Savings Calculator — How Much Could You Save?",
  description:
    "Estimate your annual savings by replacing SaaS tools with self-hosted alternatives. Adjust team size, tools, and VPS cost.",
};

export default function CalculatorPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
      <div className="mb-12">
        <SectionHeader
          eyebrow="SAVINGS CALCULATOR"
          title="How Much Could You Save?"
          description="Replace costly SaaS subscriptions with self-hosted alternatives. Adjust your team size, tools, and server cost to see potential savings."
        />
      </div>

      <SavingsCalculator />

      <div className="mt-16 ruled-divider pt-8 flex flex-col sm:flex-row gap-6">
        <Link href="/apps" className="btn-accent">
          Browse app catalog
        </Link>
        <Link href="/#waitlist" className="btn-outline">
          Join the waitlist
        </Link>
      </div>

      <p className="mt-8 font-mono text-xs text-ink/50 max-w-2xl">
        * Estimates only. Actual savings depend on your usage, setup time, and
        maintenance. SaaS prices are approximate and may vary by plan.
      </p>
    </div>
  );
}
