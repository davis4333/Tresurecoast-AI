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

export async function requireClerkAdmin(): Promise<string> {
  if (
    !process.env.CLERK_SECRET_KEY ||
    !process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
  ) {
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
