import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrgContext, getTestUserId, isAdmin } from "@/lib/auth/getOrgContext";
import { InviteCreateSchema } from "@/lib/validators/membership";
import { generateInviteToken, getInviteExpiry } from "@/lib/utils/inviteToken";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
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

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "invalid_body", message: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const parsed = InviteCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "validation_error", message: parsed.error.message },
      { status: 400 }
    );
  }

  const { role, expiresInDays } = parsed.data;

  const token = generateInviteToken();
  const expiresAt = getInviteExpiry(expiresInDays);

  const invite = await prisma.organizationInvite.create({
    data: {
      organizationId: ctx.org.id,
      token,
      role,
      createdByClerkUserId: ctx.userId,
      expiresAt,
    },
  });

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const inviteLink = `${baseUrl}/invite/${token}`;

  return NextResponse.json({
    ok: true,
    invite: {
      id: invite.id,
      token: invite.token,
      role: invite.role,
      expiresAt: invite.expiresAt,
      inviteLink,
    },
  });
}
