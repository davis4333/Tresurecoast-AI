import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrgContext } from "@/lib/auth/getOrgContext";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ActivityEvent = {
  id: string;
  type: string;
  description: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
};

export async function GET(request: NextRequest) {
  const ctx = await getOrgContext({ request });

  if (!ctx.ok) {
    return NextResponse.json(
      { ok: false, error: ctx.error, message: ctx.message },
      { status: ctx.status }
    );
  }

  const { searchParams } = new URL(request.url);
  const hoursParam = searchParams.get("hours");
  const hours = hoursParam ? Math.min(Math.max(parseInt(hoursParam, 10) || 24, 1), 168) : 24;

  const since = new Date();
  since.setHours(since.getHours() - hours);

  const [recentLeads, recentEvents, hotLeadCount] = await Promise.all([
    prisma.lead.findMany({
      where: {
        organizationId: ctx.org.id,
        createdAt: { gte: since },
      },
      select: {
        id: true,
        publicId: true,
        name: true,
        email: true,
        phone: true,
        temperature: true,
        score: true,
        createdAt: true,
        service: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),

    prisma.dataEvent.findMany({
      where: {
        organizationId: ctx.org.id,
        createdAt: { gte: since },
        type: {
          in: [
            "BOOKING_SERVICE_SELECTED",
            "BOOKING_LEAD_CREATED",
            "BOOKING_LINK_SHOWN",
            "BOOKING_LINK_CLICKED",
            "TOPIC_DETECTED",
            "LEAD_CAPTURE_TRIGGERED",
          ],
        },
      },
      select: {
        id: true,
        type: true,
        topic: true,
        payload: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),

    prisma.lead.count({
      where: {
        organizationId: ctx.org.id,
        temperature: "HOT",
        createdAt: { gte: since },
      },
    }),
  ]);

  const activities: ActivityEvent[] = [];

  for (const lead of recentLeads) {
    const tempLabel = lead.temperature === "HOT" ? "Hot" : lead.temperature === "WARM" ? "Warm" : "Cold";
    activities.push({
      id: `lead-${lead.id}`,
      type: "LEAD_CREATED",
      description: `New ${tempLabel} lead: ${lead.name || lead.email || "Anonymous"}${lead.service?.name ? ` - ${lead.service.name}` : ""}`,
      timestamp: lead.createdAt.toISOString(),
      metadata: {
        leadPublicId: lead.publicId,
        temperature: lead.temperature,
        score: lead.score,
        serviceName: lead.service?.name,
      },
    });
  }

  for (const event of recentEvents) {
    let description = "";
    const payload = event.payload as Record<string, unknown> | null;

    switch (event.type) {
      case "BOOKING_LINK_CLICKED":
        description = `Booking link clicked${payload?.serviceName ? ` for ${payload.serviceName}` : ""}`;
        break;
      case "BOOKING_SERVICE_SELECTED":
        description = `Service selected${payload?.serviceName ? `: ${payload.serviceName}` : ""}`;
        break;
      case "BOOKING_LINK_SHOWN":
        description = `Booking link shown to visitor`;
        break;
      case "TOPIC_DETECTED":
        description = `Question about ${event.topic?.toLowerCase() || "general topic"}`;
        break;
      case "LEAD_CAPTURE_TRIGGERED":
        description = "Lead capture form shown";
        break;
      default:
        description = event.type.replace(/_/g, " ").toLowerCase();
    }

    activities.push({
      id: `event-${event.id}`,
      type: event.type,
      description,
      timestamp: event.createdAt.toISOString(),
      metadata: payload ?? undefined,
    });
  }

  activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const funnelLast24h = await prisma.$queryRaw<Array<{ type: string; count: bigint }>>`
    SELECT type, COUNT(DISTINCT "conversationId") as count
    FROM "DataEvent"
    WHERE "organizationId" = ${ctx.org.id}
      AND type IN ('BOOKING_SERVICE_SELECTED', 'BOOKING_LEAD_CREATED', 'BOOKING_LINK_SHOWN', 'BOOKING_LINK_CLICKED')
      AND "createdAt" >= ${since}
      AND "conversationId" IS NOT NULL
    GROUP BY type
  `;

  const funnel = {
    serviceSelected: Number(funnelLast24h.find((c) => c.type === "BOOKING_SERVICE_SELECTED")?.count || 0),
    leadCreated: Number(funnelLast24h.find((c) => c.type === "BOOKING_LEAD_CREATED")?.count || 0),
    linkShown: Number(funnelLast24h.find((c) => c.type === "BOOKING_LINK_SHOWN")?.count || 0),
    linkClicked: Number(funnelLast24h.find((c) => c.type === "BOOKING_LINK_CLICKED")?.count || 0),
  };

  return NextResponse.json({
    ok: true,
    hours,
    since: since.toISOString(),
    hotLeadCount,
    totalLeads: recentLeads.length,
    funnel,
    activities: activities.slice(0, 30),
    recentHotLeads: recentLeads
      .filter((l) => l.temperature === "HOT")
      .slice(0, 5)
      .map((l) => ({
        publicId: l.publicId,
        name: l.name,
        email: l.email,
        phone: l.phone,
        score: l.score,
        serviceName: l.service?.name,
        createdAt: l.createdAt.toISOString(),
      })),
  });
}
