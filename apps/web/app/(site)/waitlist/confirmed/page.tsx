import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "You're on the list — InfraUp",
  description:
    "Thanks for joining the InfraUp waitlist. We'll notify you when the config generator launches.",
};

export default function WaitlistConfirmedPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32 text-center">
      <h1 className="section-heading">You&apos;re on the list.</h1>
      <p className="mt-6 text-lg text-ink/70">
        We&apos;ll notify you when the InfraUp config generator launches. In the
        meantime, browse the app catalog and start planning your stack.
      </p>
      <div className="mt-12 flex flex-col sm:flex-row gap-4 justify-center">
        <Link href="/" className="btn-primary">
          Back to homepage
        </Link>
        <Link href="/apps" className="btn-outline">
          Browse app catalog
        </Link>
      </div>
    </div>
  );
}
