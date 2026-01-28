import { z } from "zod";

/**
 * Server-side environment variables schema.
 * These are validated at build time or server startup.
 */
const serverEnvSchema = z.object({
  // Database
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),

  // Node environment
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),

  // Clerk Auth (required unless DEV_BYPASS_AUTH is enabled)
  CLERK_SECRET_KEY: z.string().optional(),

  // Development auth bypass
  DEV_BYPASS_AUTH: z.enum(["true", "false"]).optional(),
  DEV_BOOTSTRAP_CLERK_USER_ID: z.string().optional(),
  DEV_BOOTSTRAP_CLERK_ORG_ID: z.string().optional(),

  // Admin seed key
  ADMIN_SEED_KEY: z.string().optional(),

  // Rate limiting
  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),

  // Email
  RESEND_API_KEY: z.string().optional(),

  // Stripe (for billing)
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),

  // OpenAI
  OPENAI_API_KEY: z.string().optional(),
});

/**
 * Client-side environment variables schema.
 * These are exposed to the browser and must be prefixed with NEXT_PUBLIC_.
 */
const clientEnvSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().optional(),
  NEXT_PUBLIC_DEV_BYPASS_AUTH: z.enum(["true", "false"]).optional(),
  NEXT_PUBLIC_DEMO_BOT_KEY: z.string().uuid().optional(),
  NEXT_PUBLIC_RESEND_CONFIGURED: z.enum(["true", "false"]).optional(),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().optional(),
});

/**
 * Validates server-side environment variables.
 * Call this at server startup or during build.
 */
export function validateServerEnv() {
  const parsed = serverEnvSchema.safeParse(process.env);

  if (!parsed.success) {
    console.error("Invalid server environment variables:");
    console.error(parsed.error.flatten().fieldErrors);
    throw new Error("Invalid server environment configuration");
  }

  // Additional validation rules
  const env = parsed.data;

  // In production, Clerk must be configured unless explicitly bypassed
  if (env.NODE_ENV === "production" && env.DEV_BYPASS_AUTH !== "true") {
    if (!env.CLERK_SECRET_KEY?.startsWith("sk_")) {
      throw new Error("CLERK_SECRET_KEY is required in production");
    }
  }

  // If DEV_BYPASS_AUTH is enabled, ensure we're not in production
  if (env.DEV_BYPASS_AUTH === "true" && env.NODE_ENV === "production") {
    throw new Error("DEV_BYPASS_AUTH cannot be enabled in production");
  }

  return env;
}

/**
 * Validates client-side environment variables.
 */
export function validateClientEnv() {
  const clientEnv = {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
    NEXT_PUBLIC_DEV_BYPASS_AUTH: process.env.NEXT_PUBLIC_DEV_BYPASS_AUTH,
    NEXT_PUBLIC_DEMO_BOT_KEY: process.env.NEXT_PUBLIC_DEMO_BOT_KEY,
    NEXT_PUBLIC_RESEND_CONFIGURED: process.env.NEXT_PUBLIC_RESEND_CONFIGURED,
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
  };

  const parsed = clientEnvSchema.safeParse(clientEnv);

  if (!parsed.success) {
    console.error("Invalid client environment variables:");
    console.error(parsed.error.flatten().fieldErrors);
    throw new Error("Invalid client environment configuration");
  }

  return parsed.data;
}

// Type exports
export type ServerEnv = z.infer<typeof serverEnvSchema>;
export type ClientEnv = z.infer<typeof clientEnvSchema>;
