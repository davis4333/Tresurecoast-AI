"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cx } from "@/components/tca/tca";
import { TcaBadge } from "@/components/tca/TcaBadge";
import { BrandingCssVars } from "@/components/branding/BrandingCssVars";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { AuthProvider } from "@/components/providers/AuthProvider";
import dynamic from "next/dynamic";

// Force dynamic rendering to prevent SSG of authenticated pages
export const dynamic = "force-dynamic";

const NAV_ITEMS = [
  { href: "/app", label: "Dashboard", icon: "grid", testId: "nav-dashboard" },
  { href: "/app/leads", label: "Leads", icon: "users", testId: "nav-leads" },
  { href: "/app/bots", label: "Bots", icon: "bot", testId: "nav-bots" },
  { href: "/app/kb", label: "Knowledge Base", icon: "bookOpen", testId: "nav-knowledge-base" },
  { href: "/app/conversations", label: "Conversations", icon: "chat", testId: "nav-conversations" },
  { href: "/app/analytics", label: "Analytics", icon: "chart", testId: "nav-analytics" },
  { href: "/app/settings", label: "Settings", icon: "settings", testId: "nav-settings" },
  { href: "/app/settings/branding", label: "Branding", icon: "palette", testId: "nav-branding" },
];

function NavIcon({ icon }: { icon: string }) {
  const iconMap: Record<string, JSX.Element> = {
    bookOpen: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
    palette: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
      </svg>
    ),
    grid: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
      </svg>
    ),
    users: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
    bot: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
    chat: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    ),
    settings: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    chart: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  };
  return iconMap[icon] || null;
}

function DevBypassAvatar() {
  return (
    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-brand-primary)] text-xs font-bold text-white">
      DEV
    </div>
  );
}

const isDevBypass = process.env.NEXT_PUBLIC_DEV_BYPASS_AUTH === "true";
const hasClerkKey = !isDevBypass && !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

const ClerkUserButtonDynamic = hasClerkKey
  ? dynamic(
      () => import("@clerk/nextjs").then((mod) => {
        const { UserButton, useAuth } = mod;
        return function AuthUserButton() {
          const { isLoaded, isSignedIn } = useAuth();
          if (!isLoaded) {
            return <div className="h-8 w-8 animate-pulse rounded-full bg-[var(--color-surface-hover)]" />;
          }
          if (!isSignedIn) {
            return null;
          }
          return (
            <UserButton
              afterSignOutUrl="/"
              appearance={{
                elements: {
                  avatarBox: "w-8 h-8",
                },
              }}
            />
          );
        };
      }),
      {
        ssr: false,
        loading: () => <div className="h-8 w-8 animate-pulse rounded-full bg-[var(--color-surface-hover)]" />,
      }
    )
  : DevBypassAvatar;

function ClerkUserButtonInner() {
  return <ClerkUserButtonDynamic />;
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/app") return pathname === "/app";
    return pathname.startsWith(href);
  };

  return (
    <AuthProvider>
      <QueryProvider>
        <div className="flex min-h-screen bg-[var(--color-background)]">
        <BrandingCssVars />
        <aside className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r border-[var(--color-border)] bg-[var(--color-surface)]">
        <div className="flex h-16 items-center justify-between border-b border-[var(--color-border)] px-4">
          <Link href="/app" className="text-lg font-extrabold text-[var(--color-brand-primary)]">
            Treasure Coast AI
          </Link>
        </div>

        <nav className="flex-1 space-y-1 p-4">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              data-testid={item.testId}
              className={cx(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive(item.href)
                  ? "bg-[var(--color-brand-primary)] text-[var(--color-text-inverse)]"
                  : "text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-primary)]"
              )}
            >
              <NavIcon icon={item.icon} />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="border-t border-[var(--color-border)] p-4">
          <div className="text-xs text-[var(--color-text-muted)]">
            Foundation Build v0.1
          </div>
        </div>
      </aside>

      <div className="ml-64 flex flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-surface)] px-6">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-semibold text-[var(--color-text-primary)]">Dashboard</h1>
          </div>
          <div className="flex items-center gap-4">
            <TcaBadge>Foundation Build</TcaBadge>
            <ClerkUserButtonInner />
          </div>
        </header>

        <main className="flex-1 p-6">
          {children}
        </main>
        </div>
      </div>
    </QueryProvider>
    </AuthProvider>
  );
}
