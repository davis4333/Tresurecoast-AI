import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTestUserId } from "@/lib/auth/getOrgContext";
import { InviteAcceptSchema } from "@/lib/validators/membership";
import { isValidInviteTokenFormat, isInviteExpired } from "@/lib/utils/inviteToken";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const IS_PRODUCTION = process.env.NODE_ENV === "production";
const DEV_BYPASS_AUTH = process.env.DEV_BYPASS_AUTH === "true";
const DEV_BOOTSTRAP_CLERK_USER_ID = process.env.DEV_BOOTSTRAP_CLERK_USER_ID;

async function resolveUserId(req: Request): Promise<string | null> {
  const testUserId = getTestUserId(req);

  if (DEV_BYPASS_AUTH && !IS_PRODUCTION) {
    return testUserId || DEV_BOOTSTRAP_CLERK_USER_ID || null;
  }

  const { auth } = await import("@clerk/nextjs/server");
  const clerkAuth = await auth();
  return clerkAuth.userId;
}

export async function POST(req: Request) {
  const userId = await resolveUserId(req);

  if (!userId) {
    return NextResponse.json(
      { ok: false, error: "unauthorized", message: "Authentication required" },
      { status: 401 }
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

  const parsed = InviteAcceptSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "validation_error", message: parsed.error.message },
      { status: 400 }
    );
  }

  const { token } = parsed.data;

  if (!isValidInviteTokenFormat(token)) {
    return NextResponse.json(
      { ok: false, error: "invalid_token", message: "Invalid invite token format" },
      { status: 400 }
    );
  }

  const invite = await prisma.organizationInvite.findUnique({
    where: { token },
    include: {
      organization: {
        select: { id: true, publicId: true, name: true },
      },
    },
  });

  if (!invite) {
    return NextResponse.json(
      { ok: false, error: "invite_not_found", message: "Invite not found" },
      { status: 404 }
    );
  }

  if (invite.usedAt) {
    return NextResponse.json(
      { ok: false, error: "invite_used", message: "Invite has already been used" },
      { status: 400 }
    );
  }

  if (isInviteExpired(invite.expiresAt)) {
    return NextResponse.json(
      { ok: false, error: "invite_expired", message: "Invite has expired" },
      { status: 400 }
    );
  }

  const existingMembership = await prisma.organizationMember.findUnique({
    where: {
      organizationId_clerkUserId: {
        organizationId: invite.organizationId,
        clerkUserId: userId,
      },
    },
  });

  if (existingMembership) {
    return NextResponse.json(
      { ok: false, error: "already_member", message: "You are already a member of this organization" },
      { status: 400 }
    );
  }

  const result = await prisma.$transaction(async (tx) => {
    const membership = await tx.organizationMember.create({
      data: {
        organizationId: invite.organizationId,
        clerkUserId: userId,
        role: invite.role,
      },
    });

    await tx.organizationInvite.update({
      where: { id: invite.id },
      data: {
        usedAt: new Date(),
        usedByClerkUserId: userId,
      },
    });

    return membership;
  });

  return NextResponse.json({
    ok: true,
    membership: {
      id: result.id,
      role: result.role,
      createdAt: result.createdAt,
    },
    organization: {
      id: invite.organization.id,
      publicId: invite.organization.publicId,
      name: invite.organization.name,
    },
  });
}
