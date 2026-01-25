"use client";

import { ClerkProvider } from "@clerk/nextjs";
import { hasValidClerkEnv, getClerkConfigError } from "@/lib/auth/hasValidClerkEnv";
import { ReactNode } from "react";

/**
 * AuthProvider - Wraps authenticated routes with ClerkProvider.
 *
 * This component provides Clerk authentication for the /app routes.
 * It validates Clerk environment variables before initializing ClerkProvider.
 *
 * If Clerk is misconfigured, it shows a clean error UI instead of crashing.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  // Check if we're in dev bypass mode
  const isDevBypass =
    process.env.NEXT_PUBLIC_DEV_BYPASS_AUTH === "true" &&
    process.env.NODE_ENV !== "production";

  // If dev bypass, skip Clerk entirely
  if (isDevBypass) {
    return <>{children}</>;
  }

  // Validate Clerk configuration
  if (!hasValidClerkEnv()) {
    const error = getClerkConfigError();
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--color-background)] p-6">
        <div className="max-w-md rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-8 text-center shadow-lg">
          <div className="mb-4 text-5xl">🔐</div>
          <h1 className="mb-2 text-2xl font-bold text-[var(--color-text-primary)]">
            Authentication Not Configured
          </h1>
          <p className="mb-6 text-[var(--color-text-secondary)]">{error}</p>
          <div className="rounded-lg bg-[var(--color-surface-hover)] p-4 text-left text-sm">
            <p className="mb-2 font-semibold text-[var(--color-text-primary)]">
              Required Environment Variables:
            </p>
            <ul className="list-inside list-disc space-y-1 text-[var(--color-text-muted)]">
              <li>NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY</li>
              <li>CLERK_SECRET_KEY</li>
            </ul>
            <p className="mt-4 text-xs text-[var(--color-text-muted)]">
              Get your keys from{" "}
              <a
                href="https://dashboard.clerk.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--color-brand-primary)] underline"
              >
                dashboard.clerk.com
              </a>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // All checks passed - initialize ClerkProvider
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY!;

  return (
    <ClerkProvider publishableKey={publishableKey}>
      {children}
    </ClerkProvider>
  );
}
