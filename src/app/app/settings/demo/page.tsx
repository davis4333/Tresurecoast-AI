"use client";

import { useState } from "react";
import { TcaCard, TcaCardBody, TcaCardHeader } from "@/components/tca/TcaCard";
import { TcaButton } from "@/components/tca/TcaButton";
import { AlertTriangle, Trash2, RefreshCw, ArrowLeft, CheckCircle, XCircle } from "lucide-react";
import Link from "next/link";

interface DemoResetResponse {
  ok: boolean;
  deleted?: {
    leads: number;
    conversations: number;
    dataEvents: number;
    notificationLogs: number;
  };
  seeded?: boolean;
  error?: string;
  message?: string;
}

export default function DemoResetPage() {
  const [confirmText, setConfirmText] = useState("");
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [deletedCounts, setDeletedCounts] = useState<DemoResetResponse["deleted"] | null>(null);

  const isConfirmValid = confirmText === "RESET DEMO";

  const handleReset = async () => {
    if (!isConfirmValid) return;

    setIsResetting(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      const response = await fetch("/api/org/demo-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmText }),
      });

      const data: DemoResetResponse = await response.json();

      if (data.ok && data.deleted) {
        setDeletedCounts(data.deleted);
        setSuccessMessage("Demo data has been reset successfully!");
        setConfirmText("");
        setShowConfirmModal(false);
      } else {
        setErrorMessage(data.message || "Failed to reset demo data");
      }
    } catch {
      setErrorMessage("An unexpected error occurred");
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/app/settings" className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h2 className="tca-gradient-text text-3xl font-extrabold tracking-tight">
            Demo Reset
          </h2>
          <p className="mt-2 text-[var(--color-text-secondary)]">
            Reset demo data before prospect demonstrations.
          </p>
        </div>
      </div>

      {successMessage && (
        <div className="flex items-center gap-3 p-4 rounded-lg bg-green-500/10 border border-green-500/30">
          <CheckCircle className="h-5 w-5 text-green-400 shrink-0" />
          <div>
            <p className="font-medium text-green-400">{successMessage}</p>
            {deletedCounts && (
              <p className="text-sm text-green-400/80 mt-1">
                Deleted: {deletedCounts.leads} leads, {deletedCounts.conversations} conversations, 
                {deletedCounts.dataEvents} analytics events, {deletedCounts.notificationLogs} notification logs.
              </p>
            )}
          </div>
        </div>
      )}

      {errorMessage && (
        <div className="flex items-center gap-3 p-4 rounded-lg bg-red-500/10 border border-red-500/30">
          <XCircle className="h-5 w-5 text-red-400 shrink-0" />
          <p className="font-medium text-red-400">{errorMessage}</p>
        </div>
      )}

      <TcaCard className="border-red-500/50 bg-red-500/5">
        <TcaCardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-500/10">
              <AlertTriangle className="h-5 w-5 text-red-500" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-red-400">Danger Zone</h3>
              <p className="text-sm text-[var(--color-text-muted)]">
                This action cannot be undone
              </p>
            </div>
          </div>
        </TcaCardHeader>
        <TcaCardBody className="space-y-6">
          <div className="space-y-4">
            <h4 className="font-medium text-[var(--color-text-primary)]">
              What will be deleted:
            </h4>
            <ul className="space-y-2 text-sm text-[var(--color-text-secondary)]">
              <li className="flex items-center gap-2">
                <Trash2 className="h-4 w-4 text-red-400" />
                All leads and lead data
              </li>
              <li className="flex items-center gap-2">
                <Trash2 className="h-4 w-4 text-red-400" />
                All conversations and messages
              </li>
              <li className="flex items-center gap-2">
                <Trash2 className="h-4 w-4 text-red-400" />
                All analytics events and data
              </li>
              <li className="flex items-center gap-2">
                <Trash2 className="h-4 w-4 text-red-400" />
                All notification logs
              </li>
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="font-medium text-[var(--color-text-primary)]">
              What will be kept:
            </h4>
            <ul className="space-y-2 text-sm text-[var(--color-text-secondary)]">
              <li className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4 text-green-400" />
                Organization settings
              </li>
              <li className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4 text-green-400" />
                Team members
              </li>
              <li className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4 text-green-400" />
                Services configuration
              </li>
              <li className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4 text-green-400" />
                Business hours
              </li>
              <li className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4 text-green-400" />
                Bots and knowledge base
              </li>
            </ul>
          </div>

          <div className="border-t border-[var(--color-border)] pt-6">
            <label
              htmlFor="confirm-input"
              className="block text-sm font-medium text-[var(--color-text-primary)] mb-2"
            >
              Type <span className="font-mono text-red-400">RESET DEMO</span> to confirm:
            </label>
            <input
              id="confirm-input"
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="RESET DEMO"
              className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-input)] px-4 py-2 text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-red-500/50"
              data-testid="demo-reset-input"
            />
          </div>

          {!showConfirmModal ? (
            <TcaButton
              variant="destructive"
              className="w-full"
              disabled={!isConfirmValid}
              onClick={() => setShowConfirmModal(true)}
              data-testid="demo-reset-button"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Reset Demo Data
            </TcaButton>
          ) : (
            <div className="space-y-3 p-4 rounded-lg bg-red-500/10 border border-red-500/30">
              <p className="text-sm text-red-400 font-medium">
                Are you absolutely sure? This will permanently delete all demo data.
              </p>
              <div className="flex gap-3">
                <TcaButton
                  variant="ghost"
                  className="flex-1"
                  onClick={() => setShowConfirmModal(false)}
                >
                  Cancel
                </TcaButton>
                <TcaButton
                  variant="destructive"
                  className="flex-1"
                  onClick={handleReset}
                  disabled={isResetting}
                  data-testid="demo-reset-confirm"
                >
                  {isResetting ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Resetting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Yes, Reset Everything
                    </>
                  )}
                </TcaButton>
              </div>
            </div>
          )}
        </TcaCardBody>
      </TcaCard>
    </div>
  );
}
