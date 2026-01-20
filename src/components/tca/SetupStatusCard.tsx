"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { TcaButton } from "./TcaButton";
import {
  CheckCircle2,
  Circle,
  ChevronDown,
  ChevronUp,
  Sparkles,
  AlertCircle,
  Target,
  Zap,
} from "lucide-react";

interface SetupCheckItem {
  id: string;
  label: string;
  completed: boolean;
  priority: "critical" | "high" | "medium" | "low";
  actionPath: string;
  actionLabel: string;
  category: "basics" | "content" | "engagement" | "advanced";
}

interface SetupStatus {
  completedItems: number;
  totalItems: number;
  percentComplete: number;
  items: SetupCheckItem[];
  nextAction: SetupCheckItem | null;
  tier: "getting-started" | "configured" | "optimized" | "expert";
}

interface SetupStatusResponse {
  ok: boolean;
  status: SetupStatus;
}

function ProgressRing({
  percent,
  size = 80,
  strokeWidth = 8,
}: {
  percent: number;
  size?: number;
  strokeWidth?: number;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          className="text-[var(--color-surface-hover)]"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="text-[var(--color-primary)] transition-all duration-500"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-lg font-semibold text-[var(--color-foreground)]">
          {percent}%
        </span>
      </div>
    </div>
  );
}

function TierBadge({ tier }: { tier: SetupStatus["tier"] }) {
  const tierConfig = {
    "getting-started": {
      label: "Getting Started",
      icon: Target,
      color: "text-amber-500",
    },
    configured: {
      label: "Configured",
      icon: Zap,
      color: "text-blue-500",
    },
    optimized: {
      label: "Optimized",
      icon: Sparkles,
      color: "text-purple-500",
    },
    expert: {
      label: "Expert Setup",
      icon: CheckCircle2,
      color: "text-emerald-500",
    },
  };

  const config = tierConfig[tier];
  const Icon = config.icon;

  return (
    <div
      className={`flex items-center gap-1 text-sm font-medium ${config.color}`}
    >
      <Icon className="h-4 w-4" />
      <span>{config.label}</span>
    </div>
  );
}

function PriorityIndicator({
  priority,
}: {
  priority: SetupCheckItem["priority"];
}) {
  const colors = {
    critical: "bg-red-500",
    high: "bg-amber-500",
    medium: "bg-blue-500",
    low: "bg-slate-400",
  };

  return (
    <span
      className={`h-2 w-2 rounded-full ${colors[priority]}`}
      title={`${priority} priority`}
    />
  );
}

export function SetupStatusCard() {
  const [status, setStatus] = useState<SetupStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    async function fetchStatus() {
      try {
        const res = await fetch("/api/org/setup-status");
        const data: SetupStatusResponse = await res.json();
        if (data.ok) {
          setStatus(data.status);
        } else {
          setError("Failed to load setup status");
        }
      } catch (e) {
        setError("Failed to load setup status");
      } finally {
        setLoading(false);
      }
    }
    fetchStatus();
  }, []);

  if (loading) {
    return (
      <div
        className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-6"
        data-testid="setup-status-loading"
      >
        <div className="flex items-center gap-4">
          <div className="h-20 w-20 animate-pulse rounded-full bg-[var(--color-surface-hover)]" />
          <div className="flex-1 space-y-2">
            <div className="h-5 w-32 animate-pulse rounded bg-[var(--color-surface-hover)]" />
            <div className="h-4 w-48 animate-pulse rounded bg-[var(--color-surface-hover)]" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !status) {
    return (
      <div
        className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-6"
        data-testid="setup-status-error"
      >
        <div className="flex items-center gap-3 text-[var(--color-danger)]">
          <AlertCircle className="h-5 w-5" />
          <span>{error || "Unable to load setup status"}</span>
        </div>
      </div>
    );
  }

  if (status.percentComplete === 100) {
    return (
      <div
        className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-6"
        data-testid="setup-status-complete"
      >
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500">
            <CheckCircle2 className="h-6 w-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-emerald-500">
              Setup Complete
            </h3>
            <p className="text-sm text-[var(--color-muted)]">
              Your bot is fully configured and ready to capture leads
            </p>
          </div>
        </div>
      </div>
    );
  }

  const incompleteItems = status.items.filter((i) => !i.completed);
  const completedItems = status.items.filter((i) => i.completed);
  const displayItems = expanded ? incompleteItems : incompleteItems.slice(0, 3);

  return (
    <div
      className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-6"
      data-testid="setup-status-card"
    >
      <div className="flex items-start gap-4">
        <ProgressRing percent={status.percentComplete} />
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-[var(--color-foreground)]">
              Setup Progress
            </h3>
            <TierBadge tier={status.tier} />
          </div>
          <p className="mt-1 text-sm text-[var(--color-muted)]">
            {status.completedItems} of {status.totalItems} steps complete
          </p>

          {status.nextAction && (
            <div className="mt-3 flex items-center gap-2">
              <Link href={status.nextAction.actionPath} data-testid="setup-next-action-btn">
                <TcaButton variant="primary" size="sm">
                  {status.nextAction.actionLabel}
                </TcaButton>
              </Link>
              <span className="text-sm text-[var(--color-muted)]">
                {status.nextAction.label}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 border-t border-[var(--color-border)] pt-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-[var(--color-foreground)]">
            Remaining Steps ({incompleteItems.length})
          </span>
          {incompleteItems.length > 3 && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="flex items-center gap-1 text-sm text-[var(--color-primary)] hover:underline"
              data-testid="setup-expand-toggle"
            >
              {expanded ? (
                <>
                  Show Less <ChevronUp className="h-4 w-4" />
                </>
              ) : (
                <>
                  Show All <ChevronDown className="h-4 w-4" />
                </>
              )}
            </button>
          )}
        </div>

        <div className="mt-3 space-y-2">
          {displayItems.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between rounded-md p-2 hover:bg-[var(--color-surface-hover)]"
              data-testid={`setup-item-${item.id}`}
            >
              <div className="flex items-center gap-3">
                <PriorityIndicator priority={item.priority} />
                <Circle className="h-4 w-4 text-[var(--color-muted)]" />
                <span className="text-sm text-[var(--color-foreground)]">
                  {item.label}
                </span>
              </div>
              <Link href={item.actionPath} data-testid={`setup-action-${item.id}`}>
                <TcaButton variant="ghost" size="sm">
                  {item.actionLabel}
                </TcaButton>
              </Link>
            </div>
          ))}
        </div>

        {completedItems.length > 0 && (
          <div className="mt-4">
            <span className="text-sm font-medium text-[var(--color-muted)]">
              Completed ({completedItems.length})
            </span>
            <div className="mt-2 space-y-1">
              {completedItems.slice(0, 3).map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 px-2 py-1 opacity-60"
                  data-testid={`setup-completed-${item.id}`}
                >
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  <span className="text-sm text-[var(--color-muted)] line-through">
                    {item.label}
                  </span>
                </div>
              ))}
              {completedItems.length > 3 && (
                <span className="px-2 text-xs text-[var(--color-muted)]">
                  +{completedItems.length - 3} more completed
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
