import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export class ClerkMisconfiguredError extends Error {
  response: NextResponse;

  constructor() {
    super("server_misconfigured");
    this.response = NextResponse.json(
      { ok: false, error: "server_misconfigured" },
      { status: 503 }
    );
  }
}

export class ClerkUnauthorizedError extends Error {
  response: NextResponse;

  constructor() {
    super("unauthorized");
    this.response = NextResponse.json(
      { ok: false, error: "unauthorized" },
      { status: 401 }
    );
  }
}

function isDevBypassEnabled(): boolean {
  return (
    process.env.DEV_BYPASS_AUTH === "true" &&
    process.env.NODE_ENV !== "production"
  );
}

function hasValidClerkKeys(): boolean {
  const pk = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || "";
  const sk = process.env.CLERK_SECRET_KEY || "";
  return pk.startsWith("pk_") && sk.startsWith("sk_");
}

export async function requireClerkAdmin(): Promise<string> {
  if (isDevBypassEnabled()) {
    return "dev-bypass-user";
  }

  if (!hasValidClerkKeys()) {
    throw new ClerkMisconfiguredError();
  }

  const { userId } = await auth();

  if (!userId) {
    throw new ClerkUnauthorizedError();
  }

  return userId;
}

export function handleClerkError(error: unknown): NextResponse {
  if (error instanceof ClerkMisconfiguredError) {
    return error.response;
  }
  if (error instanceof ClerkUnauthorizedError) {
    return error.response;
  }
  console.error("[ADMIN ERROR]", error);
  return NextResponse.json(
    { ok: false, error: "Internal error" },
    { status: 500 }
  );
}
