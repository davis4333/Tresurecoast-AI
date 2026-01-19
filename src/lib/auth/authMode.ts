export type AuthMode = "dev_bypass" | "normal" | "production";

export function getAuthMode(): AuthMode {
  const nodeEnv = process.env.NODE_ENV;
  const devBypass = process.env.DEV_BYPASS_AUTH;

  if (nodeEnv === "production") {
    return "production";
  }

  if (devBypass === "true") {
    return "dev_bypass";
  }

  return "normal";
}

export function isDevBypassEnabled(): boolean {
  return getAuthMode() === "dev_bypass";
}

export function isProductionMode(): boolean {
  return getAuthMode() === "production";
}

export function shouldUseClerk(): boolean {
  const mode = getAuthMode();
  if (mode === "dev_bypass") {
    return false;
  }
  const pk = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || "";
  return pk.startsWith("pk_");
}

export function hasValidClerkKeys(): boolean {
  const pk = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || "";
  const sk = process.env.CLERK_SECRET_KEY || "";
  return pk.startsWith("pk_") && sk.startsWith("sk_");
}
