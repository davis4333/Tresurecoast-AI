import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrgContext } from "@/lib/auth/getOrgContext";
import { z } from "zod";

export const dynamic = "force-dynamic";

const querySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  serviceId: z.coerce.number().optional(),
});

// Generate time slots for a day based on business hours
function generateTimeSlots(
  openTime: string,
  closeTime: string,
  slotDuration: number
): string[] {
  const slots: string[] = [];

  const openParts = openTime.split(":").map(Number);
  const closeParts = closeTime.split(":").map(Number);

  const openHour = openParts[0] ?? 0;
  const openMin = openParts[1] ?? 0;
  const closeHour = closeParts[0] ?? 0;
  const closeMin = closeParts[1] ?? 0;

  let currentMinutes = openHour * 60 + openMin;
  const closeMinutes = closeHour * 60 + closeMin;

  while (currentMinutes + slotDuration <= closeMinutes) {
    const hours = Math.floor(currentMinutes / 60);
    const mins = currentMinutes % 60;
    slots.push(`${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`);
    currentMinutes += slotDuration;
  }

  return slots;
}

export async function GET(request: NextRequest) {
  const ctx = await getOrgContext({ request });

  if (!ctx.ok) {
    return NextResponse.json(
      { ok: false, error: ctx.error, message: ctx.message },
      { status: ctx.status }
    );
  }

  const { searchParams } = new URL(request.url);
  const parseResult = querySchema.safeParse({
    date: searchParams.get("date") ?? undefined,
    serviceId: searchParams.get("serviceId") ?? undefined,
  });

  if (!parseResult.success) {
    return NextResponse.json(
      { ok: false, error: "invalid_params", message: "Date parameter required (YYYY-MM-DD)" },
      { status: 400 }
    );
  }

  const { date, serviceId } = parseResult.data;

  // Get service duration
  let slotDuration = 30; // Default 30 minutes
  if (serviceId) {
    const service = await prisma.organizationService.findFirst({
      where: { id: serviceId, organizationId: ctx.org.id },
      select: { durationMinutes: true },
    });
    if (service) {
      slotDuration = service.durationMinutes;
    }
  }

  // Get day of week (0 = Sunday)
  const requestedDate = new Date(date + "T00:00:00");
  const dayOfWeek = requestedDate.getDay();

  // Get business hours for this day
  const hours = await prisma.organizationHours.findFirst({
    where: {
      organizationId: ctx.org.id,
      dayOfWeek,
    },
  });

  if (!hours || hours.isClosed || !hours.openTime || !hours.closeTime) {
    return NextResponse.json({
      ok: true,
      date,
      dayOfWeek,
      isClosed: true,
      slots: [],
    });
  }

  // Generate all possible time slots
  const allSlots = generateTimeSlots(hours.openTime, hours.closeTime, slotDuration);

  // Get existing bookings for this day
  const startOfDay = new Date(date + "T00:00:00");
  const endOfDay = new Date(date + "T23:59:59");

  const existingBookings = await prisma.booking.findMany({
    where: {
      organizationId: ctx.org.id,
      scheduledAt: {
        gte: startOfDay,
        lte: endOfDay,
      },
      status: { in: ["PENDING", "CONFIRMED"] },
    },
    select: {
      scheduledAt: true,
      endAt: true,
    },
  });

  // Filter out booked slots
  const availableSlots = allSlots.filter((slot) => {
    const slotStart = new Date(`${date}T${slot}:00`);
    const slotEnd = new Date(slotStart.getTime() + slotDuration * 60 * 1000);

    // Check if this slot conflicts with any existing booking
    for (const booking of existingBookings) {
      const bookingStart = booking.scheduledAt;
      const bookingEnd = booking.endAt || new Date(bookingStart.getTime() + 30 * 60 * 1000);

      // Check for overlap
      if (slotStart < bookingEnd && slotEnd > bookingStart) {
        return false;
      }
    }

    // Also filter out past times for today
    const now = new Date();
    if (slotStart < now) {
      return false;
    }

    return true;
  });

  return NextResponse.json({
    ok: true,
    date,
    dayOfWeek,
    isClosed: false,
    openTime: hours.openTime,
    closeTime: hours.closeTime,
    slotDuration,
    slots: availableSlots.map((time) => ({
      time,
      datetime: `${date}T${time}:00`,
    })),
    bookedCount: existingBookings.length,
  });
}
