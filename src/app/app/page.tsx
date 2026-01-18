import { TcaCard, TcaCardBody, TcaCardHeader } from "@/components/tca/TcaCard";
import { TcaButton } from "@/components/tca/TcaButton";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="tca-gradient-text text-3xl font-extrabold tracking-tight">
          Welcome Back
        </h2>
        <p className="mt-2 text-[var(--color-text-secondary)]">
          Manage your AI chatbots and leads from one place.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <TcaCard>
          <TcaCardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--color-brand-primary)]/10">
                <svg className="h-5 w-5 text-[var(--color-brand-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <div>
                <div className="text-2xl font-bold text-[var(--color-text-primary)]">—</div>
                <div className="text-sm text-[var(--color-text-secondary)]">Total Leads</div>
              </div>
            </div>
          </TcaCardHeader>
          <TcaCardBody>
            <Link href="/app/leads">
              <TcaButton variant="secondary" fullWidth>View Leads</TcaButton>
            </Link>
          </TcaCardBody>
        </TcaCard>

        <TcaCard>
          <TcaCardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--color-brand-secondary)]/10">
                <svg className="h-5 w-5 text-[var(--color-brand-secondary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <div className="text-2xl font-bold text-[var(--color-text-primary)]">—</div>
                <div className="text-sm text-[var(--color-text-secondary)]">Active Bots</div>
              </div>
            </div>
          </TcaCardHeader>
          <TcaCardBody>
            <Link href="/app/bots">
              <TcaButton variant="secondary" fullWidth>Manage Bots</TcaButton>
            </Link>
          </TcaCardBody>
        </TcaCard>

        <TcaCard>
          <TcaCardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--color-success)]/10">
                <svg className="h-5 w-5 text-[var(--color-success)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <div>
                <div className="text-2xl font-bold text-[var(--color-text-primary)]">—</div>
                <div className="text-sm text-[var(--color-text-secondary)]">Conversations</div>
              </div>
            </div>
          </TcaCardHeader>
          <TcaCardBody>
            <Link href="/app/conversations">
              <TcaButton variant="secondary" fullWidth>View All</TcaButton>
            </Link>
          </TcaCardBody>
        </TcaCard>
      </div>

      <TcaCard>
        <TcaCardHeader>
          <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">Quick Actions</h3>
        </TcaCardHeader>
        <TcaCardBody>
          <div className="flex flex-wrap gap-3">
            <Link href="/app/leads">
              <TcaButton>View Leads Inbox</TcaButton>
            </Link>
            <Link href="/app/bots">
              <TcaButton variant="secondary">Configure Bots</TcaButton>
            </Link>
            <Link href="/app/settings">
              <TcaButton variant="ghost">Settings</TcaButton>
            </Link>
          </div>
        </TcaCardBody>
      </TcaCard>
    </div>
  );
}
