#!/usr/bin/env tsx

import { PrismaClient } from "@prisma/client";
import { execSync } from "child_process";

async function main() {
  console.log("[DB MIGRATE] Starting migration and verification...");

  if (!process.env.DATABASE_URL) {
    console.error("[DB MIGRATE] ERROR: DATABASE_URL environment variable is not set");
    process.exit(1);
  }

  console.log("[DB MIGRATE] DATABASE_URL is set");

  try {
    console.log("[DB MIGRATE] Running pnpm db:migrate...");
    execSync("pnpm db:migrate", { stdio: "inherit" });
    console.log("[DB MIGRATE] Migrations completed successfully");
  } catch (error) {
    console.error("[DB MIGRATE] ERROR: Migration failed", error);
    process.exit(1);
  }

  const prisma = new PrismaClient();
  try {
    console.log("[DB MIGRATE] Verifying database connectivity (schema-agnostic)...");
    await prisma.$connect();
    await prisma.$queryRaw`SELECT 1`;
    console.log("[DB MIGRATE] Database connected successfully");
    await prisma.$disconnect();
    console.log("[DB MIGRATE] All checks passed ✓");
  } catch (error) {
    console.error("[DB MIGRATE] ERROR: Database connectivity verification failed", error);
    try {
      await prisma.$disconnect();
    } catch {}
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("[DB MIGRATE] Unexpected error:", error);
  process.exit(1);
});
