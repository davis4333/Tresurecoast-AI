"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { TcaCard, TcaCardBody, TcaCardHeader } from "@/components/tca/TcaCard";
import { TcaButton } from "@/components/tca/TcaButton";

interface Bot {
  publicKey: string;
  name: string;
  status: "ACTIVE" | "PAUSED" | "ARCHIVED";
  createdAt: string;
  organizationName: string;
  workspaceName: string;
  leadsCount: number;
  conversationsCount: number;
}

const STATUS_STYLES: Record<string, string> = {
  ACTIVE: "tca-status-booked",
  PAUSED: "tca-status-contacted",
  ARCHIVED: "tca-status-closed",
};

export default function BotsPage() {
  const [bots, setBots] = useState<Bot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchBots() {
      setIsLoading(true);
      setError(null);

      try {
        const res = await fetch("/api/admin/bots");
        const data = await res.json();

        if (!data.ok) {
          setError(data.error || "Failed to fetch bots");
          setBots([]);
        } else {
          setBots(data.bots || []);
        }
      } catch {
        setError("Network error");
        setBots([]);
      } finally {
        setIsLoading(false);
      }
    }

    fetchBots();
  }, []);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="space-y-6">
      <div className="tca-page-header">
        <h2 className="tca-page-title tca-gradient-text">Bots</h2>
        <p className="tca-page-subtitle">
          Manage your AI chatbots and their business profiles.
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-4">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {isLoading ? (
        <TcaCard>
          <TcaCardBody>
            <div className="flex items-center justify-center py-12">
              <div className="text-[var(--color-text-secondary)]">Loading bots...</div>
            </div>
          </TcaCardBody>
        </TcaCard>
      ) : bots.length === 0 ? (
        <TcaCard>
          <TcaCardBody>
            <div className="tca-empty-state">
              <div className="tca-empty-state-icon">
                <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="tca-empty-state-title">No Bots Found</h3>
              <p className="tca-empty-state-description">
                Bots are created via the admin seed API. Once created, they will appear here for management.
              </p>
            </div>
          </TcaCardBody>
        </TcaCard>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {bots.map((bot) => (
            <TcaCard key={bot.publicKey} elevated>
              <TcaCardHeader>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-base font-semibold text-[var(--color-text-primary)]">
                      {bot.name}
                    </h3>
                    <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                      {bot.workspaceName}
                    </p>
                  </div>
                  <span className={`inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[bot.status] || ""}`}>
                    {bot.status}
                  </span>
                </div>
              </TcaCardHeader>
              <TcaCardBody>
                <div className="mb-4 grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-[var(--color-text-muted)]">Leads</div>
                    <div className="font-semibold text-[var(--color-text-primary)]">{bot.leadsCount}</div>
                  </div>
                  <div>
                    <div className="text-[var(--color-text-muted)]">Chats</div>
                    <div className="font-semibold text-[var(--color-text-primary)]">{bot.conversationsCount}</div>
                  </div>
                </div>
                <div className="mb-4 text-xs text-[var(--color-text-muted)]">
                  Created {formatDate(bot.createdAt)}
                </div>
                <Link href={`/app/bots/${bot.publicKey}`} data-testid={`open-bot-${bot.publicKey}`}>
                  <TcaButton fullWidth variant="secondary">
                    Open Bot
                  </TcaButton>
                </Link>
              </TcaCardBody>
            </TcaCard>
          ))}
        </div>
      )}
    </div>
  );
}
