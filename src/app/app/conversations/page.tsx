import { TcaCard, TcaCardBody } from "@/components/tca/TcaCard";
import { TcaButton } from "@/components/tca/TcaButton";

export default function ConversationsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="tca-gradient-text text-3xl font-extrabold tracking-tight">
          Conversations
        </h2>
        <p className="mt-2 text-[var(--color-text-secondary)]">
          View chat histories and conversation analytics.
        </p>
      </div>

      <TcaCard>
        <TcaCardBody>
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-[var(--color-success)]/10">
              <svg className="h-10 w-10 text-[var(--color-success)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-[var(--color-text-primary)]">Conversation History</h3>
            <p className="mt-2 max-w-md text-[var(--color-text-secondary)]">
              Browse chat transcripts, analyze conversation patterns, and review AI responses.
            </p>
            <div className="mt-6">
              <TcaButton disabled>
                View Conversations (Coming Soon)
              </TcaButton>
            </div>
            <p className="mt-4 text-xs text-[var(--color-text-muted)]">
              Conversation browsing will be available in an upcoming release.
            </p>
          </div>
        </TcaCardBody>
      </TcaCard>
    </div>
  );
}
