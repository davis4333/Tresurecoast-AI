import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrgContext, isAdmin } from "@/lib/auth/getOrgContext";

const MAX_DAYS = 365;
const DEFAULT_DAYS = 30;

type DateRange = { start: Date; end: Date };

function parseDateRange(searchParams: URLSearchParams): DateRange {
  const daysParam = searchParams.get("days");
  const days = daysParam ? Math.min(Math.max(parseInt(daysParam, 10) || DEFAULT_DAYS, 1), MAX_DAYS) : DEFAULT_DAYS;

  const end = new Date();
  end.setHours(23, 59, 59, 999);

  const start = new Date(end);
  start.setDate(start.getDate() - days);
  start.setHours(0, 0, 0, 0);

  return { start, end };
}

function formatDateForBucket(date: Date): string {
  return date.toISOString().split("T")[0] ?? ""
}

export async function GET(request: NextRequest) {
  const ctx = await getOrgContext({ request });

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

  if (ctx.role === "CLIENT" && !org?.allowClientEdits) {
    return NextResponse.json(
      { ok: false, error: "forbidden", message: "Analytics access not permitted" },
      { status: 403 }
    );
  }

  const { searchParams } = new URL(request.url);
  const range = parseDateRange(searchParams);

  const funnelTypes = [
    "BOOKING_SERVICE_SELECTED",
    "BOOKING_LEAD_CREATED",
    "BOOKING_LINK_SHOWN",
    "BOOKING_LINK_CLICKED",
  ] as const;

  const [funnelCounts, leadsByDay, clickEvents, topTopics, clicksByServiceRaw] = await Promise.all([
    prisma.dataEvent.groupBy({
      by: ["type"],
      where: {
        organizationId: ctx.org.id,
        type: { in: [...funnelTypes] },
        createdAt: { gte: range.start, lte: range.end },
      },
      _count: { conversationId: true },
    }),

    prisma.lead.findMany({
      where: {
        organizationId: ctx.org.id,
        createdAt: { gte: range.start, lte: range.end },
      },
      select: { createdAt: true },
    }),

    prisma.dataEvent.findMany({
      where: {
        organizationId: ctx.org.id,
        type: "BOOKING_LINK_CLICKED",
        createdAt: { gte: range.start, lte: range.end },
      },
      select: { createdAt: true, payload: true },
    }),

    prisma.dataEvent.groupBy({
      by: ["topic"],
      where: {
        organizationId: ctx.org.id,
        topic: { not: null },
        createdAt: { gte: range.start, lte: range.end },
      },
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: 10,
    }),

    prisma.$queryRaw<Array<{ serviceId: number; serviceName: string; clicks: bigint }>>`
      SELECT 
        os.id as "serviceId",
        os.name as "serviceName",
        COUNT(de.id) as "clicks"
      FROM "DataEvent" de
      LEFT JOIN "OrganizationService" os ON (de.payload->>'serviceId')::int = os.id
      WHERE de."organizationId" = ${ctx.org.id}
        AND de.type = 'BOOKING_LINK_CLICKED'
        AND de."createdAt" >= ${range.start}
        AND de."createdAt" <= ${range.end}
        AND os.id IS NOT NULL
      GROUP BY os.id, os.name
      ORDER BY "clicks" DESC
    `,
  ]);

  const funnel = {
    serviceSelected: funnelCounts.find((c) => c.type === "BOOKING_SERVICE_SELECTED")?._count?.conversationId || 0,
    leadCreated: funnelCounts.find((c) => c.type === "BOOKING_LEAD_CREATED")?._count?.conversationId || 0,
    linkShown: funnelCounts.find((c) => c.type === "BOOKING_LINK_SHOWN")?._count?.conversationId || 0,
    linkClicked: funnelCounts.find((c) => c.type === "BOOKING_LINK_CLICKED")?._count?.conversationId || 0,
  };

  const leadsByDayMap: Record<string, number> = {};
  for (const lead of leadsByDay) {
    const date = formatDateForBucket(lead.createdAt);
    leadsByDayMap[date] = (leadsByDayMap[date] || 0) + 1;
  }
  const leadsByDayArray = Object.entries(leadsByDayMap)
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));

  const clicksByDayMap: Record<string, number> = {};
  for (const event of clickEvents) {
    const date = formatDateForBucket(event.createdAt);
    clicksByDayMap[date] = (clicksByDayMap[date] || 0) + 1;
  }
  const clicksByDayArray = Object.entries(clicksByDayMap)
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));

  const clicksByService = clicksByServiceRaw.map((row) => ({
    serviceId: row.serviceId,
    serviceName: row.serviceName,
    clicks: Number(row.clicks),
  }));

  const topTopicsArray = topTopics
    .filter((t) => t.topic !== null)
    .map((t) => ({
      topic: t.topic as string,
      count: t._count.id,
    }));

  return NextResponse.json({
    ok: true,
    range: {
      start: range.start.toISOString(),
      end: range.end.toISOString(),
    },
    funnel,
    leadsByDay: leadsByDayArray,
    clicksByDay: clicksByDayArray,
    clicksByService,
    topTopics: topTopicsArray,
  });
}
