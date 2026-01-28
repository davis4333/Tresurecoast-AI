import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--color-background)] px-4">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-[var(--color-brand-primary)]">404</h1>
        <h2 className="mt-4 text-2xl font-semibold text-[var(--color-text-primary)]">
          Page Not Found
        </h2>
        <p className="mt-2 text-[var(--color-text-secondary)]">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-lg bg-[var(--color-brand-primary)] px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-[var(--color-brand-primary)]/90"
          >
            Go Home
          </Link>
          <Link
            href="/app"
            className="inline-flex items-center justify-center rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-6 py-3 text-sm font-medium text-[var(--color-text-primary)] transition-colors hover:bg-[var(--color-surface-hover)]"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
