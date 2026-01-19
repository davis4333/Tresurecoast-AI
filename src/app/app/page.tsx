import { TcaCard, TcaCardBody, TcaCardHeader } from "@/components/tca/TcaCard";
import { TcaButton } from "@/components/tca/TcaButton";
import { TcaBadge } from "@/components/tca/TcaBadge";
import Link from "next/link";

export const dynamic = "force-dynamic";

const GETTING_STARTED_STEPS = [
  {
    step: 1,
    title: "Install the Widget",
    desc: "Add one script tag to your website to enable the chat widget.",
    href: "/app/bots",
    cta: "Get Embed Code",
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
      </svg>
    ),
  },
  {
    step: 2,
    title: "Test a Message",
    desc: "Send a test message through your widget to make sure it works.",
    href: "/app/conversations",
    cta: "View Conversations",
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    ),
  },
  {
    step: 3,
    title: "Check Your Leads",
    desc: "View and manage leads captured by your AI chatbot.",
    href: "/app/leads",
    cta: "View Leads",
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
  },
];

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

      <TcaCard elevated>
        <TcaCardHeader>
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">
                Getting Started
              </h3>
              <p className="text-sm text-[var(--color-text-secondary)]">
                Follow these steps to set up your AI chatbot.
              </p>
            </div>
            <TcaBadge>New</TcaBadge>
          </div>
        </TcaCardHeader>
        <TcaCardBody>
          <div className="grid gap-4 sm:grid-cols-3">
            {GETTING_STARTED_STEPS.map((item) => (
              <div
                key={item.step}
                className="flex flex-col rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-surface)] p-4"
                data-testid={`card-getting-started-step-${item.step}`}
              >
                <div className="mb-3 flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-brand-primary)] text-sm font-bold text-white">
                    {item.step}
                  </div>
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--color-brand-primary)]/10 text-[var(--color-brand-primary)]">
                    {item.icon}
                  </div>
                </div>
                <h4 className="mb-1 font-medium">{item.title}</h4>
                <p className="mb-4 flex-1 text-sm text-[var(--color-text-secondary)]">{item.desc}</p>
                <Link href={item.href}>
                  <TcaButton variant="secondary" size="sm" fullWidth>
                    {item.cta}
                  </TcaButton>
                </Link>
              </div>
            ))}
          </div>
        </TcaCardBody>
      </TcaCard>

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
                <div className="text-2xl font-bold text-[var(--color-text-primary)]" data-testid="text-total-leads">—</div>
                <div className="text-sm text-[var(--color-text-secondary)]">Total Leads</div>
              </div>
            </div>
          </TcaCardHeader>
          <TcaCardBody>
            <Link href="/app/leads">
              <TcaButton variant="secondary" fullWidth data-testid="button-view-leads">View Leads</TcaButton>
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
                <div className="text-2xl font-bold text-[var(--color-text-primary)]" data-testid="text-active-bots">—</div>
                <div className="text-sm text-[var(--color-text-secondary)]">Active Bots</div>
              </div>
            </div>
          </TcaCardHeader>
          <TcaCardBody>
            <Link href="/app/bots">
              <TcaButton variant="secondary" fullWidth data-testid="button-manage-bots">Manage Bots</TcaButton>
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
                <div className="text-2xl font-bold text-[var(--color-text-primary)]" data-testid="text-conversations">—</div>
                <div className="text-sm text-[var(--color-text-secondary)]">Conversations</div>
              </div>
            </div>
          </TcaCardHeader>
          <TcaCardBody>
            <Link href="/app/conversations">
              <TcaButton variant="secondary" fullWidth data-testid="button-view-conversations">View All</TcaButton>
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
              <TcaButton data-testid="button-leads-inbox">View Leads Inbox</TcaButton>
            </Link>
            <Link href="/app/bots">
              <TcaButton variant="secondary" data-testid="button-configure-bots">Configure Bots</TcaButton>
            </Link>
            <Link href="/app/settings">
              <TcaButton variant="ghost" data-testid="button-settings">Settings</TcaButton>
            </Link>
          </div>
        </TcaCardBody>
      </TcaCard>
    </div>
  );
}
