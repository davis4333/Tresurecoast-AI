"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";
import { TcaButton } from "@/components/tca/TcaButton";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to Sentry
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body className="bg-background text-foreground antialiased">
        <div className="flex min-h-screen items-center justify-center p-4">
          <div className="max-w-md text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10 mx-auto">
              <svg
                className="h-8 w-8 text-red-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <h1 className="mb-2 text-2xl font-bold text-[var(--color-text-primary)]">
              Something went wrong!
            </h1>
            <p className="mb-6 text-[var(--color-text-secondary)]">
              We've been notified and will look into it. Please try again.
            </p>
            {error.digest && (
              <p className="mb-4 text-xs text-[var(--color-text-muted)]">
                Error ID: {error.digest}
              </p>
            )}
            <div className="flex gap-3 justify-center">
              <TcaButton onClick={reset} variant="primary">
                Try again
              </TcaButton>
              <TcaButton
                onClick={() => (window.location.href = "/")}
                variant="secondary"
              >
                Go home
              </TcaButton>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
