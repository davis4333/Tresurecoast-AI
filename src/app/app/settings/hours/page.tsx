"use client";

import { useState, useEffect, useCallback } from "react";
import { Lock, Clock, RotateCcw, Save } from "lucide-react";
import {
  DayHours,
  DayError,
  dayLabel,
  normalizeHours,
  hasChanges,
  validateAllDays,
  preparePayload,
} from "@/lib/settings/hoursHelpers";

type Permissions = {
  canEdit: boolean;
  allowClientEdits: boolean;
  role: string;
};

export default function HoursSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [hours, setHours] = useState<DayHours[]>([]);
  const [baseline, setBaseline] = useState<DayHours[]>([]);
  const [permissions, setPermissions] = useState<Permissions | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [rowErrors, setRowErrors] = useState<Map<number, DayError>>(new Map());

  const fetchHours = useCallback(async () => {
    try {
      const res = await fetch("/api/org/settings/hours");
      const data = await res.json();
      if (data.ok) {
        const normalized = normalizeHours(data.hours);
        setHours(normalized);
        setBaseline(JSON.parse(JSON.stringify(normalized)));
        setPermissions(data.permissions);
        setRowErrors(new Map());
      } else {
        setError(data.message || "Failed to load hours");
      }
    } catch {
      setError("Failed to load hours");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHours();
  }, [fetchHours]);

  const showSuccess = (message: string) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const canEdit = permissions?.canEdit ?? false;
  const isDirty = hasChanges(hours, baseline);
  const validationErrors = validateAllDays(hours);
  const isValid = validationErrors.size === 0;
  const canSave = canEdit && isDirty && isValid;

  const updateDay = (dayOfWeek: number, updates: Partial<DayHours>) => {
    setHours((prev) =>
      prev.map((day) =>
        day.dayOfWeek === dayOfWeek ? { ...day, ...updates } : day
      )
    );
  };

  const toggleClosed = (dayOfWeek: number, isClosed: boolean) => {
    if (isClosed) {
      updateDay(dayOfWeek, { isClosed: true, openTime: null, closeTime: null });
    } else {
      updateDay(dayOfWeek, { isClosed: false, openTime: "09:00", closeTime: "17:00" });
    }
  };

  const handleRevert = () => {
    setHours(JSON.parse(JSON.stringify(baseline)));
    setRowErrors(new Map());
    setError(null);
  };

  const handleSave = async () => {
    const errors = validateAllDays(hours);
    if (errors.size > 0) {
      setRowErrors(errors);
      return;
    }

    setSaving(true);
    setError(null);
    setRowErrors(new Map());

    try {
      const payload = preparePayload(hours);
      const res = await fetch("/api/org/settings/hours", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (data.ok) {
        const normalized = normalizeHours(data.hours);
        setHours(normalized);
        setBaseline(JSON.parse(JSON.stringify(normalized)));
        showSuccess("Hours saved successfully");
      } else if (data.error === "forbidden") {
        setError("Editing is locked by your agency");
      } else if (data.error === "validation_error") {
        setError(data.message || "Invalid hours data");
      } else {
        setError(data.message || "Failed to save hours");
      }
    } catch {
      setError("Failed to save hours");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="tca-page-header">
          <h1 className="tca-page-title">Business Hours</h1>
          <p className="tca-page-subtitle">Loading...</p>
        </div>
        <div className="tca-card p-6 max-w-2xl animate-pulse">
          {[...Array(7)].map((_, i) => (
            <div key={i} className="h-14 bg-[var(--color-surface-hover)] rounded mb-3" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="tca-page-header">
        <h1 className="tca-page-title">Business Hours</h1>
        <p className="tca-page-subtitle">
          Set your weekly schedule so customers know when you&apos;re open
        </p>
      </div>

      {!canEdit && (
        <div
          className="mb-6 max-w-2xl rounded-lg border border-amber-500/20 bg-amber-500/10 p-4 flex items-center gap-3"
          data-testid="banner-locked"
        >
          <Lock className="w-5 h-5 text-amber-400" />
          <div>
            <p className="text-sm font-medium text-amber-400">Editing is disabled by your agency</p>
            <p className="text-xs text-amber-400/70 mt-0.5">
              Contact your agency to make changes to your business hours.
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-6 max-w-2xl rounded-lg border border-red-500/20 bg-red-500/10 p-4">
          <p className="text-sm text-red-400" data-testid="text-error">{error}</p>
        </div>
      )}

      {successMessage && (
        <div className="mb-6 max-w-2xl rounded-lg border border-green-500/20 bg-green-500/10 p-4">
          <p className="text-sm text-green-400" data-testid="text-success">{successMessage}</p>
        </div>
      )}

      <div className="tca-card p-6 max-w-2xl">
        <div className="space-y-4" data-testid="hours-grid">
          {hours.map((day) => {
            const dayError = validationErrors.get(day.dayOfWeek);
            return (
              <div
                key={day.dayOfWeek}
                className="p-4 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)]"
                data-testid={`day-row-${day.dayOfWeek}`}
              >
                <div className="flex items-center gap-4">
                  <div className="w-28 flex-shrink-0">
                    <span
                      className="font-medium text-[var(--color-text-primary)]"
                      data-testid={`text-day-name-${day.dayOfWeek}`}
                    >
                      {dayLabel(day.dayOfWeek)}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      role="switch"
                      aria-checked={!day.isClosed}
                      aria-label={day.isClosed ? "Mark as open" : "Mark as closed"}
                      onClick={() => canEdit && toggleClosed(day.dayOfWeek, !day.isClosed)}
                      disabled={!canEdit}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        !day.isClosed
                          ? "bg-[var(--color-brand-primary)]"
                          : "bg-[var(--color-surface-hover)]"
                      } ${!canEdit ? "opacity-50 cursor-not-allowed" : ""}`}
                      data-testid={`toggle-open-${day.dayOfWeek}`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          !day.isClosed ? "translate-x-6" : "translate-x-1"
                        }`}
                      />
                    </button>
                    <span
                      className={`text-sm ${
                        day.isClosed
                          ? "text-[var(--color-text-muted)]"
                          : "text-[var(--color-text-secondary)]"
                      }`}
                      data-testid={`text-status-${day.dayOfWeek}`}
                    >
                      {day.isClosed ? "Closed" : "Open"}
                    </span>
                  </div>

                  {!day.isClosed && (
                    <div className="flex items-center gap-2 ml-auto">
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4 text-[var(--color-text-muted)]" />
                        <input
                          type="time"
                          value={day.openTime || ""}
                          onChange={(e) => updateDay(day.dayOfWeek, { openTime: e.target.value })}
                          disabled={!canEdit}
                          className={`tca-input w-28 text-sm ${
                            dayError?.openTime ? "border-red-500" : ""
                          } ${!canEdit ? "opacity-50 cursor-not-allowed" : ""}`}
                          data-testid={`input-open-${day.dayOfWeek}`}
                        />
                      </div>
                      <span className="text-[var(--color-text-muted)]">to</span>
                      <input
                        type="time"
                        value={day.closeTime || ""}
                        onChange={(e) => updateDay(day.dayOfWeek, { closeTime: e.target.value })}
                        disabled={!canEdit}
                        className={`tca-input w-28 text-sm ${
                          dayError?.closeTime ? "border-red-500" : ""
                        } ${!canEdit ? "opacity-50 cursor-not-allowed" : ""}`}
                        data-testid={`input-close-${day.dayOfWeek}`}
                      />
                    </div>
                  )}
                </div>

                {dayError && (
                  <div className="mt-2 text-xs text-red-400" data-testid={`error-row-${day.dayOfWeek}`}>
                    {dayError.openTime && <p>{dayError.openTime}</p>}
                    {dayError.closeTime && <p>{dayError.closeTime}</p>}
                    {dayError.general && <p>{dayError.general}</p>}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {canEdit && (
          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-[var(--color-border)]">
            {isDirty && (
              <button
                onClick={handleRevert}
                disabled={saving}
                className="px-4 py-2 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] flex items-center gap-2 disabled:opacity-50"
                data-testid="button-revert"
              >
                <RotateCcw className="w-4 h-4" />
                Revert Changes
              </button>
            )}
            <button
              onClick={handleSave}
              disabled={!canSave || saving}
              className="tca-btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              data-testid="button-save"
            >
              <Save className="w-4 h-4" />
              {saving ? "Saving..." : "Save Hours"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
