import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";

export const runtime = "nodejs";

export async function GET() {
  try {
    const session = await getSession();

    return NextResponse.json({
      ok: true,
      isAuthenticated: session.isAuthenticated,
      authenticatedAt: session.authenticatedAt,
    });
  } catch (error) {
    console.error("[AUTH SESSION ERROR]", error);
    return NextResponse.json(
      { ok: false, error: "Internal error" },
      { status: 500 }
    );
  }
}
