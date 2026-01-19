import { NextResponse } from "next/server";
import { getOrgContext, getTestUserId, listUserOrgs } from "@/lib/auth/getOrgContext";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const ctx = await getOrgContext({ testUserId: getTestUserId(req), request: req });

  if (!ctx.ok) {
    return NextResponse.json(
      { ok: false, error: ctx.error, message: ctx.message },
      { status: ctx.status }
    );
  }

  const orgs = await listUserOrgs(ctx.userId);

  return NextResponse.json({
    ok: true,
    currentOrg: {
      publicId: ctx.org.publicId,
      id: ctx.org.id,
      name: ctx.org.name,
      role: ctx.role,
    },
    orgs,
  });
}
