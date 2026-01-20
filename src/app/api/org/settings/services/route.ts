import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  getOrgContext,
  isAdmin,
  getTestUserId,
  OrgRole,
} from "@/lib/auth/getOrgContext";
import {
  OrganizationServiceCreateSchema,
  OrganizationServiceUpdateSchema,
  OrganizationServiceDeleteSchema,
  serviceNameKey,
} from "@/lib/validators/orgServices";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function canEditServices(role: OrgRole, allowClientEdits: boolean): boolean {
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

    const services = await prisma.organizationService.findMany({
      where: { organizationId: ctx.org.id },
      orderBy: [{ displayOrder: "asc" }, { id: "asc" }],
      select: {
        id: true,
        name: true,
        priceCents: true,
        bookingUrl: true,
        paymentUrl: true,
        displayOrder: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ ok: true, services });
  } catch (error) {
    console.error("[API] GET /api/org/settings/services error:", error);
    return NextResponse.json(
      { ok: false, error: "internal_error", message: "Failed to fetch services" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
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

    if (!canEditServices(ctx.role, org?.allowClientEdits ?? false)) {
      return NextResponse.json(
        {
          ok: false,
          error: "forbidden",
          message: "You do not have permission to create services",
        },
        { status: 403 }
      );
    }

    const body = await req.json();
    const parsed = OrganizationServiceCreateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          ok: false,
          error: "validation_error",
          message: "Invalid service data",
          details: parsed.error.issues,
        },
        { status: 400 }
      );
    }

    const { name, priceCents, bookingUrl, paymentUrl, displayOrder, isActive } =
      parsed.data;

    const existingService = await prisma.organizationService.findFirst({
      where: {
        organizationId: ctx.org.id,
        name: {
          equals: serviceNameKey(name),
          mode: "insensitive",
        },
      },
    });

    if (existingService) {
      return NextResponse.json(
        {
          ok: false,
          error: "duplicate_service",
          message: `A service named "${name}" already exists`,
        },
        { status: 409 }
      );
    }

    const service = await prisma.organizationService.create({
      data: {
        organizationId: ctx.org.id,
        name,
        priceCents,
        bookingUrl,
        paymentUrl,
        displayOrder,
        isActive,
      },
      select: {
        id: true,
        name: true,
        priceCents: true,
        bookingUrl: true,
        paymentUrl: true,
        displayOrder: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ ok: true, service }, { status: 201 });
  } catch (error) {
    console.error("[API] POST /api/org/settings/services error:", error);
    return NextResponse.json(
      { ok: false, error: "internal_error", message: "Failed to create service" },
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

    if (!canEditServices(ctx.role, org?.allowClientEdits ?? false)) {
      return NextResponse.json(
        {
          ok: false,
          error: "forbidden",
          message: "You do not have permission to update services",
        },
        { status: 403 }
      );
    }

    const body = await req.json();
    const parsed = OrganizationServiceUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          ok: false,
          error: "validation_error",
          message: "Invalid service data",
          details: parsed.error.issues,
        },
        { status: 400 }
      );
    }

    const { id, name, ...rest } = parsed.data;

    const existing = await prisma.organizationService.findFirst({
      where: { id, organizationId: ctx.org.id },
    });

    if (!existing) {
      return NextResponse.json(
        { ok: false, error: "not_found", message: "Service not found" },
        { status: 404 }
      );
    }

    if (name && serviceNameKey(name) !== serviceNameKey(existing.name)) {
      const duplicate = await prisma.organizationService.findFirst({
        where: {
          organizationId: ctx.org.id,
          name: { equals: serviceNameKey(name), mode: "insensitive" },
          id: { not: id },
        },
      });

      if (duplicate) {
        return NextResponse.json(
          {
            ok: false,
            error: "duplicate_service",
            message: `A service named "${name}" already exists`,
          },
          { status: 409 }
        );
      }
    }

    const updateData: Record<string, unknown> = { ...rest };
    if (name !== undefined) {
      updateData.name = name;
    }

    const service = await prisma.organizationService.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        priceCents: true,
        bookingUrl: true,
        paymentUrl: true,
        displayOrder: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ ok: true, service });
  } catch (error) {
    console.error("[API] PUT /api/org/settings/services error:", error);
    return NextResponse.json(
      { ok: false, error: "internal_error", message: "Failed to update service" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
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

    if (!canEditServices(ctx.role, org?.allowClientEdits ?? false)) {
      return NextResponse.json(
        {
          ok: false,
          error: "forbidden",
          message: "You do not have permission to delete services",
        },
        { status: 403 }
      );
    }

    const body = await req.json();
    const parsed = OrganizationServiceDeleteSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          ok: false,
          error: "validation_error",
          message: "Invalid request",
          details: parsed.error.issues,
        },
        { status: 400 }
      );
    }

    const { id } = parsed.data;

    const result = await prisma.organizationService.deleteMany({
      where: { id, organizationId: ctx.org.id },
    });

    if (result.count === 0) {
      return NextResponse.json(
        { ok: false, error: "not_found", message: "Service not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ ok: true, deleted: true });
  } catch (error) {
    console.error("[API] DELETE /api/org/settings/services error:", error);
    return NextResponse.json(
      { ok: false, error: "internal_error", message: "Failed to delete service" },
      { status: 500 }
    );
  }
}
