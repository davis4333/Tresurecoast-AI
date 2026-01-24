#!/usr/bin/env tsx
/**
 * Preflight check: Validates required environment variables before build/deploy
 * Runs automatically before `pnpm build` via prebuild hook
 */

const REQUIRED_ENV_VARS = [
  'DATABASE_URL',
  'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
  'CLERK_SECRET_KEY',
] as const;

const OPTIONAL_ENV_VARS = [
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'RESEND_API_KEY',
  'OPENAI_API_KEY',
  'NEXT_PUBLIC_APP_URL',
] as const;

function checkEnvVars(): { success: boolean; errors: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check required vars
  for (const varName of REQUIRED_ENV_VARS) {
    const value = process.env[varName];
    if (!value) {
      errors.push(`❌ REQUIRED: ${varName} is not set`);
    } else if (value.includes('YOUR_') || value.includes('PLACEHOLDER')) {
      errors.push(`❌ REQUIRED: ${varName} contains placeholder value`);
    } else {
      console.log(`✅ ${varName} is set`);
    }
  }

  // Check optional vars (warnings only)
  for (const varName of OPTIONAL_ENV_VARS) {
    const value = process.env[varName];
    if (!value) {
      warnings.push(`⚠️  OPTIONAL: ${varName} is not set (some features may be disabled)`);
    } else {
      console.log(`✅ ${varName} is set`);
    }
  }

  // Validate Clerk key formats
  const clerkPubKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  if (clerkPubKey && !clerkPubKey.startsWith('pk_test_') && !clerkPubKey.startsWith('pk_live_')) {
    errors.push(`❌ NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY must start with pk_test_ or pk_live_`);
  }

  const clerkSecret = process.env.CLERK_SECRET_KEY;
  if (clerkSecret && !clerkSecret.startsWith('sk_test_') && !clerkSecret.startsWith('sk_live_')) {
    errors.push(`❌ CLERK_SECRET_KEY must start with sk_test_ or sk_live_`);
  }

  // Validate DATABASE_URL format
  const dbUrl = process.env.DATABASE_URL;
  if (dbUrl && !dbUrl.startsWith('postgresql://') && !dbUrl.startsWith('postgres://')) {
    errors.push(`❌ DATABASE_URL must be a valid PostgreSQL connection string`);
  }

  // Print warnings
  if (warnings.length > 0) {
    console.log('\n⚠️  WARNINGS:');
    warnings.forEach(w => console.log(w));
  }

  return { success: errors.length === 0, errors };
}

function main() {
  console.log('🔍 Running preflight environment checks...\n');

  const { success, errors } = checkEnvVars();

  if (!success) {
    console.error('\n❌ PREFLIGHT FAILED\n');
    errors.forEach(err => console.error(err));
    console.error('\n📋 To fix:\n');
    console.error('1. Copy .env.example to .env (if it exists)');
    console.error('2. Set all required environment variables');
    console.error('3. See README.md for setup instructions\n');
    process.exit(1);
  }

  console.log('\n✅ Preflight checks passed!\n');
  process.exit(0);
}

main();
