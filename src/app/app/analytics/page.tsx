"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Flame, Phone, Mail } from "lucide-react";
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

type ActivityData = {
  ok: boolean;
  hours: number;
  hotLeadCount: number;
  totalLeads: number;
  funnel: {
    serviceSelected: number;
    leadCreated: number;
    linkShown: number;
    linkClicked: number;
  };
  activities: Array<{
    id: string;
    type: string;
    description: string;
    timestamp: string;
    metadata?: Record<string, unknown>;
  }>;
  recentHotLeads: Array<{
    publicId: string;
    name: string | null;
    email: string | null;
    phone: string | null;
    score: number | null;
    serviceName: string | null;
    createdAt: string;
  }>;
};

type DateRange = 7 | 30 | 90;

function calculateConversion(from: number, to: number): string {
  if (from === 0) return "0%";
  return `${((to / from) * 100).toFixed(1)}%`;
}

function formatTimeAgo(timestamp: string): string {
  const now = new Date();
  const then = new Date(timestamp);
  const diffMs = now.getTime() - then.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return then.toLocaleDateString();
}


export default function AnalyticsPage() {
  const router = useRouter();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [activityData, setActivityData] = useState<ActivityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [days, setDays] = useState<DateRange>(30);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        const [analyticsRes, activityRes] = await Promise.all([
          fetch(`/api/org/analytics/overview?days=${days}`),
          fetch(`/api/org/analytics/activity?hours=24`),
        ]);

        const analyticsJson = await analyticsRes.json();
        const activityJson = await activityRes.json();

        if (analyticsJson.ok) {
          setData(analyticsJson);
        } else {
          setError(analyticsJson.message || "Failed to load analytics");
        }

        if (activityJson.ok) {
          setActivityData(activityJson);
        }
      } catch {
        setError("Failed to load analytics");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [days]);

  const totalLeads = data?.leadsByDay.reduce((sum, d) => sum + d.count, 0) || 0;
  const totalClicks = data?.clicksByDay.reduce((sum, d) => sum + d.count, 0) || 0;

  return (
    <TcaPageShell title="Analytics" subtitle={`Performance overview - Last ${days} days`}>
      <div className="mx-auto max-w-7xl space-y-6 p-6">
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
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 animate-pulse rounded-lg bg-[var(--color-surface-hover)]" />
            ))}
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-red-400">
            {error}
          </div>
        )}

        {!loading && data && (
          <>
            {activityData && activityData.hotLeadCount > 0 && (
              <TcaCard className="border-orange-500/30 bg-gradient-to-r from-orange-500/10 to-red-500/10" data-testid="card-hot-leads-alert">
                <TcaCardBody>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-500/20">
                        <Flame className="h-6 w-6 text-orange-400" />
                      </div>
                      <div>
                        <div className="text-lg font-semibold text-orange-400">
                          {activityData.hotLeadCount} Hot Lead{activityData.hotLeadCount > 1 ? "s" : ""} in Last 24h
                        </div>
                        <div className="text-sm text-[var(--color-text-secondary)]">
                          High-intent prospects ready to book
                        </div>
                      </div>
                    </div>
                    <TcaButton
                      variant="primary"
                      size="sm"
                      onClick={() => router.push("/app/leads?temperature=HOT")}
                      data-testid="button-view-hot-leads"
                    >
                      View Hot Leads
                    </TcaButton>
                  </div>

                  {activityData.recentHotLeads.length > 0 && (
                    <div className="mt-4 space-y-2">
                      {activityData.recentHotLeads.slice(0, 3).map((lead) => (
                        <div
                          key={lead.publicId}
                          className="flex items-center justify-between rounded-lg bg-[var(--color-surface)] p-3"
                        >
                          <div>
                            <div className="font-medium text-[var(--color-text-primary)]" data-testid={`text-lead-name-${lead.publicId}`}>
                              {lead.name || lead.email || "Anonymous"}
                            </div>
                            <div className="text-xs text-[var(--color-text-secondary)]" data-testid={`text-lead-service-${lead.publicId}`}>
                              {lead.serviceName && <span>{lead.serviceName} - </span>}
                              {formatTimeAgo(lead.createdAt)}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {lead.phone && (
                              <TcaButton
                                variant="secondary"
                                size="sm"
                                onClick={() => window.open(`tel:${lead.phone}`, "_self")}
                                data-testid={`button-call-${lead.publicId}`}
                              >
                                <Phone className="mr-1 h-3 w-3" />
                                Call
                              </TcaButton>
                            )}
                            {lead.email && (
                              <TcaButton
                                variant="secondary"
                                size="sm"
                                onClick={() => window.open(`mailto:${lead.email}`, "_self")}
                                data-testid={`button-email-${lead.publicId}`}
                              >
                                <Mail className="mr-1 h-3 w-3" />
                                Email
                              </TcaButton>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </TcaCardBody>
              </TcaCard>
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <TcaCard data-testid="card-leads">
                <TcaCardBody className="text-center">
                  <div className="text-3xl font-bold text-[var(--color-brand-primary)]" data-testid="text-total-leads">
                    {totalLeads}
                  </div>
                  <div className="text-sm text-[var(--color-text-secondary)]">Total Leads</div>
                  {activityData && (
                    <div className="mt-2 text-xs text-green-400">
                      +{activityData.totalLeads} today
                    </div>
                  )}
                </TcaCardBody>
              </TcaCard>

              <TcaCard data-testid="card-clicks">
                <TcaCardBody className="text-center">
                  <div className="text-3xl font-bold text-[var(--color-brand-primary)]" data-testid="text-total-clicks">
                    {totalClicks}
                  </div>
                  <div className="text-sm text-[var(--color-text-secondary)]">Booking Clicks</div>
                  {activityData && activityData.funnel.linkClicked > 0 && (
                    <div className="mt-2 text-xs text-green-400">
                      +{activityData.funnel.linkClicked} today
                    </div>
                  )}
                </TcaCardBody>
              </TcaCard>

              <TcaCard data-testid="card-conversion">
                <TcaCardBody className="text-center">
                  <div className="text-3xl font-bold text-[var(--color-brand-primary)]" data-testid="text-conversion-rate">
                    {calculateConversion(data.funnel.serviceSelected, data.funnel.linkClicked)}
                  </div>
                  <div className="text-sm text-[var(--color-text-secondary)]">Funnel Conversion</div>
                  <div className="mt-2 text-xs text-[var(--color-text-muted)]">
                    Service to Click
                  </div>
                </TcaCardBody>
              </TcaCard>

              <TcaCard data-testid="card-lead-conversion">
                <TcaCardBody className="text-center">
                  <div className="text-3xl font-bold text-[var(--color-brand-primary)]">
                    {calculateConversion(data.funnel.leadCreated, data.funnel.linkClicked)}
                  </div>
                  <div className="text-sm text-[var(--color-text-secondary)]">Lead to Click</div>
                  <div className="mt-2 text-xs text-[var(--color-text-muted)]">
                    Booking intent
                  </div>
                </TcaCardBody>
              </TcaCard>
            </div>

            <TcaCard data-testid="card-funnel">
              <TcaCardHeader>Booking Funnel with Conversion Rates</TcaCardHeader>
              <TcaCardBody>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  <div className="text-center">
                    <div className="text-2xl font-semibold text-[var(--color-text-primary)]">
                      {data.funnel.serviceSelected}
                    </div>
                    <div className="text-xs text-[var(--color-text-secondary)]">Service Selected</div>
                    <div className="mt-1 text-xs text-[var(--color-text-muted)]">100%</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-semibold text-[var(--color-text-primary)]">
                      {data.funnel.leadCreated}
                    </div>
                    <div className="text-xs text-[var(--color-text-secondary)]">Lead Created</div>
                    <div className="mt-1 text-xs text-green-400">
                      {calculateConversion(data.funnel.serviceSelected, data.funnel.leadCreated)}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-semibold text-[var(--color-text-primary)]">
                      {data.funnel.linkShown}
                    </div>
                    <div className="text-xs text-[var(--color-text-secondary)]">Link Shown</div>
                    <div className="mt-1 text-xs text-green-400">
                      {calculateConversion(data.funnel.leadCreated, data.funnel.linkShown)}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-semibold text-[var(--color-text-primary)]">
                      {data.funnel.linkClicked}
                    </div>
                    <div className="text-xs text-[var(--color-text-secondary)]">Link Clicked</div>
                    <div className="mt-1 text-xs text-green-400">
                      {calculateConversion(data.funnel.linkShown, data.funnel.linkClicked)}
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-2">
                  {[
                    { label: "Selected", value: data.funnel.serviceSelected, color: "bg-blue-500" },
                    { label: "Lead", value: data.funnel.leadCreated, color: "bg-purple-500" },
                    { label: "Shown", value: data.funnel.linkShown, color: "bg-orange-500" },
                    { label: "Clicked", value: data.funnel.linkClicked, color: "bg-green-500" },
                  ].map((step, i) => {
                    const maxVal = Math.max(data.funnel.serviceSelected, 1);
                    const width = (step.value / maxVal) * 100;
                    return (
                      <div key={i} className="flex-1">
                        <div
                          className={`h-2 rounded-full ${step.color}`}
                          style={{ width: `${Math.max(width, 5)}%` }}
                        />
                      </div>
                    );
                  })}
                </div>
              </TcaCardBody>
            </TcaCard>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2 space-y-6">
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
                      <div className="space-y-3">
                        {data.clicksByService.map((row) => {
                          const maxClicks = Math.max(...data.clicksByService.map((r) => r.clicks), 1);
                          const percentage = (row.clicks / maxClicks) * 100;
                          return (
                            <div key={row.serviceId}>
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-sm text-[var(--color-text-primary)]">{row.serviceName}</span>
                                <span className="text-sm font-semibold text-[var(--color-brand-primary)]">{row.clicks}</span>
                              </div>
                              <div className="h-2 w-full rounded-full bg-[var(--color-surface-hover)]">
                                <div
                                  className="h-2 rounded-full bg-[var(--color-brand-primary)]"
                                  style={{ width: `${percentage}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </TcaCardBody>
                </TcaCard>

                {data.topTopics.length > 0 && (
                  <TcaCard data-testid="card-top-topics">
                    <TcaCardHeader>Top Topics Customers Ask About</TcaCardHeader>
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
              </div>

              <div className="space-y-6">
                <TcaCard data-testid="card-activity">
                  <TcaCardHeader>Recent Activity (24h)</TcaCardHeader>
                  <TcaCardBody>
                    {!activityData || activityData.activities.length === 0 ? (
                      <div className="py-8 text-center text-[var(--color-text-secondary)]">
                        No recent activity
                      </div>
                    ) : (
                      <div className="space-y-3 max-h-96 overflow-y-auto">
                        {activityData.activities.slice(0, 15).map((activity) => (
                          <div
                            key={activity.id}
                            className="flex items-start gap-3 rounded-lg bg-[var(--color-surface-hover)] p-3"
                          >
                            <div
                              className={`mt-0.5 h-2 w-2 rounded-full ${
                                activity.type === "LEAD_CREATED"
                                  ? activity.metadata?.temperature === "HOT"
                                    ? "bg-orange-500"
                                    : activity.metadata?.temperature === "WARM"
                                    ? "bg-yellow-500"
                                    : "bg-blue-500"
                                  : activity.type === "BOOKING_LINK_CLICKED"
                                  ? "bg-green-500"
                                  : "bg-[var(--color-text-muted)]"
                              }`}
                            />
                            <div className="flex-1 min-w-0">
                              <div className="text-sm text-[var(--color-text-primary)] truncate">
                                {activity.description}
                              </div>
                              <div className="text-xs text-[var(--color-text-muted)]">
                                {formatTimeAgo(activity.timestamp)}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </TcaCardBody>
                </TcaCard>
              </div>
            </div>
          </>
        )}
      </div>
    </TcaPageShell>
  );
}
