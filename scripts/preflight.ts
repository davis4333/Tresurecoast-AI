#!/usr/bin/env tsx
/**
 * Preflight check: Validates required environment variables before build/deploy
 * Runs automatically before `pnpm build` via prebuild hook
 *
 * CRITICAL: This script must be deterministic and never contradict itself.
 * It loads .env locally and validates format consistently.
 */

import "dotenv/config";

const REQUIRED_ENV_VARS = [
  'DATABASE_URL',
  'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
  'CLERK_SECRET_KEY',
  'NEXT_PUBLIC_APP_URL',
] as const;

const OPTIONAL_ENV_VARS = [
  'OPENAI_API_KEY',
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'RESEND_API_KEY',
] as const;

interface EnvCheckResult {
  name: string;
  present: boolean;
  formatValid: boolean;
  formatError?: string;
}

function validateEnvVar(name: string, value: string | undefined): EnvCheckResult {
  const result: EnvCheckResult = {
    name,
    present: !!value,
    formatValid: true,
  };

  if (!value) {
    return result;
  }

  // Check for placeholder values
  if (value.includes('YOUR_') || value.includes('PLACEHOLDER')) {
    result.formatValid = false;
    result.formatError = 'Contains placeholder value';
    return result;
  }

  // Validate specific formats
  switch (name) {
    case 'DATABASE_URL':
      if (!value.startsWith('postgresql://') && !value.startsWith('postgres://')) {
        result.formatValid = false;
        result.formatError = 'Must start with postgresql:// or postgres://';
      }
      break;

    case 'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY':
      if (!value.startsWith('pk_')) {
        result.formatValid = false;
        result.formatError = 'Must start with pk_';
      }
      break;

    case 'CLERK_SECRET_KEY':
      if (!value.startsWith('sk_')) {
        result.formatValid = false;
        result.formatError = 'Must start with sk_';
      }
      break;

    case 'NEXT_PUBLIC_APP_URL':
      if (!value.startsWith('http://') && !value.startsWith('https://')) {
        result.formatValid = false;
        result.formatError = 'Must start with http:// or https://';
      }
      break;
  }

  return result;
}

function printTable(title: string, results: EnvCheckResult[]) {
  console.log(`\n${title}`);
  console.log('─'.repeat(80));
  console.log('Variable'.padEnd(40) + 'Present'.padEnd(15) + 'Format Valid');
  console.log('─'.repeat(80));

  for (const result of results) {
    const presentMark = result.present ? '✅ Yes' : '❌ No';
    const formatMark = !result.present
      ? '—'
      : result.formatValid
        ? '✅ Yes'
        : `❌ No (${result.formatError})`;

    console.log(
      result.name.padEnd(40) +
      presentMark.padEnd(15) +
      formatMark
    );
  }

  console.log('─'.repeat(80));
}

function main() {
  console.log('🔍 Running preflight environment checks...\n');

  // Check required vars
  const requiredResults: EnvCheckResult[] = [];
  const missingRequired: string[] = [];
  const invalidRequired: string[] = [];

  for (const varName of REQUIRED_ENV_VARS) {
    const value = process.env[varName];
    const result = validateEnvVar(varName, value);
    requiredResults.push(result);

    if (!result.present) {
      missingRequired.push(varName);
    } else if (!result.formatValid) {
      invalidRequired.push(`${varName}: ${result.formatError}`);
    }
  }

  printTable('REQUIRED ENVIRONMENT VARIABLES', requiredResults);

  // Check optional vars
  const optionalResults: EnvCheckResult[] = [];
  const missingOptional: string[] = [];

  for (const varName of OPTIONAL_ENV_VARS) {
    const value = process.env[varName];
    const result = validateEnvVar(varName, value);
    optionalResults.push(result);

    if (!result.present) {
      missingOptional.push(varName);
    }
  }

  printTable('OPTIONAL ENVIRONMENT VARIABLES', optionalResults);

  // Print summary
  console.log('\n📋 SUMMARY\n');

  const hasMissingRequired = missingRequired.length > 0;
  const hasInvalidRequired = invalidRequired.length > 0;

  if (hasMissingRequired) {
    console.log('❌ Missing required variables:');
    missingRequired.forEach(v => console.log(`   - ${v}`));
    console.log('');
  }

  if (hasInvalidRequired) {
    console.log('❌ Invalid required variables:');
    invalidRequired.forEach(v => console.log(`   - ${v}`));
    console.log('');
  }

  if (missingOptional.length > 0) {
    console.log('⚠️  Missing optional variables (some features may be disabled):');
    missingOptional.forEach(v => console.log(`   - ${v}`));
    console.log('');
  }

  if (hasMissingRequired || hasInvalidRequired) {
    console.log('❌ PREFLIGHT FAIL\n');
    console.log('📋 To fix:\n');
    console.log('1. Copy .env.example to .env (if it exists)');
    console.log('2. Set all required environment variables');
    console.log('3. See README.md for setup instructions\n');
    process.exit(1);
  }

  console.log('✅ PREFLIGHT PASS\n');
  console.log('All required environment variables are set and valid.');
  console.log('Build can proceed safely.\n');
  process.exit(0);
}

main();
