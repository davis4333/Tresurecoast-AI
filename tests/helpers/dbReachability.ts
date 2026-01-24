/**
 * Database Reachability Check
 *
 * Quickly checks if PostgreSQL is reachable for test suites.
 * Used to conditionally skip DB integration tests when database is unavailable.
 */

import { prisma } from "@/lib/prisma";

let cachedReachability: boolean | null = null;

/**
 * Check if database is reachable
 *
 * @param timeoutMs - Timeout in milliseconds (default: 2000ms)
 * @returns true if database is reachable, false otherwise
 */
export async function isDatabaseReachable(timeoutMs = 2000): Promise<boolean> {
  // Return cached result if available (within same test run)
  if (cachedReachability !== null) {
    return cachedReachability;
  }

  const databaseUrl = process.env.DATABASE_URL;

  // No DATABASE_URL means DB not configured
  if (!databaseUrl) {
    cachedReachability = false;
    return false;
  }

  try {
    // Race between query and timeout
    const result = await Promise.race([
      // Simple query to check connectivity
      prisma.$queryRaw`SELECT 1 as connected`,
      // Timeout promise
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Timeout")), timeoutMs)
      ),
    ]);

    cachedReachability = true;
    return true;
  } catch (error) {
    // Connection failed or timed out
    cachedReachability = false;
    return false;
  }
}

/**
 * Get skip condition for database tests
 * Use this with describe.skipIf()
 *
 * @returns true if database tests should be skipped
 */
export async function shouldSkipDatabaseTests(): Promise<boolean> {
  const isCI = process.env.CI === "true" || process.env.CI === "1";
  const runDbTests = process.env.RUN_DB_TESTS === "true";

  // If explicitly requested to run DB tests, check reachability
  if (runDbTests) {
    const reachable = await isDatabaseReachable();
    return !reachable;
  }

  // In CI mode, require database to be reachable
  if (isCI) {
    const reachable = await isDatabaseReachable();

    // If not reachable in CI, the setup in tests/setup.ts will handle the error
    // But we still return the skip condition
    return !reachable;
  }

  // In normal mode (not CI, not RUN_DB_TESTS), check if DB is reachable
  // Skip if not reachable
  const reachable = await isDatabaseReachable();
  return !reachable;
}

/**
 * Reset cached reachability (useful for testing)
 */
export function resetReachabilityCache(): void {
  cachedReachability = null;
}
