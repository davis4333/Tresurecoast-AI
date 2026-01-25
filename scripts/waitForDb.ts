#!/usr/bin/env tsx
/**
 * Wait for Database Script
 *
 * Waits for PostgreSQL to be ready before proceeding.
 * Used in CI/CD pipelines to ensure database is available.
 *
 * Usage:
 *   tsx scripts/waitForDb.ts
 *
 * Environment:
 *   DATABASE_URL - PostgreSQL connection string (required)
 */

import { exec } from "node:child_process";
import { promisify } from "node:util";

const execAsync = promisify(exec);

const MAX_ATTEMPTS = 30;
const WAIT_INTERVAL_MS = 2000;

async function isDatabaseReady(): Promise<boolean> {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.error("❌ DATABASE_URL environment variable is not set");
    process.exit(1);
  }

  try {
    // Parse DATABASE_URL to extract connection details
    const url = new URL(databaseUrl);
    const host = url.hostname;
    const port = url.port || "5432";
    const user = url.username;

    // Use pg_isready to check if PostgreSQL is accepting connections
    const command = `pg_isready -h ${host} -p ${port} -U ${user}`;

    const { stdout, stderr } = await execAsync(command);

    if (stdout.includes("accepting connections")) {
      return true;
    }

    console.log(`⏳ Database not ready: ${stderr || stdout}`);
    return false;
  } catch (error) {
    // pg_isready command failed - database not ready
    return false;
  }
}

async function waitForDatabase(): Promise<void> {
  console.log("⏳ Waiting for PostgreSQL to be ready...");

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const ready = await isDatabaseReady();

    if (ready) {
      console.log("✅ PostgreSQL is ready!");
      return;
    }

    console.log(`⏳ Attempt ${attempt}/${MAX_ATTEMPTS} - waiting ${WAIT_INTERVAL_MS}ms...`);

    if (attempt < MAX_ATTEMPTS) {
      await new Promise((resolve) => setTimeout(resolve, WAIT_INTERVAL_MS));
    }
  }

  console.error(`❌ PostgreSQL did not become ready after ${MAX_ATTEMPTS} attempts`);
  process.exit(1);
}

// Run the wait function
waitForDatabase().catch((error) => {
  console.error("❌ Error waiting for database:", error);
  process.exit(1);
});
