"use client";

import { useState, useEffect, useCallback } from "react";
import { TcaButton } from "@/components/tca/TcaButton";

interface LeadSummary {
  leadPublicId: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  status: "NEW" | "CONTACTED" | "BOOKED" | "CLOSED";
  notes: string | null;
  score: number;
  temperature: "HOT" | "WARM" | "COLD";
  serviceName: string | null;
  serviceId: number | null;
  botName: string;
  botPublicKey: string;
  conversationPublicId: string | null;
  createdAt: string;
  updatedAt: string;
}

interface NotificationLog {
  publicId: string;
  type: string;
  channel: string;
  recipientEmail: string;
  status: string;
  createdAt: string;
}

interface LeadFull extends LeadSummary {
  scoreReasons: string[] | null;
  answers: Record<string, unknown> | null;
  notificationLogs?: NotificationLog[];
}

interface LeadDetailDrawerProps {
  lead: LeadSummary | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLeadUpdate: (lead: Partial<LeadSummary>) => void;
}

const STATUSES = ["NEW", "CONTACTED", "BOOKED", "CLOSED"] as const;

const STATUS_BADGE_CLASSES: Record<string, string> = {
  NEW: "tca-status-new",
  CONTACTED: "tca-status-contacted",
  BOOKED: "tca-status-booked",
  CLOSED: "tca-status-closed",
};

const TEMPERATURE_BADGE_CLASSES: Record<string, string> = {
  HOT: "tca-status-booked",
  WARM: "tca-status-contacted",
  COLD: "tca-status-closed",
};

export function LeadDetailDrawer({ lead, open, onOpenChange, onLeadUpdate }: LeadDetailDrawerProps) {
  const [fullLead, setFullLead] = useState<LeadFull | null>(null);
  const [notes, setNotes] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const fetchLeadDetails = useCallback(async (leadPublicId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/org/leads/${leadPublicId}`);
      const data = await res.json();

      if (!data.ok) {
        setError(data.message || data.error || "Failed to fetch lead details");
        setFullLead(null);
      } else {
        setFullLead(data.lead);
        setNotes(data.lead.notes || "");
      }
    } catch (err) {
      setError("Network error");
      setFullLead(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open && lead) {
      fetchLeadDetails(lead.leadPublicId);
    } else {
      setFullLead(null);
      setNotes("");
      setError(null);
    }
  }, [open, lead, fetchLeadDetails]);

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  };

  const handleStatusChange = async (newStatus: typeof STATUSES[number]) => {
    if (!fullLead || isUpdating) return;

    setIsUpdating(true);
    const previousStatus = fullLead.status;

    setFullLead({ ...fullLead, status: newStatus });
    onLeadUpdate({ status: newStatus });

    try {
      const res = await fetch(`/api/org/leads/${fullLead.leadPublicId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await res.json();

      if (!data.ok) {
        setFullLead({ ...fullLead, status: previousStatus });
        onLeadUpdate({ status: previousStatus });
        showToast("Failed to update status");
      } else {
        showToast(`Status updated to ${newStatus}`);
      }
    } catch {
      setFullLead({ ...fullLead, status: previousStatus });
      onLeadUpdate({ status: previousStatus });
      showToast("Network error");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleNotesSave = async () => {
    if (!fullLead || isUpdating) return;

    setIsUpdating(true);

    try {
      const res = await fetch(`/api/org/leads/${fullLead.leadPublicId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes }),
      });

      const data = await res.json();

      if (!data.ok) {
        showToast("Failed to save notes");
      } else {
        setFullLead({ ...fullLead, notes });
        onLeadUpdate({ notes });
        showToast("Notes saved");
      }
    } catch {
      showToast("Network error");
    } finally {
      setIsUpdating(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (!open || !lead) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/50"
        onClick={() => onOpenChange(false)}
        data-testid="leads-drawer-backdrop"
      />

      <div
        className="fixed right-0 top-0 z-50 flex h-full w-full max-w-lg flex-col border-l border-[var(--color-border)] bg-[var(--color-surface)] shadow-2xl"
        data-testid="leads-drawer"
      >
        {toast && (
          <div className="absolute left-4 right-4 top-4 z-50 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-hover)] px-4 py-3">
            <p className="text-sm text-[var(--color-text-primary)]">{toast}</p>
          </div>
        )}

        <div className="flex items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-6 py-4">
          <h2 className="text-xl font-bold tracking-tight text-[var(--color-text-primary)]">Lead Details</h2>
          <button
            onClick={() => onOpenChange(false)}
            className="tca-focus-ring rounded-lg p-2 text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-primary)]"
            data-testid="leads-drawer-close"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="space-y-2">
                  <div className="h-4 w-20 animate-pulse rounded bg-[var(--color-surface-hover)]" />
                  <div className="h-6 w-40 animate-pulse rounded bg-[var(--color-surface-hover)]" />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-4">
              <p className="text-sm text-red-400" data-testid="leads-drawer-error">{error}</p>
              <TcaButton
                variant="secondary"
                onClick={() => lead && fetchLeadDetails(lead.leadPublicId)}
                className="mt-3"
              >
                Retry
              </TcaButton>
            </div>
          ) : fullLead ? (
            <div className="space-y-6">
              <div>
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
                  Contact Information
                </h3>
                <div className="space-y-3">
                  <div>
                    <span className="text-sm text-[var(--color-text-muted)]">Name</span>
                    <p className="text-[var(--color-text-primary)]" data-testid="leads-drawer-name">
                      {fullLead.name || "Not provided"}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm text-[var(--color-text-muted)]">Email</span>
                    {fullLead.email ? (
                      <p>
                        <a
                          href={`mailto:${fullLead.email}`}
                          className="text-[var(--color-brand-primary)] hover:underline"
                          data-testid="leads-drawer-email"
                        >
                          {fullLead.email}
                        </a>
                      </p>
                    ) : (
                      <p className="text-[var(--color-text-secondary)]">Not provided</p>
                    )}
                  </div>
                  <div>
                    <span className="text-sm text-[var(--color-text-muted)]">Phone</span>
                    {fullLead.phone ? (
                      <p>
                        <a
                          href={`tel:${fullLead.phone}`}
                          className="text-[var(--color-brand-primary)] hover:underline"
                          data-testid="leads-drawer-phone"
                        >
                          {fullLead.phone}
                        </a>
                      </p>
                    ) : (
                      <p className="text-[var(--color-text-secondary)]">Not provided</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="border-t border-[var(--color-border)] pt-6">
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
                  Lead Score
                </h3>
                <div className="flex items-center gap-4">
                  <span
                    className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold ${TEMPERATURE_BADGE_CLASSES[fullLead.temperature]}`}
                    data-testid="leads-drawer-temperature"
                  >
                    {fullLead.temperature}
                  </span>
                  <span className="text-3xl font-bold tracking-tight text-[var(--color-text-primary)]" data-testid="leads-drawer-score">
                    {fullLead.score}
                  </span>
                </div>
                {fullLead.scoreReasons && fullLead.scoreReasons.length > 0 && (
                  <div className="mt-4">
                    <span className="text-sm text-[var(--color-text-muted)]">Score Breakdown</span>
                    <ul className="mt-2 space-y-1 text-sm text-[var(--color-text-secondary)]" data-testid="leads-drawer-score-reasons">
                      {fullLead.scoreReasons.map((reason, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-[var(--color-text-muted)]">-</span>
                          <span>{reason}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <div className="border-t border-[var(--color-border)] pt-6">
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
                  Status
                </h3>
                <div className="flex flex-wrap gap-2">
                  {STATUSES.map((status) => (
                    <TcaButton
                      key={status}
                      variant={fullLead.status === status ? "primary" : "secondary"}
                      onClick={() => handleStatusChange(status)}
                      disabled={isUpdating || fullLead.status === status}
                      data-testid={`leads-drawer-status-${status.toLowerCase()}`}
                      className="text-xs"
                    >
                      {status}
                    </TcaButton>
                  ))}
                </div>
              </div>

              <div className="border-t border-[var(--color-border)] pt-6">
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
                  Notes
                </h3>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add notes about this lead..."
                  className="tca-input tca-focus-ring min-h-[120px] w-full resize-none"
                  data-testid="leads-drawer-notes"
                />
                <TcaButton
                  onClick={handleNotesSave}
                  disabled={isUpdating || notes === (fullLead.notes || "")}
                  className="mt-3"
                  data-testid="leads-drawer-save-notes"
                >
                  {isUpdating ? "Saving..." : "Save Notes"}
                </TcaButton>
              </div>

              {fullLead.answers && Object.keys(fullLead.answers).length > 0 && (
                <div className="border-t border-[var(--color-border)] pt-6">
                  <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
                    Additional Information
                  </h3>
                  <div className="space-y-2 text-sm" data-testid="leads-drawer-answers">
                    {Object.entries(fullLead.answers).map(([key, value]) => (
                      <div key={key} className="flex justify-between">
                        <span className="text-[var(--color-text-muted)]">{key}</span>
                        <span className="text-[var(--color-text-primary)]">{String(value)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="border-t border-[var(--color-border)] pt-6">
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
                  Details
                </h3>
                <div className="space-y-2 text-sm">
                  {fullLead.serviceName && (
                    <div className="flex justify-between">
                      <span className="text-[var(--color-text-muted)]">Service</span>
                      <span className="text-[var(--color-text-primary)]">{fullLead.serviceName}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-[var(--color-text-muted)]">Bot</span>
                    <span className="text-[var(--color-text-primary)]">{fullLead.botName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--color-text-muted)]">Created</span>
                    <span className="text-[var(--color-text-primary)]">{formatDate(fullLead.createdAt)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--color-text-muted)]">Updated</span>
                    <span className="text-[var(--color-text-primary)]">{formatDate(fullLead.updatedAt)}</span>
                  </div>
                </div>
              </div>

              <div className="border-t border-[var(--color-border)] pt-6">
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
                  Quick Actions
                </h3>
                <div className="flex flex-wrap gap-2">
                  {fullLead.email && (
                    <a href={`mailto:${fullLead.email}`}>
                      <TcaButton variant="secondary" data-testid="leads-drawer-action-email">
                        <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        Send Email
                      </TcaButton>
                    </a>
                  )}
                  {fullLead.phone && (
                    <a href={`tel:${fullLead.phone}`}>
                      <TcaButton variant="secondary" data-testid="leads-drawer-action-call">
                        <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        Call
                      </TcaButton>
                    </a>
                  )}
                </div>
              </div>

              {fullLead.notificationLogs && fullLead.notificationLogs.length > 0 && (
                <div className="border-t border-[var(--color-border)] pt-6">
                  <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
                    Notification History
                  </h3>
                  <ul className="space-y-2" data-testid="leads-drawer-notification-logs">
                    {fullLead.notificationLogs.map((log) => (
                      <li
                        key={log.publicId}
                        className="flex items-center justify-between rounded-lg bg-[var(--color-surface-hover)] px-3 py-2 text-sm"
                      >
                        <div>
                          <span className="font-medium text-[var(--color-text-primary)]">
                            {log.type.replace(/_/g, " ")}
                          </span>
                          <span className="ml-2 text-[var(--color-text-muted)]">
                            to {log.recipientEmail}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                              log.status === "SENT"
                                ? "bg-green-500/20 text-green-400"
                                : log.status === "FAILED"
                                ? "bg-red-500/20 text-red-400"
                                : "bg-yellow-500/20 text-yellow-400"
                            }`}
                          >
                            {log.status}
                          </span>
                          <span className="text-xs text-[var(--color-text-muted)]">
                            {new Date(log.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="border-t border-[var(--color-border)] pt-6">
                <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
                  IDs
                </h3>
                <div className="space-y-1 text-xs text-[var(--color-text-muted)]">
                  <p>Lead: <code className="rounded bg-[var(--color-surface-hover)] px-1">{fullLead.leadPublicId}</code></p>
                  {fullLead.conversationPublicId && (
                    <p>Conversation: <code className="rounded bg-[var(--color-surface-hover)] px-1">{fullLead.conversationPublicId}</code></p>
                  )}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </>
  );
}
