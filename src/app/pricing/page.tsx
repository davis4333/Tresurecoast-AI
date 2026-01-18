import type { Metadata } from "next";
import { TcaPageShell } from "@/components/tca/TcaPageShell";
import {
  TcaCard,
  TcaCardBody,
  TcaCardFooter,
  TcaCardHeader,
} from "@/components/tca/TcaCard";
import { TcaButton } from "@/components/tca/TcaButton";
import { TcaBadge } from "@/components/tca/TcaBadge";

export const metadata: Metadata = {
  title: "Pricing - Treasure Coast AI",
  description: "Simple, transparent pricing for AI-powered customer engagement",
};

const FEATURES = [
  "24/7 AI customer support",
  "Lead capture & management",
  "Custom business knowledge (Truth Mode)",
  "External booking/payment routing",
  "Analytics dashboard",
];

export default function PricingPage() {
  return (
    <TcaPageShell title="Pricing" subtitle="Simple, transparent pricing for your business">
      <div className="mx-auto max-w-3xl text-center">
        <div className="mx-auto mb-10 max-w-2xl space-y-3">
          <h1 className="tca-gradient-text text-4xl font-extrabold tracking-tight">
            Simple, Transparent Pricing
          </h1>
          <p className="text-lg text-[var(--color-text-secondary)]">
            Premium, agency-run AI chatbots that only answer from verified business data — no
            hallucinations.
          </p>
        </div>

        <div className="mx-auto max-w-md">
          <TcaCard glow>
            <TcaCardHeader className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-xl font-bold">Professional</div>
                <TcaBadge>Most Popular</TcaBadge>
              </div>
              <div className="flex items-baseline justify-center gap-2">
                <div className="text-5xl font-extrabold text-[var(--color-brand-primary)]">
                  $99
                </div>
                <div className="text-sm font-semibold text-[var(--color-text-secondary)]">
                  /month
                </div>
              </div>
            </TcaCardHeader>

            <TcaCardBody>
              <ul className="space-y-3 text-left">
                {FEATURES.map((f) => (
                  <li key={f} className="flex items-start gap-3 text-[var(--color-text-secondary)]">
                    <span className="mt-[2px] font-bold text-[var(--color-success)]">✓</span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </TcaCardBody>

            <TcaCardFooter>
              <a href="/request-demo" className="block">
                <TcaButton fullWidth>Request Demo</TcaButton>
              </a>
              <div className="mt-3 text-xs text-[var(--color-text-muted)]">
                Booking & payments always redirect to your existing provider.
              </div>
            </TcaCardFooter>
          </TcaCard>
        </div>
      </div>
    </TcaPageShell>
  );
}
