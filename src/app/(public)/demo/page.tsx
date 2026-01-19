import type { Metadata } from "next";
import Link from "next/link";
import { resolveDemoBotKey } from "@/lib/public/demoKey";
import { TcaButton } from "@/components/tca/TcaButton";
import { TcaCard, TcaCardBody } from "@/components/tca/TcaCard";

export const metadata: Metadata = {
  title: "Live Demo - Treasure Coast AI",
  description: "Try our AI chatbot live. See how it captures leads using only verified business data.",
};

const SUGGESTION_CHIPS = [
  "What services do you offer?",
  "What are your hours?",
  "How do I book an appointment?",
  "Do you have pricing info?",
];

export default async function DemoPage() {
  const demoBotKey = await resolveDemoBotKey();

  return (
    <div className="py-20">
      <div className="mx-auto max-w-4xl px-6">
        <div className="mb-12 text-center">
          <h1 className="mb-4 text-4xl font-extrabold tracking-tight">
            <span className="tca-gradient-text">Live Demo</span>
          </h1>
          <p className="mx-auto max-w-xl text-lg text-[var(--color-text-secondary)]">
            Try our AI chatbot right now. It only answers from verified business data — never makes things up.
          </p>
        </div>

        {demoBotKey ? (
          <div className="grid gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <TcaCard elevated className="overflow-hidden">
                <iframe
                  src={`/widget/${demoBotKey}`}
                  className="h-[600px] w-full border-0"
                  title="Demo Chat Widget"
                  data-testid="iframe-demo-widget"
                />
              </TcaCard>
            </div>

            <div className="space-y-6">
              <TcaCard>
                <TcaCardBody>
                  <h3 className="mb-3 font-semibold">Try asking:</h3>
                  <div className="flex flex-wrap gap-2">
                    {SUGGESTION_CHIPS.map((chip) => (
                      <button
                        key={chip}
                        type="button"
                        className="rounded-full border border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-3 py-1.5 text-xs text-[var(--color-text-secondary)] transition-colors hover:border-[var(--color-brand-primary)] hover:text-[var(--color-brand-primary)]"
                        data-testid={`chip-${chip.slice(0, 20).replace(/\s/g, "-").toLowerCase()}`}
                      >
                        {chip}
                      </button>
                    ))}
                  </div>
                </TcaCardBody>
              </TcaCard>

              <TcaCard>
                <TcaCardBody>
                  <h3 className="mb-3 font-semibold">What you are seeing:</h3>
                  <ul className="space-y-2 text-sm text-[var(--color-text-secondary)]">
                    <li className="flex gap-2">
                      <span className="text-[var(--color-success)]">1.</span>
                      AI answers ONLY from verified data
                    </li>
                    <li className="flex gap-2">
                      <span className="text-[var(--color-success)]">2.</span>
                      Lead capture when info is missing
                    </li>
                    <li className="flex gap-2">
                      <span className="text-[var(--color-success)]">3.</span>
                      Smart routing to booking/payment
                    </li>
                  </ul>
                </TcaCardBody>
              </TcaCard>

              <div className="text-center">
                <Link href="/request-demo" data-testid="link-demo-request-demo">
                  <TcaButton fullWidth>Get This For Your Business</TcaButton>
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <TcaCard>
            <TcaCardBody className="py-12 text-center">
              <div className="mb-4 text-4xl">
                <svg className="mx-auto h-16 w-16 text-[var(--color-text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h2 className="mb-2 text-xl font-semibold" data-testid="text-demo-not-configured">
                Demo Not Configured
              </h2>
              <p className="mb-6 text-[var(--color-text-secondary)]">
                The live demo is not available at this time. Please request a personalized demo instead.
              </p>
              <Link href="/request-demo">
                <TcaButton>Request a Demo</TcaButton>
              </Link>
            </TcaCardBody>
          </TcaCard>
        )}
      </div>
    </div>
  );
}
