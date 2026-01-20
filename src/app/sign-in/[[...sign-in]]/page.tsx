"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

function ClerkSignIn() {
  const [SignIn, setSignIn] = useState<typeof import("@clerk/nextjs").SignIn | null>(null);

  useEffect(() => {
    import("@clerk/nextjs").then((mod) => setSignIn(() => mod.SignIn));
  }, []);

  if (!SignIn) {
    return <div className="text-center text-[var(--color-text-secondary)]">Loading...</div>;
  }

  return (
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
  );
}

export default function SignInPage() {
  const router = useRouter();
  const isDevBypass = process.env.NEXT_PUBLIC_DEV_BYPASS_AUTH === "true";

  useEffect(() => {
    if (isDevBypass) {
      router.replace("/app");
    }
  }, [isDevBypass, router]);

  if (isDevBypass) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--color-background)]">
        <div className="text-center">
          <p className="text-[var(--color-text-secondary)]">Dev mode: Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }

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
        <ClerkSignIn />
        <p className="text-center text-xs text-[var(--color-text-muted)]">
          Contact your administrator for access.
        </p>
      </div>
    </div>
  );
}
