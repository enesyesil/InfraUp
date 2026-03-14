"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { getGeneratorUrl } from "@/lib/utils";

const navLinks = [
  { href: "/apps", label: "Catalog" },
  { href: "/deploy", label: "Deploy" },
  { href: "/calculator", label: "Calculator" },
  { href: "/guides", label: "Guides" },
  { href: "/blog", label: "Blog" },
  { href: "/platform", label: "Platform" },
];

export function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <nav className="border-b-2 border-ink bg-white sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2">
            <img src="/logos/logo-infra.png" alt="InfraUp" className="h-8 w-8" />
            <span className="font-mono text-lg font-bold tracking-tight">InfraUp</span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="font-mono text-sm uppercase tracking-wider text-ink/70 hover:text-ink hover:underline underline-offset-4 transition-colors"
              >
                {link.label}
              </Link>
            ))}
            <Link href={getGeneratorUrl()} className="btn-accent text-xs py-2 px-4">
              Get Started
            </Link>
          </div>

          <button
            onClick={() => setOpen(!open)}
            className="md:hidden p-2 border-2 border-ink"
            aria-label="Toggle menu"
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {open && (
        <div className="md:hidden border-t-2 border-ink bg-white">
          <div className="px-4 py-4 space-y-3">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="block font-mono text-sm uppercase tracking-wider py-2 hover:underline"
              >
                {link.label}
              </Link>
            ))}
            <Link
              href={getGeneratorUrl()}
              onClick={() => setOpen(false)}
              className="btn-accent text-xs py-2 px-4 w-full text-center mt-4"
            >
              Get Started
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
