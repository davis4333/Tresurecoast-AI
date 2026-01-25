/**
 * Instrumentation file for server-side monitoring and initialization
 * This runs once when the server starts up
 * https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */

export async function register() {
  // Only run on server
  if (process.env.NEXT_RUNTIME === "nodejs") {
    // Import Sentry for server-side error tracking
    await import("../sentry.server.config");
  }

  // Only run on edge runtime
  if (process.env.NEXT_RUNTIME === "edge") {
    // Import Sentry for edge runtime error tracking
    await import("../sentry.edge.config");
  }
}
