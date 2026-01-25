/**
 * Validates Clerk environment variables are present and properly formatted.
 * This does NOT make SDK calls - just checks basic string format.
 *
 * @returns true if Clerk is properly configured, false otherwise
 */
export function hasValidClerkEnv(): boolean {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  const secretKey = process.env.CLERK_SECRET_KEY;

  // Both keys must be present
  if (!publishableKey || !secretKey) {
    return false;
  }

  // Publishable key should start with pk_test_ or pk_live_
  if (!publishableKey.startsWith("pk_test_") && !publishableKey.startsWith("pk_live_")) {
    return false;
  }

  // Secret key should start with sk_test_ or sk_live_
  if (!secretKey.startsWith("sk_test_") && !secretKey.startsWith("sk_live_")) {
    return false;
  }

  return true;
}

/**
 * Returns a user-friendly error message if Clerk is misconfigured.
 */
export function getClerkConfigError(): string | null {
  if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
    return "Missing NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY environment variable";
  }

  if (!process.env.CLERK_SECRET_KEY) {
    return "Missing CLERK_SECRET_KEY environment variable";
  }

  const pk = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  if (!pk.startsWith("pk_test_") && !pk.startsWith("pk_live_")) {
    return "Invalid NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY format (should start with pk_test_ or pk_live_)";
  }

  const sk = process.env.CLERK_SECRET_KEY;
  if (!sk.startsWith("sk_test_") && !sk.startsWith("sk_live_")) {
    return "Invalid CLERK_SECRET_KEY format (should start with sk_test_ or sk_live_)";
  }

  return null;
}
