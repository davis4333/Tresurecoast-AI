import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing - Treasure Coast AI",
  description: "Simple, transparent pricing for AI-powered customer engagement",
};

export default function PricingPage() {
  return (
    <div className="tca-background tca-text-primary" style={{ minHeight: "100vh" }}>
      <header
        className="tca-surface tca-border"
        style={{ padding: "var(--space-lg) var(--space-xl)", borderTop: "none", borderLeft: "none", borderRight: "none" }}
      >
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <h1 className="tca-text-brand" style={{ fontSize: "1.5rem", fontWeight: "700", margin: 0 }}>
            Treasure Coast AI
          </h1>
        </div>
      </header>

      <main style={{ maxWidth: "1200px", margin: "0 auto", padding: "var(--space-2xl) var(--space-xl)" }}>
        <div style={{ textAlign: "center", marginBottom: "var(--space-2xl)" }}>
          <h2
            className="tca-gradient-text"
            style={{ fontSize: "2.5rem", fontWeight: "800", marginBottom: "var(--space-md)" }}
          >
            Simple, Transparent Pricing
          </h2>
          <p className="tca-text-secondary" style={{ fontSize: "1.25rem", maxWidth: "600px", margin: "0 auto" }}>
            AI-powered customer engagement for your business
          </p>
        </div>

        <div className="tca-card" style={{ maxWidth: "400px", margin: "0 auto", padding: "var(--space-xl)" }}>
          <div style={{ marginBottom: "var(--space-lg)" }}>
            <h3 style={{ fontSize: "1.5rem", fontWeight: "700", marginBottom: "var(--space-sm)", marginTop: 0 }}>
              Professional
            </h3>
            <div style={{ display: "flex", alignItems: "baseline", gap: "var(--space-xs)" }}>
              <span className="tca-text-brand" style={{ fontSize: "3rem", fontWeight: "800" }}>
                $99
              </span>
              <span className="tca-text-secondary">/month</span>
            </div>
          </div>

          <ul style={{ marginBottom: "var(--space-xl)", listStyle: "none", padding: 0 }}>
            {[
              "24/7 AI customer support",
              "Lead capture & management",
              "Custom business knowledge",
              "Service booking integration",
              "Analytics dashboard",
            ].map((feature) => (
              <li
                key={feature}
                className="tca-text-secondary"
                style={{ padding: "var(--space-sm) 0", display: "flex", alignItems: "center", gap: "var(--space-sm)" }}
              >
                <span style={{ color: "var(--color-success)" }}>✓</span>
                {feature}
              </li>
            ))}
          </ul>

          <a href="/request-demo" className="tca-btn-primary">
            Request Demo
          </a>
        </div>
      </main>
    </div>
  );
}
