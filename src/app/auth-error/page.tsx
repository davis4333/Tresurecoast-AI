export const dynamic = "force-dynamic";

function isProduction(): boolean {
  return process.env.NODE_ENV === "production";
}

export default function AuthErrorPage() {
  const isProd = isProduction();

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
          <h1 className="text-2xl font-semibold text-[#F8FAFC]" data-testid="auth-error-title">
            {isProd ? "Sign In Required" : "Authentication Not Configured"}
          </h1>
          <p className="text-[#94A3B8]">
            {isProd
              ? "Please sign in to access the dashboard."
              : "The application requires authentication to access the dashboard."}
          </p>
        </div>

        {isProd ? (
          <a
            href="/sign-in"
            className="inline-block px-6 py-2.5 rounded-lg bg-[#3B82F6] text-white font-medium hover:bg-[#2563EB] transition-colors"
            data-testid="link-sign-in"
          >
            Sign In
          </a>
        ) : (
          <>
            <div className="bg-[#1E293B]/50 rounded-lg p-4 text-left space-y-4">
              <div>
                <p className="text-sm font-medium text-[#F8FAFC] mb-2">Option 1: Enable Dev Bypass Mode</p>
                <p className="text-xs text-[#94A3B8] mb-2">
                  Add these environment variables to skip authentication in development:
                </p>
                <code className="block text-xs text-[#22C55E] font-mono bg-[#0F172A] p-2 rounded">
                  DEV_BYPASS_AUTH=true
                </code>
                <code className="block text-xs text-[#22C55E] font-mono bg-[#0F172A] p-2 rounded mt-1">
                  NEXT_PUBLIC_DEV_BYPASS_AUTH=true
                </code>
              </div>
              <div className="border-t border-[#334155] pt-4">
                <p className="text-sm font-medium text-[#F8FAFC] mb-2">Option 2: Configure Clerk Keys</p>
                <p className="text-xs text-[#94A3B8] mb-2">
                  Add your Clerk authentication keys:
                </p>
                <code className="block text-xs text-[#F8FAFC] font-mono bg-[#0F172A] p-2 rounded">
                  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
                </code>
                <code className="block text-xs text-[#F8FAFC] font-mono bg-[#0F172A] p-2 rounded mt-1">
                  CLERK_SECRET_KEY=sk_...
                </code>
              </div>
            </div>
            <p className="text-xs text-[#64748B]">
              After adding the variables, restart the development server.
            </p>
          </>
        )}

        <a
          href="/"
          className="inline-block text-sm text-[#60A5FA] hover:text-[#93C5FD] transition-colors"
          data-testid="link-home"
        >
          Return to Home
        </a>
      </div>
    </div>
  );
}
