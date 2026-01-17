import { getSalesBotPublicKey } from "@/lib/public/env";

export default function PricingPage() {
  const salesBotKey = getSalesBotPublicKey();

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-6xl px-4 py-16">
        <div className="mb-16 text-center">
          <h1 className="mb-4 text-5xl font-bold">Simple, Transparent Pricing</h1>
          <p className="text-xl text-white/70">No surprises. Pay only for what you use.</p>
        </div>

        <div className="mb-16 grid gap-8 md:grid-cols-3">
          <div className="rounded-lg border border-white/10 bg-white/5 p-8">
            <h3 className="mb-2 text-2xl font-bold">Starter</h3>
            <div className="mb-4">
              <span className="text-4xl font-bold">$49</span>
              <span className="text-white/60">/month</span>
            </div>
            <ul className="mb-6 space-y-3 text-white/80">
              <li>• 1 Bot</li>
              <li>• 1,000 conversations/mo</li>
              <li>• Lead capture</li>
              <li>• Email support</li>
            </ul>
            <button className="w-full rounded-md bg-white px-4 py-2 text-sm font-medium text-black hover:opacity-90">
              Get Started
            </button>
          </div>

          <div className="rounded-lg border-2 border-white bg-white/10 p-8">
            <div className="mb-2 inline-block rounded-full bg-white px-3 py-1 text-xs font-bold text-black">
              POPULAR
            </div>
            <h3 className="mb-2 text-2xl font-bold">Professional</h3>
            <div className="mb-4">
              <span className="text-4xl font-bold">$149</span>
              <span className="text-white/60">/month</span>
            </div>
            <ul className="mb-6 space-y-3 text-white/80">
              <li>• 5 Bots</li>
              <li>• 10,000 conversations/mo</li>
              <li>• Advanced lead routing</li>
              <li>• Priority support</li>
              <li>• Custom branding</li>
            </ul>
            <button className="w-full rounded-md bg-white px-4 py-2 text-sm font-medium text-black hover:opacity-90">
              Get Started
            </button>
          </div>

          <div className="rounded-lg border border-white/10 bg-white/5 p-8">
            <h3 className="mb-2 text-2xl font-bold">Enterprise</h3>
            <div className="mb-4">
              <span className="text-4xl font-bold">Custom</span>
            </div>
            <ul className="mb-6 space-y-3 text-white/80">
              <li>• Unlimited Bots</li>
              <li>• Unlimited conversations</li>
              <li>• White-label options</li>
              <li>• Dedicated support</li>
              <li>• SLA guarantee</li>
            </ul>
            <button className="w-full rounded-md border border-white bg-transparent px-4 py-2 text-sm font-medium text-white hover:bg-white/10">
              Contact Sales
            </button>
          </div>
        </div>

        <div className="mb-8 rounded-lg border border-blue-500/20 bg-blue-500/10 p-6">
          <h2 className="mb-2 text-xl font-bold">Payment Processing</h2>
          <p className="text-white/80">
            Payments are handled directly with our team. After requesting a demo below,
            we&apos;ll discuss payment options and set up your account.
          </p>
        </div>

        <div className="rounded-lg border border-white/10 bg-white/5 p-8">
          <h2 className="mb-4 text-center text-3xl font-bold">
            Ready to get started? Request a demo
          </h2>

          {salesBotKey ? (
            <iframe
              src={`/widget/${salesBotKey}`}
              className="mx-auto h-[640px] w-full max-w-2xl rounded-lg border border-white/10"
              title="Request Demo Chat"
            />
          ) : (
            <div className="mx-auto max-w-2xl rounded-lg border border-yellow-500/20 bg-yellow-500/10 p-6">
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
      </div>
    </div>
  );
}
