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
    select: { allowClientEdits: true, averageOrderValue: true },
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

  const [funnelCounts, leadsByDayRaw, clicksByDayRaw, topTopics, clicksByServiceRaw, hotLeadsCount] = await Promise.all([
    prisma.$queryRaw<Array<{ type: string; unique_conversations: bigint }>>`
      SELECT type, COUNT(DISTINCT "conversationId") as unique_conversations
      FROM "DataEvent"
      WHERE "organizationId" = ${ctx.org.id}
        AND type IN ('BOOKING_SERVICE_SELECTED', 'BOOKING_LEAD_CREATED', 'BOOKING_LINK_SHOWN', 'BOOKING_LINK_CLICKED')
        AND "createdAt" >= ${range.start}
        AND "createdAt" <= ${range.end}
        AND "conversationId" IS NOT NULL
      GROUP BY type
    `,

    prisma.$queryRaw<Array<{ date: Date | string; unique_conversations: bigint }>>`
      SELECT DATE("createdAt") as date, COUNT(DISTINCT "conversationId") as unique_conversations
      FROM "Lead"
      WHERE "organizationId" = ${ctx.org.id}
        AND "createdAt" >= ${range.start}
        AND "createdAt" <= ${range.end}
        AND "conversationId" IS NOT NULL
      GROUP BY DATE("createdAt")
      ORDER BY date
    `,

    prisma.$queryRaw<Array<{ date: Date | string; unique_conversations: bigint }>>`
      SELECT DATE("createdAt") as date, COUNT(DISTINCT "conversationId") as unique_conversations
      FROM "DataEvent"
      WHERE "organizationId" = ${ctx.org.id}
        AND type = 'BOOKING_LINK_CLICKED'
        AND "createdAt" >= ${range.start}
        AND "createdAt" <= ${range.end}
        AND "conversationId" IS NOT NULL
      GROUP BY DATE("createdAt")
      ORDER BY date
    `,

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
        COUNT(DISTINCT de."conversationId") as "clicks"
      FROM "DataEvent" de
      LEFT JOIN "OrganizationService" os ON (de.payload->>'serviceId')::int = os.id
      WHERE de."organizationId" = ${ctx.org.id}
        AND de.type = 'BOOKING_LINK_CLICKED'
        AND de."createdAt" >= ${range.start}
        AND de."createdAt" <= ${range.end}
        AND os.id IS NOT NULL
        AND de."conversationId" IS NOT NULL
      GROUP BY os.id, os.name
      ORDER BY "clicks" DESC
    `,

    prisma.lead.count({
      where: {
        organizationId: ctx.org.id,
        temperature: "HOT",
        createdAt: { gte: range.start, lte: range.end },
      },
    }),
  ]);

  const funnel = {
    serviceSelected: Number(funnelCounts.find((c) => c.type === "BOOKING_SERVICE_SELECTED")?.unique_conversations || 0),
    leadCreated: Number(funnelCounts.find((c) => c.type === "BOOKING_LEAD_CREATED")?.unique_conversations || 0),
    linkShown: Number(funnelCounts.find((c) => c.type === "BOOKING_LINK_SHOWN")?.unique_conversations || 0),
    linkClicked: Number(funnelCounts.find((c) => c.type === "BOOKING_LINK_CLICKED")?.unique_conversations || 0),
  };

  const leadsByDayArray = leadsByDayRaw.map((row) => ({
    date: row.date instanceof Date ? formatDateForBucket(row.date) : String(row.date).split("T")[0] ?? "",
    count: Number(row.unique_conversations),
  }));

  const clicksByDayArray = clicksByDayRaw.map((row) => ({
    date: row.date instanceof Date ? formatDateForBucket(row.date) : String(row.date).split("T")[0] ?? "",
    count: Number(row.unique_conversations),
  }));

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

  // Calculate revenue influenced from booking clicks × service prices
  let revenueInfluencedCents = 0;
  for (const service of clicksByServiceRaw) {
    const servicePrice = await prisma.organizationService.findUnique({
      where: { id: service.serviceId },
      select: { priceCents: true }
    });
    if (servicePrice?.priceCents) {
      revenueInfluencedCents += Number(service.clicks) * servicePrice.priceCents;
    } else if (org?.averageOrderValue) {
      revenueInfluencedCents += Number(service.clicks) * org.averageOrderValue;
    }
  }

  // Calculate conversion rate: (linkClicked / serviceSelected) × 100
  const conversionRate = funnel.serviceSelected > 0 
    ? Math.round((funnel.linkClicked / funnel.serviceSelected) * 10000) / 100 
    : 0;

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
    revenueInfluencedCents,
    hotLeadsCount,
    conversionRate,
  });
}
