"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Application error:", error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--color-background)] px-4">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-red-500">500</h1>
        <h2 className="mt-4 text-2xl font-semibold text-[var(--color-text-primary)]">
          Something went wrong
        </h2>
        <p className="mt-2 text-[var(--color-text-secondary)]">
          An unexpected error occurred. Please try again.
        </p>
        {error.digest && (
          <p className="mt-2 text-xs text-[var(--color-text-muted)]">
            Error ID: {error.digest}
          </p>
        )}
        <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:justify-center">
          <button
            onClick={reset}
            className="inline-flex items-center justify-center rounded-lg bg-[var(--color-brand-primary)] px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-[var(--color-brand-primary)]/90"
          >
            Try Again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-6 py-3 text-sm font-medium text-[var(--color-text-primary)] transition-colors hover:bg-[var(--color-surface-hover)]"
          >
            Go Home
          </a>
        </div>
      </div>
    </div>
  );
}
