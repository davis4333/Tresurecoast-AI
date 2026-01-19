import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrgContext, getTestUserId } from "@/lib/auth/getOrgContext";
import { setSelectedOrgPublicId } from "@/lib/auth/orgSelection";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UUID_PATTERN = /^[a-f0-9-]{36}$/i;
const MAX_PUBLIC_ID_LENGTH = 64;

export async function POST(req: Request) {
  const ctx = await getOrgContext({ testUserId: getTestUserId(req), request: req });

  if (!ctx.ok) {
    return NextResponse.json(
      { ok: false, error: ctx.error, message: ctx.message },
      { status: ctx.status }
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

  const { orgPublicId } = body as { orgPublicId?: unknown };

  if (typeof orgPublicId !== "string" || !orgPublicId.trim()) {
    return NextResponse.json(
      { ok: false, error: "invalid_org_public_id", message: "orgPublicId is required" },
      { status: 400 }
    );
  }

  const trimmedPublicId = orgPublicId.trim();

  if (trimmedPublicId.length > MAX_PUBLIC_ID_LENGTH) {
    return NextResponse.json(
      { ok: false, error: "invalid_org_public_id", message: "orgPublicId too long" },
      { status: 400 }
    );
  }

  if (!UUID_PATTERN.test(trimmedPublicId)) {
    return NextResponse.json(
      { ok: false, error: "invalid_org_public_id", message: "orgPublicId must be a valid UUID" },
      { status: 400 }
    );
  }

  const org = await prisma.organization.findUnique({
    where: { publicId: trimmedPublicId },
    select: { id: true, publicId: true, name: true },
  });

  if (!org) {
    return NextResponse.json(
      { ok: false, error: "org_not_found", message: "Organization not found" },
      { status: 404 }
    );
  }

  const membership = await prisma.organizationMember.findUnique({
    where: {
      organizationId_clerkUserId: {
        organizationId: org.id,
        clerkUserId: ctx.userId,
      },
    },
  });

  if (!membership) {
    return NextResponse.json(
      { ok: false, error: "not_member", message: "You are not a member of this organization" },
      { status: 403 }
    );
  }

  setSelectedOrgPublicId(trimmedPublicId);

  return NextResponse.json({ ok: true });
}
