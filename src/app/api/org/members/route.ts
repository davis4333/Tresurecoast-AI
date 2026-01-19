import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrgContext, getTestUserId, isAdmin } from "@/lib/auth/getOrgContext";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const ctx = await getOrgContext({ request: req, testUserId: getTestUserId(req) });

  if (!ctx.ok) {
    return NextResponse.json(
      { ok: false, error: ctx.error, message: ctx.message },
      { status: ctx.status }
    );
  }

  if (!isAdmin(ctx.role)) {
    return NextResponse.json(
      { ok: false, error: "forbidden", message: "Admin access required" },
      { status: 403 }
    );
  }

  const members = await prisma.organizationMember.findMany({
    where: { organizationId: ctx.org.id },
    select: {
      id: true,
      clerkUserId: true,
      role: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({ ok: true, members });
}
