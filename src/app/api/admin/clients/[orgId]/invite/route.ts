import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireClerkAdmin, handleClerkError } from "@/lib/admin/requireClerkAdmin";
import { CreateInviteSchema } from "@/lib/admin/clientSchemas";
import crypto from "crypto";

export const runtime = "nodejs";

export async function POST(
  req: NextRequest,
  { params }: { params: { orgId: string } }
) {
  try {
    const adminUserId = await requireClerkAdmin();

    const orgIdNum = parseInt(params.orgId, 10);
    if (isNaN(orgIdNum)) {
      return NextResponse.json(
        { ok: false, error: "invalid_org_id" },
        { status: 400 }
      );
    }

    const org = await prisma.organization.findUnique({
      where: { id: orgIdNum },
      select: { id: true, name: true },
    });

    if (!org) {
      return NextResponse.json(
        { ok: false, error: "org_not_found" },
        { status: 404 }
      );
    }

    const body = await req.json();
    const parsed = CreateInviteSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: "validation_error", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { role } = parsed.data;

    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await prisma.organizationInvite.create({
      data: {
        organizationId: org.id,
        token,
        role,
        createdByClerkUserId: adminUserId,
        expiresAt,
      },
    });

    const appBaseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://127.0.0.1:3000";
    const inviteLink = `${appBaseUrl}/api/org/members/accept?token=${token}`;

    return NextResponse.json({
      ok: true,
      inviteLink,
      expiresAt: expiresAt.toISOString(),
    });
  } catch (error) {
    return handleClerkError(error);
  }
}
