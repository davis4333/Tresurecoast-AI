"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { cx } from "@/components/tca/tca";
import { TcaBadge } from "@/components/tca/TcaBadge";
import { useAuth } from "@/hooks/use-auth";

const NAV_ITEMS = [
  { href: "/app", label: "Dashboard", icon: "grid" },
  { href: "/app/leads", label: "Leads", icon: "users" },
  { href: "/app/bots", label: "Bots", icon: "bot" },
  { href: "/app/conversations", label: "Conversations", icon: "chat" },
  { href: "/app/settings", label: "Settings", icon: "settings" },
];

function NavIcon({ icon }: { icon: string }) {
  const iconMap: Record<string, JSX.Element> = {
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
  };
  return iconMap[icon] || null;
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, isLoading, logout } = useAuth();

  const isLoginPage = pathname === "/app/login";

  useEffect(() => {
    if (!isLoading && !isAuthenticated && !isLoginPage) {
      router.push("/app/login");
    }
  }, [isLoading, isAuthenticated, isLoginPage, router]);

  const isActive = (href: string) => {
    if (href === "/app") return pathname === "/app";
    return pathname.startsWith(href);
  };

  async function handleLogout() {
    await logout();
    router.push("/app/login");
  }

  if (isLoginPage) {
    return <>{children}</>;
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--color-background)]">
        <div className="text-[var(--color-text-secondary)]">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-[var(--color-background)]">
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
              data-testid={`nav-${item.label.toLowerCase()}`}
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
          <button
            onClick={handleLogout}
            data-testid="button-logout"
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-primary)]"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Logout
          </button>
          <div className="mt-2 text-xs text-[var(--color-text-muted)]">
            Foundation Build v0.1
          </div>
        </div>
      </aside>

      <div className="ml-64 flex flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-surface)] px-6">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-semibold text-[var(--color-text-primary)]">Dashboard</h1>
          </div>
          <div className="flex items-center gap-3">
            <TcaBadge>Foundation Build</TcaBadge>
          </div>
        </header>

        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
