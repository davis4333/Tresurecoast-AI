import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrgContext } from "@/lib/auth/getOrgContext";
import { z } from "zod";

export const dynamic = "force-dynamic";

const updateBookingSchema = z.object({
  status: z.enum(["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED", "NO_SHOW"]).optional(),
  scheduledAt: z.string().datetime().optional(),
  customerName: z.string().min(1).max(100).optional(),
  customerEmail: z.string().email().max(254).optional().nullable(),
  customerPhone: z.string().max(20).optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
  staffNotes: z.string().max(1000).optional().nullable(),
  cancelReason: z.string().max(500).optional().nullable(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ bookingId: string }> }
) {
  const ctx = await getOrgContext({ request });

  if (!ctx.ok) {
    return NextResponse.json(
      { ok: false, error: ctx.error, message: ctx.message },
      { status: ctx.status }
    );
  }

  const { bookingId } = await params;

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(bookingId)) {
    return NextResponse.json(
      { ok: false, error: "invalid_booking_id", message: "Invalid booking ID format" },
      { status: 400 }
    );
  }

  const booking = await prisma.booking.findFirst({
    where: {
      publicId: bookingId,
      organizationId: ctx.org.id,
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
      staffNotes: true,
      cancelReason: true,
      reminderSentAt: true,
      createdAt: true,
      updatedAt: true,
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

  if (!booking) {
    return NextResponse.json(
      { ok: false, error: "booking_not_found", message: "Booking not found" },
      { status: 404 }
    );
  }

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
      staffNotes: booking.staffNotes,
      cancelReason: booking.cancelReason,
      reminderSentAt: booking.reminderSentAt?.toISOString() ?? null,
      serviceName: booking.service?.name ?? null,
      serviceId: booking.service?.id ?? null,
      durationMinutes: booking.service?.durationMinutes ?? null,
      priceCents: booking.service?.priceCents ?? null,
      createdAt: booking.createdAt.toISOString(),
      updatedAt: booking.updatedAt.toISOString(),
    },
  });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ bookingId: string }> }
) {
  const ctx = await getOrgContext({ request });

  if (!ctx.ok) {
    return NextResponse.json(
      { ok: false, error: ctx.error, message: ctx.message },
      { status: ctx.status }
    );
  }

  const { bookingId } = await params;

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(bookingId)) {
    return NextResponse.json(
      { ok: false, error: "invalid_booking_id", message: "Invalid booking ID format" },
      { status: 400 }
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

  const parseResult = updateBookingSchema.safeParse(body);
  if (!parseResult.success) {
    return NextResponse.json(
      { ok: false, error: "validation_error", message: parseResult.error.message },
      { status: 400 }
    );
  }

  const updates = parseResult.data;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json(
      { ok: false, error: "no_updates", message: "No updates provided" },
      { status: 400 }
    );
  }

  const existing = await prisma.booking.findFirst({
    where: {
      publicId: bookingId,
      organizationId: ctx.org.id,
    },
    select: { id: true, serviceId: true },
  });

  if (!existing) {
    return NextResponse.json(
      { ok: false, error: "booking_not_found", message: "Booking not found" },
      { status: 404 }
    );
  }

  // Calculate new endAt if scheduledAt is being updated
  let endAt: Date | undefined;
  if (updates.scheduledAt && existing.serviceId) {
    const service = await prisma.organizationService.findUnique({
      where: { id: existing.serviceId },
      select: { durationMinutes: true },
    });

    if (service) {
      endAt = new Date(new Date(updates.scheduledAt).getTime() + service.durationMinutes * 60 * 1000);
    }
  }

  const booking = await prisma.booking.update({
    where: { id: existing.id },
    data: {
      ...(updates.status !== undefined && { status: updates.status }),
      ...(updates.scheduledAt !== undefined && { scheduledAt: new Date(updates.scheduledAt) }),
      ...(endAt !== undefined && { endAt }),
      ...(updates.customerName !== undefined && { customerName: updates.customerName }),
      ...(updates.customerEmail !== undefined && { customerEmail: updates.customerEmail }),
      ...(updates.customerPhone !== undefined && { customerPhone: updates.customerPhone }),
      ...(updates.notes !== undefined && { notes: updates.notes }),
      ...(updates.staffNotes !== undefined && { staffNotes: updates.staffNotes }),
      ...(updates.cancelReason !== undefined && { cancelReason: updates.cancelReason }),
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
      staffNotes: true,
      cancelReason: true,
      updatedAt: true,
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
      staffNotes: booking.staffNotes,
      cancelReason: booking.cancelReason,
      serviceName: booking.service?.name ?? null,
      serviceId: booking.service?.id ?? null,
      updatedAt: booking.updatedAt.toISOString(),
    },
  });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ bookingId: string }> }
) {
  const ctx = await getOrgContext({ request });

  if (!ctx.ok) {
    return NextResponse.json(
      { ok: false, error: ctx.error, message: ctx.message },
      { status: ctx.status }
    );
  }

  const { bookingId } = await params;

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(bookingId)) {
    return NextResponse.json(
      { ok: false, error: "invalid_booking_id", message: "Invalid booking ID format" },
      { status: 400 }
    );
  }

  const existing = await prisma.booking.findFirst({
    where: {
      publicId: bookingId,
      organizationId: ctx.org.id,
    },
    select: { id: true },
  });

  if (!existing) {
    return NextResponse.json(
      { ok: false, error: "booking_not_found", message: "Booking not found" },
      { status: 404 }
    );
  }

  await prisma.booking.delete({
    where: { id: existing.id },
  });

  return NextResponse.json({ ok: true });
}
