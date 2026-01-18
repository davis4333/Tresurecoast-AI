"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { TcaCard, TcaCardBody, TcaCardHeader } from "@/components/tca/TcaCard";
import { TcaButton } from "@/components/tca/TcaButton";
import { TcaBadge } from "@/components/tca/TcaBadge";

interface Lead {
  leadPublicId: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  status: "NEW" | "CONTACTED" | "BOOKED" | "CLOSED";
  createdAt: string;
  conversationPublicId: string | null;
}

const STATUS_COLORS: Record<string, string> = {
  NEW: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  CONTACTED: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  BOOKED: "bg-green-500/20 text-green-400 border-green-500/30",
  CLOSED: "bg-gray-500/20 text-gray-400 border-gray-500/30",
};

const BOT_KEY_STORAGE = "tca_dashboard_bot_key";

export default function LeadsPage() {
  const [botPublicKey, setBotPublicKey] = useState("");
  const [inputKey, setInputKey] = useState("");
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem(BOT_KEY_STORAGE);
    if (saved) {
      setBotPublicKey(saved);
      setInputKey(saved);
    }
  }, []);

  const fetchLeads = useCallback(async (key: string) => {
    if (!key) return;
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/public/leads/recent?botPublicKey=${key}&limit=50`);
      const data = await res.json();

      if (!data.ok) {
        setError(data.error || "Failed to fetch leads");
        setLeads([]);
      } else {
        setLeads(data.leads || []);
      }
    } catch (err) {
      setError("Network error");
      setLeads([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (botPublicKey) {
      fetchLeads(botPublicKey);
    }
  }, [botPublicKey, fetchLeads]);

  const handleSaveKey = () => {
    const trimmed = inputKey.trim();
    if (trimmed) {
      localStorage.setItem(BOT_KEY_STORAGE, trimmed);
      setBotPublicKey(trimmed);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getContactInfo = (lead: Lead) => {
    const parts: string[] = [];
    if (lead.name) parts.push(lead.name);
    if (lead.email) parts.push(lead.email);
    if (lead.phone) parts.push(lead.phone);
    return parts.length > 0 ? parts.join(" | ") : "No contact info";
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="tca-gradient-text text-3xl font-extrabold tracking-tight">
          Leads Inbox
        </h2>
        <p className="mt-2 text-[var(--color-text-secondary)]">
          View and manage leads captured by your chatbots.
        </p>
      </div>

      <TcaCard>
        <TcaCardHeader>
          <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">Bot Configuration</h3>
        </TcaCardHeader>
        <TcaCardBody>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <div className="flex-1">
              <label className="mb-2 block text-sm font-medium text-[var(--color-text-secondary)]">
                Bot Public Key (UUID)
              </label>
              <input
                type="text"
                value={inputKey}
                onChange={(e) => setInputKey(e.target.value)}
                placeholder="Enter bot public key..."
                data-testid="input-bot-key"
                className="tca-input"
              />
            </div>
            <TcaButton onClick={handleSaveKey} data-testid="button-save-key">
              Load Leads
            </TcaButton>
          </div>
          {botPublicKey && (
            <p className="mt-3 text-sm text-[var(--color-text-muted)]">
              Currently viewing leads for: <code className="rounded bg-[var(--color-surface-hover)] px-2 py-0.5 text-xs">{botPublicKey}</code>
            </p>
          )}
        </TcaCardBody>
      </TcaCard>

      {error && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-4">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {isLoading ? (
        <TcaCard>
          <TcaCardBody>
            <div className="flex items-center justify-center py-12">
              <div className="text-[var(--color-text-secondary)]">Loading leads...</div>
            </div>
          </TcaCardBody>
        </TcaCard>
      ) : leads.length === 0 && botPublicKey ? (
        <TcaCard>
          <TcaCardBody>
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-surface-hover)]">
                <svg className="h-8 w-8 text-[var(--color-text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">No Leads Yet</h3>
              <p className="mt-2 max-w-sm text-sm text-[var(--color-text-secondary)]">
                Leads will appear here when visitors submit their contact information through your chatbot.
              </p>
            </div>
          </TcaCardBody>
        </TcaCard>
      ) : leads.length > 0 ? (
        <TcaCard>
          <TcaCardBody className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full" data-testid="leads-table">
                <thead>
                  <tr className="border-b border-[var(--color-border)] text-left">
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">Created</th>
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">Contact</th>
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">Status</th>
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border)]">
                  {leads.map((lead) => (
                    <tr 
                      key={lead.leadPublicId} 
                      className="transition-colors hover:bg-[var(--color-surface-hover)]"
                      data-testid={`lead-row-${lead.leadPublicId}`}
                    >
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-[var(--color-text-secondary)]">
                        {formatDate(lead.createdAt)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="max-w-xs truncate text-sm text-[var(--color-text-primary)]">
                          {getContactInfo(lead)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[lead.status] || ""}`}>
                          {lead.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <Link 
                          href={`/app/leads/${lead.leadPublicId}?botPublicKey=${botPublicKey}`}
                          data-testid={`view-lead-${lead.leadPublicId}`}
                        >
                          <TcaButton variant="ghost" className="text-xs">
                            View Details
                          </TcaButton>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TcaCardBody>
        </TcaCard>
      ) : null}

      {!botPublicKey && (
        <TcaCard>
          <TcaCardBody>
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-brand-primary)]/10">
                <svg className="h-8 w-8 text-[var(--color-brand-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">Enter Bot Key</h3>
              <p className="mt-2 max-w-sm text-sm text-[var(--color-text-secondary)]">
                Enter your bot&apos;s public key above to view leads captured by that chatbot.
              </p>
            </div>
          </TcaCardBody>
        </TcaCard>
      )}
    </div>
  );
}
