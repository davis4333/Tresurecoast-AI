import { getSalesBotPublicKey } from "@/lib/public/env";

export default function RequestDemoPage() {
  const salesBotKey = getSalesBotPublicKey();

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-4xl px-4 py-16">
        <div className="mb-12 text-center">
          <h1 className="mb-4 text-5xl font-bold">Request a Demo</h1>
          <p className="text-xl text-white/70">
            See Treasure Coast AI in action. Chat with us below to schedule your
            personalized demo.
          </p>
        </div>

        <div className="mb-12 grid gap-6 md:grid-cols-2">
          <div className="rounded-lg border border-white/10 bg-white/5 p-6">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-white/10">
              <span className="text-2xl">⚡</span>
            </div>
            <h3 className="mb-2 text-xl font-bold">Quick Setup</h3>
            <p className="text-white/70">
              Get your first bot running in under 5 minutes. No technical expertise
              required.
            </p>
          </div>

          <div className="rounded-lg border border-white/10 bg-white/5 p-6">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-white/10">
              <span className="text-2xl">🎯</span>
            </div>
            <h3 className="mb-2 text-xl font-bold">Industry Templates</h3>
            <p className="text-white/70">
              Pre-built templates for barber shops, salons, recovery housing, and home
              services.
            </p>
          </div>

          <div className="rounded-lg border border-white/10 bg-white/5 p-6">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-white/10">
              <span className="text-2xl">📊</span>
            </div>
            <h3 className="mb-2 text-xl font-bold">Lead Tracking</h3>
            <p className="text-white/70">
              Automatic lead capture and management. Never miss a potential customer.
            </p>
          </div>

          <div className="rounded-lg border border-white/10 bg-white/5 p-6">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-white/10">
              <span className="text-2xl">🔧</span>
            </div>
            <h3 className="mb-2 text-xl font-bold">White Label Ready</h3>
            <p className="text-white/70">
              Rebrand and resell to your clients. Perfect for marketing agencies.
            </p>
          </div>
        </div>

        <div className="mb-8 rounded-lg border border-blue-500/20 bg-blue-500/10 p-6">
          <h2 className="mb-2 text-xl font-bold">What to Expect</h2>
          <ul className="space-y-2 text-white/80">
            <li>• 30-minute personalized walkthrough</li>
            <li>• Live Q&A with our team</li>
            <li>• Custom use case discussion</li>
            <li>• Pricing and onboarding overview</li>
          </ul>
        </div>

        <div className="rounded-lg border border-white/10 bg-white/5 p-8">
          <h2 className="mb-6 text-center text-3xl font-bold">
            Chat with us to schedule
          </h2>

          {salesBotKey ? (
            <iframe
              src={`/widget/${salesBotKey}`}
              className="mx-auto h-[640px] w-full rounded-lg border border-white/10"
              title="Request Demo Chat"
            />
          ) : (
            <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/10 p-6">
              <h3 className="mb-2 font-bold text-yellow-200">Setup Required</h3>
              <p className="text-sm text-yellow-100/80">
                To enable the demo request widget, set the environment variable:
                <code className="mt-2 block rounded bg-black/50 p-2 font-mono text-xs">
                  NEXT_PUBLIC_TCA_SALES_BOT_PUBLIC_KEY=your-bot-uuid
                </code>
              </p>
            </div>
          )}
        </div>

        <div className="mt-12 text-center">
          <p className="text-sm text-white/60">
            Questions? Email us at{" "}
            <a href="mailto:sales@treasurecoastai.com" className="text-white underline">
              sales@treasurecoastai.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
