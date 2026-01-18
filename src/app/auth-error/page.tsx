export const dynamic = "force-dynamic";

export default function AuthErrorPage() {
  return (
    <div className="min-h-screen bg-[#0B0E13] flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="w-16 h-16 mx-auto rounded-full bg-red-500/10 flex items-center justify-center">
          <svg
            className="w-8 h-8 text-red-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-semibold text-[#F8FAFC]">
            Authentication Not Configured
          </h1>
          <p className="text-[#94A3B8]">
            The application requires Clerk authentication keys to access the
            dashboard. Please add the required environment variables.
          </p>
        </div>

        <div className="bg-[#1E293B]/50 rounded-lg p-4 text-left">
          <p className="text-sm text-[#94A3B8] mb-2">Required keys:</p>
          <code className="block text-xs text-[#F8FAFC] font-mono">
            NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
          </code>
          <code className="block text-xs text-[#F8FAFC] font-mono mt-1">
            CLERK_SECRET_KEY
          </code>
        </div>

        <a
          href="/"
          className="inline-block text-sm text-[#60A5FA] hover:text-[#93C5FD] transition-colors"
        >
          Return to Home
        </a>
      </div>
    </div>
  );
}
