import Link from "next/link";

const footerLinks = {
  Product: [
    { href: "/apps", label: "App Catalog" },
    { href: "/deploy", label: "Deploy Guide" },
    { href: "/calculator", label: "Savings Calculator" },
    { href: "/platform", label: "Platform" },
  ],
  Resources: [
    { href: "/guides", label: "Guides" },
    { href: "/blog", label: "Blog" },
    { href: "/about", label: "About" },
  ],
  Legal: [
    { href: "/about", label: "About Us" },
  ],
};

export function Footer() {
  return (
    <footer className="border-t-2 border-ink bg-white mt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          <div>
            <div className="flex items-center gap-2">
              <img src="/logos/logo-infra.png" alt="InfraUp" className="h-8 w-8" />
              <span className="font-mono text-lg font-bold tracking-tight">InfraUp</span>
            </div>
            <p className="mt-4 text-sm text-ink/70 max-w-xs">
              Self-hosted open source alternatives to SaaS tools.
              Your infrastructure, your rules.
            </p>
          </div>

          {Object.entries(footerLinks).map(([heading, links]) => (
            <div key={heading}>
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-ink/50 mb-4">
                {heading}
              </p>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-ink/70 hover:text-ink hover:underline underline-offset-2 transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="ruled-divider mt-12 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="font-mono text-xs text-ink/50">
            &copy; {new Date().getFullYear()} InfraUp. Open source.
          </p>
          <div className="flex items-center gap-6">
            <a
              href="https://github.com/infraup"
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-xs text-ink/50 hover:text-ink transition-colors"
            >
              GitHub
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
