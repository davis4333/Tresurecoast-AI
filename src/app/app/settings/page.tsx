import Link from "next/link";
import { TcaCard, TcaCardBody, TcaCardHeader } from "@/components/tca/TcaCard";
import { TcaBadge } from "@/components/tca/TcaBadge";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="tca-gradient-text text-3xl font-extrabold tracking-tight">
          Settings
        </h2>
        <p className="mt-2 text-[var(--color-text-secondary)]">
          Configure your account and preferences.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Link href="/app/settings/business" data-testid="link-settings-business">
          <TcaCard className="h-full hover:border-[var(--color-brand-primary)] transition-colors cursor-pointer">
            <TcaCardHeader>
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">Business Info</h3>
              </div>
            </TcaCardHeader>
            <TcaCardBody>
              <p className="text-sm text-[var(--color-text-secondary)]">
                Update your contact information, location, and business policies.
              </p>
            </TcaCardBody>
          </TcaCard>
        </Link>

        <Link href="/app/settings/services" data-testid="link-settings-services">
          <TcaCard className="h-full hover:border-[var(--color-brand-primary)] transition-colors cursor-pointer">
            <TcaCardHeader>
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">Services</h3>
              </div>
            </TcaCardHeader>
            <TcaCardBody>
              <p className="text-sm text-[var(--color-text-secondary)]">
                Manage your service menu with prices, booking links, and payment URLs.
              </p>
            </TcaCardBody>
          </TcaCard>
        </Link>

        <Link href="/app/settings/hours" data-testid="link-settings-hours">
          <TcaCard className="h-full hover:border-[var(--color-brand-primary)] transition-colors cursor-pointer">
            <TcaCardHeader>
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">Business Hours</h3>
              </div>
            </TcaCardHeader>
            <TcaCardBody>
              <p className="text-sm text-[var(--color-text-secondary)]">
                Set your weekly schedule so customers know when you&apos;re open.
              </p>
            </TcaCardBody>
          </TcaCard>
        </Link>

        <Link href="/app/settings/branding" data-testid="link-settings-branding">
          <TcaCard className="h-full hover:border-[var(--color-brand-primary)] transition-colors cursor-pointer">
            <TcaCardHeader>
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">Branding</h3>
              </div>
            </TcaCardHeader>
            <TcaCardBody>
              <p className="text-sm text-[var(--color-text-secondary)]">
                Customize your white-label branding, colors, and custom domain.
              </p>
            </TcaCardBody>
          </TcaCard>
        </Link>

        <Link href="/app/settings/notifications" data-testid="link-settings-notifications">
          <TcaCard className="h-full hover:border-[var(--color-brand-primary)] transition-colors cursor-pointer">
            <TcaCardHeader>
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">Notifications</h3>
              </div>
            </TcaCardHeader>
            <TcaCardBody>
              <p className="text-sm text-[var(--color-text-secondary)]">
                Configure email alerts for hot leads and booking clicks.
              </p>
            </TcaCardBody>
          </TcaCard>
        </Link>

        <TcaCard>
          <TcaCardHeader>
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">Account</h3>
              <TcaBadge>Coming Soon</TcaBadge>
            </div>
          </TcaCardHeader>
          <TcaCardBody>
            <p className="text-sm text-[var(--color-text-secondary)]">
              Manage your account details, email preferences, and password.
            </p>
          </TcaCardBody>
        </TcaCard>

        <TcaCard>
          <TcaCardHeader>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">Integrations</h3>
              <TcaBadge>Coming Soon</TcaBadge>
            </div>
          </TcaCardHeader>
          <TcaCardBody>
            <p className="text-sm text-[var(--color-text-secondary)]">
              Connect external services like CRMs, calendars, and payment providers.
            </p>
          </TcaCardBody>
        </TcaCard>

        <TcaCard>
          <TcaCardHeader>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">Billing</h3>
              <TcaBadge>Coming Soon</TcaBadge>
            </div>
          </TcaCardHeader>
          <TcaCardBody>
            <p className="text-sm text-[var(--color-text-secondary)]">
              View invoices, update payment methods, and manage your subscription.
            </p>
          </TcaCardBody>
        </TcaCard>

        <TcaCard>
          <TcaCardHeader>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">API Keys</h3>
              <TcaBadge>Coming Soon</TcaBadge>
            </div>
          </TcaCardHeader>
          <TcaCardBody>
            <p className="text-sm text-[var(--color-text-secondary)]">
              Generate and manage API keys for programmatic access.
            </p>
          </TcaCardBody>
        </TcaCard>
      </div>

      <TcaCard>
        <TcaCardHeader>
          <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">Build Information</h3>
        </TcaCardHeader>
        <TcaCardBody>
          <dl className="grid gap-4 sm:grid-cols-3">
            <div>
              <dt className="text-sm font-medium text-[var(--color-text-muted)]">Version</dt>
              <dd className="mt-1 text-[var(--color-text-primary)]">0.1.0 (Foundation)</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-[var(--color-text-muted)]">Environment</dt>
              <dd className="mt-1 text-[var(--color-text-primary)]">Development</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-[var(--color-text-muted)]">Database</dt>
              <dd className="mt-1 text-[var(--color-text-primary)]">PostgreSQL (Neon)</dd>
            </div>
          </dl>
        </TcaCardBody>
      </TcaCard>
    </div>
  );
}
