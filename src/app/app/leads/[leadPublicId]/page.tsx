"use client";

import { useState, useEffect, useCallback, use } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { TcaCard, TcaCardBody, TcaCardHeader } from "@/components/tca/TcaCard";
import { TcaButton } from "@/components/tca/TcaButton";
import { cx } from "@/components/tca/tca";

interface Lead {
  leadPublicId: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  status: "NEW" | "CONTACTED" | "BOOKED" | "CLOSED";
  createdAt: string;
  conversationPublicId: string | null;
}

const STATUSES = ["NEW", "CONTACTED", "BOOKED", "CLOSED"] as const;

const STATUS_COLORS: Record<string, string> = {
  NEW: "bg-blue-500 text-white",
  CONTACTED: "bg-yellow-500 text-black",
  BOOKED: "bg-green-500 text-white",
  CLOSED: "bg-gray-500 text-white",
};

export default function LeadDetailPage({ params }: { params: Promise<{ leadPublicId: string }> }) {
  const resolvedParams = use(params);
  const searchParams = useSearchParams();
  const botPublicKey = searchParams.get("botPublicKey") || "";

  const [lead, setLead] = useState<Lead | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const fetchLead = useCallback(async () => {
    if (!botPublicKey || !resolvedParams.leadPublicId) {
      setError("Missing bot key or lead ID");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(
        `/api/public/leads/${resolvedParams.leadPublicId}?botPublicKey=${botPublicKey}`
      );
      const data = await res.json();

      if (!data.ok) {
        setError(data.error || "Failed to fetch lead");
        setLead(null);
      } else {
        setLead(data.lead);
      }
    } catch (err) {
      setError("Network error");
      setLead(null);
    } finally {
      setIsLoading(false);
    }
  }, [botPublicKey, resolvedParams.leadPublicId]);

  useEffect(() => {
    fetchLead();
  }, [fetchLead]);

  const handleStatusChange = async (newStatus: typeof STATUSES[number]) => {
    if (!lead || !botPublicKey) return;

    setIsUpdating(true);
    const previousStatus = lead.status;

    setLead({ ...lead, status: newStatus });

    try {
      const res = await fetch("/api/public/leads/status", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          botPublicKey,
          leadPublicId: lead.leadPublicId,
          status: newStatus,
        }),
      });

      const data = await res.json();

      if (!data.ok) {
        setLead({ ...lead, status: previousStatus });
        setToast("Failed to update status");
      } else {
        setToast(`Status updated to ${newStatus}`);
      }
    } catch {
      setLead({ ...lead, status: previousStatus });
      setToast("Network error");
    } finally {
      setIsUpdating(false);
      setTimeout(() => setToast(null), 3000);
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-[var(--color-text-secondary)]">Loading lead details...</div>
      </div>
    );
  }

  if (error || !lead) {
    return (
      <div className="space-y-6">
        <Link href="/app/leads" className="inline-flex items-center gap-2 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Leads
        </Link>

        <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-6 text-center">
          <p className="text-red-400">{error || "Lead not found"}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {toast && (
        <div className="fixed right-6 top-20 z-50 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 shadow-lg">
          <p className="text-sm text-[var(--color-text-primary)]">{toast}</p>
        </div>
      )}

      <div className="flex items-center justify-between">
        <Link href="/app/leads" className="inline-flex items-center gap-2 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Leads
        </Link>
      </div>

      <div>
        <h2 className="tca-gradient-text text-3xl font-extrabold tracking-tight">
          Lead Details
        </h2>
        <p className="mt-2 text-[var(--color-text-secondary)]">
          Created {formatDate(lead.createdAt)}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <TcaCard>
          <TcaCardHeader>
            <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">Contact Information</h3>
          </TcaCardHeader>
          <TcaCardBody>
            <dl className="space-y-4">
              <div>
                <dt className="text-sm font-medium text-[var(--color-text-muted)]">Name</dt>
                <dd className="mt-1 text-[var(--color-text-primary)]">{lead.name || "Not provided"}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-[var(--color-text-muted)]">Email</dt>
                <dd className="mt-1 text-[var(--color-text-primary)]">
                  {lead.email ? (
                    <a href={`mailto:${lead.email}`} className="text-[var(--color-brand-primary)] hover:underline">
                      {lead.email}
                    </a>
                  ) : (
                    "Not provided"
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-[var(--color-text-muted)]">Phone</dt>
                <dd className="mt-1 text-[var(--color-text-primary)]">
                  {lead.phone ? (
                    <a href={`tel:${lead.phone}`} className="text-[var(--color-brand-primary)] hover:underline">
                      {lead.phone}
                    </a>
                  ) : (
                    "Not provided"
                  )}
                </dd>
              </div>
            </dl>
          </TcaCardBody>
        </TcaCard>

        <TcaCard>
          <TcaCardHeader>
            <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">Status Management</h3>
          </TcaCardHeader>
          <TcaCardBody>
            <div className="space-y-4">
              <div>
                <dt className="mb-2 text-sm font-medium text-[var(--color-text-muted)]">Current Status</dt>
                <span className={cx("inline-flex items-center rounded-full px-3 py-1 text-sm font-medium", STATUS_COLORS[lead.status])}>
                  {lead.status}
                </span>
              </div>

              <div>
                <dt className="mb-3 text-sm font-medium text-[var(--color-text-muted)]">Update Status</dt>
                <div className="flex flex-wrap gap-2">
                  {STATUSES.map((status) => (
                    <TcaButton
                      key={status}
                      variant={lead.status === status ? "primary" : "secondary"}
                      onClick={() => handleStatusChange(status)}
                      disabled={isUpdating || lead.status === status}
                      data-testid={`status-btn-${status.toLowerCase()}`}
                      className="text-xs"
                    >
                      {status}
                    </TcaButton>
                  ))}
                </div>
              </div>
            </div>
          </TcaCardBody>
        </TcaCard>
      </div>

      <TcaCard>
        <TcaCardHeader>
          <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">Metadata</h3>
        </TcaCardHeader>
        <TcaCardBody>
          <dl className="grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-sm font-medium text-[var(--color-text-muted)]">Lead ID</dt>
              <dd className="mt-1 font-mono text-xs text-[var(--color-text-secondary)]">{lead.leadPublicId}</dd>
            </div>
            {lead.conversationPublicId && (
              <div>
                <dt className="text-sm font-medium text-[var(--color-text-muted)]">Conversation ID</dt>
                <dd className="mt-1 font-mono text-xs text-[var(--color-text-secondary)]">{lead.conversationPublicId}</dd>
              </div>
            )}
          </dl>
        </TcaCardBody>
      </TcaCard>
    </div>
  );
}
