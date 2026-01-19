import type { Metadata } from "next";
import Link from "next/link";
import { TcaCard, TcaCardBody, TcaCardFooter, TcaCardHeader } from "@/components/tca/TcaCard";
import { TcaButton } from "@/components/tca/TcaButton";
import { TcaBadge } from "@/components/tca/TcaBadge";

export const metadata: Metadata = {
  title: "Pricing - Treasure Coast AI",
  description: "Simple, transparent pricing for agency-managed AI chatbots",
};

const STARTER_FEATURES = [
  "1 AI chatbot",
  "Lead capture & scoring",
  "Truth Mode (no hallucinations)",
  "Booking/payment redirects",
  "Email support",
];

const PRO_FEATURES = [
  "Up to 5 AI chatbots",
  "Everything in Starter",
  "Custom knowledge base",
  "Priority support",
  "Analytics dashboard",
  "White-label option",
];

const AGENCY_FEATURES = [
  "Unlimited chatbots",
  "Everything in Pro",
  "Multi-client management",
  "Custom domain",
  "Dedicated account manager",
  "API access",
];

export default function PricingPage() {
  return (
    <div className="py-20">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-16 text-center">
          <h1 className="mb-4 text-4xl font-extrabold tracking-tight">
            <span className="tca-gradient-text">Simple, Transparent</span> Pricing
          </h1>
          <p className="mx-auto max-w-xl text-lg text-[var(--color-text-secondary)]">
            Agency-managed AI chatbots that only answer from verified business data.
            We handle everything.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          <TcaCard>
            <TcaCardHeader>
              <div className="mb-2 text-lg font-bold">Starter</div>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-extrabold">$99</span>
                <span className="text-sm text-[var(--color-text-secondary)]">/month</span>
              </div>
              <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
                Perfect for small businesses getting started.
              </p>
            </TcaCardHeader>
            <TcaCardBody>
              <ul className="space-y-3">
                {STARTER_FEATURES.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <span className="mt-0.5 text-[var(--color-success)]">
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                    <span className="text-[var(--color-text-secondary)]">{f}</span>
                  </li>
                ))}
              </ul>
            </TcaCardBody>
            <TcaCardFooter>
              <Link href="/request-demo" className="block">
                <TcaButton variant="secondary" fullWidth>Request Demo</TcaButton>
              </Link>
            </TcaCardFooter>
          </TcaCard>

          <TcaCard elevated>
            <TcaCardHeader className="relative">
              <TcaBadge className="absolute right-4 top-4">Most Popular</TcaBadge>
              <div className="mb-2 text-lg font-bold">Professional</div>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-extrabold text-[var(--color-brand-primary)]">$249</span>
                <span className="text-sm text-[var(--color-text-secondary)]">/month</span>
              </div>
              <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
                For growing businesses with multiple locations.
              </p>
            </TcaCardHeader>
            <TcaCardBody>
              <ul className="space-y-3">
                {PRO_FEATURES.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <span className="mt-0.5 text-[var(--color-success)]">
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                    <span className="text-[var(--color-text-secondary)]">{f}</span>
                  </li>
                ))}
              </ul>
            </TcaCardBody>
            <TcaCardFooter>
              <Link href="/request-demo" className="block" data-testid="link-pricing-request-demo">
                <TcaButton fullWidth>Request Demo</TcaButton>
              </Link>
            </TcaCardFooter>
          </TcaCard>

          <TcaCard>
            <TcaCardHeader>
              <div className="mb-2 text-lg font-bold">Agency</div>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-extrabold">Custom</span>
              </div>
              <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
                For agencies managing multiple client accounts.
              </p>
            </TcaCardHeader>
            <TcaCardBody>
              <ul className="space-y-3">
                {AGENCY_FEATURES.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <span className="mt-0.5 text-[var(--color-success)]">
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                    <span className="text-[var(--color-text-secondary)]">{f}</span>
                  </li>
                ))}
              </ul>
            </TcaCardBody>
            <TcaCardFooter>
              <Link href="/request-demo" className="block">
                <TcaButton variant="secondary" fullWidth>Contact Sales</TcaButton>
              </Link>
            </TcaCardFooter>
          </TcaCard>
        </div>

        <div className="mt-16 text-center">
          <p className="text-sm text-[var(--color-text-muted)]">
            All plans include setup, training, and ongoing support.
            Booking and payment links redirect to your existing providers.
          </p>
        </div>
      </div>
    </div>
  );
}
