import { NextResponse } from "next/server";

export class AdminUnauthorizedError extends Error {
  response: NextResponse;

  constructor(message: string, status: number) {
    super(message);
    this.response = NextResponse.json(
      { ok: false, error: message },
      { status }
    );
  }
}

function isSameOriginRequest(req: Request): boolean {
  const origin = req.headers.get("origin");
  const referer = req.headers.get("referer");
  const host = req.headers.get("host");

  if (!host) return false;

  if (origin) {
    try {
      const originHost = new URL(origin).host;
      if (originHost === host) return true;
    } catch {
      // invalid origin
    }
  }

  if (referer) {
    try {
      const refererHost = new URL(referer).host;
      if (refererHost === host) return true;
    } catch {
      // invalid referer
    }
  }

  return false;
}

export function requireAdmin(req: Request): void {
  if (isSameOriginRequest(req)) {
    return;
  }

  const adminKey = process.env.ADMIN_SEED_KEY;

  if (!adminKey) {
    throw new AdminUnauthorizedError("server_misconfigured", 500);
  }

  const providedKey = req.headers.get("x-admin-key");

  if (!providedKey || providedKey !== adminKey) {
    throw new AdminUnauthorizedError("unauthorized", 401);
  }
}

export function handleAdminError(error: unknown): NextResponse {
  if (error instanceof AdminUnauthorizedError) {
    return error.response;
  }
  console.error("[ADMIN ERROR]", error);
  return NextResponse.json(
    { ok: false, error: "Internal error" },
    { status: 500 }
  );
}
