"use client";

import { useState, useEffect } from "react";
import { TcaPageShell } from "@/components/tca/TcaPageShell";
import { TcaCard, TcaCardHeader, TcaCardBody } from "@/components/tca/TcaCard";
import { TcaButton } from "@/components/tca/TcaButton";

type AnalyticsData = {
  ok: boolean;
  range: { start: string; end: string };
  funnel: {
    serviceSelected: number;
    leadCreated: number;
    linkShown: number;
    linkClicked: number;
  };
  leadsByDay: Array<{ date: string; count: number }>;
  clicksByDay: Array<{ date: string; count: number }>;
  clicksByService: Array<{ serviceId: number; serviceName: string; clicks: number }>;
  topTopics: Array<{ topic: string; count: number }>;
};

type DateRange = 7 | 30 | 90;

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [days, setDays] = useState<DateRange>(30);

  useEffect(() => {
    async function fetchAnalytics() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/org/analytics/overview?days=${days}`);
        const json = await res.json();
        if (json.ok) {
          setData(json);
        } else {
          setError(json.message || "Failed to load analytics");
        }
      } catch {
        setError("Failed to load analytics");
      } finally {
        setLoading(false);
      }
    }
    fetchAnalytics();
  }, [days]);

  const totalLeads = data?.leadsByDay.reduce((sum, d) => sum + d.count, 0) || 0;
  const totalClicks = data?.clicksByDay.reduce((sum, d) => sum + d.count, 0) || 0;
  const conversionRate = totalLeads > 0 ? ((totalClicks / totalLeads) * 100).toFixed(1) : "0";

  return (
    <TcaPageShell title="Analytics" subtitle={`Last ${days} days`}>
      <div className="mx-auto max-w-6xl space-y-6 p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-[var(--color-text-primary)]">Dashboard</h2>
          <div className="flex gap-2">
            {([7, 30, 90] as DateRange[]).map((d) => (
              <TcaButton
                key={d}
                variant={days === d ? "primary" : "secondary"}
                size="sm"
                onClick={() => setDays(d)}
                data-testid={`button-range-${d}`}
              >
                {d}d
              </TcaButton>
            ))}
          </div>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-[var(--color-text-secondary)]">Loading analytics...</div>
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-red-400">
            {error}
          </div>
        )}

        {!loading && data && (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <TcaCard data-testid="card-leads">
                <TcaCardBody className="text-center">
                  <div className="text-3xl font-bold text-[var(--color-brand-primary)]" data-testid="text-total-leads">
                    {totalLeads}
                  </div>
                  <div className="text-sm text-[var(--color-text-secondary)]">Total Leads</div>
                </TcaCardBody>
              </TcaCard>

              <TcaCard data-testid="card-clicks">
                <TcaCardBody className="text-center">
                  <div className="text-3xl font-bold text-[var(--color-brand-primary)]" data-testid="text-total-clicks">
                    {totalClicks}
                  </div>
                  <div className="text-sm text-[var(--color-text-secondary)]">Booking Clicks</div>
                </TcaCardBody>
              </TcaCard>

              <TcaCard data-testid="card-conversion">
                <TcaCardBody className="text-center">
                  <div className="text-3xl font-bold text-[var(--color-brand-primary)]" data-testid="text-conversion-rate">
                    {conversionRate}%
                  </div>
                  <div className="text-sm text-[var(--color-text-secondary)]">Click Rate</div>
                </TcaCardBody>
              </TcaCard>
            </div>

            <TcaCard data-testid="card-funnel">
              <TcaCardHeader>Booking Funnel</TcaCardHeader>
              <TcaCardBody>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  <div className="text-center">
                    <div className="text-2xl font-semibold text-[var(--color-text-primary)]">
                      {data.funnel.serviceSelected}
                    </div>
                    <div className="text-xs text-[var(--color-text-secondary)]">Service Selected</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-semibold text-[var(--color-text-primary)]">
                      {data.funnel.leadCreated}
                    </div>
                    <div className="text-xs text-[var(--color-text-secondary)]">Lead Created</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-semibold text-[var(--color-text-primary)]">
                      {data.funnel.linkShown}
                    </div>
                    <div className="text-xs text-[var(--color-text-secondary)]">Link Shown</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-semibold text-[var(--color-text-primary)]">
                      {data.funnel.linkClicked}
                    </div>
                    <div className="text-xs text-[var(--color-text-secondary)]">Link Clicked</div>
                  </div>
                </div>
              </TcaCardBody>
            </TcaCard>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <TcaCard data-testid="card-leads-chart">
                <TcaCardHeader>Leads Over Time</TcaCardHeader>
                <TcaCardBody>
                  {data.leadsByDay.length === 0 ? (
                    <div className="py-8 text-center text-[var(--color-text-secondary)]">
                      No leads in this period
                    </div>
                  ) : (
                    <div className="flex h-32 items-end gap-1">
                      {data.leadsByDay.slice(-14).map((d, i) => {
                        const max = Math.max(...data.leadsByDay.map((x) => x.count), 1);
                        const height = (d.count / max) * 100;
                        return (
                          <div
                            key={i}
                            className="flex-1 rounded-t bg-[var(--color-brand-primary)]"
                            style={{ height: `${Math.max(height, 4)}%` }}
                            title={`${d.date}: ${d.count}`}
                          />
                        );
                      })}
                    </div>
                  )}
                </TcaCardBody>
              </TcaCard>

              <TcaCard data-testid="card-clicks-chart">
                <TcaCardHeader>Clicks Over Time</TcaCardHeader>
                <TcaCardBody>
                  {data.clicksByDay.length === 0 ? (
                    <div className="py-8 text-center text-[var(--color-text-secondary)]">
                      No clicks in this period
                    </div>
                  ) : (
                    <div className="flex h-32 items-end gap-1">
                      {data.clicksByDay.slice(-14).map((d, i) => {
                        const max = Math.max(...data.clicksByDay.map((x) => x.count), 1);
                        const height = (d.count / max) * 100;
                        return (
                          <div
                            key={i}
                            className="flex-1 rounded-t bg-[var(--color-accent)]"
                            style={{ height: `${Math.max(height, 4)}%` }}
                            title={`${d.date}: ${d.count}`}
                          />
                        );
                      })}
                    </div>
                  )}
                </TcaCardBody>
              </TcaCard>
            </div>

            <TcaCard data-testid="card-clicks-by-service">
              <TcaCardHeader>Clicks by Service</TcaCardHeader>
              <TcaCardBody>
                {data.clicksByService.length === 0 ? (
                  <div className="py-8 text-center text-[var(--color-text-secondary)]">
                    No service click data
                  </div>
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[var(--color-border)]">
                        <th className="pb-2 text-left text-[var(--color-text-secondary)]">Service</th>
                        <th className="pb-2 text-right text-[var(--color-text-secondary)]">Clicks</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.clicksByService.map((row) => (
                        <tr key={row.serviceId} className="border-b border-[var(--color-border-subtle)]">
                          <td className="py-2 text-[var(--color-text-primary)]">{row.serviceName}</td>
                          <td className="py-2 text-right text-[var(--color-text-primary)]">{row.clicks}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </TcaCardBody>
            </TcaCard>

            {data.topTopics.length > 0 && (
              <TcaCard data-testid="card-top-topics">
                <TcaCardHeader>Top Topics</TcaCardHeader>
                <TcaCardBody>
                  <div className="flex flex-wrap gap-2">
                    {data.topTopics.map((t) => (
                      <span
                        key={t.topic}
                        className="rounded-full bg-[var(--color-surface-elevated)] px-3 py-1 text-sm text-[var(--color-text-secondary)]"
                      >
                        {t.topic} ({t.count})
                      </span>
                    ))}
                  </div>
                </TcaCardBody>
              </TcaCard>
            )}
          </>
        )}
      </div>
    </TcaPageShell>
  );
}
