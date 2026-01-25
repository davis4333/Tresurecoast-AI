/**
 * Vitest Setup File
 * Runs before all test files
 */

import "dotenv/config";

/**
 * CI Mode Detection
 *
 * In CI environments, we want to ensure database tests actually run
 * rather than silently skipping. This prevents false confidence from
 * all tests passing when DB tests are simply being skipped.
 */
const isCI = process.env.CI === "true" || process.env.CI === "1";
const hasDatabase = !!process.env.DATABASE_URL;

if (isCI && !hasDatabase) {
  console.error("\n❌ CI MODE ERROR\n");
  console.error("Running in CI mode (CI=true) but DATABASE_URL is not set.");
  console.error("Database integration tests will be skipped, which defeats the purpose of CI.");
  console.error("\nTo fix:");
  console.error("1. Set DATABASE_URL in your CI environment");
  console.error("2. Or remove CI=true to run in local development mode (DB tests will skip gracefully)\n");

  throw new Error("CI mode requires DATABASE_URL to be set. Cannot proceed with test suite.");
}

if (!hasDatabase && !isCI) {
  console.warn("\n⚠️  WARNING: DATABASE_URL not set\n");
  console.warn("Database integration tests will be skipped.");
  console.warn("To run all tests:");
  console.warn("1. Set up PostgreSQL (see DB_SETUP.md)");
  console.warn("2. Set DATABASE_URL in .env");
  console.warn("3. Run: pnpm prisma migrate dev");
  console.warn("4. Run: pnpm test\n");
}
