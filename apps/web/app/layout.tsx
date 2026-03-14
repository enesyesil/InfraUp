import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "InfraUp — Self-Hosted Open Source Alternatives",
    template: "%s | InfraUp",
  },
  description:
    "Discover 50+ self-hosted open source alternatives to SaaS tools. Replace Notion, Slack, HubSpot, and more. Deploy on your own server in minutes.",
  metadataBase: new URL("https://infraup.dev"),
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://infraup.dev",
    siteName: "InfraUp",
    title: "InfraUp — Self-Hosted Open Source Alternatives",
    description:
      "Discover 50+ self-hosted open source alternatives to SaaS tools.",
  },
  twitter: {
    card: "summary_large_image",
    title: "InfraUp — Self-Hosted Open Source Alternatives",
    description:
      "Discover 50+ self-hosted open source alternatives to SaaS tools.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-white">{children}</body>
    </html>
  );
}
