"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { TcaButton } from "@/components/tca/TcaButton";

interface NotificationSettings {
  notificationEnabled: boolean;
  notificationEmails: string[];
  notifyOnHotLead: boolean;
  notifyOnBookingClick: boolean;
}

async function fetchNotificationSettings(): Promise<NotificationSettings> {
  const res = await fetch("/api/org/notifications");
  const data = await res.json();
  if (!data.ok) {
    throw new Error(data.message || "Failed to load settings");
  }
  return data.settings;
}

async function updateNotificationSettings(
  updates: Partial<NotificationSettings>
): Promise<NotificationSettings> {
  const res = await fetch("/api/org/notifications", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updates),
  });
  const data = await res.json();
  if (!data.ok) {
    throw new Error(data.message || "Failed to save settings");
  }
  return data.settings;
}

export default function NotificationsSettingsPage() {
  const queryClient = useQueryClient();
  const [emailInput, setEmailInput] = useState("");
  const [toast, setToast] = useState<string | null>(null);

  const {
    data: settings,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["/api/org/notifications"],
    queryFn: fetchNotificationSettings,
  });

  const mutation = useMutation({
    mutationFn: updateNotificationSettings,
    onSuccess: (newSettings) => {
      queryClient.setQueryData(["/api/org/notifications"], newSettings);
      showToast("Settings saved");
    },
    onError: (err: Error) => {
      showToast(err.message);
    },
  });

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  };

  const handleAddEmail = () => {
    if (!settings || !emailInput.trim()) return;

    const email = emailInput.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      showToast("Invalid email address");
      return;
    }

    if (settings.notificationEmails.includes(email)) {
      showToast("Email already added");
      return;
    }

    mutation.mutate({
      notificationEmails: [...settings.notificationEmails, email],
    });
    setEmailInput("");
  };

  const handleRemoveEmail = (email: string) => {
    if (!settings) return;

    mutation.mutate({
      notificationEmails: settings.notificationEmails.filter((e) => e !== email),
    });
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-2xl p-6">
        <div className="space-y-6">
          <div className="h-8 w-48 animate-pulse rounded bg-[var(--color-surface-hover)]" />
          <div className="h-4 w-64 animate-pulse rounded bg-[var(--color-surface-hover)]" />
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-16 animate-pulse rounded-lg bg-[var(--color-surface-hover)]" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-2xl p-6">
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-6">
          <h2 className="mb-2 text-lg font-semibold text-red-400">Error</h2>
          <p className="mb-4 text-sm text-red-300">{(error as Error).message}</p>
          <TcaButton onClick={() => refetch()}>Retry</TcaButton>
        </div>
      </div>
    );
  }

  if (!settings) return null;

  return (
    <div className="mx-auto max-w-2xl p-6">
      {toast && (
        <div className="fixed right-4 top-4 z-50 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 shadow-lg">
          <p className="text-sm text-[var(--color-text-primary)]">{toast}</p>
        </div>
      )}

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Notification Settings</h1>
        <p className="mt-1 text-[var(--color-text-secondary)]">
          Configure when and how you receive lead notifications
        </p>
      </div>

      <div className="space-y-6">
        <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-[var(--color-text-primary)]">Enable Notifications</h3>
              <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                Receive email alerts for important lead activities
              </p>
            </div>
            <label className="relative inline-flex cursor-pointer items-center">
              <input
                type="checkbox"
                checked={settings.notificationEnabled}
                onChange={(e) => mutation.mutate({ notificationEnabled: e.target.checked })}
                disabled={mutation.isPending}
                className="peer sr-only"
                data-testid="toggle-notifications-enabled"
              />
              <div className="peer h-6 w-11 rounded-full bg-[var(--color-surface-hover)] after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-[var(--color-brand-primary)] peer-checked:after:translate-x-full peer-focus:outline-none" />
            </label>
          </div>
        </div>

        {settings.notificationEnabled && (
          <>
            <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
              <h3 className="mb-4 font-semibold text-[var(--color-text-primary)]">Notification Emails</h3>
              <p className="mb-4 text-sm text-[var(--color-text-secondary)]">
                Add email addresses to receive notifications
              </p>

              <div className="mb-4 flex gap-2">
                <input
                  type="email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="email@example.com"
                  className="tca-input flex-1"
                  onKeyDown={(e) => e.key === "Enter" && handleAddEmail()}
                  data-testid="input-add-email"
                />
                <TcaButton
                  onClick={handleAddEmail}
                  disabled={mutation.isPending || !emailInput.trim()}
                  data-testid="button-add-email"
                >
                  Add
                </TcaButton>
              </div>

              {settings.notificationEmails.length === 0 ? (
                <p className="text-sm text-[var(--color-text-muted)]">No emails configured</p>
              ) : (
                <ul className="space-y-2">
                  {settings.notificationEmails.map((email) => (
                    <li
                      key={email}
                      className="flex items-center justify-between rounded-lg bg-[var(--color-surface-hover)] px-4 py-2"
                    >
                      <span className="text-[var(--color-text-primary)]">{email}</span>
                      <button
                        onClick={() => handleRemoveEmail(email)}
                        disabled={mutation.isPending}
                        className="text-sm text-red-400 hover:text-red-300"
                        data-testid={`button-remove-email-${email}`}
                      >
                        Remove
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
              <h3 className="mb-4 font-semibold text-[var(--color-text-primary)]">Notification Triggers</h3>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-[var(--color-text-primary)]">Hot Lead Created</p>
                    <p className="text-sm text-[var(--color-text-secondary)]">
                      Get notified when a high-intent lead comes in
                    </p>
                  </div>
                  <label className="relative inline-flex cursor-pointer items-center">
                    <input
                      type="checkbox"
                      checked={settings.notifyOnHotLead}
                      onChange={(e) => mutation.mutate({ notifyOnHotLead: e.target.checked })}
                      disabled={mutation.isPending}
                      className="peer sr-only"
                      data-testid="toggle-hot-lead"
                    />
                    <div className="peer h-6 w-11 rounded-full bg-[var(--color-surface-hover)] after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-[var(--color-brand-primary)] peer-checked:after:translate-x-full peer-focus:outline-none" />
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-[var(--color-text-primary)]">Booking Link Clicked</p>
                    <p className="text-sm text-[var(--color-text-secondary)]">
                      Get notified when someone clicks a booking link
                    </p>
                  </div>
                  <label className="relative inline-flex cursor-pointer items-center">
                    <input
                      type="checkbox"
                      checked={settings.notifyOnBookingClick}
                      onChange={(e) => mutation.mutate({ notifyOnBookingClick: e.target.checked })}
                      disabled={mutation.isPending}
                      className="peer sr-only"
                      data-testid="toggle-booking-click"
                    />
                    <div className="peer h-6 w-11 rounded-full bg-[var(--color-surface-hover)] after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-[var(--color-brand-primary)] peer-checked:after:translate-x-full peer-focus:outline-none" />
                  </label>
                </div>
              </div>
            </div>
          </>
        )}

        <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
          <h3 className="mb-2 font-semibold text-[var(--color-text-primary)]">Email Provider</h3>
          <p className="text-sm text-[var(--color-text-secondary)]">
            {process.env.NEXT_PUBLIC_RESEND_CONFIGURED === "true" ? (
              <span className="text-green-400">Resend is configured and ready to send emails</span>
            ) : (
              <span className="text-yellow-400">
                Email sending requires a RESEND_API_KEY environment variable
              </span>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
