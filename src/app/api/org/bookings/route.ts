import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrgContext } from "@/lib/auth/getOrgContext";
import { z } from "zod";

export const dynamic = "force-dynamic";

const listQuerySchema = z.object({
  days: z.coerce.number().min(1).max(365).optional(),
  status: z.enum(["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED", "NO_SHOW"]).optional(),
  serviceId: z.coerce.number().optional(),
  upcoming: z.enum(["true", "false"]).optional(),
});

const createBookingSchema = z.object({
  serviceId: z.number().optional(),
  scheduledAt: z.string().datetime(),
  customerName: z.string().min(1).max(100),
  customerEmail: z.string().email().max(254).optional(),
  customerPhone: z.string().max(20).optional(),
  notes: z.string().max(1000).optional(),
});

export async function GET(request: NextRequest) {
  const ctx = await getOrgContext({ request });

  if (!ctx.ok) {
    return NextResponse.json(
      { ok: false, error: ctx.error, message: ctx.message },
      { status: ctx.status }
    );
  }

  const { searchParams } = new URL(request.url);
  const parseResult = listQuerySchema.safeParse({
    days: searchParams.get("days") ?? undefined,
    status: searchParams.get("status") ?? undefined,
    serviceId: searchParams.get("serviceId") ?? undefined,
    upcoming: searchParams.get("upcoming") ?? undefined,
  });

  if (!parseResult.success) {
    return NextResponse.json(
      { ok: false, error: "invalid_params", message: parseResult.error.message },
      { status: 400 }
    );
  }

  const { days, status, serviceId, upcoming } = parseResult.data;

  const now = new Date();
  let dateFilter: { gte?: Date; lte?: Date } | undefined;

  if (upcoming === "true") {
    dateFilter = { gte: now };
  } else if (days) {
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - days);
    dateFilter = { gte: startDate };
  }

  const bookings = await prisma.booking.findMany({
    where: {
      organizationId: ctx.org.id,
      ...(dateFilter && { scheduledAt: dateFilter }),
      ...(status && { status }),
      ...(serviceId && { serviceId }),
    },
    orderBy: { scheduledAt: upcoming === "true" ? "asc" : "desc" },
    take: 100,
    select: {
      publicId: true,
      status: true,
      scheduledAt: true,
      endAt: true,
      customerName: true,
      customerEmail: true,
      customerPhone: true,
      notes: true,
      createdAt: true,
      service: {
        select: {
          id: true,
          name: true,
          durationMinutes: true,
          priceCents: true,
        },
      },
    },
  });

  // Get summary counts
  const [totalCount, pendingCount, confirmedCount, todayCount] = await Promise.all([
    prisma.booking.count({ where: { organizationId: ctx.org.id } }),
    prisma.booking.count({ where: { organizationId: ctx.org.id, status: "PENDING" } }),
    prisma.booking.count({ where: { organizationId: ctx.org.id, status: "CONFIRMED" } }),
    prisma.booking.count({
      where: {
        organizationId: ctx.org.id,
        scheduledAt: {
          gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
          lt: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1),
        },
        status: { in: ["PENDING", "CONFIRMED"] },
      },
    }),
  ]);

  return NextResponse.json({
    ok: true,
    bookings: bookings.map((b) => ({
      bookingPublicId: b.publicId,
      status: b.status,
      scheduledAt: b.scheduledAt.toISOString(),
      endAt: b.endAt?.toISOString() ?? null,
      customerName: b.customerName,
      customerEmail: b.customerEmail,
      customerPhone: b.customerPhone,
      notes: b.notes,
      serviceName: b.service?.name ?? null,
      serviceId: b.service?.id ?? null,
      durationMinutes: b.service?.durationMinutes ?? null,
      priceCents: b.service?.priceCents ?? null,
      createdAt: b.createdAt.toISOString(),
    })),
    summary: {
      total: totalCount,
      pending: pendingCount,
      confirmed: confirmedCount,
      today: todayCount,
    },
  });
}

export async function POST(request: NextRequest) {
  const ctx = await getOrgContext({ request });

  if (!ctx.ok) {
    return NextResponse.json(
      { ok: false, error: ctx.error, message: ctx.message },
      { status: ctx.status }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "invalid_body", message: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const parseResult = createBookingSchema.safeParse(body);
  if (!parseResult.success) {
    return NextResponse.json(
      { ok: false, error: "validation_error", message: parseResult.error.message },
      { status: 400 }
    );
  }

  const { serviceId, scheduledAt, customerName, customerEmail, customerPhone, notes } = parseResult.data;

  const scheduledDate = new Date(scheduledAt);

  // Calculate end time if service is specified
  let endAt: Date | undefined;
  if (serviceId) {
    const service = await prisma.organizationService.findFirst({
      where: { id: serviceId, organizationId: ctx.org.id },
      select: { durationMinutes: true },
    });

    if (!service) {
      return NextResponse.json(
        { ok: false, error: "service_not_found", message: "Service not found" },
        { status: 404 }
      );
    }

    endAt = new Date(scheduledDate.getTime() + service.durationMinutes * 60 * 1000);
  }

  // Check for conflicts
  const conflictingBooking = await prisma.booking.findFirst({
    where: {
      organizationId: ctx.org.id,
      status: { in: ["PENDING", "CONFIRMED"] },
      OR: [
        {
          scheduledAt: { lte: scheduledDate },
          endAt: { gt: scheduledDate },
        },
        {
          scheduledAt: { lt: endAt ?? scheduledDate },
          endAt: { gte: endAt ?? scheduledDate },
        },
        {
          scheduledAt: { gte: scheduledDate },
          endAt: { lte: endAt ?? scheduledDate },
        },
      ],
    },
  });

  if (conflictingBooking) {
    return NextResponse.json(
      { ok: false, error: "time_conflict", message: "This time slot is already booked" },
      { status: 409 }
    );
  }

  const booking = await prisma.booking.create({
    data: {
      organizationId: ctx.org.id,
      serviceId: serviceId ?? null,
      scheduledAt: scheduledDate,
      endAt,
      customerName,
      customerEmail,
      customerPhone,
      notes,
      status: "PENDING",
    },
    select: {
      publicId: true,
      status: true,
      scheduledAt: true,
      endAt: true,
      customerName: true,
      customerEmail: true,
      customerPhone: true,
      notes: true,
      createdAt: true,
      service: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  return NextResponse.json({
    ok: true,
    booking: {
      bookingPublicId: booking.publicId,
      status: booking.status,
      scheduledAt: booking.scheduledAt.toISOString(),
      endAt: booking.endAt?.toISOString() ?? null,
      customerName: booking.customerName,
      customerEmail: booking.customerEmail,
      customerPhone: booking.customerPhone,
      notes: booking.notes,
      serviceName: booking.service?.name ?? null,
      serviceId: booking.service?.id ?? null,
      createdAt: booking.createdAt.toISOString(),
    },
  });
}
