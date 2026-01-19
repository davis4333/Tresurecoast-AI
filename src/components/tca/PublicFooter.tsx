import Link from "next/link";

const FOOTER_LINKS = {
  Product: [
    { href: "/pricing", label: "Pricing" },
    { href: "/demo", label: "Live Demo" },
    { href: "/request-demo", label: "Request Demo" },
  ],
  Company: [
    { href: "mailto:sales@treasurecoastai.com", label: "Contact" },
  ],
};

export function PublicFooter() {
  return (
    <footer className="border-t border-[var(--color-border)] bg-[var(--color-surface)]">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="grid gap-8 md:grid-cols-4">
          <div className="md:col-span-2">
            <div className="mb-4 text-lg font-extrabold text-[var(--color-brand-primary)]">
              Treasure Coast AI
            </div>
            <p className="max-w-sm text-sm text-[var(--color-text-secondary)]">
              AI-powered lead capture that only answers from verified business data.
              No hallucinations. No missed leads.
            </p>
          </div>

          {Object.entries(FOOTER_LINKS).map(([category, links]) => (
            <div key={category}>
              <h4 className="mb-3 text-sm font-semibold text-[var(--color-text-primary)]">
                {category}
              </h4>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-[var(--color-text-secondary)] transition-colors hover:text-[var(--color-text-primary)]"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 border-t border-[var(--color-border-subtle)] pt-6">
          <p className="text-center text-xs text-[var(--color-text-muted)]">
            {new Date().getFullYear()} Treasure Coast AI. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
