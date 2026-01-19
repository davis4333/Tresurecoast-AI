"use client";

import { useState, useEffect } from "react";

interface AuthStatus {
  authMode: string;
  hasPublishableKey: boolean;
  hasSecretKey: boolean;
  devBypassEnvSet: boolean;
  isProduction: boolean;
  clerkKeysValid: boolean;
}

export default function AdminSettingsPage() {
  const [authStatus, setAuthStatus] = useState<AuthStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAuthStatus() {
      try {
        const res = await fetch("/api/admin/auth-status");
        if (!res.ok) {
          throw new Error("Failed to fetch auth status");
        }
        const data = await res.json();
        setAuthStatus(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    }

    fetchAuthStatus();
  }, []);

  if (loading) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-6">Admin Settings</h1>
        <p>Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-6">Admin Settings</h1>
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto" data-testid="admin-settings-page">
      <h1 className="text-2xl font-bold mb-6">Admin Settings</h1>

      <div className="space-y-6">
        <div className="border rounded-lg p-6 bg-card">
          <h2 className="text-lg font-semibold mb-4">Authentication Status</h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-muted-foreground">Auth Mode</span>
              <span
                className={`font-mono px-2 py-1 rounded text-sm ${
                  authStatus?.authMode === "production"
                    ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                    : authStatus?.authMode === "dev_bypass"
                      ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                      : "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                }`}
                data-testid="auth-mode-value"
              >
                {authStatus?.authMode}
              </span>
            </div>

            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-muted-foreground">Clerk Publishable Key</span>
              <span
                className={`${authStatus?.hasPublishableKey ? "text-green-600" : "text-red-600"}`}
                data-testid="clerk-publishable-status"
              >
                {authStatus?.hasPublishableKey ? "Present" : "Missing"}
              </span>
            </div>

            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-muted-foreground">Clerk Secret Key</span>
              <span
                className={`${authStatus?.hasSecretKey ? "text-green-600" : "text-red-600"}`}
                data-testid="clerk-secret-status"
              >
                {authStatus?.hasSecretKey ? "Present" : "Missing"}
              </span>
            </div>

            {authStatus?.devBypassEnvSet && !authStatus.isProduction && (
              <div
                className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg"
                data-testid="dev-bypass-warning"
              >
                <p className="text-yellow-800 dark:text-yellow-200 font-medium">
                  Warning: DEV_BYPASS_AUTH is enabled
                </p>
                <p className="text-yellow-700 dark:text-yellow-300 text-sm mt-1">
                  This setting is ignored in production. Remove it before deploying.
                </p>
              </div>
            )}

            {authStatus?.isProduction && (
              <div
                className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg"
                data-testid="production-safe-notice"
              >
                <p className="text-green-800 dark:text-green-200 font-medium">
                  Production Mode Active
                </p>
                <p className="text-green-700 dark:text-green-300 text-sm mt-1">
                  DEV_BYPASS_AUTH is ignored in production. Clerk authentication is enforced.
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="border rounded-lg p-6 bg-card">
          <h2 className="text-lg font-semibold mb-4">Production Readiness Checklist</h2>
          <ul className="space-y-3">
            <li className="flex items-start gap-3">
              <span
                className={`mt-1 w-4 h-4 rounded-full flex-shrink-0 ${
                  authStatus?.clerkKeysValid ? "bg-green-500" : "bg-red-500"
                }`}
              />
              <div>
                <p className="font-medium">Clerk Keys Configured</p>
                <p className="text-sm text-muted-foreground">
                  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY and CLERK_SECRET_KEY must be set in Replit Secrets.
                </p>
              </div>
            </li>

            <li className="flex items-start gap-3">
              <span
                className={`mt-1 w-4 h-4 rounded-full flex-shrink-0 ${
                  !authStatus?.devBypassEnvSet || authStatus.isProduction ? "bg-green-500" : "bg-yellow-500"
                }`}
              />
              <div>
                <p className="font-medium">DEV_BYPASS_AUTH Disabled</p>
                <p className="text-sm text-muted-foreground">
                  Remove DEV_BYPASS_AUTH environment variable before production deployment.
                </p>
              </div>
            </li>

            <li className="flex items-start gap-3">
              <span className="mt-1 w-4 h-4 rounded-full flex-shrink-0 bg-blue-500" />
              <div>
                <p className="font-medium">Database Migrated</p>
                <p className="text-sm text-muted-foreground">
                  Run prisma migrate deploy to apply all migrations to production database.
                </p>
              </div>
            </li>

            <li className="flex items-start gap-3">
              <span className="mt-1 w-4 h-4 rounded-full flex-shrink-0 bg-blue-500" />
              <div>
                <p className="font-medium">Demo Bot Configured</p>
                <p className="text-sm text-muted-foreground">
                  Set NEXT_PUBLIC_DEMO_BOT_KEY to a valid bot UUID for the /demo page.
                </p>
              </div>
            </li>

            <li className="flex items-start gap-3">
              <span className="mt-1 w-4 h-4 rounded-full flex-shrink-0 bg-blue-500" />
              <div>
                <p className="font-medium">Webhook URLs (Optional)</p>
                <p className="text-sm text-muted-foreground">
                  Set DEMO_REQUEST_WEBHOOK_URL and LEAD_WEBHOOK_URL for notifications.
                </p>
              </div>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
