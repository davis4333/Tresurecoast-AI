"use client";

import { useEffect, useState } from "react";
import { TcaCard, TcaCardHeader, TcaCardBody } from "./TcaCard";
import { DollarSign, Flame, TrendingUp, AlertCircle } from "lucide-react";

interface AnalyticsOverviewResponse {
  ok: boolean;
  revenueInfluencedCents?: number;
  hotLeadsCount?: number;
  conversionRate?: number;
}

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

export function RevenueMetricsCard() {
  const [data, setData] = useState<AnalyticsOverviewResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        const res = await fetch("/api/org/analytics/overview");
        const json: AnalyticsOverviewResponse = await res.json();
        if (json.ok) {
          setData(json);
        } else {
          setError("Failed to load revenue metrics");
        }
      } catch {
        setError("Failed to load revenue metrics");
      } finally {
        setLoading(false);
      }
    }
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <TcaCard data-testid="revenue-metrics-loading">
        <TcaCardHeader>
          <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">
            Revenue Attribution
          </h3>
        </TcaCardHeader>
        <TcaCardBody>
          <div className="grid gap-6 md:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="h-10 w-10 animate-pulse rounded-lg bg-[var(--color-surface-hover)]" />
                <div className="flex-1 space-y-2">
                  <div className="h-6 w-20 animate-pulse rounded bg-[var(--color-surface-hover)]" />
                  <div className="h-4 w-24 animate-pulse rounded bg-[var(--color-surface-hover)]" />
                </div>
              </div>
            ))}
          </div>
        </TcaCardBody>
      </TcaCard>
    );
  }

  if (error || !data) {
    return (
      <TcaCard data-testid="revenue-metrics-error">
        <TcaCardHeader>
          <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">
            Revenue Attribution
          </h3>
        </TcaCardHeader>
        <TcaCardBody>
          <div className="flex items-center gap-3 text-[var(--color-danger)]">
            <AlertCircle className="h-5 w-5" />
            <span>{error || "Unable to load revenue metrics"}</span>
          </div>
        </TcaCardBody>
      </TcaCard>
    );
  }

  return (
    <TcaCard data-testid="revenue-metrics-card">
      <TcaCardHeader>
        <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">
          Revenue Attribution
        </h3>
      </TcaCardHeader>
      <TcaCardBody>
        <div className="grid gap-6 md:grid-cols-3">
          <div className="flex items-center gap-3" data-testid="revenue-influenced-section">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
              <DollarSign className="h-5 w-5 text-emerald-500" />
            </div>
            <div>
              <div 
                className="text-2xl font-bold text-emerald-600 dark:text-emerald-400" 
                data-testid="text-revenue-influenced"
              >
                {formatCurrency(data.revenueInfluencedCents ?? 0)}
              </div>
              <div className="text-sm text-[var(--color-text-secondary)]">
                Revenue Influenced
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3" data-testid="hot-leads-section">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-500/10">
              <Flame className="h-5 w-5 text-orange-500" />
            </div>
            <div>
              <div 
                className="text-2xl font-bold text-[var(--color-text-primary)]" 
                data-testid="text-hot-leads-count"
              >
                {data.hotLeadsCount ?? 0}
              </div>
              <div className="text-sm text-[var(--color-text-secondary)]">
                Hot Leads
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3" data-testid="conversion-rate-section">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
              <TrendingUp className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <div 
                className="text-2xl font-bold text-[var(--color-text-primary)]" 
                data-testid="text-conversion-rate"
              >
                {data.conversionRate ?? 0}%
              </div>
              <div className="text-sm text-[var(--color-text-secondary)]">
                Conversion Rate
              </div>
            </div>
          </div>
        </div>
      </TcaCardBody>
    </TcaCard>
  );
}
