"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cx } from "./tca";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/pricing", label: "Pricing" },
  { href: "/demo", label: "Live Demo" },
  { href: "/request-demo", label: "Request Demo" },
];

export function PublicNav() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--color-border)] bg-[var(--color-background)]/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link
          href="/"
          className="text-xl font-extrabold text-[var(--color-brand-primary)]"
          data-testid="link-home-logo"
        >
          Treasure Coast AI
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              data-testid={`link-nav-${link.label.toLowerCase().replace(/\s/g, "-")}`}
              className={cx(
                "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                pathname === link.href
                  ? "bg-[var(--color-surface-elevated)] text-[var(--color-text-primary)]"
                  : "text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-primary)]"
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/sign-in"
            className="rounded-lg px-3 py-2 text-sm font-medium text-[var(--color-text-secondary)] transition-colors hover:text-[var(--color-text-primary)]"
            data-testid="link-sign-in"
          >
            Sign In
          </Link>
          <Link
            href="/request-demo"
            className="rounded-lg bg-[var(--color-brand-primary)] px-4 py-2 text-sm font-medium text-white transition-all hover:shadow-lg hover:shadow-[var(--color-brand-primary)]/25"
            data-testid="link-request-demo-cta"
          >
            Book a Demo
          </Link>
        </div>
      </div>
    </header>
  );
}
