import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { checkRateLimit } from "@/lib/public/rateLimit";
import { sendBookingConfirmation } from "@/lib/notifications/email";

export const dynamic = "force-dynamic";

const createBookingSchema = z.object({
  botPublicKey: z.string().uuid("Invalid bot key"),
  conversationPublicId: z.string().uuid("Invalid conversation ID").optional(),
  serviceId: z.number().optional(),
  scheduledAt: z.string().datetime(),
  customerName: z.string().min(1).max(100),
  customerEmail: z.string().email().max(254).optional(),
  customerPhone: z.string().max(20).optional(),
  notes: z.string().max(500).optional(),
});

export async function POST(request: NextRequest) {
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

  const {
    botPublicKey,
    conversationPublicId,
    serviceId,
    scheduledAt,
    customerName,
    customerEmail,
    customerPhone,
    notes,
  } = parseResult.data;

  // Rate limit
  const rateLimitResult = await checkRateLimit(request, "leads", botPublicKey);
  if (!rateLimitResult.allowed) {
    return NextResponse.json(
      { ok: false, error: "rate_limited", message: rateLimitResult.error },
      { status: 429 }
    );
  }

  // Get bot and organization
  const bot = await prisma.bot.findUnique({
    where: { publicKey: botPublicKey },
    select: {
      id: true,
      organizationId: true,
      status: true,
    },
  });

  if (!bot || bot.status !== "ACTIVE") {
    return NextResponse.json(
      { ok: false, error: "bot_not_found", message: "Bot not found or inactive" },
      { status: 404 }
    );
  }

  const scheduledDate = new Date(scheduledAt);

  // Validate service belongs to org if specified
  let endAt: Date | undefined;
  if (serviceId) {
    const service = await prisma.organizationService.findFirst({
      where: { id: serviceId, organizationId: bot.organizationId },
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

  // Check for time conflicts
  const conflictingBooking = await prisma.booking.findFirst({
    where: {
      organizationId: bot.organizationId,
      status: { in: ["PENDING", "CONFIRMED"] },
      OR: [
        {
          scheduledAt: { lte: scheduledDate },
          endAt: { gt: scheduledDate },
        },
        ...(endAt
          ? [
              {
                scheduledAt: { lt: endAt },
                endAt: { gte: endAt },
              },
              {
                scheduledAt: { gte: scheduledDate },
                endAt: { lte: endAt },
              },
            ]
          : []),
      ],
    },
  });

  if (conflictingBooking) {
    return NextResponse.json(
      { ok: false, error: "time_conflict", message: "This time slot is no longer available" },
      { status: 409 }
    );
  }

  // Get conversation if provided
  let conversationId: number | undefined;
  let leadId: number | undefined;

  if (conversationPublicId) {
    const conversation = await prisma.conversation.findFirst({
      where: {
        publicId: conversationPublicId,
        botId: bot.id,
      },
      select: { id: true },
    });

    if (conversation) {
      conversationId = conversation.id;

      // Check if there's a lead associated with this conversation
      const lead = await prisma.lead.findFirst({
        where: { conversationId: conversation.id },
        select: { id: true },
      });

      if (lead) {
        leadId = lead.id;
      }
    }
  }

  // Create the booking
  const booking = await prisma.booking.create({
    data: {
      organizationId: bot.organizationId,
      serviceId: serviceId ?? null,
      leadId,
      conversationId,
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
      service: {
        select: {
          name: true,
          durationMinutes: true,
        },
      },
    },
  });

  // Track booking event
  const botWorkspace = await prisma.bot.findUnique({ where: { id: bot.id }, select: { workspaceId: true } });
  await prisma.dataEvent.create({
    data: {
      organizationId: bot.organizationId,
      workspaceId: botWorkspace!.workspaceId,
      botId: bot.id,
      conversationId,
      type: "BOOKING_CREATED",
      payload: {
        bookingPublicId: booking.publicId,
        serviceId,
        scheduledAt,
      },
    },
  });

  // Send booking confirmation email if customer has email
  if (customerEmail) {
    const businessProfile = await prisma.businessProfile.findUnique({
      where: { organizationId: bot.organizationId },
      select: {
        businessName: true,
        phone: true,
        address: true,
      },
    });

    const org = await prisma.organization.findUnique({
      where: { id: bot.organizationId },
      select: { name: true },
    });

    // Send confirmation email (fire and forget - don't block response)
    sendBookingConfirmation({
      booking: {
        customerName,
        customerEmail,
        serviceName: booking.service?.name ?? null,
        scheduledAt: scheduledDate,
      },
      business: {
        name: businessProfile?.businessName || org?.name || "Our Business",
        phone: businessProfile?.phone,
        address: businessProfile?.address,
      },
      appUrl: process.env.NEXT_PUBLIC_APP_URL || "https://treasurecoast.ai",
    }).catch((err) => {
      console.error("[BOOKING] Failed to send confirmation email:", err);
    });
  }

  return NextResponse.json({
    ok: true,
    booking: {
      bookingPublicId: booking.publicId,
      status: booking.status,
      scheduledAt: booking.scheduledAt.toISOString(),
      endAt: booking.endAt?.toISOString() ?? null,
      customerName: booking.customerName,
      serviceName: booking.service?.name ?? null,
      durationMinutes: booking.service?.durationMinutes ?? null,
    },
    message: "Booking created successfully. You will receive a confirmation.",
  });
}
