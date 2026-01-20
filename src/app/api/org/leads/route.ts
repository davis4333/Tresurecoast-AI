import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrgContext } from "@/lib/auth/getOrgContext";
import { z } from "zod";

const PAGE_SIZE = 25;
const MAX_PAGE_SIZE = 100;

const querySchema = z.object({
  cursor: z.string().uuid().optional(),
  limit: z.coerce.number().min(1).max(MAX_PAGE_SIZE).default(PAGE_SIZE),
  days: z.coerce.number().min(1).max(365).optional(),
  status: z.enum(["NEW", "CONTACTED", "BOOKED", "CLOSED"]).optional(),
  temperature: z.enum(["HOT", "WARM", "COLD"]).optional(),
  serviceId: z.coerce.number().optional(),
  search: z.string().max(100).optional(),
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
  const parseResult = querySchema.safeParse({
    cursor: searchParams.get("cursor") ?? undefined,
    limit: searchParams.get("limit") ?? PAGE_SIZE,
    days: searchParams.get("days") ?? undefined,
    status: searchParams.get("status") ?? undefined,
    temperature: searchParams.get("temperature") ?? undefined,
    serviceId: searchParams.get("serviceId") ?? undefined,
    search: searchParams.get("search") ?? undefined,
  });

  if (!parseResult.success) {
    return NextResponse.json(
      { ok: false, error: "invalid_params", message: parseResult.error.message },
      { status: 400 }
    );
  }

  const { cursor, limit, days, status, temperature, serviceId, search } = parseResult.data;

  const dateFilter = days
    ? { gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000) }
    : undefined;

  const searchFilter = search
    ? {
        OR: [
          { name: { contains: search, mode: "insensitive" as const } },
          { email: { contains: search, mode: "insensitive" as const } },
          { phone: { contains: search, mode: "insensitive" as const } },
        ],
      }
    : undefined;

  const whereClause = {
    organizationId: ctx.org.id,
    ...(dateFilter && { createdAt: dateFilter }),
    ...(status && { status }),
    ...(temperature && { temperature }),
    ...(serviceId && { serviceId }),
    ...searchFilter,
  };

  const cursorLead = cursor
    ? await prisma.lead.findUnique({
        where: { publicId: cursor },
        select: { id: true },
      })
    : null;

  const [leads, total] = await Promise.all([
    prisma.lead.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      take: limit + 1,
      ...(cursorLead && { cursor: { id: cursorLead.id }, skip: 1 }),
      select: {
        publicId: true,
        name: true,
        email: true,
        phone: true,
        status: true,
        notes: true,
        score: true,
        temperature: true,
        createdAt: true,
        updatedAt: true,
        service: {
          select: {
            id: true,
            name: true,
          },
        },
        bot: {
          select: {
            publicKey: true,
            name: true,
          },
        },
        conversation: {
          select: {
            publicId: true,
          },
        },
      },
    }),
    prisma.lead.count({ where: whereClause }),
  ]);

  const hasNextPage = leads.length > limit;
  const resultsToReturn = hasNextPage ? leads.slice(0, limit) : leads;
  const nextCursor = hasNextPage ? resultsToReturn[resultsToReturn.length - 1]?.publicId : null;

  const mappedLeads = resultsToReturn.map((lead) => ({
    leadPublicId: lead.publicId,
    name: lead.name,
    email: lead.email,
    phone: lead.phone,
    status: lead.status,
    notes: lead.notes,
    score: lead.score,
    temperature: lead.temperature,
    serviceName: lead.service?.name ?? null,
    serviceId: lead.service?.id ?? null,
    botName: lead.bot.name,
    botPublicKey: lead.bot.publicKey,
    conversationPublicId: lead.conversation?.publicId ?? null,
    createdAt: lead.createdAt.toISOString(),
    updatedAt: lead.updatedAt.toISOString(),
  }));

  const [statusCounts, tempCounts] = await Promise.all([
    prisma.lead.groupBy({
      by: ["status"],
      where: { organizationId: ctx.org.id },
      _count: { id: true },
    }),
    prisma.lead.groupBy({
      by: ["temperature"],
      where: { organizationId: ctx.org.id },
      _count: { id: true },
    }),
  ]);

  const summary = {
    total,
    byStatus: {
      NEW: statusCounts.find((c) => c.status === "NEW")?._count.id ?? 0,
      CONTACTED: statusCounts.find((c) => c.status === "CONTACTED")?._count.id ?? 0,
      BOOKED: statusCounts.find((c) => c.status === "BOOKED")?._count.id ?? 0,
      CLOSED: statusCounts.find((c) => c.status === "CLOSED")?._count.id ?? 0,
    },
    byTemperature: {
      HOT: tempCounts.find((c) => c.temperature === "HOT")?._count.id ?? 0,
      WARM: tempCounts.find((c) => c.temperature === "WARM")?._count.id ?? 0,
      COLD: tempCounts.find((c) => c.temperature === "COLD")?._count.id ?? 0,
    },
  };

  return NextResponse.json({
    ok: true,
    leads: mappedLeads,
    nextCursor,
    total,
    summary,
  });
}
