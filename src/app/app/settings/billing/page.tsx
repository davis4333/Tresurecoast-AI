"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { TcaCard, TcaCardBody, TcaCardHeader } from "@/components/tca/TcaCard";
import { TcaButton } from "@/components/tca/TcaButton";
import { TcaBadge } from "@/components/tca/TcaBadge";
import { Check, CreditCard, AlertTriangle } from "lucide-react";

interface Plan {
  publicId: string;
  name: string;
  description: string | null;
  priceCents: number;
  interval: string;
  maxBots: number;
  maxLeadsPerMonth: number;
  maxConversationsPerMonth: number;
  customBranding: boolean;
  customDomain: boolean;
  apiAccess: boolean;
  prioritySupport: boolean;
}

interface Subscription {
  publicId: string;
  status: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  trialEnd: string | null;
}

interface Usage {
  bots: number;
  maxBots: number;
  leads: number;
  maxLeads: number;
  conversations: number;
  maxConversations: number;
}

const STATUS_BADGES: Record<string, { label: string; className: string }> = {
  ACTIVE: { label: "Active", className: "bg-green-500/20 text-green-400" },
  TRIALING: { label: "Trial", className: "bg-blue-500/20 text-blue-400" },
  PAST_DUE: { label: "Past Due", className: "bg-yellow-500/20 text-yellow-400" },
  CANCELLED: { label: "Cancelled", className: "bg-red-500/20 text-red-400" },
  PAUSED: { label: "Paused", className: "bg-gray-500/20 text-gray-400" },
};

function BillingPageContent() {
  const searchParams = useSearchParams();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [usage, setUsage] = useState<Usage | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    // Check URL params for success/cancel
    if (searchParams.get("success") === "true") {
      setToast("Subscription activated successfully!");
    } else if (searchParams.get("cancelled") === "true") {
      setToast("Checkout was cancelled.");
    }

    // Fetch subscription data
    Promise.all([
      fetch("/api/org/subscription").then((r) => r.json()),
      fetch("/api/plans").then((r) => r.json()),
    ])
      .then(([subData, plansData]) => {
        if (subData.ok) {
          setSubscription(subData.subscription);
          setPlan(subData.plan);
          setUsage(subData.usage);
        }
        if (plansData.ok) {
          setPlans(plansData.plans);
        }
      })
      .finally(() => setIsLoading(false));
  }, [searchParams]);

  const handleCheckout = async (planId: string) => {
    if (planId === "free") return;

    setIsCheckingOut(true);
    try {
      const res = await fetch("/api/org/subscription/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId }),
      });
      const data = await res.json();

      if (data.ok && data.url) {
        window.location.href = data.url;
      } else {
        setToast(data.message || "Failed to start checkout");
      }
    } catch {
      setToast("Network error");
    } finally {
      setIsCheckingOut(false);
    }
  };

  const handleManageBilling = async () => {
    setIsCheckingOut(true);
    try {
      const res = await fetch("/api/org/subscription/portal", {
        method: "POST",
      });
      const data = await res.json();

      if (data.ok && data.url) {
        window.location.href = data.url;
      } else {
        setToast(data.message || "Failed to open billing portal");
      }
    } catch {
      setToast("Network error");
    } finally {
      setIsCheckingOut(false);
    }
  };

  const formatPrice = (cents: number) => {
    if (cents === 0) return "Free";
    return `$${(cents / 100).toFixed(0)}`;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl p-6">
        <div className="space-y-6">
          <div className="h-8 w-48 animate-pulse rounded bg-[var(--color-surface-hover)]" />
          <div className="h-64 animate-pulse rounded-lg bg-[var(--color-surface-hover)]" />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl p-6">
      {toast && (
        <div className="fixed right-4 top-4 z-50 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 shadow-lg">
          <p className="text-sm text-[var(--color-text-primary)]">{toast}</p>
        </div>
      )}

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Billing & Subscription</h1>
        <p className="mt-1 text-[var(--color-text-secondary)]">
          Manage your subscription and billing details
        </p>
      </div>

      {/* Current Plan */}
      <TcaCard className="mb-6">
        <TcaCardHeader>
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">
              Current Plan
            </h3>
            {subscription && (
              <span className={`rounded-full px-3 py-1 text-xs font-medium ${STATUS_BADGES[subscription.status]?.className}`}>
                {STATUS_BADGES[subscription.status]?.label}
              </span>
            )}
          </div>
        </TcaCardHeader>
        <TcaCardBody>
          <div className="flex items-start justify-between">
            <div>
              <h4 className="text-xl font-bold text-[var(--color-text-primary)]">
                {plan?.name || "Free Trial"}
              </h4>
              <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                {plan?.description}
              </p>
              {subscription && (
                <p className="mt-2 text-sm text-[var(--color-text-muted)]">
                  {subscription.cancelAtPeriodEnd
                    ? `Cancels on ${formatDate(subscription.currentPeriodEnd)}`
                    : `Renews on ${formatDate(subscription.currentPeriodEnd)}`}
                </p>
              )}
              {subscription?.trialEnd && new Date(subscription.trialEnd) > new Date() && (
                <p className="mt-1 text-sm text-blue-400">
                  Trial ends {formatDate(subscription.trialEnd)}
                </p>
              )}
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-[var(--color-text-primary)]">
                {formatPrice(plan?.priceCents || 0)}
                <span className="text-sm font-normal text-[var(--color-text-muted)]">/mo</span>
              </div>
              {subscription && (
                <TcaButton
                  variant="secondary"
                  className="mt-2"
                  onClick={handleManageBilling}
                  disabled={isCheckingOut}
                >
                  <CreditCard className="mr-2 h-4 w-4" />
                  Manage Billing
                </TcaButton>
              )}
            </div>
          </div>
        </TcaCardBody>
      </TcaCard>

      {/* Usage */}
      {usage && (
        <TcaCard className="mb-6">
          <TcaCardHeader>
            <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">Usage</h3>
          </TcaCardHeader>
          <TcaCardBody>
            <div className="grid gap-4 sm:grid-cols-3">
              <UsageBar label="Bots" used={usage.bots} max={usage.maxBots} />
              <UsageBar label="Leads" used={usage.leads} max={usage.maxLeads} suffix="/month" />
              <UsageBar label="Conversations" used={usage.conversations} max={usage.maxConversations} suffix="/month" />
            </div>
          </TcaCardBody>
        </TcaCard>
      )}

      {/* Available Plans */}
      <h3 className="mb-4 text-lg font-semibold text-[var(--color-text-primary)]">
        {subscription ? "Change Plan" : "Choose a Plan"}
      </h3>
      <div className="grid gap-4 md:grid-cols-3">
        {plans.map((p) => {
          const isCurrent = plan?.publicId === p.publicId || (!subscription && p.publicId === "free");
          const isUpgrade = !subscription || (plan && p.priceCents > plan.priceCents);

          return (
            <TcaCard key={p.publicId} className={isCurrent ? "border-[var(--color-brand-primary)]" : ""}>
              <TcaCardBody className="flex h-full flex-col">
                <div className="mb-4 flex items-start justify-between">
                  <div>
                    <h4 className="font-semibold text-[var(--color-text-primary)]">{p.name}</h4>
                    <p className="text-sm text-[var(--color-text-muted)]">{p.description}</p>
                  </div>
                  {isCurrent && (
                    <TcaBadge>Current</TcaBadge>
                  )}
                </div>

                <div className="mb-4">
                  <span className="text-3xl font-bold text-[var(--color-text-primary)]">
                    {formatPrice(p.priceCents)}
                  </span>
                  {p.priceCents > 0 && (
                    <span className="text-[var(--color-text-muted)]">/month</span>
                  )}
                </div>

                <ul className="mb-6 flex-1 space-y-2 text-sm">
                  <PlanFeature included>{p.maxBots} bot{p.maxBots > 1 ? "s" : ""}</PlanFeature>
                  <PlanFeature included>{p.maxLeadsPerMonth} leads/month</PlanFeature>
                  <PlanFeature included>{p.maxConversationsPerMonth} conversations/month</PlanFeature>
                  <PlanFeature included={p.customBranding}>Custom branding</PlanFeature>
                  <PlanFeature included={p.customDomain}>Custom domain</PlanFeature>
                  <PlanFeature included={p.prioritySupport}>Priority support</PlanFeature>
                </ul>

                {!isCurrent && p.publicId !== "free" && (
                  <TcaButton
                    onClick={() => handleCheckout(p.publicId)}
                    disabled={isCheckingOut}
                    fullWidth
                  >
                    {isUpgrade ? "Upgrade" : "Downgrade"}
                  </TcaButton>
                )}
                {isCurrent && (
                  <TcaButton variant="secondary" disabled fullWidth>
                    Current Plan
                  </TcaButton>
                )}
              </TcaCardBody>
            </TcaCard>
          );
        })}
      </div>
    </div>
  );
}

function UsageBar({
  label,
  used,
  max,
  suffix = "",
}: {
  label: string;
  used: number;
  max: number;
  suffix?: string;
}) {
  const percentage = Math.min((used / max) * 100, 100);
  const isNearLimit = percentage >= 80;
  const isAtLimit = percentage >= 100;

  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <span className="text-sm font-medium text-[var(--color-text-secondary)]">{label}</span>
        <span className={`text-sm ${isAtLimit ? "text-red-400" : isNearLimit ? "text-yellow-400" : "text-[var(--color-text-primary)]"}`}>
          {used} / {max}{suffix}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-[var(--color-surface-hover)]">
        <div
          className={`h-full rounded-full transition-all ${isAtLimit ? "bg-red-500" : isNearLimit ? "bg-yellow-500" : "bg-[var(--color-brand-primary)]"}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {isAtLimit && (
        <div className="mt-1 flex items-center gap-1 text-xs text-red-400">
          <AlertTriangle className="h-3 w-3" />
          Limit reached
        </div>
      )}
    </div>
  );
}

function PlanFeature({ included, children }: { included: boolean; children: React.ReactNode }) {
  return (
    <li className={`flex items-center gap-2 ${included ? "text-[var(--color-text-primary)]" : "text-[var(--color-text-muted)] line-through"}`}>
      <Check className={`h-4 w-4 ${included ? "text-green-400" : "text-[var(--color-text-muted)]"}`} />
      {children}
    </li>
  );
}

export default function BillingPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-4xl p-6">
          <div className="space-y-6">
            <div className="h-8 w-48 animate-pulse rounded bg-[var(--color-surface-hover)]" />
            <div className="h-64 animate-pulse rounded-lg bg-[var(--color-surface-hover)]" />
          </div>
        </div>
      }
    >
      <BillingPageContent />
    </Suspense>
  );
}
