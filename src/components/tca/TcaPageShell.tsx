import * as React from "react";
import { cx } from "./tca";

export function TcaPageShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[var(--color-background)] text-[var(--color-text-primary)]">
      <header className="border-b border-[var(--color-border)] bg-[var(--color-surface)]">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <div className="space-y-1">
            <div className="text-lg font-extrabold text-[var(--color-brand-primary)]">
              Treasure Coast AI
            </div>
            {subtitle ? (
              <div className="text-sm text-[var(--color-text-secondary)]">{subtitle}</div>
            ) : null}
          </div>
          <div className={cx("text-sm font-semibold text-[var(--color-text-secondary)]")}>
            {title}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-12">{children}</main>
    </div>
  );
}
