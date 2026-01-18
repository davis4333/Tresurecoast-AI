import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";

export const runtime = "nodejs";

export async function POST() {
  try {
    const session = await getSession();
    session.destroy();

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[AUTH LOGOUT ERROR]", error);
    return NextResponse.json(
      { ok: false, error: "Internal error" },
      { status: 500 }
    );
  }
}
