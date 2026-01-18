import { TcaCard, TcaCardBody } from "@/components/tca/TcaCard";
import { TcaButton } from "@/components/tca/TcaButton";

export default function BotsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="tca-gradient-text text-3xl font-extrabold tracking-tight">
          Bots
        </h2>
        <p className="mt-2 text-[var(--color-text-secondary)]">
          Manage your AI chatbots and their configurations.
        </p>
      </div>

      <TcaCard>
        <TcaCardBody>
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-[var(--color-brand-secondary)]/10">
              <svg className="h-10 w-10 text-[var(--color-brand-secondary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-[var(--color-text-primary)]">Bot Management</h3>
            <p className="mt-2 max-w-md text-[var(--color-text-secondary)]">
              Create and configure AI chatbots that capture leads and answer questions for your clients.
            </p>
            <div className="mt-6">
              <TcaButton disabled>
                Create Bot (Coming Soon)
              </TcaButton>
            </div>
            <p className="mt-4 text-xs text-[var(--color-text-muted)]">
              Bot creation is managed via the seed API during the foundation build phase.
            </p>
          </div>
        </TcaCardBody>
      </TcaCard>
    </div>
  );
}
