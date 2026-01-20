import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  getOrgContext,
  isAdmin,
  getTestUserId,
  OrgRole,
} from "@/lib/auth/getOrgContext";
import {
  OrganizationHoursBulkSchema,
  normalizeHoursResponse,
  sortHoursByDay,
} from "@/lib/validators/orgHours";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function canEditHours(role: OrgRole, allowClientEdits: boolean): boolean {
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
    const canEdit = canEditHours(ctx.role, allowClientEdits);

    const dbHours = await prisma.organizationHours.findMany({
      where: { organizationId: ctx.org.id },
      select: {
        dayOfWeek: true,
        isClosed: true,
        openTime: true,
        closeTime: true,
      },
    });

    const hours = normalizeHoursResponse(dbHours);

    return NextResponse.json({
      ok: true,
      hours,
      permissions: {
        canEdit,
        allowClientEdits,
        role: ctx.role,
      },
    });
  } catch (error) {
    console.error("[API] GET /api/org/settings/hours error:", error);
    return NextResponse.json(
      { ok: false, error: "internal_error", message: "Failed to fetch hours" },
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

    if (!canEditHours(ctx.role, org?.allowClientEdits ?? false)) {
      return NextResponse.json(
        {
          ok: false,
          error: "forbidden",
          message: "You do not have permission to update hours",
        },
        { status: 403 }
      );
    }

    const body = await req.json();
    
    if (!body.hours || !Array.isArray(body.hours)) {
      return NextResponse.json(
        {
          ok: false,
          error: "validation_error",
          message: "Request must include hours array",
        },
        { status: 400 }
      );
    }

    const parsed = OrganizationHoursBulkSchema.safeParse(body.hours);

    if (!parsed.success) {
      return NextResponse.json(
        {
          ok: false,
          error: "validation_error",
          message: "Invalid hours data",
          details: parsed.error.issues,
        },
        { status: 400 }
      );
    }

    const sortedHours = sortHoursByDay(parsed.data);

    await prisma.$transaction(async (tx) => {
      await tx.organizationHours.deleteMany({
        where: { organizationId: ctx.org.id },
      });

      await tx.organizationHours.createMany({
        data: sortedHours.map((h) => ({
          organizationId: ctx.org.id,
          dayOfWeek: h.dayOfWeek,
          isClosed: h.isClosed,
          openTime: h.openTime,
          closeTime: h.closeTime,
        })),
      });
    });

    const dbHours = await prisma.organizationHours.findMany({
      where: { organizationId: ctx.org.id },
      select: {
        dayOfWeek: true,
        isClosed: true,
        openTime: true,
        closeTime: true,
      },
    });

    const hours = normalizeHoursResponse(dbHours);

    return NextResponse.json({ ok: true, hours });
  } catch (error) {
    console.error("[API] PUT /api/org/settings/hours error:", error);
    return NextResponse.json(
      { ok: false, error: "internal_error", message: "Failed to update hours" },
      { status: 500 }
    );
  }
}
