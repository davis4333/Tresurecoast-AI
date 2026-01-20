import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  getOrgContext,
  isAdmin,
  getTestUserId,
  OrgRole,
} from "@/lib/auth/getOrgContext";
import {
  BusinessSettingsUpdateSchema,
  sanitizeBusinessSettings,
} from "@/lib/validators/businessSettings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function canEditBusinessSettings(role: OrgRole, allowClientEdits: boolean): boolean {
  return isAdmin(role) || (role === "CLIENT" && allowClientEdits);
}

export async function GET(req: NextRequest) {
  try {
    const ctx = await getOrgContext({ testUserId: getTestUserId(req) });

    if (!ctx.ok) {
      return NextResponse.json(
        { ok: false, error: ctx.error, message: ctx.message },
        { status: ctx.status }
      );
    }

    const org = await prisma.organization.findUnique({
      where: { id: ctx.org.id },
      select: { allowClientEdits: true },
    });

    const allowClientEdits = org?.allowClientEdits ?? false;
    const canEdit = canEditBusinessSettings(ctx.role, allowClientEdits);

    const profile = await prisma.businessProfile.findUnique({
      where: { organizationId: ctx.org.id },
      select: {
        id: true,
        businessName: true,
        category: true,
        phone: true,
        email: true,
        address: true,
        serviceArea: true,
        websiteUrl: true,
        bookingUrl: true,
        tone: true,
        primaryGoal: true,
        cancellationPolicy: true,
        depositPolicy: true,
        refundPolicy: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      ok: true,
      profile,
      permissions: {
        canEdit,
        allowClientEdits,
        role: ctx.role,
      },
    });
  } catch (error) {
    console.error("[API] GET /api/org/settings/business error:", error);
    return NextResponse.json(
      { ok: false, error: "internal_error", message: "Failed to fetch business settings" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const ctx = await getOrgContext({ testUserId: getTestUserId(req) });

    if (!ctx.ok) {
      return NextResponse.json(
        { ok: false, error: ctx.error, message: ctx.message },
        { status: ctx.status }
      );
    }

    const org = await prisma.organization.findUnique({
      where: { id: ctx.org.id },
      select: { allowClientEdits: true },
    });

    if (!canEditBusinessSettings(ctx.role, org?.allowClientEdits ?? false)) {
      return NextResponse.json(
        {
          ok: false,
          error: "forbidden",
          message: "You do not have permission to update business settings",
        },
        { status: 403 }
      );
    }

    const body = await req.json();
    const parsed = BusinessSettingsUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          ok: false,
          error: "validation_error",
          message: "Invalid business settings data",
          details: parsed.error.issues,
        },
        { status: 400 }
      );
    }

    const sanitized = sanitizeBusinessSettings(parsed.data);

    const existing = await prisma.businessProfile.findUnique({
      where: { organizationId: ctx.org.id },
    });

    let profile;

    if (existing) {
      profile = await prisma.businessProfile.update({
        where: { organizationId: ctx.org.id },
        data: sanitized,
        select: {
          id: true,
          businessName: true,
          category: true,
          phone: true,
          email: true,
          address: true,
          serviceArea: true,
          websiteUrl: true,
          bookingUrl: true,
          tone: true,
          primaryGoal: true,
          cancellationPolicy: true,
          depositPolicy: true,
          refundPolicy: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    } else {
      const createData = {
        organizationId: ctx.org.id,
        businessName: sanitized.businessName || ctx.org.name,
        category: sanitized.category || "general",
        tone: sanitized.tone || "professional",
        primaryGoal: sanitized.primaryGoal || "leads",
        phone: sanitized.phone,
        email: sanitized.email,
        address: sanitized.address,
        serviceArea: sanitized.serviceArea,
        websiteUrl: sanitized.websiteUrl,
        bookingUrl: sanitized.bookingUrl,
        cancellationPolicy: sanitized.cancellationPolicy,
        depositPolicy: sanitized.depositPolicy,
        refundPolicy: sanitized.refundPolicy,
      };

      profile = await prisma.businessProfile.create({
        data: createData,
        select: {
          id: true,
          businessName: true,
          category: true,
          phone: true,
          email: true,
          address: true,
          serviceArea: true,
          websiteUrl: true,
          bookingUrl: true,
          tone: true,
          primaryGoal: true,
          cancellationPolicy: true,
          depositPolicy: true,
          refundPolicy: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    }

    return NextResponse.json({ ok: true, profile });
  } catch (error) {
    console.error("[API] PUT /api/org/settings/business error:", error);
    return NextResponse.json(
      { ok: false, error: "internal_error", message: "Failed to update business settings" },
      { status: 500 }
    );
  }
}
