"use client";

import { useEffect, useMemo, useState } from "react";
import { TcaCard } from "@/components/tca/TcaCard";
import { TcaBadge } from "@/components/tca/TcaBadge";
import { TcaButton } from "@/components/tca/TcaButton";

type InsightsData = {
  ok: true;
  botPublicKey: string;
  rangeDays: number;
  totals: {
    chats: number;
    missingDataEvents: number;
    leadCaptureTriggered: number;
    redirectClicks: number;
  };
  topMissingFields: Array<{ field: string; count: number }>;
  topTopics: Array<{ topic: string; count: number }>;
  sampleQuestions: Array<{
    message: string;
    createdAt: string;
    topic?: string;
    missingFields?: string[];
  }>;
  suggestions: Array<{
    title: string;
    reason: string;
    suggestedFields: string[];
    exampleValues?: unknown;
  }>;
};

export default function InsightsPage() {
  const [botPublicKey, setBotPublicKey] = useState("");
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [insights, setInsights] = useState<InsightsData | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("tca_selected_bot_public_key");
    if (stored) setBotPublicKey(stored);
  }, []);

  const leadCaptureRate = useMemo(() => {
    if (!insights || insights.totals.chats <= 0) return "0.0";
    return ((insights.totals.leadCaptureTriggered / insights.totals.chats) * 100).toFixed(1);
  }, [insights]);

  async function handleLoad() {
    if (!botPublicKey) {
      setError("Enter a bot public key.");
      return;
    }
    setLoading(true);
    setError(null);
    setInsights(null);

    try {
      const params = new URLSearchParams({
        botPublicKey,
        days: String(days),
      });

      const res = await fetch(`/api/admin/insights?${params.toString()}`);
      const data = await res.json();

      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || "Failed to load insights");
      }

      setInsights(data);
      localStorage.setItem("tca_selected_bot_public_key", botPublicKey);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Insights</h1>
        <p className="text-[var(--color-text-secondary)] mt-1">
          Missing-data trends + safe suggestions to improve Truth Mode coverage
        </p>
      </div>

      <TcaCard className="p-5">
        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm mb-1 text-[var(--color-text-secondary)]">
              Bot Public Key
            </label>
            <input
              className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-primary)]"
              placeholder="UUID"
              value={botPublicKey}
              onChange={(e) => setBotPublicKey(e.target.value)}
              data-testid="input-bot-public-key"
            />
          </div>

          <div className="w-full md:w-32">
            <label className="block text-sm mb-1 text-[var(--color-text-secondary)]">
              Days
            </label>
            <input
              className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-primary)]"
              type="number"
              min={1}
              max={90}
              value={days}
              onChange={(e) => setDays(parseInt(e.target.value || "30", 10))}
              data-testid="input-days"
            />
          </div>

          <TcaButton 
            onClick={handleLoad} 
            disabled={loading || !botPublicKey}
            data-testid="button-load-insights"
          >
            {loading ? "Loading..." : "Load Insights"}
          </TcaButton>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-md border border-red-500/30 bg-red-500/10 text-red-600 text-sm" data-testid="error-message">
            {error}
          </div>
        )}
      </TcaCard>

      {insights ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <TcaCard className="p-5">
              <div className="text-sm text-[var(--color-text-secondary)]">Chats</div>
              <div className="text-3xl font-bold text-[var(--color-text-primary)]" data-testid="stat-chats">
                {insights.totals.chats}
              </div>
            </TcaCard>

            <TcaCard className="p-5">
              <div className="text-sm text-[var(--color-text-secondary)]">Missing Data Events</div>
              <div className="text-3xl font-bold text-orange-600" data-testid="stat-missing-data">
                {insights.totals.missingDataEvents}
              </div>
            </TcaCard>

            <TcaCard className="p-5">
              <div className="text-sm text-[var(--color-text-secondary)]">Lead Capture Rate</div>
              <div className="text-3xl font-bold text-blue-600" data-testid="stat-lead-capture-rate">
                {leadCaptureRate}%
              </div>
            </TcaCard>

            <TcaCard className="p-5">
              <div className="text-sm text-[var(--color-text-secondary)]">Redirect Clicks</div>
              <div className="text-3xl font-bold text-green-600" data-testid="stat-redirect-clicks">
                {insights.totals.redirectClicks}
              </div>
            </TcaCard>
          </div>

          {insights.suggestions && insights.suggestions.length > 0 && (
            <TcaCard className="p-5">
              <h2 className="text-xl font-semibold mb-4 text-[var(--color-text-primary)]">Suggested Improvements</h2>
              <div className="space-y-4">
                {insights.suggestions.map((s, idx) => (
                  <div key={idx} className="border-l-4 border-blue-500 pl-4 py-2" data-testid={`suggestion-${idx}`}>
                    <div className="font-semibold text-[var(--color-text-primary)]">{s.title}</div>
                    <div className="text-sm text-[var(--color-text-secondary)] mt-1">{s.reason}</div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {s.suggestedFields.map((f) => (
                        <TcaBadge key={f} variant="info">
                          {f}
                        </TcaBadge>
                      ))}
                    </div>
                    {s.exampleValues !== undefined && (
                      <pre className="mt-3 text-xs p-3 rounded-md bg-[var(--color-surface-hover)] border border-[var(--color-border)] overflow-x-auto text-[var(--color-text-secondary)]">
                        {JSON.stringify(s.exampleValues, null, 2)}
                      </pre>
                    )}
                  </div>
                ))}
              </div>
            </TcaCard>
          )}

          {insights.topMissingFields && insights.topMissingFields.length > 0 && (
            <TcaCard className="p-5">
              <h2 className="text-xl font-semibold mb-4 text-[var(--color-text-primary)]">Top Missing Fields</h2>
              <div className="space-y-2">
                {insights.topMissingFields.map((x) => (
                  <div key={x.field} className="flex justify-between items-center py-2 border-b last:border-0 border-[var(--color-border)]" data-testid={`missing-field-${x.field}`}>
                    <div className="font-medium text-[var(--color-text-primary)]">{x.field}</div>
                    <TcaBadge variant="warning">{x.count}</TcaBadge>
                  </div>
                ))}
              </div>
            </TcaCard>
          )}

          {insights.topTopics && insights.topTopics.length > 0 && (
            <TcaCard className="p-5">
              <h2 className="text-xl font-semibold mb-4 text-[var(--color-text-primary)]">Top Topics</h2>
              <div className="flex flex-wrap gap-2">
                {insights.topTopics.map((x) => (
                  <TcaBadge key={x.topic} variant="secondary" data-testid={`topic-${x.topic}`}>
                    {x.topic} ({x.count})
                  </TcaBadge>
                ))}
              </div>
            </TcaCard>
          )}

          {insights.sampleQuestions && insights.sampleQuestions.length > 0 && (
            <TcaCard className="p-5">
              <h2 className="text-xl font-semibold mb-4 text-[var(--color-text-primary)]">Sample Customer Questions</h2>
              <div className="space-y-3">
                {insights.sampleQuestions.slice(0, 12).map((q, idx) => (
                  <div key={idx} className="p-3 rounded-md bg-[var(--color-surface-hover)] border border-[var(--color-border)]" data-testid={`sample-question-${idx}`}>
                    <div className="text-[var(--color-text-primary)]">{q.message}</div>
                    <div className="text-xs text-[var(--color-text-muted)] mt-1">
                      {new Date(q.createdAt).toLocaleString()}
                      {q.topic ? ` - ${q.topic}` : ""}
                    </div>
                  </div>
                ))}
              </div>
            </TcaCard>
          )}
        </>
      ) : (
        <TcaCard className="text-center py-12 p-5">
          <div className="text-[var(--color-text-secondary)]">
            Enter a bot public key and load insights.
          </div>
        </TcaCard>
      )}
    </div>
  );
}
