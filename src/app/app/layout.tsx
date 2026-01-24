import { AppLayoutClient } from "./AppLayoutClient";

/**
 * Server component layout wrapper for /app routes
 * Forces dynamic rendering to prevent static generation of authenticated pages
 * This prevents Clerk from validating API keys at build time
 */
export const dynamic = "force-dynamic";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <AppLayoutClient>{children}</AppLayoutClient>;
}
