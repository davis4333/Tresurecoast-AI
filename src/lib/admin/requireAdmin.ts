import { NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { SessionData, sessionOptions } from "@/lib/session";

export async function requireAdmin(req: Request): Promise<void> {
  const providedKey = req.headers.get("x-admin-key");
  const adminKey = process.env.ADMIN_API_KEY;

  if (providedKey && adminKey && providedKey === adminKey) {
    return;
  }

  const cookieStore = await cookies();
  const session = await getIronSession<SessionData>(cookieStore, sessionOptions);

  if (session.isAuthenticated) {
    return;
  }

  if (!adminKey) {
    throw NextResponse.json({ ok: false, error: "server_misconfigured" }, { status: 500 });
  }

  throw NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
}
