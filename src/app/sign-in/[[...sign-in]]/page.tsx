"use client";

import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-background)]">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
            Treasure Coast AI
          </h1>
          <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
            Agency Dashboard
          </p>
        </div>
        <SignIn
          appearance={{
            elements: {
              rootBox: "mx-auto",
              card: "bg-[var(--color-surface)] border border-[var(--color-border)]",
              headerTitle: "text-[var(--color-text-primary)]",
              headerSubtitle: "text-[var(--color-text-secondary)]",
              formButtonPrimary: "bg-[var(--color-brand-primary)] hover:bg-[var(--color-brand-primary-hover)]",
              footerActionLink: "text-[var(--color-brand-primary)]",
            },
          }}
        />
        <p className="text-center text-xs text-[var(--color-text-muted)]">
          Contact your administrator for access.
        </p>
      </div>
    </div>
  );
}
