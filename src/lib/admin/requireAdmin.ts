import { NextResponse } from "next/server";

export function requireAdmin(req: Request): void {
  const adminKey = process.env.ADMIN_API_KEY;
  if (!adminKey) {
    throw NextResponse.json({ ok: false, error: "server_misconfigured" }, { status: 500 });
  }

  const provided = req.headers.get("x-admin-key");
  if (!provided || provided !== adminKey) {
    throw NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
}
