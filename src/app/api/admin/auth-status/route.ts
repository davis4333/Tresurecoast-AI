import { NextResponse } from "next/server";
import { requireClerkAdmin, handleClerkError } from "@/lib/admin/requireClerkAdmin";
import { getAuthMode, hasValidClerkKeys } from "@/lib/auth/authMode";

export const runtime = "nodejs";

export async function GET() {
  try {
    await requireClerkAdmin();
  } catch (error) {
    return handleClerkError(error);
  }

  const nodeEnv = process.env.NODE_ENV;
  const devBypassEnvSet = process.env.DEV_BYPASS_AUTH === "true";
  const isProduction = nodeEnv === "production";

  const authMode = getAuthMode();
  const clerkKeysValid = hasValidClerkKeys();

  return NextResponse.json({
    authMode,
    hasPublishableKey: !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.startsWith("pk_"),
    hasSecretKey: !!process.env.CLERK_SECRET_KEY?.startsWith("sk_"),
    devBypassEnvSet: !isProduction && devBypassEnvSet,
    isProduction,
    clerkKeysValid,
  });
}
